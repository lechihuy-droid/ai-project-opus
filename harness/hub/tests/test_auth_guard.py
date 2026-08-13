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


def test_shell_is_open_while_api_stays_gated() -> None:
    # The browser cannot attach a header to a top-level navigation or to the
    # <script>/<link> tags it pulls in, so gating / and /assets meant the page
    # could never boot and pick up its token in the first place. The bundle
    # holds no secrets; only /api/* (other than /api/health) needs the token.
    # Each request gets its own client because GET / now hands back a cookie,
    # which would authenticate anything reusing the same jar.
    assert _client(headers={"X-Hub-Token": ""}).get("/assets/index.js").status_code != 403
    assert _client(headers={"X-Hub-Token": ""}).get("/").status_code != 403
    assert _client(headers={"X-Hub-Token": ""}).get("/api/agent/runs").status_code == 403


def test_loading_the_shell_authenticates_that_origin() -> None:
    """The point of the cookie: no token to paste, per origin, ever."""
    client = _client(headers={"X-Hub-Token": ""})
    assert client.get("/api/agent/runs").status_code == 403

    shell = client.get("/")
    cookie = shell.headers.get("set-cookie", "")
    assert "HttpOnly" in cookie, "page scripts must not be able to read it"
    assert "samesite=strict" in cookie.lower(), "must not ride along on another site's requests"

    assert client.get("/api/agent/runs").status_code == 200


def test_a_forged_cookie_is_still_refused() -> None:
    client = _client(headers={"X-Hub-Token": ""})
    client.cookies.set("hub_token", "not-the-real-token")
    assert client.get("/api/agent/runs").status_code == 403
