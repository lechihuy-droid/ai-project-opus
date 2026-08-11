from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from api._shared import _http_error
from services import behavior, runtime_skills, search, skill_library, skill_resolution

router = APIRouter()


@router.get("/api/skills")
def api_skills() -> list[dict[str, object]]:
    return runtime_skills.list_skills()


@router.get("/api/search")
def api_search(q: str = "") -> list[dict[str, str]]:
    return search.search(q)


@router.get("/api/skills/names")
def api_skill_names() -> list[str]:
    return sorted(skill_library.list_skill_names())


@router.post("/api/skill-resolution/preview")
def api_skill_resolution_preview(payload: dict[str, object]) -> dict[str, object]:
    """Resolve a task to skills without executing or exposing skill bodies."""
    try:
        return skill_resolution.preview(payload)
    except (ValueError, FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc, status_code=400) from exc


@router.get("/api/skills/{skill_id}/usage")
def api_skill_usage(skill_id: str) -> dict[str, object]:
    try:
        return runtime_skills.skill_usage(skill_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/skills/{skill_id}")
def api_skill(skill_id: str) -> dict[str, object]:
    try:
        return runtime_skills.get_skill(skill_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/tools")
@router.get("/api/tools/usage")
def api_tools(
    source: str | None = None,
    model: str | None = None,
    since: str | None = None,
) -> dict[str, object]:
    try:
        events, _warnings = behavior.collect_tool_events()
        filtered = behavior.filter_tool_events(events, {"source": source, "model": model, "since": since})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return behavior.tool_rollup(filtered)


@router.get("/api/skill-library")
def api_skill_library() -> list[dict[str, object]]:
    return skill_library.list_skills()


@router.get("/api/skill-library/summary")
def api_skill_library_summary(
    query: str = "",
    source: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> dict[str, object]:
    return skill_library.list_skill_summary(query=query, source=source, offset=offset, limit=limit)


@router.post("/api/skill-library")
def api_skill_library_create(payload: dict[str, object]) -> dict[str, object]:
    try: return skill_library.create_skill(payload)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/api/skill-library/{skill_id:path}")
def api_skill_library_update(skill_id: str, payload: dict[str, object]) -> dict[str, object]:
    try: return skill_library.update_skill(skill_id, payload)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.delete("/api/skill-library/{skill_id:path}")
def api_skill_library_delete(skill_id: str) -> dict[str, bool]:
    try: skill_library.delete_skill(skill_id)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc
    return {"ok": True}


@router.get("/api/skill-library/drift")
def api_skill_library_drift() -> list[dict[str, object]]:
    return skill_library.drift()


@router.get("/api/skill-library/deploy-log")
def api_skill_library_deploy_log() -> list[dict[str, object]]:
    return skill_library.deploy_log()


@router.get("/api/skill-library/{skill_id:path}")
def api_skill_library_detail(skill_id: str) -> dict[str, object]:
    try:
        return skill_library.get_skill(skill_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.post("/api/skill-library/{skill_id:path}/deploy")
def api_skill_library_deploy(skill_id: str, payload: dict[str, object]) -> dict[str, object]:
    target = payload.get("target")
    if not isinstance(target, str) or not target:
        raise HTTPException(status_code=400, detail="target is required")
    try:
        return skill_library.deploy(skill_id, target)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
