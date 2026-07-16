from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any, Iterator

import pytest

import config
from services import chat
from services.providers import claude_cli, codex_cli, gemini_cli, nvidia_api, procs
from services.providers import get_provider, list_providers


# ---------------------------------------------------------------------------
# nvidia_api — mock services/chat.py, never call the real NVIDIA API
# ---------------------------------------------------------------------------


def test_nvidia_status_available_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")
    status = nvidia_api.status()
    assert status["id"] == "nvidia"
    assert status["available"] is True
    assert status["capabilities"]["models"] == config.CHAT_MODELS


def test_nvidia_status_unavailable_without_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    status = nvidia_api.status()
    assert status["available"] is False


def test_nvidia_stream_chat_maps_events(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_stream_chat(messages: list[dict[str, str]], model: str, max_tokens: int) -> Iterator[dict[str, Any]]:
        assert model == config.CHAT_DEFAULT_MODEL
        yield {"type": "reasoning", "text": "thinking..."}
        yield {"type": "delta", "text": "hello"}
        yield {"type": "delta", "text": " world"}
        yield {"type": "done", "usage": {"input_tokens": 5, "output_tokens": 7, "total_tokens": 12}, "model": model}

    monkeypatch.setattr(chat, "stream_chat", fake_stream_chat)

    events = list(nvidia_api.stream_chat([{"role": "user", "content": "hi"}]))

    assert events[0] == {"type": "reasoning", "text": "thinking..."}
    assert events[1] == {"type": "delta", "text": "hello"}
    assert events[2] == {"type": "delta", "text": " world"}
    assert events[3]["type"] == "done"
    assert events[3]["session_id"] is None
    assert events[3]["usage"]["total_tokens"] == 12


def test_nvidia_stream_chat_auth_error_becomes_error_event(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_stream_chat(messages: list[dict[str, str]], model: str, max_tokens: int) -> Iterator[dict[str, Any]]:
        raise chat.ChatAuthError("no key")
        yield  # pragma: no cover - unreachable, makes this a generator

    monkeypatch.setattr(chat, "stream_chat", fake_stream_chat)
    events = list(nvidia_api.stream_chat([{"role": "user", "content": "hi"}]))
    assert events == [{"type": "error", "message": "no key", "code": None}]


# ---------------------------------------------------------------------------
# claude_cli — fake CLI subprocess, never invoke the real `claude` binary
# ---------------------------------------------------------------------------

_FAKE_CLAUDE_SCRIPT = """
import json
print(json.dumps({"type": "assistant", "message": {"role": "assistant", "content": [{"type": "text", "text": "Hello "}]}}))
print(json.dumps({"type": "assistant", "message": {"role": "assistant", "content": [{"type": "text", "text": "world"}]}}))
print(json.dumps({"type": "result", "subtype": "success", "session_id": "sess-abc123", "usage": {"input_tokens": 11, "output_tokens": 22}}))
"""


@pytest.fixture
def fake_claude_cli(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    script = tmp_path / "fake_claude.py"
    script.write_text(_FAKE_CLAUDE_SCRIPT, encoding="utf-8")
    monkeypatch.setitem(config.PROVIDERS, "claude", {"cmd": [sys.executable, str(script)]})
    monkeypatch.setattr(config, "CHAT_USAGE_FILE", tmp_path / "chat_usage.jsonl")
    return script


def test_claude_cli_parses_delta_done_session_usage(fake_claude_cli: Path) -> None:
    events = list(claude_cli.stream_chat([{"role": "user", "content": "hi"}]))

    deltas = [event for event in events if event["type"] == "delta"]
    assert [event["text"] for event in deltas] == ["Hello ", "world"]

    done = events[-1]
    assert done["type"] == "done"
    assert done["session_id"] == "sess-abc123"
    assert done["usage"] == {"input_tokens": 11, "output_tokens": 22, "total_tokens": 33}

    usage_file = config.CHAT_USAGE_FILE
    assert usage_file.is_file()
    logged = json.loads(usage_file.read_text(encoding="utf-8").strip().splitlines()[-1])
    assert logged["source"] == "chat"
    assert logged["model"] == "cli:claude"
    assert logged["total_tokens"] == 33


def test_claude_cli_build_cmd_includes_disallowed_tools_and_resume() -> None:
    cmd = claude_cli._build_cmd("hello", "sess-1")
    assert "-p" in cmd and "hello" in cmd
    assert cmd.count("--disallowed-tools") == 3
    assert "-r" in cmd and "sess-1" in cmd


# ---------------------------------------------------------------------------
# codex_cli — fake CLI subprocess, never invoke the real `codex` binary
# ---------------------------------------------------------------------------

_FAKE_CODEX_SCRIPT = """
import json
print(json.dumps({"type": "item.completed", "item": {"type": "agent_message", "text": "Hi from codex"}}))
print(json.dumps({"type": "token_count", "usage": {"input_tokens": 4, "output_tokens": 6}}))
print(json.dumps({"type": "turn.completed", "session_id": "codex-sess-1"}))
"""


@pytest.fixture
def fake_codex_cli(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    script = tmp_path / "fake_codex.py"
    script.write_text(_FAKE_CODEX_SCRIPT, encoding="utf-8")
    monkeypatch.setitem(config.PROVIDERS, "codex", {"cmd": [sys.executable, str(script)]})
    monkeypatch.setattr(config, "CHAT_USAGE_FILE", tmp_path / "chat_usage.jsonl")
    return script


def test_codex_cli_parses_delta_and_done(fake_codex_cli: Path) -> None:
    events = list(codex_cli.stream_chat([{"role": "user", "content": "hi"}]))

    deltas = [event for event in events if event["type"] == "delta"]
    assert deltas == [{"type": "delta", "text": "Hi from codex"}]

    done = events[-1]
    assert done["type"] == "done"
    assert done["session_id"] == "codex-sess-1"
    assert done["usage"] == {"input_tokens": 4, "output_tokens": 6, "total_tokens": 10}


def test_codex_cli_build_cmd_has_fresh_start_preamble_and_flags() -> None:
    cmd = codex_cli._build_cmd("do the thing", None)
    assert "exec" in cmd
    assert "-s" in cmd and "read-only" in cmd
    assert "--skip-git-repo-check" in cmd
    assert "--json" in cmd
    assert cmd[-1].startswith("FRESH START\n\n")
    assert cmd[-1].endswith("do the thing")


def test_codex_status_reports_stderr_on_failure(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    script = tmp_path / "fake_codex_error.py"
    script.write_text('import sys\nsys.stderr.write("codex config is invalid")\nraise SystemExit(2)\n', encoding="utf-8")
    monkeypatch.setitem(config.PROVIDERS, "codex", {"cmd": [sys.executable, str(script)]})
    monkeypatch.setitem(codex_cli._status_cache, "value", None)

    status = codex_cli.status()

    assert status["available"] is False
    assert "codex config is invalid" in status["detail"]


def test_codex_status_reports_not_installed_for_missing_executable(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setitem(config.PROVIDERS, "codex", {"cmd": [str(tmp_path / "missing-codex")]})
    monkeypatch.setitem(codex_cli._status_cache, "value", None)

    status = codex_cli.status()

    assert status["available"] is False
    assert status["detail"] == "not_installed"


def test_codex_status_parses_version(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    script = tmp_path / "fake_codex_version.py"
    script.write_text('print("codex-cli 0.144.3")\n', encoding="utf-8")
    monkeypatch.setitem(config.PROVIDERS, "codex", {"cmd": [sys.executable, str(script)]})
    monkeypatch.setitem(codex_cli._status_cache, "value", None)

    status = codex_cli.status()

    assert status["available"] is True
    assert status["version"] == "codex-cli 0.144.3"
    assert status["detail"] == "ok"


# ---------------------------------------------------------------------------
# gemini_cli — stub
# ---------------------------------------------------------------------------


def test_gemini_status_not_installed() -> None:
    status = gemini_cli.status()
    assert status["available"] is False
    assert status["detail"] == "not_installed"


def test_gemini_stream_chat_yields_error() -> None:
    events = list(gemini_cli.stream_chat([{"role": "user", "content": "hi"}]))
    assert len(events) == 1
    assert events[0]["type"] == "error"


# ---------------------------------------------------------------------------
# procs.ProcessRegistry — timeout kill + max concurrent
# ---------------------------------------------------------------------------

_FAKE_SLEEP_SCRIPT = """
import sys
import time
time.sleep(float(sys.argv[1]) if len(sys.argv) > 1 else 10)
"""


@pytest.fixture
def fake_sleeper(tmp_path: Path) -> Path:
    script = tmp_path / "fake_sleep.py"
    script.write_text(_FAKE_SLEEP_SCRIPT, encoding="utf-8")
    return script


def test_procs_kills_process_that_exceeds_timeout(fake_sleeper: Path) -> None:
    registry = procs.ProcessRegistry()
    proc_id = registry.spawn([sys.executable, str(fake_sleeper), "10"], timeout=0.3)

    deadline = time.monotonic() + 5.0
    while time.monotonic() < deadline and not registry.is_timed_out(proc_id):
        time.sleep(0.05)

    assert registry.is_timed_out(proc_id) is True
    process = registry.get(proc_id)
    assert process is not None
    assert process.poll() is not None  # killed
    registry.unregister(proc_id)


def test_procs_raises_busy_error_at_max_concurrent(monkeypatch: pytest.MonkeyPatch, fake_sleeper: Path) -> None:
    monkeypatch.setattr(config, "MAX_CONCURRENT_CLI", 3)
    registry = procs.ProcessRegistry()
    proc_ids = []
    try:
        for _ in range(3):
            proc_ids.append(registry.spawn([sys.executable, str(fake_sleeper), "5"], timeout=30))

        assert registry.count_live() == 3

        with pytest.raises(procs.BusyError):
            registry.spawn([sys.executable, str(fake_sleeper), "5"], timeout=30)
    finally:
        registry.kill_all()


# ---------------------------------------------------------------------------
# registry — get_provider / list_providers
# ---------------------------------------------------------------------------


def test_list_providers_returns_four_entries(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        claude_cli,
        "status",
        lambda: {"id": "claude", "available": True, "version": "2.1.207", "detail": "ok", "capabilities": {}},
    )
    monkeypatch.setattr(
        codex_cli,
        "status",
        lambda: {"id": "codex", "available": True, "version": "0.144.3", "detail": "ok", "capabilities": {}},
    )

    statuses = list_providers()
    assert len(statuses) == 4
    assert {item["id"] for item in statuses} == {"nvidia", "claude", "codex", "gemini"}


def test_get_provider_unknown_raises() -> None:
    with pytest.raises(ValueError):
        get_provider("not-a-provider")


def test_get_provider_known_returns_module() -> None:
    assert get_provider("claude") is claude_cli
    assert get_provider("nvidia") is nvidia_api
