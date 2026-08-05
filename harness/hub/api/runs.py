from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse, StreamingResponse

from api._shared import _http_error
from services import artifact_comments, runs, runtime_artifacts, runtime_files, suites, trigger

router = APIRouter()


@router.get("/api/runs")
def api_runs() -> list[dict[str, object]]:
    return runs.list_runs()


@router.post("/api/runs/trigger")
def api_trigger(payload: dict[str, object]) -> dict[str, str]:
    suite = payload.get("suite")
    check = payload.get("check")
    if not isinstance(suite, str) or not suite:
        raise HTTPException(status_code=400, detail="suite is required")
    if check is not None and not isinstance(check, str):
        raise HTTPException(status_code=400, detail="check must be a string")
    try:
        stream_id = trigger.start_run(suite, check)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OSError as exc:
        raise _http_error(exc) from exc
    return {"stream_id": stream_id}


@router.get("/api/runs/stream/{stream_id}")
def api_run_stream(stream_id: str) -> StreamingResponse:
    try:
        return StreamingResponse(trigger.stream_events(stream_id), media_type="text/event-stream")
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc


@router.get("/api/runs/budget/{stream_id}")
def api_run_budget(stream_id: str) -> dict[str, object]:
    try:
        return trigger.budget_status(stream_id)
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc


@router.get("/api/runs/compare")
def api_run_compare(a: str = Query(..., min_length=1), b: str = Query(..., min_length=1)) -> dict[str, object]:
    try:
        return runs.compare_runs(a, b)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/runs/{run_id}")
def api_run(run_id: str) -> dict[str, object]:
    try:
        return runs.get_run(run_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/runs/{run_id}/artifact")
def api_run_artifact(run_id: str, rel: str = Query(..., min_length=1)) -> PlainTextResponse:
    try:
        return PlainTextResponse(runs.read_artifact(run_id, rel), media_type="text/plain; charset=utf-8")
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/suites")
def api_suites() -> list[dict[str, object]]:
    return suites.list_suites()


@router.get("/api/suites/{suite_id}")
def api_suite(suite_id: str) -> dict[str, object]:
    try:
        return suites.get_suite(suite_id)
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc


@router.get("/api/runs/{run_id}/files")
def api_run_files(run_id: str) -> list[dict[str, object]]:
    try: return runtime_files.list_files(run_id)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.post("/api/runs/{run_id}/files")
async def api_run_files_upload(run_id: str, file: UploadFile = File(...)) -> dict[str, object]:
    try: return runtime_files.upload(run_id, file.filename or "", await file.read())
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.get("/api/runs/{run_id}/files/{name:path}")
def api_run_file_download(run_id: str, name: str) -> FileResponse:
    try: return FileResponse(runtime_files.download(run_id, name), filename=Path(name).name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.delete("/api/runs/{run_id}/files/{name:path}")
def api_run_file_delete(run_id: str, name: str) -> dict[str, bool]:
    try: runtime_files.delete(run_id, name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc
    return {"ok": True}


@router.get("/api/artifacts")
def api_artifacts() -> dict[str, object]:
    try:
        return {"artifacts": runtime_artifacts.list_library_artifacts()}
    except (PermissionError, ValueError) as exc:
        raise _http_error(exc) from exc


@router.get("/api/artifacts/{artifact_id}")
def api_artifact(artifact_id: str) -> dict[str, object]:
    try:
        return runtime_artifacts.read_library_artifact(artifact_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise HTTPException(status_code=404) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/artifacts")
def api_artifact_save(payload: dict[str, object]) -> dict[str, object]:
    artifact_id = payload.get("id")
    title = payload.get("title")
    content = payload.get("content")
    source = payload.get("source")
    if artifact_id is not None and not isinstance(artifact_id, str):
        raise HTTPException(status_code=400, detail="id must be a string")
    if title is not None and not isinstance(title, str):
        raise HTTPException(status_code=400, detail="title must be a string")
    if not isinstance(content, str):
        raise HTTPException(status_code=400, detail="content must be a string")
    if not isinstance(source, str):
        raise HTTPException(status_code=400, detail="source must be a string")
    try:
        return runtime_artifacts.save_library_artifact(artifact_id, title, content, source)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _require_artifact(artifact_id: str) -> None:
    runtime_artifacts.read_library_artifact(artifact_id)


@router.get("/api/artifacts/{artifact_id}/comments")
def api_artifact_comments(artifact_id: str) -> dict[str, object]:
    try:
        _require_artifact(artifact_id)
        return {"comments": artifact_comments.list_comments(artifact_id)}
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/artifacts/{artifact_id}/comments")
def api_artifact_comment_create(artifact_id: str, payload: dict[str, object]) -> dict[str, object]:
    quoted_text, author, body = payload.get("quoted_text"), payload.get("author"), payload.get("body")
    if not all(isinstance(value, str) for value in (quoted_text, author, body)):
        raise HTTPException(status_code=400, detail="quoted_text, author and body must be strings")
    try:
        _require_artifact(artifact_id)
        return artifact_comments.create(artifact_id, quoted_text, author, body)
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/api/artifacts/{artifact_id}/comments/{comment_id}")
def api_artifact_comment_resolve(artifact_id: str, comment_id: str, payload: dict[str, object]) -> dict[str, object]:
    resolved = payload.get("resolved")
    if not isinstance(resolved, bool): raise HTTPException(status_code=400, detail="resolved must be a boolean")
    try:
        _require_artifact(artifact_id)
        return artifact_comments.resolve(artifact_id, comment_id, resolved)
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/api/artifacts/{artifact_id}/comments/{comment_id}")
def api_artifact_comment_delete(artifact_id: str, comment_id: str) -> dict[str, bool]:
    try:
        _require_artifact(artifact_id)
        artifact_comments.delete(artifact_id, comment_id)
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}
