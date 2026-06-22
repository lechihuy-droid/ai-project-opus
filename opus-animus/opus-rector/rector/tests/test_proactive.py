import pytest

from rector.proactive import (
    exclude_dismissed,
    get_proactive_set,
    save_proactive_set,
    update_proactive_state,
)


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


@pytest.fixture(autouse=True)
def proactive_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("ANIMUS_PROACTIVE_DIR", str(tmp_path))


def test_save_then_get_roundtrip_returns_items():
    items = [_item(), _item(id="item-2", priority="high")]

    save_proactive_set(DATE, items)

    assert get_proactive_set(DATE) == items


def test_invalid_item_requires_approval_false_raises_value_error():
    with pytest.raises(ValueError):
        save_proactive_set(DATE, [_item(requires_approval=False)])


def test_invalid_item_bad_enum_raises_value_error():
    with pytest.raises(ValueError):
        save_proactive_set(DATE, [_item(priority="urgent")])


def test_update_proactive_state_changes_state():
    save_proactive_set(DATE, [_item()])

    update_proactive_state("item-1", "accepted", date=DATE)

    assert get_proactive_set(DATE)[0]["state"] == "accepted"


def test_update_proactive_state_unknown_id_raises_error():
    save_proactive_set(DATE, [_item()])

    with pytest.raises(ValueError):
        update_proactive_state("missing", "accepted", date=DATE)


def test_exclude_dismissed_removes_dismissed_item():
    save_proactive_set(DATE, [_item(), _item(id="item-2")])
    update_proactive_state("item-1", "dismissed", date=DATE)

    assert exclude_dismissed(DATE, [_item(), _item(id="item-2")]) == [_item(id="item-2")]


def test_corrupt_json_file_returns_empty_and_creates_backup(tmp_path, caplog):
    path = tmp_path / f"{DATE}.json"
    path.write_text("{not-json", encoding="utf-8")

    assert get_proactive_set(DATE) == []

    assert (tmp_path / f"{DATE}.json.bak").exists()
    assert not path.exists()
    assert "corrupt proactive store backed up" in caplog.text
