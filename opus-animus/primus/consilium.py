"""Readers for Opus Consilium daily intel reviews.

Discovery in this repo:
- No checked-in ``opus-consilium/logs/`` data files were present, so runtime
  review JSON appears absent from the worktree.
- ``opus-consilium/CLAUDE.md`` and ``run_collect.py`` document the daily output
  as ``logs/intel_reviews/YYYY-MM-DD.json``.
- ``tools/collect_tool.py:daily_synthesis`` writes a review object with
  ``title``, ``reading_time``, and ``sections[]`` where section bodies may hold
  article lines such as ``1. Article title - why it matters``.
- ``api/intel.py`` can expose an API wrapper with ``llm_review`` plus structured
  article/change lists such as ``articles`` or ``latest_changes``.

This reader supports both the direct review shape and the API-wrapper shape.
Unknown or missing shapes degrade to ``[]``.
"""

from __future__ import annotations

import json
import os
import re
from datetime import date as Date
from pathlib import Path
from typing import Any


def consilium_intel(date: str) -> list[dict]:
    """Return intel items from the latest review on or before ``date``."""

    try:
        review_path = _latest_review_path(_intel_reviews_dir(), date)
        if review_path is None:
            return []
        data = json.loads(review_path.read_text(encoding="utf-8"))
        return _dedupe_items(_extract_items(data))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return []


def _intel_reviews_dir() -> Path:
    env_root = os.environ.get("OPUS_CONSILIUM_LOGS")
    if env_root:
        root = Path(env_root)
        return root if root.name == "intel_reviews" else root / "intel_reviews"
    return Path(__file__).resolve().parents[1] / "opus-consilium" / "logs" / "intel_reviews"


def _latest_review_path(review_dir: Path, target_date: str) -> Path | None:
    target = Date.fromisoformat(target_date)
    if not review_dir.exists() or not review_dir.is_dir():
        return None

    candidates: list[tuple[Date, Path]] = []
    for path in review_dir.glob("*.json"):
        try:
            review_date = Date.fromisoformat(path.stem)
        except ValueError:
            continue
        if review_date <= target:
            candidates.append((review_date, path))

    if not candidates:
        return None
    return max(candidates, key=lambda item: item[0])[1]


def _extract_items(data: Any) -> list[dict]:
    if isinstance(data, list):
        return _extract_list(data)
    if not isinstance(data, dict):
        return []

    items: list[dict] = []

    for key in ("articles", "latest_changes", "info_items", "items", "intel_items", "signals"):
        value = data.get(key)
        if isinstance(value, list):
            items.extend(_extract_list(value))

    llm_review = data.get("llm_review")
    if isinstance(llm_review, (dict, list)):
        items.extend(_extract_items(llm_review))

    sections = data.get("sections")
    if isinstance(sections, list):
        items.extend(_extract_sections(sections))

    direct_item = _normalize_item(data)
    if direct_item is not None:
        items.append(direct_item)

    return items


def _extract_list(values: list[Any]) -> list[dict]:
    items: list[dict] = []
    for value in values:
        if isinstance(value, dict):
            nested = _extract_items(value)
            if nested:
                items.extend(nested)
            else:
                item = _normalize_item(value)
                if item is not None:
                    items.append(item)
    return items


def _extract_sections(sections: list[Any]) -> list[dict]:
    parsed: list[dict] = []
    fallback: list[dict] = []

    for section in sections:
        if not isinstance(section, dict):
            continue
        heading = _first_string(section, ("heading", "title", "topic", "name"))
        body = _first_string(section, ("body", "summary", "text", "content", "reason"))
        if not heading or not body:
            continue

        if _looks_like_article_section(heading):
            parsed.extend(_items_from_review_body(body, heading))
        else:
            fallback.append({"title": heading, "reason": body, "topic": heading})

    return parsed or fallback


def _looks_like_article_section(heading: str) -> bool:
    text = heading.casefold()
    return any(token in text for token in ("top", "read", "doc", "can doc", "article"))


def _items_from_review_body(body: str, topic: str) -> list[dict]:
    items: list[dict] = []
    for raw_line in body.splitlines():
        line = _strip_list_marker(raw_line)
        if not line:
            continue
        title, reason = _split_title_reason(line)
        items.append({"title": title, "reason": reason or line, "topic": topic})
    return items


def _strip_list_marker(line: str) -> str:
    return re.sub(r"^\s*(?:[-*]\s+|\d+[\).]\s*)", "", line).strip()


def _split_title_reason(line: str) -> tuple[str, str]:
    for delimiter in (" \u2014 ", " \u2013 ", " - ", ": "):
        if delimiter in line:
            title, reason = line.split(delimiter, 1)
            return title.strip(), reason.strip()
    return line.strip(), ""


def _normalize_item(item: dict) -> dict | None:
    title = _first_string(item, ("title", "headline", "name"))
    if not title:
        return None

    reason = _first_string(item, ("reason", "why", "summary", "fpt_relevance", "relevance", "content", "excerpt"))
    topic = (
        _first_string(item, ("topic", "category", "category_label", "goal_ref", "goal", "source_kind"))
        or _list_string(item.get("tags"))
        or _list_string(item.get("signals"))
        or ""
    )
    if not reason and not topic:
        return None
    return {"title": title, "reason": reason or "", "topic": topic}


def _first_string(data: dict, keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _list_string(value: Any) -> str | None:
    if not isinstance(value, list):
        return None

    parts: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            parts.append(item.strip())
        elif isinstance(item, dict):
            label = _first_string(item, ("label", "title", "name", "key"))
            if label:
                parts.append(label)
    return ", ".join(parts) if parts else None


def _dedupe_items(items: list[dict]) -> list[dict]:
    deduped: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for item in items:
        title = str(item.get("title", "")).strip()
        reason = str(item.get("reason", "")).strip()
        topic = str(item.get("topic", "")).strip()
        if not title:
            continue
        key = (title.casefold(), reason.casefold(), topic.casefold())
        if key in seen:
            continue
        seen.add(key)
        deduped.append({"title": title, "reason": reason, "topic": topic})
    return deduped
