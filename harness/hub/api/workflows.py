from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, StreamingResponse

from api._shared import _check_if_match, _etag, _http_error
from services import run_inputs, runtime_artifacts, runtime_interrupts, runtime_state, workflow, workflow_exec

router = APIRouter()


@router.get("/api/workflows")
def api_workflows() -> list[dict[str, object]]:
    return workflow.list_workflows()


@router.post("/api/workflows", status_code=201)
def api_workflow_create(payload: dict[str, object], response: Response) -> dict[str, object]:
    workflow_id = payload.get("id")
    yaml_text = payload.get("yaml_text")
    agent = payload.get("agent")
    if not isinstance(workflow_id, str):
        raise HTTPException(status_code=400, detail="id must be a string")
    if yaml_text is not None and not isinstance(yaml_text, str):
        raise HTTPException(status_code=400, detail="yaml_text must be a string")
    if agent is not None and not isinstance(agent, str):
        raise HTTPException(status_code=400, detail="agent must be a string")
    try:
        result = workflow.create_workflow(workflow_id, yaml_text, agent=agent)
        response.headers["ETag"] = _etag(workflow.workflow_path(workflow_id).read_bytes())
        return result
    except workflow.WorkflowConflictError as exc:
        raise _http_error(exc, 409) from exc
    except (PermissionError, ValueError) as exc:
        raise _http_error(exc, 400) from exc


@router.get("/api/workflows/{workflow_id}/layout")
def api_workflow_layout(workflow_id: str, response: Response) -> dict[str, object]:
    try:
        response.headers["ETag"] = _etag(workflow.workflow_layout_path(workflow_id).read_bytes()) if workflow.workflow_layout_path(workflow_id).exists() else '"empty"'
        return {"nodes": workflow.read_layout(workflow_id)}
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/api/workflows/{workflow_id}/layout")
def api_workflow_layout_save(workflow_id: str, payload: dict[str, object], request: Request, response: Response) -> dict[str, object]:
    try:
        path = workflow.workflow_layout_path(workflow_id)
        _check_if_match(request, path.read_bytes() if path.exists() else b"")
        result = {"nodes": workflow.save_layout(workflow_id, payload)}
        response.headers["ETag"] = _etag(path.read_bytes())
        return result
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/api/workflows/{workflow_id}/model")
def api_workflow_model_save(workflow_id: str, payload: dict[str, object], request: Request, response: Response) -> dict[str, object]:
    model = payload.get("model")
    if not isinstance(model, dict):
        raise HTTPException(status_code=400, detail="model must be a mapping")
    try:
        _check_if_match(request, workflow.workflow_path(workflow_id).read_bytes())
        yaml_text = workflow.model_yaml_text(workflow_id, model)
        result = workflow.save_workflow(workflow_id, yaml_text)
        response.headers["ETag"] = _etag(workflow.workflow_path(workflow_id).read_bytes())
        return result
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/workflows/{workflow_id}/source")
def api_workflow_source(workflow_id: str, response: Response) -> dict[str, str]:
    try:
        path = workflow.workflow_path(workflow_id)
        response.headers["ETag"] = _etag(path.read_bytes())
        return {"id": workflow_id, "yaml_text": path.read_text(encoding="utf-8")}
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/workflows/validate")
def api_workflow_validate(payload: dict[str, object]) -> dict[str, object]:
    yaml_text = payload.get("yaml_text")
    workflow_id = payload.get("id")
    if isinstance(yaml_text, str):
        source = yaml_text
    elif isinstance(workflow_id, str):
        try:
            source = workflow.workflow_path(workflow_id).read_text(encoding="utf-8")
        except (FileNotFoundError, PermissionError) as exc:
            raise _http_error(exc) from exc
    else:
        raise HTTPException(status_code=400, detail="yaml_text or id is required")

    try:
        data = workflow.parse_workflow(source)
    except ValueError as exc:
        return {"ok": False, "errors": [str(exc)], "ir": None}
    errors = workflow.validate_workflow(data)
    return {"ok": not errors, "errors": errors, "ir": workflow.build_ir(data) if not errors else None}


@router.put("/api/workflows/{workflow_id}")
def api_workflow_save(workflow_id: str, payload: dict[str, object], request: Request, response: Response) -> dict[str, object]:
    yaml_text = payload.get("yaml_text")
    if not isinstance(yaml_text, str):
        raise HTTPException(status_code=400, detail="yaml_text must be a string")
    try:
        _check_if_match(request, workflow.workflow_path(workflow_id).read_bytes())
        result = workflow.save_workflow(workflow_id, yaml_text)
        response.headers["ETag"] = _etag(workflow.workflow_path(workflow_id).read_bytes())
        return result
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/api/workflows/{workflow_id}")
def api_workflow_delete(workflow_id: str) -> dict[str, bool]:
    try:
        workflow.delete_workflow(workflow_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    return {"ok": True}


@router.post("/api/workflows/{workflow_id}/runs", response_model=None)
def api_workflow_run(workflow_id: str, payload: dict[str, object]):
    objective = payload.get("objective")
    if not isinstance(objective, str):
        raise HTTPException(status_code=400, detail="objective must be a string")
    try:
        references, inputs = run_inputs.resolve_inputs(payload.get("inputs"))
        source = workflow.workflow_path(workflow_id).read_text(encoding="utf-8")
        errors = workflow.validate_workflow(workflow.parse_workflow(source))
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    except ValueError as exc:
        raise _http_error(exc, 400) from exc
    if errors:
        raise _http_error(ValueError("Workflow validation failed"), 422)
    return StreamingResponse(workflow_exec.create_workflow_run_stream(workflow_id, objective, inputs, references), media_type="text/event-stream")


@router.get("/api/workflows/runs/{run_id}/artifacts")
def api_workflow_run_artifacts(run_id: str) -> dict[str, object]:
    try:
        return {"artifacts": runtime_artifacts.list_artifacts(run_id)}
    except (FileNotFoundError, PermissionError) as exc:
        raise HTTPException(status_code=404) from exc


@router.get("/api/workflows/runs/{run_id}/artifacts/{name}")
def api_workflow_run_artifact(run_id: str, name: str) -> dict[str, str]:
    try:
        return {"name": name, "text": runtime_artifacts.read_artifact(run_id, name)}
    except (FileNotFoundError, PermissionError) as exc:
        raise HTTPException(status_code=404) from exc


@router.post("/api/workflows/runs/{run_id}/interrupts/{interrupt_id}/resume")
def api_workflow_run_interrupt_resume(run_id: str, interrupt_id: str, payload: dict[str, object]) -> StreamingResponse:
    try:
        runtime_state.read_run(run_id)
        runtime_interrupts.get_interrupt(run_id, interrupt_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    return StreamingResponse(
        workflow_exec.resume_workflow_run_stream(run_id, interrupt_id, payload),
        media_type="text/event-stream",
    )
