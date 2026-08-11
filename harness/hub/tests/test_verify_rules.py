from __future__ import annotations

import pytest

from services import verify


def test_unattended_unknown_command_is_denied() -> None:
    result = verify.rule_check({"unattended": True, "command": ["/tmp/evil"]})

    assert result == {"decision": "deny", "reasons": ["unclassified command in unattended job"]}


def test_interactive_unknown_command_is_not_denied() -> None:
    result = verify.rule_check({"unattended": False, "command": ["/tmp/evil"]})

    assert result["decision"] != "deny"
    assert "unclassified command" in result["reasons"][0]


def test_unattended_read_only_command_is_allowed() -> None:
    result = verify.rule_check({"unattended": True, "command": ["ls"]})

    assert result == {"decision": "allow", "reasons": []}


def test_override_audits_unknown_unattended_command(monkeypatch: pytest.MonkeyPatch) -> None:
    recorded: list[tuple[str, list[str]]] = []

    def record_denial(job_id: str, reasons: list[str], escalate: bool = False) -> None:
        recorded.append((job_id, reasons))

    monkeypatch.setattr("services.verify.governance.record_denial", record_denial)

    result = verify.rule_check(
        {"id": "j-override", "unattended": True, "allow_override": True, "command": ["/tmp/evil"]}
    )

    assert result["decision"] != "deny"
    assert recorded == [("j-override", ["unclassified command in unattended job"])]
