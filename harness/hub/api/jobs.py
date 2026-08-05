from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse, StreamingResponse

import config
from api._shared import _http_error
from services import gitjobs, hooks

router = APIRouter()


@router.get("/api/jobs")
def api_jobs() -> list[dict[str, object]]:
    return gitjobs.list_jobs()


@router.post("/api/jobs")
def api_create_job(payload: dict[str, object]) -> dict[str, object]:
    brief = payload.get("brief")
    agent = payload.get("agent") or "codex"
    allow_override = bool(payload.get("allow_override"))
    if not isinstance(brief, str) or not brief.strip():
        raise HTTPException(status_code=400, detail="brief is required")
    if not isinstance(agent, str):
        raise HTTPException(status_code=400, detail="agent must be a string")
    if agent not in config.JOB_ALLOW_AGENTS:
        raise HTTPException(status_code=400, detail=f"Unsupported agent: {agent}")
    try:
        return gitjobs.create_job(brief, agent, allow_override=allow_override)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (OSError, PermissionError, RuntimeError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/jobs/{job_id}")
def api_job(job_id: str) -> dict[str, object]:
    try:
        job = dict(gitjobs.get_job(job_id))
        patch = gitjobs.diff(job_id)
        if patch:
            job["diff"] = patch
        return job
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/jobs/{job_id}/approve")
def api_job_approve(job_id: str) -> dict[str, object]:
    try:
        return gitjobs.approve(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    except (OSError, RuntimeError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/jobs/{job_id}/stream")
def api_job_stream(job_id: str) -> StreamingResponse:
    try:
        gitjobs.get_job(job_id)
        return StreamingResponse(gitjobs.stream_events(job_id), media_type="text/event-stream")
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/jobs/{job_id}/accept")
def api_job_accept(job_id: str) -> dict[str, object]:
    try:
        return gitjobs.accept(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError, RuntimeError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/jobs/{job_id}/rollback")
def api_job_rollback(job_id: str) -> dict[str, object]:
    try:
        return gitjobs.rollback(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError, RuntimeError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/jobs/{job_id}/reject")
def api_job_reject(job_id: str) -> dict[str, object]:
    try:
        return gitjobs.reject(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError, RuntimeError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/jobs/{job_id}/diff")
def api_job_diff(job_id: str) -> PlainTextResponse:
    try:
        return PlainTextResponse(gitjobs.diff(job_id), media_type="text/plain; charset=utf-8")
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/hooks")
def api_hooks() -> list[dict[str, object]]: return hooks.list_hooks()


@router.get("/api/hooks/events")
def api_hook_events() -> list[str]: return hooks.events()


@router.post("/api/hooks")
def api_hooks_create(payload: dict[str, object]) -> dict[str, object]:
    try: return hooks.create(payload)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/api/hooks/{hook_id}")
def api_hooks_update(hook_id: str, payload: dict[str, object]) -> dict[str, object]:
    try: return hooks.update(hook_id, payload)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc: raise _http_error(exc) from exc


@router.delete("/api/hooks/{hook_id}")
def api_hooks_delete(hook_id: str) -> dict[str, bool]:
    try: hooks.delete(hook_id)
    except FileNotFoundError as exc: raise _http_error(exc) from exc
    return {"ok": True}


@router.get("/api/hooks/{hook_id}/log")
def api_hook_log(hook_id: str) -> list[dict[str, object]]: return hooks.log(hook_id)
