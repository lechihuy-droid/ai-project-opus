"""Specification tests for the skill-resolution control-plane contract.

These tests deliberately exercise only the public resolver and HTTP surfaces.
The fixtures use temporary skills, agent manifests, metadata, and policy files so
selection behaviour cannot accidentally depend on the checked-in Hub catalog.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
import yaml
from fastapi.testclient import TestClient

import config
import server
from services import runtime_agents
from services import skill_resolution


def _write_skill(root: Path, name: str, *, description: str, body: str) -> None:
    path = root / name
    path.mkdir(parents=True)
    (path / "SKILL.md").write_text(
        f"---\nname: {name}\ndescription: {description}\n---\n\n{body}\n",
        encoding="utf-8",
    )


def _agent(*, capabilities: list[str] | None = None) -> dict[str, object]:
    return {
        "id": "frontend-engineer",
        "provider": "claude",
        "system_prompt": "Build product UI.",
        "skills": [],
        "permission": "workspace_write",
        "budget": {"seconds": 60, "max_calls": 4},
        "risk_tier": "write",
        "capabilities": capabilities or ["browser_visual_validation"],
    }


@pytest.fixture()
def resolution_fixture(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> dict[str, Any]:
    """A small independent catalog with both allowed and denied candidates."""
    skills_root = tmp_path / "skills"
    agents_dir = tmp_path / "agents"
    metadata_path = tmp_path / "skill_metadata.yaml"
    policy_path = tmp_path / "skill_selection.yaml"

    _write_skill(
        skills_root,
        "frontend-app-builder",
        description="Build a dashboard application.",
        body="FRONTEND_APP_BODY_DO_NOT_LEAK",
    )
    _write_skill(
        skills_root,
        "frontend-design",
        description="Improve visual hierarchy in a frontend.",
        body="FRONTEND_DESIGN_BODY_DO_NOT_LEAK",
    )
    _write_skill(
        skills_root,
        "build-dashboard",
        description="Build analytical dashboards.",
        body="DASHBOARD_BODY_DO_NOT_LEAK",
    )
    _write_skill(
        skills_root,
        "verification-before-completion",
        description="Require fresh evidence before a completion claim.",
        body="VERIFY_BODY_DO_NOT_LEAK",
    )
    _write_skill(
        skills_root,
        "security-review",
        description="Review security controls.",
        body="SECURITY_BODY_DO_NOT_LEAK",
    )
    _write_skill(
        skills_root,
        "accessibility-audit",
        description="Audit dashboard accessibility.",
        body="ACCESSIBILITY_BODY_DO_NOT_LEAK",
    )
    _write_skill(
        skills_root,
        "oversized-dashboard-skill",
        description="Build a dashboard with extensive detail.",
        body="X" * 2000,
    )

    metadata_path.write_text(
        yaml.safe_dump(
            {
                "version": "2026-08-09",
                "skills": [
                    {
                        "id": "fixture/frontend-app-builder",
                        "domains": ["frontend", "uiux"],
                        "intents": ["build_dashboard"],
                        "compatible_agents": ["frontend-engineer"],
                        "required_capabilities": ["browser_visual_validation"],
                    },
                    {
                        "id": "fixture/frontend-design",
                        "domains": ["frontend", "uiux"],
                        "intents": ["build_dashboard", "improve_ui"],
                        "compatible_agents": ["frontend-engineer"],
                        "optional_capabilities": ["design_context_fetch"],
                    },
                    {
                        "id": "fixture/build-dashboard",
                        "domains": ["frontend", "analytics"],
                        "intents": ["build_dashboard"],
                        "compatible_agents": ["frontend-engineer"],
                    },
                    {
                        "id": "fixture/verification-before-completion",
                        "domains": ["engineering"],
                        "intents": ["verify"],
                        "compatible_agents": ["frontend-engineer"],
                    },
                    {
                        "id": "fixture/security-review",
                        "domains": ["security"],
                        "intents": ["review_security"],
                        "compatible_agents": ["security-reviewer"],
                    },
                    {
                        "id": "fixture/accessibility-audit",
                        "domains": ["frontend", "uiux"],
                        "intents": ["build_dashboard"],
                        "compatible_agents": ["frontend-engineer"],
                        "required_capabilities": ["accessibility_validation"],
                    },
                    {
                        "id": "fixture/oversized-dashboard-skill",
                        "domains": ["frontend"],
                        "intents": ["build_dashboard"],
                        "compatible_agents": ["frontend-engineer"],
                    },
                ],
            },
            sort_keys=False,
        ),
        encoding="utf-8",
    )
    policy_path.write_text(
        yaml.safe_dump(
            {
                "version": "2026-08-09",
                "selection": {
                    "max_skills_per_agent_run": 3,
                    "max_prompt_chars": 600,
                    "never_truncate_skill": True,
                    "strategy": ["explicit_request", "intent_match", "domain_match"],
                    "rules": [
                        {
                            "if": {"lifecycle_stage": "verification"},
                            "force": ["fixture/verification-before-completion"],
                        }
                    ],
                },
            },
            sort_keys=False,
        ),
        encoding="utf-8",
    )

    agents_dir.mkdir()
    (agents_dir / "frontend-engineer.agent.yaml").write_text(
        yaml.safe_dump(_agent(), sort_keys=False), encoding="utf-8"
    )
    monkeypatch.setattr(config, "SKILL_SOURCES", {"fixture": skills_root})
    monkeypatch.setattr(runtime_agents, "AGENTS_DIR", agents_dir)
    monkeypatch.setattr(skill_resolution, "SKILL_METADATA_PATH", metadata_path)
    monkeypatch.setattr(skill_resolution, "SKILL_SELECTION_POLICY_PATH", policy_path)
    monkeypatch.setattr(
        skill_resolution.capabilities,
        "public_catalog",
        lambda: [
            {
                "id": capability_id,
                "allowed_permissions": ["read_only", "workspace_write"],
                "binding": {"configured": True, "registered": True, "health": "healthy"},
            }
            for capability_id in ("browser_visual_validation", "design_context_fetch", "accessibility_validation")
        ],
    )
    return {"skills_root": skills_root, "agents_dir": agents_dir, "metadata_path": metadata_path, "policy_path": policy_path}


def _preview(**overrides: object) -> dict[str, Any]:
    payload: dict[str, object] = {
        "task": "Build a dashboard for requirements.",
        "agent_id": "frontend-engineer",
        "lifecycle_stage": "implementation",
        "task_tags": ["frontend", "uiux"],
    }
    payload.update(overrides)
    return skill_resolution.preview(payload)


def _selected_ids(decision: dict[str, Any]) -> set[str]:
    return {str(skill["id"]) for skill in decision["selected_skills"]}


def _trace_by_id(decision: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(item["skill_id"]): item for item in decision["selection_trace"]}


def test_shadow_preview_is_deterministic_and_pins_only_metadata(
    resolution_fixture: dict[str, Any],
) -> None:
    first = _preview()
    second = _preview()

    assert first == second
    assert first["mode"] == "shadow"
    assert first["agent_id"] == "frontend-engineer"
    assert _selected_ids(first) >= {
        "fixture/frontend-app-builder",
        "fixture/frontend-design",
        "fixture/build-dashboard",
    }
    assert all({"id", "source", "content_hash"} <= set(skill) for skill in first["selected_skills"])
    assert all("content" not in skill and "body" not in skill for skill in first["selected_skills"])
    assert "FRONTEND_APP_BODY_DO_NOT_LEAK" not in repr(first)
    assert first["policy"]["version"] == "2026-08-09"
    assert first["policy"]["content_hash"].startswith("sha256:")
    assert first["catalog"]["version"] == "2026-08-09"
    assert first["catalog"]["content_hash"].startswith("sha256:")


def test_required_capability_makes_candidate_ineligible_but_optional_capability_degrades(
    resolution_fixture: dict[str, Any],
) -> None:
    decision = _preview(explicit_skills=["fixture/accessibility-audit", "fixture/frontend-design"])
    trace = _trace_by_id(decision)

    assert "fixture/accessibility-audit" not in _selected_ids(decision)
    assert trace["fixture/accessibility-audit"]["outcome"] == "rejected"
    assert trace["fixture/accessibility-audit"]["reason"] == "required_capability_denied"
    assert "fixture/frontend-design" in _selected_ids(decision)
    assert trace["fixture/frontend-design"]["outcome"] == "selected"
    assert trace["fixture/frontend-design"]["capability_state"] == "degraded"


def test_required_capability_is_ineligible_when_runtime_binding_is_not_ready(
    resolution_fixture: dict[str, Any], monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        skill_resolution.capabilities,
        "public_catalog",
        lambda: [{
            "id": "browser_visual_validation",
            "allowed_permissions": ["workspace_write"],
            "binding": {"configured": False, "registered": False, "health": "not_checked"},
        }],
    )

    decision = _preview(explicit_skills=["fixture/frontend-app-builder"])

    assert "fixture/frontend-app-builder" not in _selected_ids(decision)
    assert _trace_by_id(decision)["fixture/frontend-app-builder"]["reason"] == "required_capability_denied"


def test_explicit_request_never_bypasses_compatibility_or_capability_policy(
    resolution_fixture: dict[str, Any],
) -> None:
    decision = _preview(
        explicit_skills=["fixture/security-review", "fixture/accessibility-audit"],
    )
    trace = _trace_by_id(decision)

    assert _selected_ids(decision).isdisjoint({"fixture/security-review", "fixture/accessibility-audit"})
    assert trace["fixture/security-review"]["reason"] == "incompatible_agent"
    assert trace["fixture/accessibility-audit"]["reason"] == "required_capability_denied"


def test_unknown_explicit_skill_is_invalid_request(resolution_fixture: dict[str, Any]) -> None:
    with pytest.raises(ValueError, match="Unknown explicit skill"):
        _preview(explicit_skills=["fixture/not-installed"])


def test_budget_never_partially_loads_a_skill(resolution_fixture: dict[str, Any]) -> None:
    decision = _preview(explicit_skills=["fixture/oversized-dashboard-skill"])

    assert "fixture/oversized-dashboard-skill" not in _selected_ids(decision)
    assert _trace_by_id(decision)["fixture/oversized-dashboard-skill"]["reason"] == "prompt_budget_exceeded"
    assert decision["prompt_budget"]["truncated"] is False
    assert decision["prompt_budget"]["used_chars"] <= decision["prompt_budget"]["max_chars"]
    assert len(decision["selected_skills"]) <= decision["prompt_budget"]["max_skills"]


def test_verification_stage_forces_verification_skill_when_eligible(
    resolution_fixture: dict[str, Any],
) -> None:
    decision = _preview(lifecycle_stage="verification")

    assert "fixture/verification-before-completion" in _selected_ids(decision)
    assert _trace_by_id(decision)["fixture/verification-before-completion"]["reason"] == "policy_forced"


def test_verification_force_wins_over_explicit_requests_and_skill_count_budget(
    resolution_fixture: dict[str, Any],
) -> None:
    policy_path = resolution_fixture["policy_path"]
    policy = yaml.safe_load(policy_path.read_text(encoding="utf-8"))
    policy["selection"]["max_skills_per_agent_run"] = 1
    policy_path.write_text(yaml.safe_dump(policy, sort_keys=False), encoding="utf-8")

    decision = _preview(
        lifecycle_stage="verification",
        explicit_skills=["fixture/frontend-app-builder", "fixture/frontend-design"],
    )

    assert _selected_ids(decision) == {"fixture/verification-before-completion"}
    assert _trace_by_id(decision)["fixture/frontend-app-builder"]["reason"] == "prompt_budget_exceeded"


def test_metadata_cannot_reference_an_uninstalled_skill(
    resolution_fixture: dict[str, Any],
) -> None:
    metadata_path = resolution_fixture["metadata_path"]
    metadata = yaml.safe_load(metadata_path.read_text(encoding="utf-8"))
    metadata["skills"].append({"id": "fixture/not-installed", "domains": ["frontend"]})
    metadata_path.write_text(yaml.safe_dump(metadata, sort_keys=False), encoding="utf-8")

    with pytest.raises(ValueError, match="metadata references missing skill"):
        _preview()


def test_duplicate_logical_name_requires_a_namespaced_identity(
    resolution_fixture: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    second_source = resolution_fixture["skills_root"].parent / "other-skills"
    _write_skill(second_source, "frontend-design", description="Different source.", body="OTHER_BODY")
    monkeypatch.setattr(config, "SKILL_SOURCES", {"fixture": resolution_fixture["skills_root"], "other": second_source})

    with pytest.raises(ValueError, match="Ambiguous skill identity"):
        _preview(explicit_skills=["frontend-design"])

    decision = _preview(explicit_skills=["fixture/frontend-design"])
    assert "fixture/frontend-design" in _selected_ids(decision)


def test_preview_endpoint_returns_the_same_public_decision_and_rejects_invalid_request(
    resolution_fixture: dict[str, Any],
) -> None:
    client = TestClient(server.app, headers={"X-Hub-Token": config.HUB_TOKEN})
    payload = {
        "task": "Build a dashboard for requirements.",
        "agent_id": "frontend-engineer",
        "lifecycle_stage": "implementation",
        "task_tags": ["frontend", "uiux"],
    }

    response = client.post("/api/skill-resolution/preview", json=payload)
    assert response.status_code == 200
    assert response.json() == _preview()

    invalid = client.post("/api/skill-resolution/preview", json=payload | {"explicit_skills": ["fixture/missing"]})
    assert invalid.status_code == 400
    assert "Unknown explicit skill" in invalid.json()["detail"]
