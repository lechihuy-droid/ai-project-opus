"""KPI status classification for Actio plan cockpit.

The cockpit intentionally does not force every KPI into one numeric formula.
Some KPIs are threshold bands, while others are counts, overdue-day severity,
or a boolean FIRE projection. Treating counts/booleans as percentage distance
from a threshold would make the status harder to reason about.
"""

from __future__ import annotations

from typing import Any


def _number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def get_kpi_status(kind, **kwargs) -> str:
    """Returns one of: "pending", "ok", "warn", "breach"."""
    if kind == "threshold_band":
        actual = _number(kwargs.get("actual"))
        threshold = _number(kwargs.get("threshold"))
        direction = kwargs.get("direction")
        if kwargs.get("pending") or actual is None or threshold is None:
            return "pending"
        if direction not in {"<=", ">="}:
            return "pending"
        if threshold == 0:
            if (direction == "<=" and actual <= 0) or (direction == ">=" and actual >= 0):
                return "ok"
            return "breach"

        ratio = actual / threshold
        if direction == "<=":
            if ratio <= 0.8:
                return "ok"
            if ratio <= 1.0:
                return "warn"
            return "breach"

        if ratio >= 1.0:
            return "ok"
        if ratio >= 0.8:
            return "warn"
        return "breach"

    if kind == "count_step":
        count = int(_number(kwargs.get("count")) or 0)
        warn_at = int(_number(kwargs.get("warn_at")) or 1)
        breach_at = int(_number(kwargs.get("breach_at")) or 2)
        if count >= breach_at:
            return "breach"
        if count >= warn_at:
            return "warn"
        return "ok"

    if kind == "day_severity":
        overdue_count = int(_number(kwargs.get("overdue_count")) or 0)
        max_days = _number(kwargs.get("max_days")) or 0
        limit_days = _number(kwargs.get("limit_days"))
        if overdue_count == 0:
            return "ok"
        if limit_days is not None and max_days > limit_days:
            return "breach"
        return "warn"

    if kind == "boolean_flip":
        is_ok = kwargs.get("is_ok")
        if is_ok is None:
            return "pending"
        # FI has no warn state because on_track already embeds the FIRE safety band.
        return "ok" if bool(is_ok) else "breach"

    return "pending"
