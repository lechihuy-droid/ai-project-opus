from __future__ import annotations

from pathlib import Path

import pytest

import config
from services import hooks


def hook_payload() -> dict[str, object]:
    return {
        "name": "notify",
        "agent_id": "reviewer",
        "event": "done",
        "trigger_point": "after",
        "enabled": True,
    }


@pytest.fixture()
def hooks_file(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    path = tmp_path / "hooks.json"
    monkeypatch.setattr(hooks, "_FILE", path)
    return path


def test_shell_command_rejected_when_allowlist_empty(hooks_file: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ())

    with pytest.raises(ValueError):
        hooks.create(hook_payload() | {"action": {"type": "shell", "command": ["/tmp/evil"]}})


def test_shell_command_allowed_when_binary_in_allowlist(hooks_file: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ("git",))

    hook = hooks.create(hook_payload() | {"action": {"type": "shell", "command": ["git", "status"]}})

    assert hook["action"]["command"] == ["git", "status"]


def test_shell_command_matches_allowlist_by_basename(hooks_file: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ("git",))

    hook = hooks.create(hook_payload() | {"action": {"type": "shell", "command": ["/usr/bin/git", "status"]}})

    assert hook["action"]["command"] == ["/usr/bin/git", "status"]


def test_webhook_and_append_log_file_actions_unaffected_by_allowlist(
    hooks_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(config, "HOOK_ALLOWED_COMMANDS", ())

    webhook_hook = hooks.create(hook_payload() | {"action": {"type": "webhook", "url": "http://example.test/hook"}})
    assert webhook_hook["action"]["type"] == "webhook"

    log_hook = hooks.create(hook_payload() | {"action": {"type": "append_log_file", "path": "hook.log"}})
    assert log_hook["action"]["type"] == "append_log_file"
