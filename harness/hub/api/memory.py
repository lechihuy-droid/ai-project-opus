from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api._shared import _http_error
from services import retention, runtime_memory

router = APIRouter()


@router.get("/api/memory")
def api_memory() -> list[dict[str, object]]:
    return runtime_memory.list_memory()


@router.get("/api/settings/retention")
def api_retention_settings() -> dict[str, int]:
    return retention.settings()


@router.put("/api/settings/retention")
def api_retention_update(payload: dict[str, object]) -> dict[str, int]:
    try:
        result = retention.update(payload.get("days"))
        retention.sweep()
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/memory/candidates")
def api_memory_candidates() -> list[dict[str, object]]:
    return runtime_memory.list_candidates()


@router.post("/api/memory/candidates/{candidate_id}/accept")
def api_memory_candidate_accept(candidate_id: str, payload: dict[str, object] | None = None) -> dict[str, object]:
    try:
        return runtime_memory.accept_candidate(candidate_id, payload if isinstance(payload, dict) else None)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/memory/candidates/{candidate_id}/reject")
def api_memory_candidate_reject(candidate_id: str) -> dict[str, object]:
    try:
        return runtime_memory.reject_candidate(candidate_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/memory/{memory_id}/revoke")
def api_memory_revoke(memory_id: str, payload: dict[str, object]) -> dict[str, object]:
    try:
        return runtime_memory.revoke_memory(memory_id, str(payload.get("revoked_by") or ""), str(payload.get("reason") or ""))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
