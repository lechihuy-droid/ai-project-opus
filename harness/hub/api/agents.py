from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, StreamingResponse

import config
from api._shared import _check_if_match, _etag, _http_error
from services import capabilities, execution, risk, run_inputs, runtime_agents, runtime_events, runtime_interrupts, runtime_pipeline, runtime_state
from services.providers import list_providers

router = APIRouter()


@router.get("/api/providers")
def api_providers() -> list[dict[str, object]]:
    return list_providers()


@router.get("/api/model-classes")
def api_model_classes() -> dict[str, dict[str, object]]:
    return config.MODEL_CLASS_ROUTING


@router.get("/api/agents")
def api_agents() -> list[dict[str, object]]:
    return runtime_agents.list_agents()


@router.get("/api/capabilities")
def api_capabilities() -> list[dict[str, object]]:
    return capabilities.public_catalog()


@router.get("/api/risk-tiers")
def api_risk_tiers() -> list[str]:
    return list(risk.TIERS)


@router.post("/api/agents")
def api_agents_create_or_update(payload: dict[str, object], request: Request, response: Response) -> dict[str, object]:
    try:
        agent_id = payload.get("id")
        if isinstance(agent_id, str):
            try:
                current = runtime_agents.get_agent(agent_id)
                current_path = runtime_agents.AGENTS_DIR / f"{current['id']}.agent.yaml"
                _check_if_match(request, current_path.read_bytes())
            except FileNotFoundError:
                pass
        result = runtime_agents.create_or_update_agent(payload)
        response.headers["ETag"] = _etag((runtime_agents.AGENTS_DIR / f"{result['id']}.agent.yaml").read_bytes())
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/api/agents/{agent_id}")
def api_agents_delete(agent_id: str) -> dict[str, bool]:
    try:
        runtime_agents.delete_agent(agent_id)
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc
    return {"ok": True}


@router.get("/api/agent/runs")
def api_agent_runs(agent_id: str | None = None) -> list[dict[str, object]]:
    rows = runtime_state.list_runs()
    if agent_id is not None:
        rows = [row for row in rows if (row.get("metadata") or {}).get("agent_id") == agent_id]
    return rows


@router.post("/api/agents/{agent_id}/test")
def api_agent_test(agent_id: str) -> dict[str, object]:
    try:
        agent = runtime_agents.get_agent(agent_id)
        route = runtime_agents.resolve_provider(agent)
        started = time.monotonic(); output: list[str] = []; usage: dict[str, object] = {}
        request = execution.ExecutionRequest(
            correlation_id=f"agent-test-{agent_id}", provider_id=str(route["provider"]), model=route.get("model"),
            messages=[{"role": "user", "content": "Trả lời ngắn: kết nối agent hoạt động."}],
            tool_policy={
                "permission": agent["permission"], "allowed_tools": agent.get("allowed_tools", []),
                "allowed_paths": agent.get("allowed_paths", []), "allowed_origins": agent.get("allowed_origins", []),
                "allowed_capabilities": agent.get("capabilities", []),
            },
        )
        for item in execution.execute(request):
            if item.get("type") == "delta": output.append(str(item.get("text") or ""))
            elif item.get("type") == "done": usage = dict(item.get("usage") or {})
            elif item.get("type") == "error": raise RuntimeError(str(item.get("message") or "Provider error"))
        elapsed = time.monotonic() - started
        if elapsed > agent["budget"]["seconds"]: raise RuntimeError("budget_exceeded: agent seconds")
        return {"output": "".join(output), "elapsed_seconds": elapsed, "usage": usage}
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/agent/runs")
def api_create_agent_run(payload: dict[str, object]) -> StreamingResponse:
    try:
        references, inputs = run_inputs.resolve_inputs(payload.get("inputs"))
    except (ValueError, PermissionError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    forwarded = dict(payload)
    if references:
        metadata = dict(forwarded.get("metadata") or {}) if isinstance(forwarded.get("metadata"), dict) else {}
        metadata.update({"inputs": inputs, "input_references": references})
        forwarded["metadata"] = metadata
    return StreamingResponse(runtime_pipeline.create_run_stream(forwarded), media_type="text/event-stream")


@router.get("/api/agent/runs/{run_id}")
def api_agent_run(run_id: str) -> dict[str, object]:
    try:
        return runtime_state.read_run(run_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/agent/runs/{run_id}/events")
def api_agent_run_events(run_id: str) -> list[dict[str, object]]:
    try:
        return runtime_events.read_events(run_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/agent/runs/{run_id}/interrupts/{interrupt_id}/resume")
def api_agent_run_interrupt_resume(run_id: str, interrupt_id: str, payload: dict[str, object]) -> StreamingResponse:
    try:
        runtime_state.read_run(run_id)
        runtime_interrupts.get_interrupt(run_id, interrupt_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    return StreamingResponse(
        runtime_pipeline.resume_run_stream(run_id, interrupt_id, payload),
        media_type="text/event-stream",
    )
