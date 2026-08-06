from __future__ import annotations

from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response

import config
from api._shared import _http_error
from services import behavior, board, fsbrowse, governance, inspect_evals, integrity, runtime_policy, usage
from services.providers import list_providers

router = APIRouter()

WEB_V3_DIST = Path(__file__).resolve().parent.parent / "web-v3" / "dist"


@router.get("/")
def index() -> FileResponse:
    return FileResponse(WEB_V3_DIST / "index.html")


@router.get("/api/health")
def health() -> dict[str, object]:
    return {
        "ok": True,
        "root": str(config.ROOT),
        "runs_dir": str(config.RUNS_DIR),
        "port": config.PORT,
    }


@router.get("/api/fs/drives")
def api_fs_drives() -> list[str]:
    return fsbrowse.list_drives()


@router.get("/api/fs/dirs")
def api_fs_dirs(path: str | None = None, show_hidden: bool = False) -> dict[str, object]:
    try:
        return fsbrowse.list_dirs(path, show_hidden=show_hidden)
    except (PermissionError, ValueError) as exc:
        raise _http_error(exc, 400) from exc


@router.get("/api/guardrails/decisions")
def api_guardrail_decisions() -> list[dict[str, object]]:
    return runtime_policy.list_decisions()


@router.post("/api/guardrails/decisions/command")
def api_guardrail_command_decision(payload: dict[str, object]) -> dict[str, object]:
    subject_id = str(payload.get("subject_id") or "manual")
    command = payload.get("command")
    return runtime_policy.decide_command(subject_id, command)


@router.get("/api/integrity")
def api_integrity() -> dict[str, object]:
    results = integrity.verify_suites()
    return {
        "ok": all(bool(item.get("ok")) for item in results),
        "suites": results,
        "count": len(results),
    }


@router.get("/api/governance")
def api_governance() -> dict[str, object]:
    return governance.status()


@router.get("/api/usage")
def api_usage(
    source: str | None = None,
    model: str | None = None,
    since: str | None = None,
) -> list[dict[str, object]]:
    try:
        return usage.collect_usage({"source": source, "model": model, "since": since})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/usage/rollup")
def api_usage_rollup(
    source: str | None = None,
    model: str | None = None,
    since: str | None = None,
) -> dict[str, object]:
    try:
        events = usage.collect_usage({"source": source, "model": model, "since": since})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return usage.rollup(events)


@router.get("/api/inspect/logs")
def api_inspect_logs() -> list[dict[str, object]]:
    return inspect_evals.list_logs()


@router.get("/api/inspect/mep")
def api_inspect_mep() -> dict[str, object]:
    try:
        return inspect_evals.latest_mep()
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/api/usage/cockpit")
def api_usage_cockpit() -> dict[str, object]:
    stats = usage.cockpit_stats()
    stats["providers_online"] = [
        {"id": provider["id"], "available": provider["available"]}
        for provider in list_providers()
    ]
    return stats


@router.api_route("/api/vgov/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def api_vgov_proxy(path: str, request: Request) -> Response:
    """Keep Version Governance behind the Hub control-plane boundary.

    vgov-api mounts every functional router under /api/vgov, so the prefix must be preserved.
    Forwarding to /{path} only ever resolved /health and 404'd everything else.
    """
    target = f"{config.VGOV_BASE_URL.rstrip('/')}/api/vgov/{path}"
    headers = {name: value for name, value in request.headers.items()
               if name.lower() in {"x-actor", "content-type"}}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            upstream = await client.request(
                request.method, target, params=request.query_params,
                content=await request.body(), headers=headers,
            )
    except (httpx.ConnectError, httpx.TimeoutException):
        return JSONResponse(
            status_code=502,
            content={"error": {"code": "RUNTIME_UNAVAILABLE", "message": "Version Governance API is unavailable"}},
        )
    content_type = upstream.headers.get("content-type")
    return Response(content=upstream.content, status_code=upstream.status_code, media_type=content_type)


@router.get("/api/board")
def api_board() -> dict[str, object]:
    return board.task_board()
