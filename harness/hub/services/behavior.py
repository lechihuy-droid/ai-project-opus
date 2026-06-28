from __future__ import annotations

import datetime as dt
import json
import threading
import time
from pathlib import Path
from typing import Any

import config
from parsers.codex_sessions import _model_from_obj as _codex_model_from_obj
from services import replay, usage


CACHE_TTL_SECONDS = 30.0
_BEHAVIOR_CACHE: dict[str, Any] = {
    "expires": 0.0,
    "events": [],
    "warnings": [],
    "sessions": [],
    "fingerprint": None,
}
_DISK_CACHE = config.HUB_DIR / ".cache" / "behavior.json"
_LOCK = threading.RLock()


def _source_files() -> list[Path]:
    """All Claude/Codex session source files used for behavior analytics."""
    files: list[Path] = []
    claude = config.USAGE_SOURCES.get("claude")
    if isinstance(claude, Path) and claude.exists():
        files.extend(claude.glob("*/*.jsonl"))
    roots = config.USAGE_SOURCES.get("codex") or []
    if isinstance(roots, Path):
        roots = [roots]
    for root in roots:
        if isinstance(root, Path) and root.exists():
            files.extend(root.rglob("*.jsonl"))
    return files


def _fingerprint() -> str:
    """Stat-only signature of the source set: rebuild only when a file is added/changed."""
    count = 0
    max_mtime = 0
    for path in _source_files():
        try:
            stat = path.stat()
        except OSError:
            continue
        count += 1
        if stat.st_mtime_ns > max_mtime:
            max_mtime = stat.st_mtime_ns
    return f"{count}:{max_mtime}"


def _load_disk(fingerprint: str) -> tuple[list[dict[str, Any]], list[str], list[dict[str, Any]]] | None:
    try:
        data = json.loads(_DISK_CACHE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if data.get("fingerprint") != fingerprint:
        return None
    return data.get("events") or [], data.get("warnings") or [], data.get("sessions") or []


def _save_disk(
    fingerprint: str,
    events: list[dict[str, Any]],
    warnings: list[str],
    sessions: list[dict[str, Any]],
) -> None:
    try:
        _DISK_CACHE.parent.mkdir(parents=True, exist_ok=True)
        _DISK_CACHE.write_text(
            json.dumps(
                {
                    "fingerprint": fingerprint,
                    "events": events,
                    "warnings": warnings,
                    "sessions": sessions,
                }
            ),
            encoding="utf-8",
        )
    except OSError:
        pass


def _parse_ts(value: Any) -> dt.datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.UTC)
    return parsed


def _latency_values(agent_ts: list[str]) -> list[float]:
    values: list[float] = []
    previous: dt.datetime | None = None
    for ts in agent_ts:
        current = _parse_ts(ts)
        if previous is not None and current is not None:
            delta = (current - previous).total_seconds()
            if 0 <= delta <= 3600:
                values.append(round(delta, 3))
        if current is not None:
            previous = current
    return values


def _tool_event(record: replay.SessionRecord, tool: str, model: str | None, ts: str) -> dict[str, Any]:
    return {
        "tool": tool,
        "source": record.source,
        "model": model,
        "session": record.session,
        "ts": ts,
    }


def _session_stats(record: replay.SessionRecord, session_events: list[dict[str, Any]], agent_ts: list[str]) -> dict[str, Any]:
    tools = [str(event.get("tool") or "") for event in session_events if event.get("tool")]
    total = len(tools)
    max_consecutive = 0
    top_tool: str | None = None
    current_tool: str | None = None
    current_count = 0

    for tool in tools:
        if tool == current_tool:
            current_count += 1
        else:
            current_tool = tool
            current_count = 1
        if current_count > max_consecutive:
            max_consecutive = current_count
            top_tool = tool

    distinct = len(set(tools))
    repeat_ratio = 0.0 if total == 0 else 1 - (distinct / total)
    latencies = _latency_values(agent_ts)
    avg_latency = round(sum(latencies) / len(latencies), 3) if latencies else None
    max_latency = max(latencies) if latencies else None

    return {
        "session": record.session,
        "source": record.source,
        "max_consecutive": max_consecutive,
        "max_consecutive_same_tool": max_consecutive,
        "top_tool": top_tool,
        "total_tool_calls": total,
        "repeat_ratio": round(repeat_ratio, 6),
        "loop_risk": max_consecutive >= int(config.LOOP_CONSECUTIVE_THRESHOLD),
        "avg_latency_s": avg_latency,
        "max_latency_s": max_latency,
    }


def _claude_session(record: replay.SessionRecord) -> tuple[list[dict[str, Any]], list[str]]:
    events: list[dict[str, Any]] = []
    agent_ts: list[str] = []
    current_model: str | None = None

    for obj in replay._iter_jsonl(record.path):
        if obj.get("type") != "assistant":
            continue
        ts = replay.normalize_ts(obj.get("timestamp"), record.path)
        message = obj.get("message") if isinstance(obj.get("message"), dict) else {}
        model = message.get("model")
        if isinstance(model, str) and model:
            current_model = model

        has_agent_row = False
        for block in replay._blocks(message.get("content")):
            if not isinstance(block, dict):
                continue
            block_type = block.get("type")
            if block_type == "text" and isinstance(block.get("text"), str) and block.get("text"):
                has_agent_row = True
            elif block_type == "tool_use":
                name = block.get("name")
                if isinstance(name, str) and name:
                    has_agent_row = True
                    events.append(_tool_event(record, name, current_model, ts))
        if has_agent_row:
            agent_ts.append(ts)

    final_model = current_model or "claude:unknown"
    for event in events:
        if not event.get("model"):
            event["model"] = final_model
    return events, agent_ts


def _codex_session(record: replay.SessionRecord) -> tuple[list[dict[str, Any]], list[str]]:
    events: list[dict[str, Any]] = []
    agent_ts: list[str] = []
    current_model: str | None = None

    for obj in replay._iter_jsonl(record.path):
        if current_model is None:
            current_model = _codex_model_from_obj(obj)

        ts = replay._codex_ts(obj, record.path)
        event_type = obj.get("type")
        payload = replay._codex_payload(obj)
        payload_type = payload.get("type")

        if event_type == "event_msg" and payload_type == "agent_message":
            text = payload.get("message")
            if isinstance(text, str) and text:
                agent_ts.append(ts)
            continue

        if event_type != "response_item":
            continue

        if payload_type == "function_call":
            name = payload.get("name")
            if isinstance(name, str) and name:
                events.append(_tool_event(record, name, current_model, ts))
                agent_ts.append(ts)
        elif payload_type == "message":
            text = replay._text_from_content(payload.get("content"))
            if text:
                agent_ts.append(ts)

    final_model = current_model or "codex:unknown"
    for event in events:
        if not event.get("model"):
            event["model"] = final_model
    return events, agent_ts


def _build() -> tuple[list[dict[str, Any]], list[str], list[dict[str, Any]]]:
    events: list[dict[str, Any]] = []
    warnings: list[str] = []
    sessions: list[dict[str, Any]] = []

    for record in replay._records().values():
        try:
            if record.source == "claude":
                session_events, agent_ts = _claude_session(record)
            else:
                session_events, agent_ts = _codex_session(record)
        except Exception as exc:
            warnings.append(f"{record.path}: {exc}")
            continue
        events.extend(session_events)
        sessions.append(_session_stats(record, session_events, agent_ts))

    events.sort(key=lambda item: str(item.get("ts") or ""), reverse=True)
    sessions.sort(
        key=lambda item: (
            bool(item.get("loop_risk")),
            int(item.get("max_consecutive") or 0),
            int(item.get("total_tool_calls") or 0),
            str(item.get("session") or ""),
        ),
        reverse=True,
    )
    return events, warnings, sessions


def _collect_all() -> tuple[list[dict[str, Any]], list[str], list[dict[str, Any]]]:
    now = time.monotonic()
    fingerprint = _fingerprint()
    with _LOCK:
        if _BEHAVIOR_CACHE["expires"] > now and _BEHAVIOR_CACHE["fingerprint"] == fingerprint:
            return (
                list(_BEHAVIOR_CACHE["events"]),
                list(_BEHAVIOR_CACHE["warnings"]),
                list(_BEHAVIOR_CACHE["sessions"]),
            )

        disk = _load_disk(fingerprint)
        if disk is not None:
            events, warnings, sessions = disk
        else:
            events, warnings, sessions = _build()
            _save_disk(fingerprint, events, warnings, sessions)

        _BEHAVIOR_CACHE.update(
            {
                "expires": now + CACHE_TTL_SECONDS,
                "events": events,
                "warnings": warnings,
                "sessions": sessions,
                "fingerprint": fingerprint,
            }
        )
        return list(events), list(warnings), list(sessions)


def warm() -> None:
    """Best-effort cache warm (call in a background thread at startup)."""
    try:
        _collect_all()
    except Exception:
        pass


def collect_tool_events() -> tuple[list[dict[str, Any]], list[str]]:
    events, warnings, _sessions = _collect_all()
    return events, warnings


def _matches(event: dict[str, Any], filters: dict[str, str | None], since_dt: dt.datetime | None) -> bool:
    source = filters.get("source")
    model = filters.get("model")
    if source and event.get("source") != source:
        return False
    if model and event.get("model") != model:
        return False
    if since_dt is not None:
        event_time = usage._event_dt(event)
        if event_time is None or event_time < since_dt:
            return False
    return True


def filter_tool_events(
    events: list[dict[str, Any]],
    filters: dict[str, str | None] | None = None,
) -> list[dict[str, Any]]:
    filters = filters or {}
    since_dt = usage._parse_since(filters.get("since"))
    filtered = [event for event in events if _matches(event, filters, since_dt)]
    filtered.sort(key=lambda item: str(item.get("ts") or ""), reverse=True)
    return filtered


def tool_rollup(events: list[dict[str, Any]]) -> dict[str, Any]:
    by_tool: dict[str, dict[str, Any]] = {}
    by_day: dict[str, dict[str, Any]] = {}

    for event in events:
        tool = str(event.get("tool") or "unknown")
        day = str(event.get("ts") or "")[:10] or "unknown"
        model = str(event.get("model") or "unknown")
        session = str(event.get("session") or "")

        tool_row = by_tool.setdefault(
            tool,
            {"tool": tool, "count": 0, "_sessions": set(), "_models": set()},
        )
        day_row = by_day.setdefault(day, {"day": day, "count": 0})
        tool_row["count"] += 1
        if session:
            tool_row["_sessions"].add(session)
        if model:
            tool_row["_models"].add(model)
        day_row["count"] += 1

    tool_rows = [
        {
            "tool": row["tool"],
            "count": row["count"],
            "sessions": len(row["_sessions"]),
            "models": sorted(row["_models"]),
        }
        for row in by_tool.values()
    ]

    return {
        "by_tool": sorted(tool_rows, key=lambda item: (-int(item["count"]), str(item["tool"]))),
        "by_day": sorted(by_day.values(), key=lambda item: item["day"]),
        "totals": {"tool_calls": len(events), "distinct_tools": len(by_tool)},
    }


def session_loops() -> list[dict[str, Any]]:
    _events, _warnings, sessions = _collect_all()
    return sessions
