from __future__ import annotations

import datetime as dt
import json
import threading
import time
from pathlib import Path
from typing import Any

import config
from parsers import claude_sessions, codex_sessions, inspect_eval


CACHE_TTL_SECONDS = 30.0
_USAGE_CACHE: dict[str, Any] = {"expires": 0.0, "events": [], "warnings": [], "fingerprint": None}
_DISK_CACHE = config.HUB_DIR / ".cache" / "usage.json"
_LOCK = threading.RLock()


def _source_files() -> list[Path]:
    """All raw usage source files (cheap glob; used only for the fingerprint)."""
    files: list[Path] = []
    claude = config.USAGE_SOURCES.get("claude")
    if isinstance(claude, Path) and claude.exists():
        files.extend(claude.glob("*/*.jsonl"))
    for codex_dir in config.USAGE_SOURCES.get("codex") or []:
        if isinstance(codex_dir, Path) and codex_dir.exists():
            files.extend(codex_dir.glob("*.jsonl"))
    inspect = config.USAGE_SOURCES.get("inspect")
    if isinstance(inspect, Path) and inspect.exists():
        files.extend(inspect.glob("*.eval"))
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


def _load_disk(fingerprint: str) -> tuple[list[dict[str, Any]], list[str]] | None:
    try:
        data = json.loads(_DISK_CACHE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if data.get("fingerprint") != fingerprint:
        return None
    return data.get("events") or [], data.get("warnings") or []


def _save_disk(fingerprint: str, events: list[dict[str, Any]], warnings: list[str]) -> None:
    try:
        _DISK_CACHE.parent.mkdir(parents=True, exist_ok=True)
        _DISK_CACHE.write_text(
            json.dumps({"fingerprint": fingerprint, "events": events, "warnings": warnings}),
            encoding="utf-8",
        )
    except OSError:
        pass


def _build() -> tuple[list[dict[str, Any]], list[str]]:
    events: list[dict[str, Any]] = []
    warnings: list[str] = []
    for parser in (claude_sessions, codex_sessions, inspect_eval):
        parser_events, parser_warnings = parser.collect()
        events.extend(parser_events)
        warnings.extend(parser_warnings)
    events.sort(key=lambda item: str(item.get("ts") or ""), reverse=True)
    return events, warnings


def _collect_all() -> tuple[list[dict[str, Any]], list[str]]:
    now = time.monotonic()
    fingerprint = _fingerprint()
    with _LOCK:
        # In-memory cache valid only while the source set is unchanged.
        if _USAGE_CACHE["expires"] > now and _USAGE_CACHE["fingerprint"] == fingerprint:
            return list(_USAGE_CACHE["events"]), list(_USAGE_CACHE["warnings"])

        disk = _load_disk(fingerprint)
        if disk is not None:
            events, warnings = disk
        else:
            events, warnings = _build()
            _save_disk(fingerprint, events, warnings)

        _USAGE_CACHE.update(
            {"expires": now + CACHE_TTL_SECONDS, "events": events, "warnings": warnings, "fingerprint": fingerprint}
        )
        return list(events), list(warnings)


def warm() -> None:
    """Best-effort cache warm (call in a background thread at startup)."""
    try:
        _collect_all()
    except Exception:
        pass


def _parse_since(value: str | None) -> dt.datetime | None:
    if not value:
        return None
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.UTC)
    return parsed


def _event_dt(event: dict[str, Any]) -> dt.datetime | None:
    ts = event.get("ts")
    if not isinstance(ts, str) or not ts:
        return None
    try:
        parsed = dt.datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.UTC)
    return parsed


def _matches(event: dict[str, Any], filters: dict[str, str | None], since_dt: dt.datetime | None) -> bool:
    source = filters.get("source")
    model = filters.get("model")
    if source and event.get("source") != source:
        return False
    if model and event.get("model") != model:
        return False
    if since_dt is not None:
        event_time = _event_dt(event)
        if event_time is None or event_time < since_dt:
            return False
    return True


def collect_usage(filters: dict[str, str | None] | None = None) -> list[dict[str, Any]]:
    filters = filters or {}
    since_dt = _parse_since(filters.get("since"))
    events, _warnings = _collect_all()
    filtered = [event for event in events if _matches(event, filters, since_dt)]
    filtered.sort(key=lambda item: str(item.get("ts") or ""), reverse=True)
    return filtered


def warnings() -> list[str]:
    _events, parser_warnings = _collect_all()
    return parser_warnings


def _empty_totals() -> dict[str, int]:
    return {"calls": 0, "input_tokens": 0, "output_tokens": 0, "total_tokens": 0}


def _empty_rollup_totals() -> dict[str, int]:
    return {**_empty_totals(), "cache_tokens": 0, "non_cache_tokens": 0}


def _add_tokens(target: dict[str, Any], event: dict[str, Any]) -> None:
    input_tokens = int(event.get("input_tokens") or 0)
    output_tokens = int(event.get("output_tokens") or 0)
    cache_tokens = int(event.get("cache_read_tokens") or 0) + int(event.get("cache_creation_tokens") or 0)

    target["calls"] += int(event.get("calls") or 0)
    target["input_tokens"] += input_tokens
    target["output_tokens"] += output_tokens
    target["total_tokens"] += int(event.get("total_tokens") or 0)
    if "cache_tokens" in target:
        target["cache_tokens"] += cache_tokens
    if "non_cache_tokens" in target:
        target["non_cache_tokens"] += input_tokens + output_tokens


def rollup(events: list[dict[str, Any]]) -> dict[str, Any]:
    by_model: dict[str, dict[str, Any]] = {}
    by_day: dict[str, dict[str, Any]] = {}
    by_source: dict[str, dict[str, Any]] = {}
    totals = _empty_rollup_totals()

    for usage_event in events:
        model = str(usage_event.get("model") or "unknown")
        day = str(usage_event.get("ts") or "")[:10] or "unknown"
        source = str(usage_event.get("source") or "unknown")

        model_row = by_model.setdefault("model:" + model, {"model": model, **_empty_totals()})
        day_row = by_day.setdefault("day:" + day, {"day": day, **_empty_totals()})
        source_row = by_source.setdefault("source:" + source, {"source": source, "calls": 0, "total_tokens": 0})

        _add_tokens(model_row, usage_event)
        _add_tokens(day_row, usage_event)
        source_row["calls"] += int(usage_event.get("calls") or 0)
        source_row["total_tokens"] += int(usage_event.get("total_tokens") or 0)
        _add_tokens(totals, usage_event)

    return {
        "by_model": sorted(by_model.values(), key=lambda item: item["total_tokens"], reverse=True),
        "by_day": sorted(by_day.values(), key=lambda item: item["day"]),
        "by_source": sorted(by_source.values(), key=lambda item: item["total_tokens"], reverse=True),
        "totals": totals,
    }
