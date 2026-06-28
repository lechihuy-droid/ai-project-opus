from __future__ import annotations

import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import config
import server
from services import behavior, gitjobs, runs, trigger


FIXTURE_RUNS_DIR = Path(__file__).resolve().parent / "fixtures" / "runs"
FIXTURE_BOARD_DIR = Path(__file__).resolve().parent / "fixtures" / "board"
FIXTURE_REPLAY_DIR = Path(__file__).resolve().parent / "fixtures" / "replay"
FIXTURE_USAGE_DIR = Path(__file__).resolve().parent / "fixtures" / "usage"
FIXTURE_RUN_ID = "20260627-234104-workspace-smoke"


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> TestClient:
    monkeypatch.setattr(config, "RUNS_DIR", FIXTURE_RUNS_DIR)
    monkeypatch.setattr(config, "JOBS_DIR", tmp_path / "api-jobs")
    monkeypatch.setattr(config, "OPUS_AI_DIR", FIXTURE_BOARD_DIR)
    monkeypatch.setattr(
        config,
        "USAGE_SOURCES",
        {
            "claude": FIXTURE_REPLAY_DIR / "claude_projects",
            "codex": [FIXTURE_REPLAY_DIR / "codex_sessions"],
            "inspect": FIXTURE_USAGE_DIR / "inspect_logs",
        },
    )
    runs._RUNS_CACHE.update({"expires": 0.0, "base": None, "items": []})
    monkeypatch.setattr(behavior, "_DISK_CACHE", tmp_path / "api-behavior.json")
    behavior._BEHAVIOR_CACHE.update(
        {"expires": 0.0, "events": [], "warnings": [], "sessions": [], "fingerprint": None}
    )
    trigger._STREAMS.clear()
    gitjobs._STREAMS.clear()
    return TestClient(server.app)


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["port"] == 8799


def test_runs_endpoints(client: TestClient) -> None:
    response = client.get("/api/runs")
    assert response.status_code == 200
    assert response.json()[0]["run_id"] == FIXTURE_RUN_ID

    detail = client.get(f"/api/runs/{FIXTURE_RUN_ID}")
    assert detail.status_code == 200
    assert detail.json()["summary"]["total"] == 11

    missing = client.get("/api/runs/missing")
    assert missing.status_code == 404


def test_artifact_endpoint_boundary(client: TestClient) -> None:
    response = client.get(f"/api/runs/{FIXTURE_RUN_ID}/artifact", params={"rel": "report.md"})
    assert response.status_code == 200
    assert "Harness Report" in response.text

    outside = client.get(f"/api/runs/{FIXTURE_RUN_ID}/artifact", params={"rel": "../outside.txt"})
    assert outside.status_code == 403


def test_suites_endpoints(client: TestClient) -> None:
    response = client.get("/api/suites")
    assert response.status_code == 200
    assert any(item["id"] == "workspace-smoke" for item in response.json())

    detail = client.get("/api/suites/workspace-smoke")
    assert detail.status_code == 200
    assert detail.json()["check_count"] >= 11


def test_trigger_rejects_unknown_suite(client: TestClient) -> None:
    response = client.post("/api/runs/trigger", json={"suite": "missing-suite"})
    assert response.status_code == 400


def test_jobs_reject_unknown_agent(client: TestClient) -> None:
    response = client.post("/api/jobs", json={"brief": "test", "agent": "unknown"})
    assert response.status_code == 400


def test_jobs_bad_id_returns_404(client: TestClient) -> None:
    response = client.get("/api/jobs/not-a-valid-job-id!")
    assert response.status_code == 404


def test_trigger_streams_mocked_subprocess(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[list[str], dict[str, object]]] = []

    class FakeProcess:
        stdout = io.StringIO('hello\n{"run_id":"fake-run"}\n')
        stderr = io.StringIO("warn\n")

        def wait(self) -> int:
            return 0

    def fake_popen(command: list[str], **kwargs: object) -> FakeProcess:
        calls.append((command, kwargs))
        return FakeProcess()

    monkeypatch.setattr(trigger.subprocess, "Popen", fake_popen)

    started = client.post("/api/runs/trigger", json={"suite": "workspace-smoke"})
    assert started.status_code == 200
    stream_id = started.json()["stream_id"]
    assert stream_id

    streamed = client.get(f"/api/runs/stream/{stream_id}")
    assert streamed.status_code == 200
    assert "event: line" in streamed.text
    assert "hello" in streamed.text
    assert "fake-run" in streamed.text
    assert "event: exit" in streamed.text

    command, kwargs = calls[0]
    assert command[1].endswith("harness\\run_harness.py") or command[1].endswith("harness/run_harness.py")
    assert command[2:] == ["--suite", "workspace-smoke", "--json"]
    assert kwargs["cwd"] == config.ROOT
    assert kwargs["shell"] is False


def test_phase3_read_endpoints(client: TestClient) -> None:
    board_response = client.get("/api/board")
    assert board_response.status_code == 200
    assert board_response.json()["owner"] == "codex"

    sessions_response = client.get("/api/sessions")
    assert sessions_response.status_code == 200
    assert {item["source"] for item in sessions_response.json()} == {"claude", "codex"}

    inspect_response = client.get("/api/inspect/logs")
    assert inspect_response.status_code == 200
    assert isinstance(inspect_response.json(), list)


def test_behavior_endpoints(client: TestClient) -> None:
    tools_response = client.get("/api/tools")
    assert tools_response.status_code == 200
    tools = tools_response.json()
    assert tools["totals"]["tool_calls"] == 4
    assert any(row["tool"] == "Bash" and row["count"] == 1 for row in tools["by_tool"])
    assert any(row["tool"] == "functions.shell_command" and row["count"] == 1 for row in tools["by_tool"])

    filtered = client.get("/api/tools", params={"source": "codex", "model": "gpt-5-codex"})
    assert filtered.status_code == 200
    assert filtered.json()["totals"]["tool_calls"] == 2

    loops_response = client.get("/api/sessions/loops")
    assert loops_response.status_code == 200
    loops = loops_response.json()
    assert len(loops) == 2
    assert all("loop_risk" in item for item in loops)


def test_spa_index(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "Harness Hub" in response.text
