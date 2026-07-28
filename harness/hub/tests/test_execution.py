from __future__ import annotations

from pathlib import Path

from services import execution


def test_mock_adapter_conforms_to_execution_port() -> None:
    adapter = execution.MockAdapter([
        {"type": "reasoning", "text": "think"}, {"type": "delta", "text": "answer"},
        {"type": "tool_call", "tool_name": "Read"}, {"type": "tool_result", "tool_output": "ok"},
        {"type": "done", "usage": {"total_tokens": 2}},
    ])
    request = execution.ExecutionRequest(
        correlation_id="test-1", provider_id="nvidia", model="model", messages=[{"role": "user", "content": "hi"}],
        system_prompt="system", tool_policy={"permission": "read_only"}, limits={"seconds": 1},
    )

    assert list(execution.execute(request, resolver=lambda _provider_id: adapter)) == adapter.events
    assert adapter.calls == [{
        "messages": [{"role": "user", "content": "hi"}], "session_id": None, "model": "model",
        "system_prompt": "system", "tool_policy": {"permission": "read_only"},
    }]


def test_gateway_returns_normalized_denial() -> None:
    result = execution.gateway(execution.ExecutionRequest(
        correlation_id="test-2", provider_id="missing", model=None, messages=[],
    ))

    assert result.denied
    assert result.route is None
    assert result.error is not None
    assert result.error.message.startswith("Unknown provider: missing; valid providers or model classes:")


def test_runtime_callers_do_not_import_or_call_provider_directly() -> None:
    hub = Path(__file__).resolve().parents[1]
    workflow_source = (hub / "services" / "workflow_exec.py").read_text(encoding="utf-8")
    transport_source = (hub / "services" / "chat.py").read_text(encoding="utf-8")
    route_source = (hub / "server.py").read_text(encoding="utf-8")

    assert "from services.providers import get_provider" not in workflow_source
    assert ".stream_chat(" not in workflow_source
    assert "from services.providers import get_provider" not in transport_source
    assert ".stream_chat(" not in route_source
