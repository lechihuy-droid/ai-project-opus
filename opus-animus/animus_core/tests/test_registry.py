from __future__ import annotations

import pytest

from animus_core import registry


@pytest.fixture(autouse=True)
def clear_registry_cache():
    registry._REGISTRY_CACHE = None
    yield
    registry._REGISTRY_CACHE = None


def _write_registry(path, entries: dict[str, str]) -> None:
    path.write_text("\n".join(f"{tool_id}: {action_class}" for tool_id, action_class in entries.items()), encoding="utf-8")


def test_classify_known_tool_uses_registry(monkeypatch, tmp_path):
    registry_path = tmp_path / "action-registry.yaml"
    _write_registry(registry_path, {"calendar.events.insert": "write"})
    monkeypatch.setenv("ANIMUS_ACTION_REGISTRY", str(registry_path))

    assert registry.classify("calendar.events.insert") == "write"


def test_classify_unregistered_tool_returns_dangerous(monkeypatch, tmp_path):
    registry_path = tmp_path / "action-registry.yaml"
    _write_registry(registry_path, {"telegram.send": "write"})
    monkeypatch.setenv("ANIMUS_ACTION_REGISTRY", str(registry_path))

    assert registry.classify("telegram.broadcast") == "dangerous"


@pytest.mark.parametrize(
    ("action_class", "gate"),
    [
        ("read", "free"),
        ("draft", "free"),
        ("write", "requires_approval"),
        ("dangerous", "requires_confirm"),
    ],
)
def test_gate_for_maps_all_action_classes(action_class, gate):
    assert registry.gate_for(action_class) == gate
