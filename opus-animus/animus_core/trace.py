"""Append-only trace logging for animus-level eval data."""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


JST = timezone(timedelta(hours=9))
TRACES_DIR = Path(__file__).resolve().parents[1] / "ai" / "traces"

REQUIRED_FIELDS = {
    "id",
    "ts",
    "origin",
    "user_input",
    "intent_type",
    "target_subsystem",
    "route_confidence",
    "sources_loaded",
    "action_class",
    "output_kind",
    "step_index",
}

ORIGINS = {"user", "proactive_trigger"}
INTENT_TYPES = {
    "strategy",
    "information",
    "execution",
    "content",
    "memory",
    "health",
    "infra",
    "admin",
}
TARGET_SUBSYSTEMS = {"NEXUS", "CONSILIUM", "LOGOS", "RECTOR", "LUCIDA", "WIKI", "INFRA"}
ACTION_CLASSES = {"read", "draft", "write", "dangerous"}


def log_trace(record: dict) -> None:
    """Append one validated trace record as a JSONL row."""

    _validate_record(record)
    _append_json_line(_trace_path(_jst_date()), record)


def patch_trace(id: str, patch: dict) -> None:
    """Append an update delta for an existing trace id."""

    _append_json_line(_trace_path(_jst_date()), {"id": id, "patch": patch})


def read_traces(date: Any) -> list[dict]:
    """Read a day file and return records with patch rows merged by id."""

    path = _trace_path(str(date))
    if not path.exists():
        return []

    records: dict[str, dict] = {}
    order: list[str] = []
    pending_patches: dict[str, dict] = {}

    with path.open("r", encoding="utf-8") as trace_file:
        for line in trace_file:
            row = json.loads(line)
            row_id = row.get("id")
            if not row_id:
                continue

            if "patch" in row:
                patch = row["patch"]
                if row_id in records:
                    records[row_id].update(patch)
                else:
                    pending_patches.setdefault(row_id, {}).update(patch)
                continue

            records[row_id] = row
            if row_id not in order:
                order.append(row_id)
            if row_id in pending_patches:
                records[row_id].update(pending_patches[row_id])

    return [records[row_id] for row_id in order]


def _validate_record(record: dict) -> None:
    missing = REQUIRED_FIELDS - set(record)
    if missing:
        raise ValueError(f"Missing required trace field(s): {', '.join(sorted(missing))}")

    _validate_enum(record, "origin", ORIGINS)
    _validate_enum(record, "intent_type", INTENT_TYPES)
    _validate_enum(record, "target_subsystem", TARGET_SUBSYSTEMS)
    _validate_enum(record, "action_class", ACTION_CLASSES)


def _validate_enum(record: dict, field: str, allowed: set[str]) -> None:
    if record[field] not in allowed:
        allowed_values = ", ".join(sorted(allowed))
        raise ValueError(f"Invalid {field}: {record[field]!r}. Expected one of: {allowed_values}")


def _append_json_line(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as trace_file:
        json.dump(payload, trace_file, ensure_ascii=False, separators=(",", ":"))
        trace_file.write("\n")


def _trace_path(date: str) -> Path:
    return _traces_dir() / f"{date}.jsonl"


def _traces_dir() -> Path:
    return Path(os.environ.get("ANIMUS_TRACES_DIR", TRACES_DIR))


def _jst_date() -> str:
    return datetime.now(JST).date().isoformat()
