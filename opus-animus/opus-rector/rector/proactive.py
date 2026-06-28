from __future__ import annotations

import json
import logging
import os
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


TRIGGERS = {"time", "event", "threshold"}
SOURCE_SUBSYSTEMS = {"RECTOR", "LOGOS", "NEXUS", "CONSILIUM", "ACTIO"}
KINDS = {"task", "health_nudge", "calendar_prep", "knowledge_nudge", "info_alert", "finance_alert"}
PRIORITIES = {"high", "medium", "low"}
ITEM_STATES = {"pending", "accepted", "snoozed", "dismissed"}
ACTION_STATES = {"accepted", "snoozed", "dismissed"}
REQUIRED_KEYS = {
    "id",
    "trigger",
    "source_subsystem",
    "kind",
    "title",
    "reason",
    "priority",
    "suggested_action",
    "requires_approval",
    "state",
}


def save_proactive_set(date: str, items: list[dict]) -> None:
    _validate_date(date)
    validated_items = [_validate_item(item) for item in items]
    _write_store(date, {"date": date, "items": validated_items})


def get_proactive_set(date: str) -> list[dict]:
    _validate_date(date)
    payload = _read_store(date)
    return deepcopy(payload.get("items", []))


def update_proactive_state(item_id: str, state: str, date: str | None = None) -> None:
    if state not in ACTION_STATES:
        raise ValueError(f"invalid proactive state: {state}")

    target_date = date or _today_jst()
    _validate_date(target_date)
    payload = _read_store(target_date)

    for item in payload.get("items", []):
        if item.get("id") == item_id:
            item["state"] = state
            _write_store(target_date, payload)
            return

    raise ValueError(f"proactive item not found: {item_id}")


def exclude_dismissed(date: str, items: list[dict]) -> list[dict]:
    _validate_date(date)
    dismissed_ids = {
        item.get("id")
        for item in _read_store(date).get("items", [])
        if item.get("state") == "dismissed"
    }
    return [item for item in items if item.get("id") not in dismissed_ids]


def _validate_item(item: dict) -> dict:
    if not isinstance(item, dict):
        raise ValueError("proactive item must be a dict")

    missing = REQUIRED_KEYS - item.keys()
    if missing:
        raise ValueError(f"missing proactive item keys: {sorted(missing)}")

    _require_str(item, "id")
    _require_enum(item, "trigger", TRIGGERS)
    _require_enum(item, "source_subsystem", SOURCE_SUBSYSTEMS)
    _require_enum(item, "kind", KINDS)
    _require_str(item, "title")
    _require_str(item, "reason")
    _require_enum(item, "priority", PRIORITIES)
    _require_str(item, "suggested_action")
    if item["requires_approval"] is not True:
        raise ValueError("requires_approval must be True")
    _require_enum(item, "state", ITEM_STATES)

    return deepcopy(item)


def _require_str(item: dict, key: str) -> None:
    if not isinstance(item[key], str):
        raise ValueError(f"{key} must be a string")


def _require_enum(item: dict, key: str, values: set[str]) -> None:
    if item[key] not in values:
        raise ValueError(f"invalid {key}: {item[key]}")


def _read_store(date: str) -> dict:
    path = _store_path(date)
    if not path.exists():
        return {"date": date, "items": []}

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        _backup_corrupt_store(path)
        logging.warning("corrupt proactive store backed up: %s", path)
        return {"date": date, "items": []}

    if not isinstance(payload, dict):
        raise ValueError(f"proactive store must contain a JSON object: {path}")
    if not isinstance(payload.get("items", []), list):
        raise ValueError(f"proactive store items must be a list: {path}")
    return payload


def _write_store(date: str, payload: dict) -> None:
    store_dir = _store_dir()
    store_dir.mkdir(parents=True, exist_ok=True)
    path = _store_path(date)
    tmp_path = path.with_suffix(".json.tmp")
    tmp_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    tmp_path.replace(path)


def _backup_corrupt_store(path: Path) -> None:
    backup_path = path.with_suffix(path.suffix + ".bak")
    path.replace(backup_path)


def _store_path(date: str) -> Path:
    return _store_dir() / f"{date}.json"


def _store_dir() -> Path:
    env_dir = os.environ.get("ANIMUS_PROACTIVE_DIR")
    if env_dir:
        return Path(env_dir)
    return Path(__file__).resolve().parents[1] / "proactive"


def _validate_date(date: str) -> None:
    datetime.strptime(date, "%Y-%m-%d")


def _today_jst() -> str:
    return datetime.now(ZoneInfo("Asia/Tokyo")).date().isoformat()
