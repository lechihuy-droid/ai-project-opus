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
    """Serve the shell and hand it the token in a cookie.

    The token used to reach the browser only through a ?k= parameter the user
    pasted, stored in localStorage. localStorage is keyed by origin, so
    127.0.0.1:8799 and localhost:8799 each needed their own paste, and a fresh
    profile or a cleared store silently went back to 403 on every call. Setting
    it here means every origin that can load the page is authenticated the
    moment it does, with nothing to copy.

    HttpOnly keeps page scripts from reading it; SameSite=Strict keeps the
    browser from attaching it to requests started by another site, which is
    what makes an auto-sent credential safe to use here. Non-safe methods are
    still checked against ALLOWED_ORIGINS in the auth guard.
    """
    response = FileResponse(WEB_V3_DIST / "index.html")
    response.set_cookie(
        "hub_token", config.HUB_TOKEN,
        httponly=True, samesite="strict", path="/",
    )
    return response


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


@router.get("/api/workflows/{workflow_id}/folder-grants/check")
def api_folder_grant_check(workflow_id: str, path: str) -> dict[str, object]:
    try:
        resolved = fsbrowse.resolve_workspace_dir(path)
    except (PermissionError, ValueError) as exc:
        raise _http_error(exc, 400) from exc
    grant = governance.find_folder_grant(workflow_id, resolved) if resolved else None
    return {"path": str(resolved), "granted": grant is not None, "grant": grant}


@router.post("/api/workflows/{workflow_id}/folder-grants")
def api_folder_grant_create(workflow_id: str, payload: dict[str, object]) -> dict[str, object]:
    try:
        grant = governance.grant_folder(workflow_id, payload.get("path", ""), str(payload.get("granted_by") or "ui"))
    except (PermissionError, ValueError) as exc:
        raise _http_error(exc, 400) from exc
    return grant


@router.get("/api/folder-grants")
def api_folder_grants() -> list[dict[str, object]]:
    return [{**grant, "exists": Path(str(grant.get("path") or "")).is_dir()} for grant in governance.list_folder_grants()]


@router.delete("/api/workflows/{workflow_id}/folder-grants")
def api_folder_grant_revoke(workflow_id: str, path: str) -> dict[str, bool]:
    return {"ok": governance.revoke_folder_grant(workflow_id, path)}


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
