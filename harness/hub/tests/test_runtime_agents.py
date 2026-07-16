from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import server
from services import runtime_agents


@pytest.fixture()
def agents_tmp(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    agents_dir = tmp_path / "agents"
    monkeypatch.setattr(runtime_agents, "AGENTS_DIR", agents_dir)
    monkeypatch.setattr(runtime_agents.skill_library, "list_skills", lambda: [{"name": "opus-design-reviewer"}])
    return agents_dir


def valid_profile() -> dict[str, object]:
    return {
        "id": "reviewer",
        "provider": "claude",
        "model": None,
        "system_prompt": "You are a strict reviewer.",
        "skills": ["opus-design-reviewer"],
        "permission": "read_only",
        "budget": {"seconds": 900, "max_calls": 5},
        "risk_tier": "read_only",
    }


def test_list_agents_loads_valid_yaml(agents_tmp: Path) -> None:
    runtime_agents.create_or_update_agent(valid_profile())

    agents = runtime_agents.list_agents()

    assert agents == [valid_profile()]


def test_list_agents_skips_invalid_yaml(agents_tmp: Path) -> None:
    invalid = valid_profile() | {"provider": "unknown"}
    agents_tmp.mkdir()
    (agents_tmp / "invalid.agent.yaml").write_text("provider: unknown\n", encoding="utf-8")

    assert runtime_agents.list_agents() == []


@pytest.mark.parametrize(
    ("profile", "message"),
    [
        (valid_profile() | {"provider": "unknown"}, "Unknown provider: unknown"),
        (valid_profile() | {"skills": ["unknown-skill"]}, "Unknown skill: unknown-skill"),
        (valid_profile() | {"budget": {"seconds": 0, "max_calls": 5}}, "budget.seconds must be a positive integer"),
        (valid_profile() | {"budget": {"seconds": 5, "max_calls": -1}}, "budget.max_calls must be a positive integer"),
        ({key: value for key, value in valid_profile().items() if key != "risk_tier"}, "Missing required field: risk_tier"),
        (valid_profile() | {"id": "nested/reviewer"}, "Invalid agent id: nested/reviewer"),
        (valid_profile() | {"id": "..reviewer"}, "Invalid agent id: ..reviewer"),
    ],
)
def test_validate_agent_profile_rejects_invalid_profiles(
    agents_tmp: Path, profile: dict[str, object], message: str
) -> None:
    with pytest.raises(ValueError, match=message):
        runtime_agents.validate_agent_profile(profile)


def test_agent_profile_api_crud(agents_tmp: Path) -> None:
    client = TestClient(server.app, headers={"x-hub-client": "harness-hub"})
    profile = valid_profile()

    created = client.post("/api/agents", json=profile)
    assert created.status_code == 200
    assert created.json() == profile
    assert (agents_tmp / "reviewer.agent.yaml").is_file()

    listed = client.get("/api/agents")
    assert listed.status_code == 200
    assert listed.json() == [profile]

    invalid = client.post("/api/agents", json=profile | {"provider": "unknown"})
    assert invalid.status_code == 400
    assert invalid.json()["detail"] == "Unknown provider: unknown"

    deleted = client.delete("/api/agents/reviewer")
    assert deleted.status_code == 200
    assert deleted.json() == {"ok": True}
    assert not (agents_tmp / "reviewer.agent.yaml").exists()

    missing = client.delete("/api/agents/missing")
    assert missing.status_code == 404
