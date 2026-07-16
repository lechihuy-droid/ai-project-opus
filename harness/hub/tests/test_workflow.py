from __future__ import annotations

from copy import deepcopy

import pytest
import yaml
from fastapi.testclient import TestClient

import server
from services import workflow


@pytest.fixture(autouse=True)
def fake_agents(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        workflow.runtime_agents,
        "list_agents",
        lambda: [{"id": "reviewer", "name": "Review Worker"}],
    )


@pytest.fixture()
def review_ui() -> dict[str, object]:
    return {
        "id": "review-ui",
        "nodes": [
            {"id": "plan", "agent": "reviewer", "prompt": "Plan review for: {{objective}}", "gate": "none"},
            {"id": "act", "agent": "reviewer", "prompt": "Execute: {{plan_output}}", "gate": "approval"},
        ],
        "edges": [["plan", "act"]],
        "stop": {"max_nodes": 10, "max_seconds": 1800},
    }


def test_valid_workflow_builds_ordered_ir(review_ui: dict[str, object]) -> None:
    assert workflow.validate_workflow(review_ui) == []
    ir = workflow.build_ir(review_ui)
    assert [node["id"] for node in ir] == ["plan", "act"]
    assert [node["order"] for node in ir] == [0, 1]
    assert ir[0]["agent"]["id"] == "reviewer"


def test_cycle_is_rejected(review_ui: dict[str, object]) -> None:
    data = deepcopy(review_ui)
    data["edges"] = [["plan", "act"], ["act", "plan"]]
    errors = workflow.validate_workflow(data)
    assert any("linear chain" in error for error in errors)


def test_unknown_agent_is_rejected(review_ui: dict[str, object]) -> None:
    data = deepcopy(review_ui)
    data["nodes"][0]["agent"] = "missing-agent"
    errors = workflow.validate_workflow(data)
    assert any("missing-agent" in error for error in errors)


def test_missing_or_invalid_stop_caps_are_rejected(review_ui: dict[str, object]) -> None:
    data = deepcopy(review_ui)
    data["stop"] = {"max_nodes": 10, "max_seconds": 0}
    errors = workflow.validate_workflow(data)
    assert any("stop.max_seconds" in error for error in errors)


def test_bad_template_reference_is_rejected(review_ui: dict[str, object]) -> None:
    data = deepcopy(review_ui)
    data["nodes"][1]["prompt"] = "Execute: {{act_output}}"
    errors = workflow.validate_workflow(data)
    assert any("{{act_output}}" in error for error in errors)


@pytest.mark.parametrize(
    ("change", "expected_ok"),
    [
        (lambda data: data, True),
        (lambda data: data.update(edges=[["plan", "act"], ["act", "plan"]]), False),
        (lambda data: data["nodes"][0].update(agent="missing-agent"), False),
        (lambda data: data.update(stop={"max_nodes": 10, "max_seconds": 0}), False),
        (lambda data: data["nodes"][1].update(prompt="Execute: {{nonexistent_output}}"), False),
    ],
)
def test_validate_endpoint_reports_every_case(
    review_ui: dict[str, object], change, expected_ok: bool
) -> None:
    data = deepcopy(review_ui)
    change(data)
    client = TestClient(server.app, headers={"x-hub-client": "harness-hub"})
    response = client.post("/api/workflows/validate", json={"yaml_text": yaml.safe_dump(data)})
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is expected_ok
    assert bool(body["errors"]) is not expected_ok
    assert (body["ir"] is not None) is expected_ok


def test_validate_endpoint_requires_yaml_text_or_id() -> None:
    client = TestClient(server.app, headers={"x-hub-client": "harness-hub"})
    response = client.post("/api/workflows/validate", json={})
    assert response.status_code == 400
    assert response.json()["detail"] == "yaml_text or id is required"
