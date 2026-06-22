from __future__ import annotations

import os
import re
import warnings
from datetime import date as Date
from datetime import timedelta
from pathlib import Path
from typing import Any


_TASK_ID_RE = re.compile(r"\[([A-Z][A-Z0-9]*-\d+)\]")
_CHECKBOX_RE = re.compile(r"^\s*[-*]\s+\[[ xX]\]\s+")
_DATE_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")


def pull_due_tasks(date: str, profile: dict) -> list[dict]:
    target_date = Date.fromisoformat(date)
    window_days = int(profile.get("window_days", profile.get("task_window_days", 7)))
    due_by = target_date + timedelta(days=window_days)
    active_goals = _active_goals(profile)

    tasks: list[dict] = []
    for filename, source in (("TODO.md", "TODO"), ("WEEKLY-PLAN.md", "WEEKLY-PLAN")):
        tasks.extend(_read_tasks(filename, source))

    return [
        task
        for task in tasks
        if _is_relevant(task, due_by=due_by, active_goals=active_goals)
    ]


def _animus_root() -> Path:
    env_root = os.environ.get("ANIMUS_ROOT")
    if env_root:
        return Path(env_root)
    return Path(__file__).resolve().parents[2]


def _read_tasks(filename: str, source: str) -> list[dict]:
    path = _animus_root() / filename
    if not path.exists():
        warnings.warn(f"{filename} not found; skipping task source", RuntimeWarning)
        return []

    tasks: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        task = _parse_task_line(line, source)
        if task:
            tasks.append(task)
    return tasks


def _parse_task_line(line: str, source: str) -> dict | None:
    task_id_match = _TASK_ID_RE.search(line)
    has_checkbox = _CHECKBOX_RE.match(line) is not None
    if not task_id_match and not has_checkbox:
        return None

    task_id = task_id_match.group(1) if task_id_match else _fallback_id(source, line)
    prefix = task_id.split("-", 1)[0] if "-" in task_id else None
    due = _extract_due(line)
    flag = "this_week" if source == "WEEKLY-PLAN" or _has_this_week_marker(line) else None

    title = _clean_title(line, task_id=task_id, due=due)
    if not title:
        return None

    return {
        "id": task_id,
        "title": title,
        "source": source,
        "due": due,
        "flag": flag,
        "goal_ref": prefix,
    }


def _fallback_id(source: str, line: str) -> str:
    normalized = re.sub(r"\W+", "-", line.strip()).strip("-").upper()
    return f"{source}:{normalized[:32] or 'TASK'}"


def _extract_due(line: str) -> str | None:
    match = _DATE_RE.search(line)
    if not match:
        return None
    due = match.group(0)
    Date.fromisoformat(due)
    return due


def _has_this_week_marker(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in ("this_week", "this-week", "this week"))


def _clean_title(line: str, *, task_id: str, due: str | None) -> str:
    title = _CHECKBOX_RE.sub("", line).strip()
    title = re.sub(r"^\s*[-*]\s+", "", title).strip()
    title = title.replace(f"[{task_id}]", "", 1).strip()
    if due:
        title = re.sub(rf"\b(?:due|by|deadline)?\s*:?\s*{re.escape(due)}\b", "", title, flags=re.IGNORECASE).strip()
    title = re.sub(r"\b(?:#?this[_ -]week|this week)\b", "", title, flags=re.IGNORECASE).strip()
    return re.sub(r"\s+", " ", title).strip(" -:;")


def _active_goals(profile: dict[str, Any]) -> set[str]:
    raw = (
        profile.get("active_goals")
        or profile.get("active_goal_refs")
        or profile.get("goals")
        or []
    )
    if isinstance(raw, str):
        raw = [raw]

    goals: set[str] = set()
    for goal in raw:
        if isinstance(goal, dict):
            values = [goal.get("id"), goal.get("ref"), goal.get("prefix")]
        else:
            values = [goal]
        for value in values:
            if value:
                text = str(value).upper()
                goals.add(text)
                goals.add(text.split("-", 1)[0])
    return goals


def _is_relevant(task: dict, *, due_by: Date, active_goals: set[str]) -> bool:
    if task["due"] and Date.fromisoformat(task["due"]) <= due_by:
        return True
    if task["flag"] == "this_week":
        return True

    task_refs = {str(task["id"]).upper().split("-", 1)[0]}
    if task["goal_ref"]:
        task_refs.add(str(task["goal_ref"]).upper())
    return bool(active_goals.intersection(task_refs))
