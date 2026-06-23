"""Readers for Opus Vita health and workout data.

Data root resolution:
- ``OPUS_VITA_DATA`` env var, when set, points at the repo-level data root.
- Default data root is the repo root containing ``opus-animus/``.

Expected data shape under the data root:
- ``health-data/index.json``: list of ISO dates.
- ``health-data/YYYY-MM-DD.json``: ``date``, ``meals[]`` where each meal may
  include ``total_kcal`` and ``total_protein``, plus ``water_ml``, ``steps``,
  ``sleep_hours``, ``weight_kg``, and ``notes``.
- ``workout-data/index.json``: list of ISO dates.
- ``workout-data/YYYY-MM-DD.json``: ``date``, ``sessions[]`` where each session
  may include ``time``, ``type``, ``duration_min``, ``calories``, ``exercises``,
  and ``notes``.
"""

from __future__ import annotations

import json
import os
from datetime import date as Date
from datetime import timedelta
from pathlib import Path
from typing import Any


def vita_health(date: str) -> dict | None:
    """Return the daily health summary, degrading to None when data is absent."""

    health_dir = _data_root() / "health-data"
    data = _read_dated_json(health_dir, date)
    if data is None:
        return None

    meals = data.get("meals") if isinstance(data.get("meals"), list) else []
    total_kcal = _sum_numbers(meal.get("total_kcal") for meal in meals if isinstance(meal, dict))
    total_protein = _sum_numbers(
        meal.get("total_protein") for meal in meals if isinstance(meal, dict)
    )
    result = {
        "sleep_hours": _number(data.get("sleep_hours")),
        "weight_kg": _number(data.get("weight_kg")),
        "total_kcal": total_kcal,
        "total_protein": total_protein,
        "steps": _number(data.get("steps")),
        "water_ml": _number(data.get("water_ml")),
    }
    result["summary"] = _health_summary(result)
    return result


def vita_workout(date: str) -> dict | None:
    """Return the daily workout summary, degrading to None when data is absent."""

    workout_dir = _data_root() / "workout-data"
    data = _read_dated_json(workout_dir, date)
    if data is None:
        return None

    raw_sessions = data.get("sessions")
    sessions = (
        [session for session in raw_sessions if isinstance(session, dict)]
        if isinstance(raw_sessions, list)
        else []
    )
    types = _unique_strings(session.get("type") for session in sessions)
    result = {
        "trained_today": bool(sessions),
        "sessions": len(sessions),
        "types": types,
        "total_min": _sum_numbers(session.get("duration_min") for session in sessions),
    }
    streak_days = _workout_streak_days(workout_dir, date)
    if streak_days is not None:
        result["streak_days"] = streak_days
    result["summary"] = _workout_summary(result)
    return result


def _data_root() -> Path:
    env_root = os.environ.get("OPUS_VITA_DATA")
    if env_root:
        return Path(env_root)
    return Path(__file__).resolve().parents[2]


def _read_dated_json(root: Path, date: str) -> dict | None:
    if not root.exists() or not root.is_dir():
        return None

    path = root / f"{date}.json"
    if not path.exists() or not path.is_file():
        return None

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _workout_streak_days(workout_dir: Path, current_date: str) -> int | None:
    try:
        parsed_date = Date.fromisoformat(current_date)
    except ValueError:
        return None

    index_path = workout_dir / "index.json"
    try:
        raw_dates = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    if not isinstance(raw_dates, list):
        return None

    available_dates = {item for item in raw_dates if isinstance(item, str)}
    if current_date not in available_dates:
        return None

    streak = 0
    cursor = parsed_date
    while cursor.isoformat() in available_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _sum_numbers(values: Any) -> int | float:
    total = 0.0
    for value in values:
        number = _number(value)
        if number is not None:
            total += number
    return _compact_number(total)


def _number(value: Any) -> int | float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return _compact_number(value)
    if isinstance(value, str):
        try:
            return _compact_number(float(value.strip()))
        except ValueError:
            return None
    return None


def _compact_number(value: int | float) -> int | float:
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def _unique_strings(values: Any) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if not isinstance(value, str):
            continue
        text = value.strip()
        key = text.casefold()
        if text and key not in seen:
            seen.add(key)
            result.append(text)
    return result


def _health_summary(health: dict) -> str:
    parts: list[str] = []
    if health.get("sleep_hours") is not None:
        parts.append(f"Ngủ {_format_number(health['sleep_hours'])}h")
    if health.get("total_kcal") or health.get("total_protein"):
        parts.append(
            f"{_format_number(health['total_kcal'])} kcal / "
            f"{_format_number(health['total_protein'])}g đạm"
        )
    if health.get("steps") is not None:
        parts.append(f"{_format_number(health['steps'])} bước")
    if health.get("water_ml") is not None:
        parts.append(f"{_format_number(health['water_ml'])}ml nước")
    if health.get("weight_kg") is not None:
        parts.append(f"{_format_number(health['weight_kg'])}kg")
    return "; ".join(parts) + "." if parts else "Có dữ liệu sức khỏe."


def _workout_summary(workout: dict) -> str:
    if not workout["trained_today"]:
        return "Chưa tập hôm nay."

    type_text = f" ({', '.join(workout['types'])})" if workout["types"] else ""
    streak_text = f"; chuỗi {workout['streak_days']} ngày" if workout.get("streak_days") else ""
    minutes_text = (
        f", {_format_number(workout['total_min'])}'"
        if workout.get("total_min")
        else ""
    )
    return f"Đã tập: {workout['sessions']} buổi{type_text}{minutes_text}{streak_text}."


def _format_number(value: Any) -> str:
    if value is None:
        return "0"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)
