from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterator

import pytest
from fastapi.testclient import TestClient

import config
import server
from services import hooks, runtime_agents, runtime_state


@pytest.fixture()
def client() -> TestClient:
    return TestClient(server.app, headers={"x-hub-client": "harness-hub"})


@pytest.fixture()
def runtime_tmp(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    root = tmp_path / "runtime"
    monkeypatch.setattr(config, "RUNTIME_DIR", root)
    monkeypatch.setattr(config, "RUNTIME_THREADS_DIR", root / "threads")
    monkeypatch.setattr(config, "RUNTIME_RUNS_DIR", root / "runs")
    monkeypatch.setattr(config, "RUNTIME_STORE_DIR", root / "store")
    return root


@pytest.fixture()
def hooks_tmp(monkeypatch: pytest.MonkeyPatch, runtime_tmp: Path) -> Path:
    monkeypatch.setattr(hooks, "_FILE", runtime_tmp / "store" / "hooks.json")
    monkeypatch.setattr(hooks, "_LOG", runtime_tmp / "store" / "hook-log.jsonl")
    return runtime_tmp


def hook_payload() -> dict[str, object]:
    return {"name": "notify", "event": "done", "trigger_point": "after", "enabled": True, "action": {"type": "append_log_file", "path": "hook.log"}}


def test_hooks_api_crud_events_and_log(client: TestClient, hooks_tmp: Path) -> None:
    assert "done" in client.get("/api/hooks/events").json()
    created = client.post("/api/hooks", json=hook_payload())
    assert created.status_code == 200
    hook = created.json(); hook_id = hook["id"]
    assert client.get("/api/hooks").json() == [hook]
    updated = client.put(f"/api/hooks/{hook_id}", json=hook_payload() | {"name": "renamed"})
    assert updated.status_code == 200 and updated.json()["name"] == "renamed"
    hooks._LOG.parent.mkdir(parents=True, exist_ok=True)
    hooks._LOG.write_text(json.dumps({"hook_id": hook_id, "status": "succeeded"}) + "\n", encoding="utf-8")
    assert client.get(f"/api/hooks/{hook_id}/log").json() == [{"hook_id": hook_id, "status": "succeeded"}]
    assert client.delete(f"/api/hooks/{hook_id}").json() == {"ok": True}
    assert client.get("/api/hooks").json() == []


def test_hooks_api_rejects_invalid_and_missing(client: TestClient, hooks_tmp: Path) -> None:
    assert client.post("/api/hooks", json=hook_payload() | {"event": "invented"}).status_code == 400
    assert client.put("/api/hooks/missing", json=hook_payload()).status_code == 404
    assert client.delete("/api/hooks/missing").status_code == 404


def make_run(runtime_tmp: Path, agent_id: str = "agent-a") -> str:
    state = runtime_state.create_run(run_id="run-20260728000000-abcdefgh", agent_id=agent_id)
    return str(state["run_id"])


def test_run_files_api_crud(client: TestClient, runtime_tmp: Path) -> None:
    run_id = make_run(runtime_tmp)
    assert client.get(f"/api/runs/{run_id}/files").json() == []
    uploaded = client.post(f"/api/runs/{run_id}/files", files={"file": ("note.txt", b"hello", "text/plain")})
    assert uploaded.status_code == 200 and uploaded.json()["name"] == "note.txt"
    assert client.get(f"/api/runs/{run_id}/files").json()[0]["size"] == 5
    assert client.get(f"/api/runs/{run_id}/files/note.txt").content == b"hello"
    assert client.delete(f"/api/runs/{run_id}/files/note.txt").json() == {"ok": True}


def test_run_files_api_rejects_traversal_and_size_caps(client: TestClient, runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    run_id = make_run(runtime_tmp)
    traversal = client.post(f"/api/runs/{run_id}/files", files={"file": ("../escape.txt", b"x", "text/plain")})
    assert traversal.status_code == 403
    assert client.get(f"/api/runs/{run_id}/files/%2E%2E%2Fescape.txt").status_code == 403
    monkeypatch.setattr(config, "RUNTIME_FILE_MAX_BYTES", 3)
    assert client.post(f"/api/runs/{run_id}/files", files={"file": ("large.txt", b"1234", "text/plain")}).status_code == 400
    monkeypatch.setattr(config, "RUNTIME_FILE_MAX_BYTES", 10)
    monkeypatch.setattr(config, "RUNTIME_FILES_MAX_BYTES", 5)
    assert client.post(f"/api/runs/{run_id}/files", files={"file": ("one.txt", b"123", "text/plain")}).status_code == 200
    assert client.post(f"/api/runs/{run_id}/files", files={"file": ("two.txt", b"123", "text/plain")}).status_code == 400
    assert client.delete(f"/api/runs/{run_id}/files/missing.txt").status_code == 404


def test_skill_library_write_endpoints(client: TestClient, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    sources = {"local": tmp_path / "skills"}
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    from services import skill_library
    skill_library._clear_cache()
    created = client.post("/api/skill-library", json={"name": "new-skill", "source": "local", "content": "# one"})
    assert created.status_code == 200 and created.json()["id"] == "local/new-skill"
    updated = client.put("/api/skill-library/local/new-skill", json={"content": "# two"})
    assert updated.status_code == 200 and updated.json()["content"] == "# two"
    assert client.delete("/api/skill-library/local/new-skill").json() == {"ok": True}


def test_skill_library_write_endpoints_reject_invalid_input(client: TestClient, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(config, "SKILL_SOURCES", {"local": tmp_path / "skills"}, raising=False)
    assert client.post("/api/skill-library", json={"name": "../bad", "source": "local", "content": "x"}).status_code == 400
    assert client.put("/api/skill-library/local/missing", json={"content": "x"}).status_code == 404
    assert client.delete("/api/skill-library/local/missing").status_code == 404


def test_agent_runs_filter(client: TestClient, runtime_tmp: Path) -> None:
    first = make_run(runtime_tmp, "agent-a")
    runtime_state.create_run(run_id="run-20260728000001-bcdefghi", agent_id="agent-b")
    rows = client.get("/api/agent/runs", params={"agent_id": "agent-a"})
    assert rows.status_code == 200 and [row["run_id"] for row in rows.json()] == [first]
    assert client.get("/api/agent/runs", params={"agent_id": "none"}).json() == []


def agent_profile() -> dict[str, object]:
    return {"id": "tester", "provider": "nvidia", "model": None, "system_prompt": "test", "skills": [], "permission": "read_only", "budget": {"seconds": 60, "max_calls": 1}, "risk_tier": "read_only"}


def test_agent_test_endpoint_returns_provider_result(client: TestClient, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(runtime_agents, "AGENTS_DIR", tmp_path / "agents")
    runtime_agents.create_or_update_agent(agent_profile())
    class Provider:
        def stream_chat(self, *_: Any, **__: Any) -> Iterator[dict[str, Any]]:
            yield {"type": "delta", "text": "ok"}; yield {"type": "done", "usage": {"input_tokens": 3, "output_tokens": 1}}
    monkeypatch.setattr(server, "get_provider", lambda _provider: Provider())
    response = client.post("/api/agents/tester/test")
    assert response.status_code == 200 and response.json()["output"] == "ok"
    assert response.json()["usage"] == {"input_tokens": 3, "output_tokens": 1}


def test_agent_test_endpoint_rejects_missing_or_provider_error(client: TestClient, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(runtime_agents, "AGENTS_DIR", tmp_path / "agents")
    assert client.post("/api/agents/missing/test").status_code == 404
    runtime_agents.create_or_update_agent(agent_profile())
    class Provider:
        def stream_chat(self, *_: Any, **__: Any) -> Iterator[dict[str, Any]]:
            yield {"type": "error", "message": "provider unavailable"}
    monkeypatch.setattr(server, "get_provider", lambda _provider: Provider())
    response = client.post("/api/agents/tester/test")
    assert response.status_code == 400 and response.json()["detail"] == "provider unavailable"


def test_tools_usage_endpoint_and_alias_match(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    events = [{"tool": "Read", "source": "codex", "model": "gpt", "ts": "2026-07-28T00:00:00Z", "session": "s"}]
    monkeypatch.setattr(server.behavior, "collect_tool_events", lambda: (events, []))
    expected = client.get("/api/tools/usage").json()
    assert expected == client.get("/api/tools").json()
    assert expected["totals"]["tool_calls"] == 1


def test_tools_usage_endpoint_rejects_bad_filter(client: TestClient) -> None:
    assert client.get("/api/tools/usage", params={"since": "not-a-date"}).status_code == 400
