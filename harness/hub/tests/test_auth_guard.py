from __future__ import annotations

from fastapi.testclient import TestClient

import config
import server


def _client(**kwargs) -> TestClient:
    # conftest.py only fills in X-Hub-Token when the caller omits it
    # (dict.setdefault), so passing an explicit value here - including ""
    # for "no token" - always wins and each test controls its own credential.
    return TestClient(server.app, **kwargs)


def test_get_agent_runs_without_token_is_forbidden() -> None:
    response = _client(headers={"X-Hub-Token": ""}).get("/api/agent/runs")
    assert response.status_code == 403


def test_get_agent_runs_with_wrong_token_is_forbidden() -> None:
    response = _client(headers={"X-Hub-Token": "not-the-real-token"}).get("/api/agent/runs")
    assert response.status_code == 403


def test_get_agent_runs_with_correct_token_header_is_allowed() -> None:
    response = _client(headers={"X-Hub-Token": config.HUB_TOKEN}).get("/api/agent/runs")
    assert response.status_code == 200


def test_get_agent_runs_with_correct_token_query_param_is_allowed() -> None:
    response = _client(headers={"X-Hub-Token": ""}).get("/api/agent/runs", params={"k": config.HUB_TOKEN})
    assert response.status_code == 200


def test_get_health_without_token_is_allowed() -> None:
    response = _client(headers={"X-Hub-Token": ""}).get("/api/health")
    assert response.status_code == 200


def test_post_with_correct_token_but_foreign_origin_is_forbidden() -> None:
    response = _client(headers={"X-Hub-Token": config.HUB_TOKEN, "origin": "https://evil.example"}).post(
        "/api/runs/trigger", json={"suite": "x"}
    )
    assert response.status_code == 403


def test_get_fs_dirs_without_token_is_forbidden() -> None:
    response = _client(headers={"X-Hub-Token": ""}).get("/api/fs/dirs")
    assert response.status_code == 403


def test_assets_are_reachable_without_token_while_root_and_api_stay_gated() -> None:
    # The SPA's <script>/<link> tags fetch /assets/* with no custom header and
    # no ?k=, so the static bundle mount must be exempt like /static/ - only
    # its absence (never a 403) is asserted here since web-v3/dist isn't built
    # in this environment. / (the entry point) and /api/* must stay gated.
    client = _client(headers={"X-Hub-Token": ""})
    assert client.get("/assets/index.js").status_code != 403
    assert client.get("/").status_code == 403
    assert client.get("/api/agent/runs").status_code == 403
