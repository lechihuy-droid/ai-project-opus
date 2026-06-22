from __future__ import annotations

from copy import deepcopy

from rector.proactive import _read_store, _today_jst, _validate_date, _write_store


ENGAGEMENT_SIGNALS = {"accepted", "snoozed", "dismissed"}
OUTCOME_DONE = "done"
OUTCOME_NOT_DONE = "not_done"


def record_engagement(item_id: str, signal: str, date: str | None = None) -> None:
    if signal not in ENGAGEMENT_SIGNALS:
        raise ValueError(f"invalid engagement signal: {signal}")

    target_date = date or _today_jst()
    _validate_date(target_date)
    payload = _read_store(target_date)
    signals = _item_signals(payload, item_id)
    signals["engagement"] = signal
    _write_store(target_date, payload)


def record_outcome(item_id: str, done: bool, date: str | None = None) -> None:
    if not isinstance(done, bool):
        raise ValueError("done must be a bool")

    target_date = date or _today_jst()
    _validate_date(target_date)
    payload = _read_store(target_date)
    signals = _item_signals(payload, item_id)
    signals["outcome"] = OUTCOME_DONE if done else OUTCOME_NOT_DONE
    _write_store(target_date, payload)


def get_signals(item_id: str, date: str | None = None) -> dict:
    target_date = date or _today_jst()
    _validate_date(target_date)
    payload = _read_store(target_date)
    signals = payload.get("outcomes", {}).get(item_id, {})
    return {
        "engagement": signals.get("engagement"),
        "outcome": signals.get("outcome"),
    }


def _item_signals(payload: dict, item_id: str) -> dict:
    outcomes = payload.setdefault("outcomes", {})
    if not isinstance(outcomes, dict):
        raise ValueError("proactive store outcomes must be a dict")

    signals = outcomes.setdefault(item_id, {})
    if not isinstance(signals, dict):
        signals = {}
        outcomes[item_id] = signals
    else:
        signals = deepcopy(signals)
        outcomes[item_id] = signals
    return signals
