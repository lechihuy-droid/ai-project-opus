"""Rank proactive Logos items by strategic fit and today's constraints."""

from __future__ import annotations

import json
from typing import Any, Callable


Priority = str
LLM = Callable[[str], str]


def rank(items: list[dict], profile: dict, context: dict, llm: LLM | None = None) -> list[dict]:
    """Return items sorted by descending score with rank metadata."""

    prompt = _build_prompt(items, profile, context)
    scorer = llm or _default_llm

    for _ in range(2):
        try:
            scored = _parse_rankings(scorer(prompt), items)
            return _apply_rankings(items, scored)
        except Exception:
            continue

    return _heuristic_rank(items, profile)


def _default_llm(prompt: str) -> str:
    from animus_core.llm import claude_cli

    return claude_cli(prompt)


def _build_prompt(items: list[dict], profile: dict, context: dict) -> str:
    payload = {
        "items": [_prompt_item(index, item) for index, item in enumerate(items)],
        "profile_goals": profile.get("goals", profile),
        "context": context,
    }
    return (
        "Score each proactive item for today's brief.\n"
        "Criteria: goal alignment with profile goals, urgency, and fit with energy/calendar context.\n"
        "Return JSON only as an array of objects: "
        '[{"id":"<item id>","score":0.0-1.0,"rank_reason":"short reason"}].\n'
        "Use the provided id exactly for every item.\n\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )


def _prompt_item(index: int, item: dict) -> dict:
    prompt_item = dict(item)
    prompt_item["id"] = _item_id(item, index)
    return prompt_item


def _parse_rankings(text: str, items: list[dict]) -> dict[str, dict[str, Any]]:
    data = _extract_json(text)
    rows = _ranking_rows(data)
    valid_ids = {_item_id(item, index) for index, item in enumerate(items)}
    rankings: dict[str, dict[str, Any]] = {}

    for row in rows:
        item_id = str(row.get("id", row.get("item_id", row.get("key", ""))))
        if item_id not in valid_ids:
            continue
        rankings[item_id] = {
            "score": _clamp_score(row.get("score")),
            "rank_reason": str(row.get("rank_reason", row.get("reason", ""))).strip()
            or "LLM ranking",
        }

    if len(rankings) != len(items):
        raise ValueError("LLM response did not score every item")
    return rankings


def _ranking_rows(data: Any) -> list[dict]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    if isinstance(data, dict):
        for key in ("items", "ranked_items", "scores", "rankings"):
            value = data.get(key)
            if isinstance(value, list):
                return [row for row in value if isinstance(row, dict)]
        if all(isinstance(value, (int, float)) for value in data.values()):
            return [{"id": key, "score": value} for key, value in data.items()]
    raise ValueError("LLM response did not contain ranking rows")


def _extract_json(text: str) -> Any:
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char not in "[{":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, (dict, list)):
            return value
    raise ValueError(f"No JSON in response: {text[:200]}")


def _apply_rankings(items: list[dict], rankings: dict[str, dict[str, Any]]) -> list[dict]:
    ranked = []
    for index, item in enumerate(items):
        item_id = _item_id(item, index)
        score = rankings[item_id]["score"]
        ranked.append(
            {
                **item,
                "score": score,
                "priority": _priority_from_score(score),
                "rank_reason": rankings[item_id]["rank_reason"],
            }
        )
    return _sort_ranked(ranked)


def _heuristic_rank(items: list[dict], profile: dict) -> list[dict]:
    ranked = []
    active_keywords = _active_goal_keywords(profile)
    for index, item in enumerate(items):
        score = _heuristic_score(item, active_keywords)
        ranked.append(
            {
                **item,
                "score": score,
                "priority": _priority_from_score(score),
                "rank_reason": "heuristic fallback",
                "_rank_index": index,
            }
        )
    sorted_items = sorted(ranked, key=lambda item: (-item["score"], item["_rank_index"]))
    for item in sorted_items:
        item.pop("_rank_index", None)
    return sorted_items


def _heuristic_score(item: dict, active_keywords: list[str]) -> float:
    aligned = _is_goal_aligned(item, active_keywords)
    due_or_high = _is_due_or_high(item)
    if aligned and due_or_high:
        score = 0.85
    elif aligned:
        score = 0.6
    elif due_or_high:
        score = 0.5
    else:
        score = 0.25

    if item.get("blocked"):
        score -= 0.2
    return _clamp_score(score)


def _active_goal_keywords(profile: dict) -> list[str]:
    goals = profile.get("goals", []) if isinstance(profile, dict) else []
    explicit = (
        profile.get("active_goals", [])
        or profile.get("active_goal_refs", [])
        if isinstance(profile, dict)
        else []
    )
    values: list[Any] = []
    if isinstance(explicit, str):
        values.append(explicit)
    elif isinstance(explicit, list):
        values.extend(explicit)

    if isinstance(goals, str):
        values.append(goals)
    elif isinstance(goals, list):
        for goal in goals:
            if isinstance(goal, dict):
                values.append(goal.get("id"))
                keywords = goal.get("keywords", [])
                if isinstance(keywords, str):
                    values.append(keywords)
                elif isinstance(keywords, list):
                    values.extend(keywords)
            else:
                values.append(goal)

    keywords: list[str] = []
    seen: set[str] = set()
    for value in values:
        if value is None:
            continue
        keyword = str(value).strip()
        key = keyword.casefold()
        if keyword and key not in seen:
            keywords.append(keyword)
            seen.add(key)
    return keywords


def _is_goal_aligned(item: dict, active_keywords: list[str]) -> bool:
    if not active_keywords:
        return False
    text = " ".join(
        _text_parts(
            [
                item.get("title"),
                item.get("reason"),
                item.get("goal_ref"),
                item.get("goal_refs"),
            ]
        )
    ).casefold()
    return any(keyword.casefold() in text for keyword in active_keywords)


def _text_parts(values: list[Any]) -> list[str]:
    parts: list[str] = []
    for value in values:
        if value is None:
            continue
        if isinstance(value, list):
            parts.extend(_text_parts(value))
        elif isinstance(value, dict):
            parts.extend(_text_parts(list(value.values())))
        else:
            text = str(value).strip()
            if text:
                parts.append(text)
    return parts


def _is_due_or_high(item: dict) -> bool:
    priority = str(item.get("priority", "")).casefold()
    if priority in {"urgent", "high", "p0"}:
        return True
    return any(item.get(key) for key in ("due", "due_date", "deadline", "hard_deadline"))


def _item_id(item: dict, index: int) -> str:
    for key in ("id", "item_id", "key"):
        value = item.get(key)
        if value is not None:
            return str(value)
    return str(index)


def _clamp_score(value: Any) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid score: {value!r}") from None
    return max(0.0, min(1.0, score))


def _priority_from_score(score: float) -> Priority:
    if score >= 0.75:
        return "high"
    if score >= 0.4:
        return "medium"
    return "low"


def _sort_ranked(items: list[dict]) -> list[dict]:
    return sorted(items, key=lambda item: item["score"], reverse=True)
