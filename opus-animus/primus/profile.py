"""Load the user's goal/preference profile for proactive brief ranking."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


EMPTY_PROFILE = {"goals": [], "preferences": {}, "constraints": {}}


def load_user_profile() -> dict:
    """Load profile JSON files, degrading cleanly when the directory is absent."""

    profile_dir = _profile_dir()
    if not profile_dir.exists():
        return dict(EMPTY_PROFILE)

    return {
        "goals": _read_json(profile_dir / "goals.json", []),
        "preferences": _read_json(profile_dir / "preferences.json", {}),
        "constraints": _read_json(profile_dir / "constraints.json", {}),
    }


def active_goal_keywords(profile: dict) -> list[str]:
    """Flatten goal ids and keywords in declaration order."""

    goals = profile.get("goals", []) if isinstance(profile, dict) else []
    if isinstance(goals, str):
        goals = [goals]
    if not isinstance(goals, list):
        return []

    keywords: list[str] = []
    seen: set[str] = set()
    for goal in goals:
        values: list[Any]
        if isinstance(goal, dict):
            values = [goal.get("id")]
            goal_keywords = goal.get("keywords", [])
            if isinstance(goal_keywords, str):
                values.append(goal_keywords)
            elif isinstance(goal_keywords, list):
                values.extend(goal_keywords)
        else:
            values = [goal]

        for value in values:
            if value is None:
                continue
            keyword = str(value).strip()
            key = keyword.casefold()
            if keyword and key not in seen:
                keywords.append(keyword)
                seen.add(key)
    return keywords


def _profile_dir() -> Path:
    configured = os.environ.get("ANIMUS_USER_PROFILE")
    if configured:
        return Path(configured).expanduser()
    return Path(__file__).resolve().parents[1] / "user-profile"


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return default
