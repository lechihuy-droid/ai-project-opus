"""Controller-loop orchestration for Primus proactive daily briefs."""

from __future__ import annotations

import hashlib
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable


_ANIMUS_DIR = Path(__file__).resolve().parents[1]
for _IMPORT_DIR in reversed(
    (
        _ANIMUS_DIR,
        _ANIMUS_DIR / "opus-rector",
        _ANIMUS_DIR / "opus-logos",
    )
):
    _IMPORT_DIR_TEXT = str(_IMPORT_DIR)
    if _IMPORT_DIR_TEXT not in sys.path:
        sys.path.insert(0, _IMPORT_DIR_TEXT)

from animus_core import trace, registry
from primus import profile as user_profile
from primus import providers
import rector.tasks, rector.proactive
import logos.rank, logos.arbiter


JST = timezone(timedelta(hours=9))
MAX_STEPS = 6
DEFAULT_MAX_ITEMS = 5
BRIEF_ACTION_TOOL_ID = "brief.draft"
BRIEF_ACTION_CLASS = "draft"
ACTION_BAR = "[Chấp nhận tất cả] [Chọn] [Để sau] [Bỏ qua]"


def generate_brief(intent_packet: dict) -> tuple[str, list[dict]]:
    """Generate a suggestion-only daily brief and persist resolved items."""

    assert registry.classify(BRIEF_ACTION_TOOL_ID) == BRIEF_ACTION_CLASS
    assert BRIEF_ACTION_CLASS not in {"write", "dangerous"}

    date = _brief_date(intent_packet)
    profile = _profile(intent_packet)
    active_goals = _active_goals(profile)
    origin = _origin(intent_packet)
    user_input = str(intent_packet.get("user_input", ""))
    run_ts = datetime.now(JST)
    no_progress_count = 0

    def run_step(
        step_index: int,
        target_subsystem: str,
        output_kind: str,
        sources_loaded: list[str],
        operation: Callable[[], Any],
    ) -> Any:
        if step_index >= MAX_STEPS:
            raise RuntimeError(f"controller loop exceeded max_steps={MAX_STEPS}")
        try:
            result = operation()
        except Exception:
            _log_step(
                date=date,
                run_ts=run_ts,
                step_index=step_index,
                origin=origin,
                user_input=user_input,
                target_subsystem=target_subsystem,
                sources_loaded=sources_loaded,
                output_kind=f"{output_kind}_error",
            )
            raise
        _log_step(
            date=date,
            run_ts=run_ts,
            step_index=step_index,
            origin=origin,
            user_input=user_input,
            target_subsystem=target_subsystem,
            sources_loaded=sources_loaded,
            output_kind=output_kind,
        )
        return result

    def observe(result: Any, *, empty_is_progress: bool = False) -> bool:
        nonlocal no_progress_count
        made_progress = empty_is_progress or _has_progress(result)
        no_progress_count = 0 if made_progress else no_progress_count + 1
        return no_progress_count < 2

    tasks = run_step(
        0,
        "RECTOR",
        "task_list",
        ["docs/SD-proactive-brief.md", "opus-rector/rector/tasks.py", "TODO.md", "WEEKLY-PLAN.md"],
        lambda: rector.tasks.pull_due_tasks(date, profile),
    )
    observe(tasks, empty_is_progress=True)

    ctx = run_step(
        1,
        "NEXUS",
        "context",
        ["docs/SD-proactive-brief.md", "primus/providers.py", "opus-nexus/health", "WEEKLY-PLAN.md"],
        lambda: providers.nexus_context(date),
    )
    observe(ctx, empty_is_progress=True)

    info = run_step(
        2,
        "CONSILIUM",
        "info_items",
        ["docs/SD-proactive-brief.md", "primus/providers.py", "opus-consilium/logs"],
        lambda: providers.consilium_info(active_goals),
    )
    observe(info, empty_is_progress=True)

    candidate_items = run_step(
        3,
        "NEXUS",
        "proactive_items",
        [
            "docs/SD-proactive-brief.md",
            "docs/OPERATING-MODEL-OPUS-ANIMUS-v4.md",
            "ai/action-registry.yaml",
        ],
        lambda: _build_candidate_items(date, tasks, ctx, info),
    )
    if not observe(candidate_items) or not candidate_items:
        return _nothing_new_brief_text(), []

    ranked = run_step(
        4,
        "LOGOS",
        "ranked_items",
        ["docs/SD-proactive-brief.md", "docs/SD-opus-logos.md", "opus-logos/logos/rank.py"],
        lambda: logos.rank.rank(candidate_items, profile, ctx, llm=_safe_rank_llm),
    )
    if not observe(ranked):
        return _nothing_new_brief_text(), []

    resolved, tradeoffs = run_step(
        5,
        "LOGOS",
        "resolved_items",
        ["docs/SD-proactive-brief.md", "docs/SD-opus-logos.md", "opus-logos/logos/arbiter.py"],
        lambda: logos.arbiter.arbitrate(ranked),
    )
    observe(resolved)

    resolved = _gate_suggested_actions(resolved)
    resolved = resolved[:_max_brief_items()]
    if not resolved:
        return _nothing_new_brief_text(), []

    rector.proactive.save_proactive_set(date, resolved)
    brief_text = assemble_brief_text(ctx, resolved, tradeoffs)
    return brief_text, resolved


def assemble_brief_text(ctx: dict, resolved: list[dict], tradeoffs: list[dict]) -> str:
    """Assemble the Vietnamese brief text shape from SD §3.5."""

    if not resolved:
        return _nothing_new_brief_text()

    lines = ["Chào buổi sáng.", "", "Bối cảnh hôm nay:"]
    context_lines = _context_lines(ctx)
    lines.extend(f"- {line}" for line in context_lines)
    lines.extend(["", "Primus đề xuất:"])

    tradeoff_by_item = _tradeoffs_by_kept_item(tradeoffs)
    for index, item in enumerate(resolved, start=1):
        source = item.get("source_subsystem", "UNKNOWN")
        priority = _priority_label(item.get("priority"))
        title = str(item.get("title", "")).strip()
        reason = str(item.get("reason", "")).strip()
        action = str(item.get("suggested_action", "")).strip()
        item_lines = [f"{index}. {priority}{title} ({source})"]
        if reason:
            item_lines.append(f"   Lý do: {reason}")
        if action and action != f"Xử lý: {title}":
            item_lines.append(f"   Gợi ý: {action}")
        for note in tradeoff_by_item.get(str(item.get("id")), []):
            item_lines.append(f"   Đánh đổi: {note}")
        lines.extend(item_lines)

    global_tradeoffs = _global_tradeoffs(tradeoffs, {str(item.get("id")) for item in resolved})
    if global_tradeoffs:
        lines.extend(["", "Đánh đổi:"])
        lines.extend(f"- {note}" for note in global_tradeoffs)

    lines.extend(["", ACTION_BAR])
    return "\n".join(lines)


def _build_candidate_items(date: str, tasks: list[dict], ctx: dict, info_items: list[dict]) -> list[dict]:
    items: list[dict] = []

    for task in tasks or []:
        if not isinstance(task, dict):
            continue
        title = _first_string(task, ("title", "name", "summary"))
        if not title:
            continue
        item = {
            "id": _stable_item_id(date, "task", str(task.get("id", title))),
            "trigger": "event" if task.get("due") or task.get("flag") else "time",
            "source_subsystem": "RECTOR",
            "kind": "task",
            "title": title,
            "reason": _task_reason(task),
            "priority": _task_priority(task, date),
            "suggested_action": _first_string(task, ("suggested_action", "action"))
            or f"Xử lý: {title}",
            "requires_approval": True,
            "state": "pending",
        }
        _copy_optional_fields(task, item, ("due", "deadline", "flag", "goal_ref", "active_goal"))
        items.append(item)

    health_summary = _health_summary(ctx)
    if health_summary:
        items.append(
            {
                "id": _stable_item_id(date, "health", health_summary),
                "trigger": "threshold",
                "source_subsystem": "NEXUS",
                "kind": "health_nudge",
                "title": "Điều chỉnh theo sức khỏe hôm nay",
                "reason": health_summary,
                "priority": "medium",
                "suggested_action": "Chọn một micro-action nhẹ để giữ nhịp ngày hôm nay.",
                "requires_approval": True,
                "state": "pending",
            }
        )

    for info in info_items or []:
        if not isinstance(info, dict):
            continue
        title = _first_string(info, ("title", "headline", "topic", "name"))
        reason = _first_string(info, ("reason", "summary", "why", "content", "excerpt"))
        if not title or not reason:
            continue
        item = {
            "id": _stable_item_id(date, "info", f"{info.get('goal_ref', '')}:{title}"),
            "trigger": "event",
            "source_subsystem": "CONSILIUM",
            "kind": "info_alert",
            "title": title,
            "reason": reason,
            "priority": "medium",
            "suggested_action": "Đọc nhanh và quyết định có đưa vào kế hoạch hôm nay không.",
            "requires_approval": True,
            "state": "pending",
        }
        _copy_optional_fields(info, item, ("goal_ref", "source", "url"))
        items.append(item)

    return _gate_suggested_actions(_dedupe_item_ids(items))


def _gate_suggested_actions(items: list[dict]) -> list[dict]:
    gated: list[dict] = []
    for raw_item in items or []:
        item = dict(raw_item)
        item["requires_approval"] = True
        item.setdefault("state", "pending")
        tool_id = _nominal_tool_id(item)
        action_class = registry.classify(tool_id)
        item["action_tool_id"] = tool_id
        item["action_class"] = action_class
        item["approval_gate"] = registry.gate_for(action_class)
        gated.append(item)

    assert all(item["requires_approval"] is True for item in gated)
    assert all("execution_result" not in item and "executed_at" not in item for item in gated)
    return gated


def _nominal_tool_id(item: dict) -> str:
    explicit = item.get("action_tool_id") or item.get("tool_id")
    if isinstance(explicit, str) and explicit.strip():
        return explicit.strip()
    return BRIEF_ACTION_TOOL_ID


def _max_brief_items() -> int:
    value = os.environ.get("ANIMUS_BRIEF_MAX_ITEMS")
    if not value:
        return DEFAULT_MAX_ITEMS
    return int(value)


def _safe_rank_llm(prompt: str) -> str:
    if _env_truthy("ANIMUS_BRIEF_NO_LLM"):
        raise RuntimeError("External LLM disabled by ANIMUS_BRIEF_NO_LLM")

    from animus_core.llm import claude_cli

    return claude_cli(prompt)


def _env_truthy(name: str) -> bool:
    value = os.environ.get(name, "")
    return value.strip().casefold() not in {"", "0", "false", "no", "off"}


def _log_step(
    *,
    date: str,
    run_ts: datetime,
    step_index: int,
    origin: str,
    user_input: str,
    target_subsystem: str,
    sources_loaded: list[str],
    output_kind: str,
) -> None:
    assert BRIEF_ACTION_CLASS == "draft"
    trace.log_trace(
        {
            "id": f"{date}-{run_ts:%H%M}-{step_index + 1:02d}",
            "ts": datetime.now(JST).isoformat(timespec="seconds"),
            "origin": origin,
            "user_input": user_input,
            "intent_type": "execution",
            "target_subsystem": target_subsystem,
            "route_confidence": 1.0,
            "sources_loaded": sources_loaded,
            "action_class": BRIEF_ACTION_CLASS,
            "output_kind": output_kind,
            "step_index": step_index,
        }
    )


def _brief_date(intent_packet: dict) -> str:
    value = intent_packet.get("date") or intent_packet.get("target_date")
    if value:
        date_text = str(value)
        datetime.strptime(date_text, "%Y-%m-%d")
        return date_text
    return datetime.now(JST).date().isoformat()


def _profile(intent_packet: dict) -> dict:
    if "profile" in intent_packet:
        profile = intent_packet.get("profile")
    elif "user_profile" in intent_packet:
        profile = intent_packet.get("user_profile")
    else:
        return user_profile.load_user_profile()
    if not isinstance(profile, dict):
        return user_profile.load_user_profile()
    return profile


def _origin(intent_packet: dict) -> str:
    origin = str(intent_packet.get("origin", "user"))
    if origin not in {"user", "proactive_trigger"}:
        raise ValueError(f"invalid intent origin: {origin}")
    return origin


def _active_goals(profile: dict) -> list[str]:
    raw_goals = (
        profile.get("active_goals")
        or profile.get("active_goal_refs")
        or profile.get("goals")
        or []
    )
    if isinstance(raw_goals, str):
        raw_goals = [raw_goals]
    elif not isinstance(raw_goals, list):
        raw_goals = []

    goals: list[str] = []
    seen: set[str] = set()

    def add(value: Any) -> None:
        if value is None:
            return
        goal = str(value).strip()
        key = goal.casefold()
        if goal and key not in seen:
            goals.append(goal)
            seen.add(key)

    for goal in raw_goals:
        if isinstance(goal, dict):
            value = goal.get("id") or goal.get("ref") or goal.get("name") or goal.get("title")
        else:
            value = goal
        add(value)
    for keyword in user_profile.active_goal_keywords(profile):
        add(keyword)
    return goals


def _has_progress(result: Any) -> bool:
    if result is None:
        return False
    if isinstance(result, (list, tuple, set, dict, str)):
        return bool(result)
    return True


def _nothing_new_brief_text() -> str:
    return "Chào buổi sáng.\n\nKhông có gì mới được ưu tiên hôm nay (nothing-new)."


def _context_lines(ctx: dict) -> list[str]:
    lines: list[str] = []
    calendar_today = _context_value(ctx, ("calendar_today", "calendar_summary", "calendar"))
    health_summary = _health_summary(ctx)

    if calendar_today:
        lines.extend(_split_context_lines(calendar_today))
    if health_summary:
        lines.extend(_split_context_lines(health_summary))
    return lines or ["Chưa có bối cảnh Nexus mới."]


def _context_value(ctx: dict, keys: tuple[str, ...]) -> str | None:
    if not isinstance(ctx, dict):
        return None
    for key in keys:
        value = ctx.get(key)
        rendered = _render_context_value(value)
        if rendered:
            return rendered
    return None


def _render_context_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, list):
        parts = [_render_context_value(part) for part in value]
        return "\n".join(part for part in parts if part) or None
    if isinstance(value, dict):
        for key in ("summary", "text", "note", "notes", "title"):
            rendered = _render_context_value(value.get(key))
            if rendered:
                return rendered
        parts = [
            f"{key}: {rendered}"
            for key, raw in value.items()
            if (rendered := _render_context_value(raw))
        ]
        return "\n".join(parts) or None
    return str(value).strip() or None


def _split_context_lines(value: str) -> list[str]:
    return [line.strip(" -") for line in value.splitlines() if line.strip(" -")]


def _health_summary(ctx: dict) -> str | None:
    return _context_value(ctx, ("health_summary", "health"))


def _task_reason(task: dict) -> str:
    reason = _first_string(task, ("reason", "why", "summary"))
    if reason:
        return reason
    if task.get("due"):
        return f"Đến hạn {task['due']}."
    if task.get("flag"):
        return f"Được đánh dấu {task['flag']}."
    return "Nhiệm vụ đang liên quan tới mục tiêu hiện tại."


def _task_priority(task: dict, date: str) -> str:
    priority = str(task.get("priority", "")).lower()
    if priority in {"high", "medium", "low"}:
        return priority
    if task.get("due") and str(task["due"]) <= date:
        return "high"
    if task.get("due") or task.get("flag"):
        return "medium"
    return "low"


def _first_string(data: dict, keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _copy_optional_fields(source: dict, target: dict, keys: tuple[str, ...]) -> None:
    for key in keys:
        if source.get(key) is not None:
            target[key] = source[key]


def _stable_item_id(date: str, kind: str, raw_value: str) -> str:
    normalized = " ".join(str(raw_value).split())
    digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()[:8]
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.casefold()).strip("-")
    prefix = f"{date}-{kind}"
    return f"{prefix}-{slug[:32]}-{digest}" if slug else f"{prefix}-{digest}"


def _dedupe_item_ids(items: list[dict]) -> list[dict]:
    counts: dict[str, int] = {}
    deduped: list[dict] = []
    for item in items:
        copied = dict(item)
        base_id = str(copied["id"])
        counts[base_id] = counts.get(base_id, 0) + 1
        if counts[base_id] > 1:
            copied["id"] = f"{base_id}-{counts[base_id]:02d}"
        deduped.append(copied)
    return deduped


def _priority_label(priority: Any) -> str:
    if str(priority).lower() == "high":
        return "[Ưu tiên] "
    return ""


def _tradeoffs_by_kept_item(tradeoffs: list[dict]) -> dict[str, list[str]]:
    notes: dict[str, list[str]] = {}
    for tradeoff in tradeoffs or []:
        if not isinstance(tradeoff, dict):
            continue
        kept = tradeoff.get("kept")
        if kept is None:
            continue
        note = _tradeoff_note(tradeoff)
        if note:
            notes.setdefault(str(kept), []).append(note)
    return notes


def _global_tradeoffs(tradeoffs: list[dict], resolved_ids: set[str]) -> list[str]:
    notes: list[str] = []
    for tradeoff in tradeoffs or []:
        if isinstance(tradeoff, str) and tradeoff.strip():
            notes.append(tradeoff.strip())
            continue
        if not isinstance(tradeoff, dict):
            continue
        kept = tradeoff.get("kept")
        if kept is not None and str(kept) in resolved_ids:
            continue
        note = _tradeoff_note(tradeoff)
        if note:
            notes.append(note)
    return notes


def _tradeoff_note(tradeoff: dict) -> str | None:
    reason = str(tradeoff.get("reason", "")).strip()
    dropped = str(tradeoff.get("dropped", "")).strip()
    if reason and dropped:
        return f"{reason}; bỏ {dropped}."
    if reason:
        return reason
    if dropped:
        return f"Bỏ {dropped}."
    return None
