from __future__ import annotations

from pathlib import Path

import pytest

import config
from services import hooks


def _payload(action: dict[str, object]) -> dict[str, object]:
    return {
        "name": "test hook",
        "agent_id": "agent-1",
        "event": "done",
        "trigger_point": "after",
        "enabled": True,
        "action": action,
    }


@pytest.fixture
def isolated_hooks(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(hooks, "_FILE", tmp_path / "hooks.json")
    monkeypatch.setattr(hooks, "_LOG", tmp_path / "hook-log.jsonl")


def test_create_rejects_shell_command_when_allowlist_is_empty(
    isolated_hooks: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ())

    with pytest.raises(ValueError, match="not in HOOK_ALLOWED_COMMANDS: /tmp/evil"):
        hooks.create(_payload({"type": "shell", "command": ["/tmp/evil"]}))


def test_create_accepts_allowlisted_shell_command(isolated_hooks: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ("git",))

    created = hooks.create(_payload({"type": "shell", "command": ["git", "status"]}))

    assert created["action"] == {"type": "shell", "command": ["git", "status"]}


def test_create_matches_shell_command_by_basename(isolated_hooks: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ("git",))

    created = hooks.create(_payload({"type": "shell", "command": ["/usr/bin/git", "status"]}))

    assert created["action"]["command"][0] == "/usr/bin/git"


def test_create_keeps_non_shell_actions_unaffected(isolated_hooks: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ())

    webhook = hooks.create(_payload({"type": "webhook", "url": "https://example.test/hook"}))
    log_file = hooks.create(_payload({"type": "append_log_file", "path": "hook.log"}))

    assert webhook["action"]["type"] == "webhook"
    assert log_file["action"]["type"] == "append_log_file"
