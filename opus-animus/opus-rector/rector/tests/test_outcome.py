from rector.outcome import get_signals, record_engagement, record_outcome
from rector.proactive import save_proactive_set


DATE = "2026-06-21"


def _item(**overrides):
    item = {
        "id": "item-1",
        "trigger": "time",
        "source_subsystem": "RECTOR",
        "kind": "task",
        "title": "Prepare weekly note",
        "reason": "Task is due soon",
        "priority": "medium",
        "suggested_action": "Draft the note",
        "requires_approval": True,
        "state": "pending",
    }
    item.update(overrides)
    return item


def test_engagement_and_outcome_are_stored_separately(tmp_path, monkeypatch):
    monkeypatch.setenv("ANIMUS_PROACTIVE_DIR", str(tmp_path))
    save_proactive_set(DATE, [_item()])

    record_engagement("item-1", "accepted", date=DATE)
    record_outcome("item-1", True, date=DATE)

    assert get_signals("item-1", date=DATE) == {
        "engagement": "accepted",
        "outcome": "done",
    }


def test_engagement_and_outcome_do_not_overwrite_each_other(tmp_path, monkeypatch):
    monkeypatch.setenv("ANIMUS_PROACTIVE_DIR", str(tmp_path))
    save_proactive_set(DATE, [_item()])

    record_outcome("item-1", False, date=DATE)
    record_engagement("item-1", "dismissed", date=DATE)

    assert get_signals("item-1", date=DATE) == {
        "engagement": "dismissed",
        "outcome": "not_done",
    }
