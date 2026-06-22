from __future__ import annotations

import pytest

from animus_core.trace import log_trace, patch_trace, read_traces


def _record(trace_id: str, step_index: int = 0) -> dict:
    return {
        "id": trace_id,
        "ts": "2026-06-21T12:00:00+09:00",
        "origin": "user",
        "user_input": "Route this request",
        "intent_type": "execution",
        "target_subsystem": "NEXUS",
        "route_confidence": 0.9,
        "sources_loaded": ["docs/SD-eval-foundation.md"],
        "action_class": "read",
        "output_kind": "answer",
        "step_index": step_index,
    }


def test_read_traces_merges_patch_by_id(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_TRACES_DIR", str(tmp_path))
    monkeypatch.setattr("animus_core.trace._jst_date", lambda: "2026-06-21")

    log_trace(_record("2026-06-21-1200-01", step_index=0))
    log_trace(_record("2026-06-21-1200-02", step_index=1))
    patch_trace("2026-06-21-1200-01", {"user_verdict": "accepted", "outcome": "used"})

    traces = read_traces("2026-06-21")

    assert len(traces) == 2
    assert traces[0]["id"] == "2026-06-21-1200-01"
    assert traces[0]["user_verdict"] == "accepted"
    assert traces[0]["outcome"] == "used"
    assert "user_verdict" not in traces[1]


def test_log_trace_missing_required_field_raises_value_error(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_TRACES_DIR", str(tmp_path))
    monkeypatch.setattr("animus_core.trace._jst_date", lambda: "2026-06-21")
    record = _record("2026-06-21-1200-01")
    del record["target_subsystem"]

    with pytest.raises(ValueError, match="Missing required trace field"):
        log_trace(record)


def test_log_trace_invalid_enum_raises_value_error(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_TRACES_DIR", str(tmp_path))
    monkeypatch.setattr("animus_core.trace._jst_date", lambda: "2026-06-21")
    record = _record("2026-06-21-1200-01")
    record["action_class"] = "execute"

    with pytest.raises(ValueError, match="Invalid action_class"):
        log_trace(record)
