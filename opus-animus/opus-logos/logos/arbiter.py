"""Resolve contradictory Logos brief items with fixed precedence."""

from __future__ import annotations

from collections.abc import Iterable


PRECEDENCE = ["safety/health", "hard_deadline", "goal_priority", "preference"]
_PRECEDENCE_RANK = {tier: index for index, tier in enumerate(PRECEDENCE)}


def arbitrate(ranked_items: list[dict]) -> tuple[list[dict], list[dict]]:
    """Drop conflicting lower-precedence items and record the trade-off made."""

    conflicts = detect_conflicts(ranked_items)
    if not conflicts:
        return ranked_items, []

    item_by_id = {_item_id(item, index): item for index, item in enumerate(ranked_items)}
    order = {_item_id(item, index): index for index, item in enumerate(ranked_items)}
    dropped: set[str] = set()
    tradeoff_notes = []

    for left_id, right_id in conflicts:
        if left_id in dropped or right_id in dropped:
            continue

        left = item_by_id[left_id]
        right = item_by_id[right_id]
        kept_id, dropped_id = _resolve_pair(left_id, right_id, left, right, order)
        dropped.add(dropped_id)

        kept_tier = tier_of(item_by_id[kept_id])
        dropped_tier = tier_of(item_by_id[dropped_id])
        tradeoff_notes.append(
            {
                "kept": kept_id,
                "dropped": dropped_id,
                "reason": _tradeoff_reason(kept_tier, dropped_tier),
            }
        )

    resolved_items = [
        item for index, item in enumerate(ranked_items) if _item_id(item, index) not in dropped
    ]

    return resolved_items, tradeoff_notes


def tier_of(item: dict) -> str:
    """Map a proactive item to the fixed arbiter precedence tier."""

    if item.get("kind") == "health_nudge":
        return "safety/health"
    if _is_hard_deadline(item):
        return "hard_deadline"
    if _has_active_goal(item):
        return "goal_priority"
    return "preference"


def detect_conflicts(items: list[dict]) -> list[tuple[str, str]]:
    """Return contradictory item id pairs in deterministic input order."""

    ids = [_item_id(item, index) for index, item in enumerate(items)]
    id_to_index = {item_id: index for index, item_id in enumerate(ids)}
    conflicts: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()

    def add(left_id: str, right_id: str) -> None:
        if left_id == right_id or left_id not in id_to_index or right_id not in id_to_index:
            return
        if id_to_index[left_id] > id_to_index[right_id]:
            left_id, right_id = right_id, left_id
        pair = (left_id, right_id)
        if pair not in seen:
            seen.add(pair)
            conflicts.append(pair)

    for index, item in enumerate(items):
        for other_id in _conflict_ids(item):
            add(ids[index], other_id)

    for left_index, left in enumerate(items):
        for right_index in range(left_index + 1, len(items)):
            right = items[right_index]
            if _is_health_rest(left) and _is_deadline_push(right):
                add(ids[left_index], ids[right_index])
            elif _is_health_rest(right) and _is_deadline_push(left):
                add(ids[left_index], ids[right_index])

    return conflicts


def _resolve_pair(
    left_id: str,
    right_id: str,
    left: dict,
    right: dict,
    order: dict[str, int],
) -> tuple[str, str]:
    left_rank = _PRECEDENCE_RANK[tier_of(left)]
    right_rank = _PRECEDENCE_RANK[tier_of(right)]

    if left_rank < right_rank:
        return left_id, right_id
    if right_rank < left_rank:
        return right_id, left_id
    if order[left_id] <= order[right_id]:
        return left_id, right_id
    return right_id, left_id


def _tradeoff_reason(kept_tier: str, dropped_tier: str) -> str:
    if kept_tier == dropped_tier:
        return f"same tier ({kept_tier}); kept the earlier-ranked conflicting item"
    return f"{kept_tier} takes precedence over {dropped_tier}"


def _conflict_ids(item: dict) -> list[str]:
    conflicts = item.get("conflicts_with", [])
    if isinstance(conflicts, str):
        return [conflicts]
    if isinstance(conflicts, Iterable):
        return [str(item_id) for item_id in conflicts]
    return []


def _is_hard_deadline(item: dict) -> bool:
    if item.get("kind") in {"hard_deadline", "deadline_push"}:
        return True
    if any(item.get(key) for key in ("deadline", "hard_deadline", "is_deadline", "due", "due_date")):
        return True
    if _has_deadline_flag(item.get("flag")) or _has_deadline_flag(item.get("flags")):
        return True
    return _mentions_any(item, {"deadline", "due"})


def _has_deadline_flag(value: object) -> bool:
    if isinstance(value, str):
        return "deadline" in value.casefold() or "due" in value.casefold()
    if isinstance(value, Iterable):
        return any(_has_deadline_flag(part) for part in value)
    return False


def _has_active_goal(item: dict) -> bool:
    return any(
        item.get(key)
        for key in (
            "active_goal",
            "active_goal_id",
            "active_goal_ref",
            "goal_ref",
            "goal_refs",
            "goal_id",
            "goal",
            "goals",
        )
    )


def _is_health_rest(item: dict) -> bool:
    return item.get("kind") == "health_nudge" and _mentions_any(
        item, {"rest", "recover", "recovery", "sleep", "nap", "break"}
    )


def _is_deadline_push(item: dict) -> bool:
    return _is_hard_deadline(item) and (
        item.get("kind") in {"hard_deadline", "deadline_push"} or _mentions_any(item, {"push"})
    )


def _mentions_any(item: dict, terms: set[str]) -> bool:
    text = " ".join(
        str(item.get(key, ""))
        for key in ("title", "reason", "description", "summary", "action", "body")
    ).casefold()
    return any(term in text for term in terms)


def _item_id(item: dict, index: int) -> str:
    for key in ("id", "item_id", "key"):
        value = item.get(key)
        if value is not None:
            return str(value)
    return str(index)
