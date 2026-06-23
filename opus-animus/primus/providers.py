"""Thin data adapters for Primus proactive brief assembly."""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


JST = timezone(timedelta(hours=9))


def nexus_context(date: str) -> dict:
    return {
        "health_summary": _health_summary(date),
        "calendar_today": _calendar_today(date),
    }


def consilium_info(active_goals: list[str], date: str | None = None) -> list[dict]:
    goals = [goal.strip() for goal in active_goals if goal and goal.strip()]
    if not goals:
        return []

    from . import consilium

    review_date = date or datetime.now(JST).date().isoformat()
    try:
        intel_items = consilium.consilium_intel(review_date)
    except Exception:
        return []

    items: list[dict] = []
    for raw_item in intel_items:
        info_item = _info_item_if_relevant(raw_item, goals)
        if info_item is not None:
            items.append(info_item)
    return items


def _animus_root() -> Path:
    return Path(os.environ.get("ANIMUS_ROOT", Path(__file__).resolve().parents[1]))


def _health_summary(date: str) -> str | None:
    from . import vita

    health = vita.vita_health(date)
    workout = vita.vita_workout(date)
    summaries = [
        item.get("summary")
        for item in (health, workout)
        if isinstance(item, dict) and item.get("summary")
    ]
    return " ".join(summaries) if summaries else None


def _calendar_today(date: str) -> str | None:
    weekly_plan = _animus_root() / "WEEKLY-PLAN.md"
    if not weekly_plan.exists():
        return None

    try:
        lines = weekly_plan.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None

    matches = [
        line.strip()
        for line in lines
        if date in line and line.strip() and not _is_markdown_table_separator(line)
    ]
    return "\n".join(matches) if matches else None


def _dated_files(root: Path, date: str, suffixes: set[str]) -> list[Path]:
    direct_name_matches = [
        path
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in suffixes and date in path.name
    ]
    if direct_name_matches:
        return sorted(direct_name_matches)

    content_matches: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in suffixes:
            continue
        try:
            if date in path.read_text(encoding="utf-8"):
                content_matches.append(path)
        except (OSError, UnicodeDecodeError):
            continue
    return sorted(content_matches)


def _json_summary(path: Path) -> str | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None

    summary = _first_string(data, ("health_summary", "summary", "text", "note", "notes"))
    if summary:
        return summary

    if isinstance(data, list):
        for item in data:
            summary = _first_string(item, ("health_summary", "summary", "text", "note", "notes"))
            if summary:
                return summary
    return None


def _text_summary(path: Path) -> str | None:
    try:
        text = path.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeDecodeError):
        return None
    return text or None


def _info_item_if_relevant(raw_item: dict, goals: list[str]) -> dict | None:
    title = _first_string(raw_item, ("title", "headline", "topic", "name"))
    reason = _first_string(raw_item, ("reason", "summary", "why", "content", "excerpt"))
    topic = _first_string(raw_item, ("topic", "goal_ref", "goal"))
    if not title or not reason:
        return None

    matched_goal = _matched_goal(raw_item, goals)
    if matched_goal is None:
        return None

    return {
        "title": title,
        "reason": reason,
        "topic": topic or "",
        "goal_ref": _first_string(raw_item, ("goal_ref", "goal")) or matched_goal,
    }


def _matched_goal(raw_item: dict, goals: list[str]) -> str | None:
    item_text = _normalize(" ".join(_item_strings(raw_item)))

    for goal in goals:
        goal_text = _normalize(goal)
        if not goal_text:
            continue
        if goal_text in item_text:
            return goal
    return None


def _item_strings(raw_item: dict) -> list[str]:
    values: list[str] = []
    for key in ("topic", "goal_ref", "goal", "title", "headline", "name", "reason", "summary", "tags"):
        value = raw_item.get(key)
        if isinstance(value, str):
            values.append(value)
        elif isinstance(value, list):
            values.extend(str(item) for item in value if isinstance(item, str))
    return values


def _first_string(data: Any, keys: tuple[str, ...]) -> str | None:
    if not isinstance(data, dict):
        return None
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _normalize(value: str) -> str:
    return " ".join(value.lower().split())


def _is_markdown_table_separator(line: str) -> bool:
    stripped = line.strip()
    return bool(stripped) and set(stripped) <= {"|", "-", ":", " "}
