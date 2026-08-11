from __future__ import annotations

from fastapi.testclient import TestClient

import config
import server


def _client() -> TestClient:
    return TestClient(server.app)


def test_get_agent_runs_without_token_is_forbidden() -> None:
    assert _client().get("/api/agent/runs").status_code == 403


def test_get_agent_runs_with_wrong_token_is_forbidden() -> None:
    response = _client().get("/api/agent/runs", headers={"X-Hub-Token": "wrong-token"})
    assert response.status_code == 403


def test_get_agent_runs_with_header_token_is_allowed() -> None:
    response = _client().get("/api/agent/runs", headers={"X-Hub-Token": config.HUB_TOKEN})
    assert response.status_code == 200


def test_get_agent_runs_with_query_token_is_allowed() -> None:
    response = _client().get(f"/api/agent/runs?k={config.HUB_TOKEN}")
    assert response.status_code == 200


def test_health_is_allowed_without_token() -> None:
    assert _client().get("/api/health").status_code == 200


def test_post_with_token_and_foreign_origin_is_forbidden() -> None:
    response = _client().post(
        "/api/runs/trigger",
        json={"suite": "does-not-exist"},
        headers={"X-Hub-Token": config.HUB_TOKEN, "origin": "https://evil.example"},
    )
    assert response.status_code == 403


def test_fs_dirs_without_token_is_forbidden() -> None:
    assert _client().get("/api/fs/dirs").status_code == 403
