from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import run_push_brief


DATE = "2026-06-22"
PROFILE = {
    "goals": [],
    "preferences": {"quiet_hours": {"start": "06:00", "end": "22:00"}},
    "constraints": {},
}


def _now(hour: int) -> datetime:
    return datetime(2026, 6, 22, hour, 0)


def _set_env(monkeypatch, tmp_path) -> Path:
    traces_dir = tmp_path / "traces"
    monkeypatch.setenv("ANIMUS_TRACES_DIR", str(traces_dir))
    monkeypatch.setenv("ANIMUS_PROACTIVE_DIR", str(tmp_path / "proactive"))
    return traces_dir


def _trace_records(traces_dir: Path) -> list[dict]:
    return [
        json.loads(line)
        for trace_file in traces_dir.glob("*.jsonl")
        for line in trace_file.read_text(encoding="utf-8").splitlines()
    ]


def _output_kinds(traces_dir: Path) -> list[str]:
    return [record["output_kind"] for record in _trace_records(traces_dir)]


def test_quiet_hours_suppresses_send(monkeypatch, tmp_path):
    traces_dir = _set_env(monkeypatch, tmp_path)
    send_calls: list[str] = []

    result = run_push_brief.main(
        now=_now(3),
        get_existing=lambda date: [],
        generate=lambda intent: ("should not generate", [{"id": "item-1"}]),
        send=send_calls.append,
        profile=PROFILE,
    )

    assert result == 0
    assert send_calls == []
    assert _output_kinds(traces_dir) == ["suppressed_quiet"]


def test_rate_limit_suppresses_existing_daily_set(monkeypatch, tmp_path):
    traces_dir = _set_env(monkeypatch, tmp_path)
    send_calls: list[str] = []
    generate_calls: list[dict] = []

    result = run_push_brief.main(
        now=_now(7),
        get_existing=lambda date: [{"id": "existing-item"}],
        generate=lambda intent: generate_calls.append(intent) or ("should not generate", []),
        send=send_calls.append,
        profile=PROFILE,
    )

    assert result == 0
    assert generate_calls == []
    assert send_calls == []
    assert _output_kinds(traces_dir) == ["suppressed_ratelimited"]


def test_empty_brief_suppresses_send(monkeypatch, tmp_path):
    traces_dir = _set_env(monkeypatch, tmp_path)
    send_calls: list[str] = []

    result = run_push_brief.main(
        now=_now(7),
        get_existing=lambda date: [],
        generate=lambda intent: ("", []),
        send=send_calls.append,
        profile=PROFILE,
    )

    assert result == 0
    assert send_calls == []
    assert _output_kinds(traces_dir) == ["suppressed_empty"]


def test_happy_path_sends_once_and_traces_pushed(monkeypatch, tmp_path):
    traces_dir = _set_env(monkeypatch, tmp_path)
    send_calls: list[str] = []
    brief = "Chào buổi sáng.\n\nPrimus đề xuất:\n1. Test"

    def fake_send(text: str) -> bool:
        send_calls.append(text)
        return True

    result = run_push_brief.main(
        now=_now(7),
        get_existing=lambda date: [],
        generate=lambda intent: (brief, [{"id": "item-1"}]),
        send=fake_send,
        profile=PROFILE,
    )

    assert result == 0
    assert send_calls == [brief]
    assert _output_kinds(traces_dir) == ["pushed"]


def test_send_failure_retries_once_and_traces_failure(monkeypatch, tmp_path):
    traces_dir = _set_env(monkeypatch, tmp_path)
    send_calls: list[str] = []
    brief = "Chào buổi sáng.\n\nPrimus đề xuất:\n1. Test"

    def fake_send(text: str) -> bool:
        send_calls.append(text)
        return False

    result = run_push_brief.main(
        now=_now(7),
        get_existing=lambda date: [],
        generate=lambda intent: (brief, [{"id": "item-1"}]),
        send=fake_send,
        profile=PROFILE,
    )

    assert result == 0
    assert send_calls == [brief, brief]
    assert _output_kinds(traces_dir) == ["send_failed"]


def test_dry_run_prints_but_never_sends(monkeypatch, tmp_path, capsys):
    traces_dir = _set_env(monkeypatch, tmp_path)
    send_calls: list[str] = []
    brief = "Chào buổi sáng.\n\nPrimus đề xuất:\n1. Test"

    result = run_push_brief.main(
        ["--dry-run"],
        now=_now(7),
        get_existing=lambda date: [],
        generate=lambda intent: (brief, [{"id": "item-1"}]),
        send=lambda text: send_calls.append(text) or True,
        profile=PROFILE,
    )

    assert result == 0
    assert send_calls == []
    assert brief in capsys.readouterr().out
    assert _output_kinds(traces_dir) == ["pushed"]
