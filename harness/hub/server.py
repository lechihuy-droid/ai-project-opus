from __future__ import annotations

import json
import logging
import re
import sys
import threading
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import httpx


HUB_DIR = Path(__file__).resolve().parent
if str(HUB_DIR) not in sys.path:
    sys.path.insert(0, str(HUB_DIR))

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles

from api._shared import _check_if_match, _error_code, _etag, _http_error, _safe_error_message, _sse
from api.system import router as system_router
from api.memory import router as memory_router
from api.agents import router as agents_router
from api.jobs import router as jobs_router

import config
from services import (
    behavior,
    artifact_comments,
    board,
    chat_files,
    chat,
    execution,
    gitjobs,
    governance,
    hooks,
    inspect_evals,
    integrity,
    replay,
    risk,
    runs,
    runtime_agents,
    runtime_artifacts,
    runtime_events,
    runtime_files,
    runtime_interrupts,
    runtime_memory,
    run_inputs,
    runtime_pipeline,
    runtime_policy,
    retention,
    runtime_skills,
    search,
    runtime_state,
    skill_library,
    suites,
    trigger,
    usage,
    workflow,
    workflow_exec,
)
from services.providers import list_providers

# Compatibility for existing in-process callers; API chat execution uses services.execution.
get_provider = execution.get_provider


@asynccontextmanager
async def lifespan(_app: FastAPI):
    threading.Thread(target=usage.warm, name="usage-warm", daemon=True).start()
    threading.Thread(target=behavior.warm, name="behavior-warm", daemon=True).start()
    # The first skill-library call parses the telemetry log and walks every skill
    # source, so without this the Skills metric sits in its skeleton for seconds
    # after each restart while the rest of the dashboard has already resolved.
    threading.Thread(target=skill_library.list_skills, name="skills-warm", daemon=True).start()
    threading.Thread(target=list_providers, name="providers-warm", daemon=True).start()
    try:
        gitjobs.reconcile_orphans()
    except Exception:
        pass
    try:
        retention.sweep()
    except Exception:
        pass
    yield
    try:
        from services.providers import procs

        procs.kill_all()
    except Exception:
        pass


app = FastAPI(title="Harness Hub", lifespan=lifespan)
WEB_V3_DIST = HUB_DIR / "web-v3" / "dist"
if WEB_V3_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(WEB_V3_DIST / "assets")), name="assets-v3")

_CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
_SCHEMA_VERSION = "1"
_IDEMPOTENCY_LOCK = threading.Lock()
_IDEMPOTENCY_RESULTS: dict[tuple[str, str], tuple[int, bytes, str]] = {}
_IDEMPOTENT_COMMANDS = {
    ("POST", "/api/jobs"),
    ("POST", "/api/agent/runs"),
    ("POST", "/api/runs/trigger"),
}
_LOGGER = logging.getLogger(__name__)


def _is_idempotent_command(request: Request) -> bool:
    if (request.method, request.url.path) in _IDEMPOTENT_COMMANDS:
        return True
    return request.method == "POST" and bool(re.fullmatch(
        r"/api/(?:jobs/[^/]+/(?:approve|accept)|memory/candidates/[^/]+/accept|"
        r"(?:agent|workflows)/runs/[^/]+/interrupts/[^/]+/resume|workflows/[^/]+/runs)",
        request.url.path,
    ))


@app.middleware("http")
async def _csrf_guard(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or f"corr-{uuid.uuid4().hex}"
    request.state.correlation_id = correlation_id
    if request.method not in _CSRF_SAFE_METHODS:
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin and not any(origin.startswith(allowed) for allowed in config.ALLOWED_ORIGINS):
            return await _http_exception(request, _http_error(HTTPException(status_code=403, detail="cross-origin blocked")))
        if request.headers.get(config.HUB_CLIENT_HEADER) != config.HUB_CLIENT_VALUE:
            return await _http_exception(request, _http_error(HTTPException(status_code=403, detail="missing hub client header")))
    key = request.headers.get("Idempotency-Key")
    cache_key = (request.url.path, key) if key and _is_idempotent_command(request) else None
    if cache_key:
        with _IDEMPOTENCY_LOCK:
            cached = _IDEMPOTENCY_RESULTS.get(cache_key)
        if cached:
            status_code, body, content_type = cached
            response = Response(content=body, status_code=status_code, media_type=content_type)
            response.headers["Idempotency-Replayed"] = "true"
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Schema-Version"] = _SCHEMA_VERSION
            return response
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Schema-Version"] = _SCHEMA_VERSION
    if response.media_type == "text/event-stream":
        response.body_iterator = _correlated_sse(response.body_iterator, correlation_id)
    if cache_key and response.status_code < 500:
        response.body_iterator = _cache_response(response.body_iterator, cache_key, response.status_code, response.media_type or "application/json")
    # SPA assets change on every deploy; force revalidation so the browser
    # never runs stale app.js/workspace.js against a newer backend.
    if request.url.path == "/" or request.url.path.startswith("/static"):
        response.headers["Cache-Control"] = "no-cache"
    _LOGGER.info("api_request correlation_id=%s method=%s path=%s status=%s", correlation_id, request.method, request.url.path, response.status_code)
    return response


async def _cache_response(iterator, cache_key: tuple[str, str], status_code: int, content_type: str):
    body: list[bytes] = []
    async for chunk in iterator:
        value = chunk.encode("utf-8") if isinstance(chunk, str) else chunk
        body.append(value)
        yield value
    with _IDEMPOTENCY_LOCK:
        _IDEMPOTENCY_RESULTS.setdefault(cache_key, (status_code, b"".join(body), content_type))


async def _correlated_sse(iterator, correlation_id: str):
    async for chunk in iterator:
        text = chunk.decode("utf-8") if isinstance(chunk, bytes) else chunk
        def decorate(match):
            try:
                data = json.loads(match.group(1))
            except (TypeError, ValueError):
                return match.group(0)
            if not isinstance(data, dict):
                return match.group(0)
            data.setdefault("schema_version", 1)
            data.setdefault("correlation_id", correlation_id)
            return f"data: {json.dumps(data, ensure_ascii=False)}"
        yield re.sub(r"data: (\{[^\n]*\})", decorate, text)


@app.exception_handler(HTTPException)
async def _http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    normalized = _http_error(exc)
    correlation_id = getattr(request.state, "correlation_id", f"corr-{uuid.uuid4().hex}")
    structured = normalized.detail if isinstance(normalized.detail, dict) else None
    detail = str(structured["message"] if structured else normalized.detail)
    error: dict[str, object] = {
        "code": structured["code"] if structured else _error_code(normalized.status_code),
        "message": detail, "correlation_id": correlation_id,
    }
    if structured and structured.get("details") is not None:
        error["details"] = structured["details"]
    return JSONResponse(
        status_code=normalized.status_code,
        content={"detail": detail, "schema_version": 1, "error": error},
        headers={"X-Correlation-ID": correlation_id, "X-Schema-Version": _SCHEMA_VERSION},
    )


@app.exception_handler(Exception)
async def _unexpected_exception(request: Request, exc: Exception) -> JSONResponse:
    return await _http_exception(request, _http_error(exc))


@app.exception_handler(RequestValidationError)
async def _validation_exception(request: Request, _exc: RequestValidationError) -> JSONResponse:
    return await _http_exception(request, _http_error(HTTPException(status_code=422, detail="Invalid request")))


def _chat_messages(value: object) -> list[dict[str, str]]:
    if not isinstance(value, list):
        raise HTTPException(status_code=400, detail="messages must be a list")
    messages: list[dict[str, str]] = []
    for item in value:
        if not isinstance(item, dict):
            raise HTTPException(status_code=400, detail="messages must contain objects")
        role = item.get("role")
        content = item.get("content")
        if role not in {"user", "assistant"}:
            raise HTTPException(status_code=400, detail="message role must be user or assistant")
        if not isinstance(content, str):
            raise HTTPException(status_code=400, detail="message content must be a string")
        messages.append({"role": role, "content": content})
    if not messages:
        raise HTTPException(status_code=400, detail="messages is required")
    return messages


CHAT_SKILL_MAX_CHARS = skill_library.SKILL_PROMPT_MAX_CHARS


def _chat_skills(value: object) -> tuple[list[str], bool]:
    if value is None:
        return [], False
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise HTTPException(status_code=400, detail="skills must be a list of skill names")

    requested = [item for item in value if item]
    known = skill_library.list_skill_names()
    unknown = next((name for name in requested if name not in known), None)
    if unknown is not None:
        raise HTTPException(status_code=400, detail=f"Unknown skill: {unknown}")

    contents, truncated, _missing = skill_library.load_skill_prompt_contents(requested)
    return contents, truncated


def _system_prompt_with_skills(system_prompt: str | None, contents: list[str]) -> str | None:
    return skill_library.system_prompt_with_skills(system_prompt, contents)


app.include_router(system_router)
app.include_router(jobs_router)
app.include_router(agents_router)
app.include_router(memory_router)


@app.get("/api/chat/models")
def api_chat_models() -> dict[str, object]:
    return {
        "models": config.CHAT_MODELS,
        "default": config.CHAT_DEFAULT_MODEL,
        "catalog": config.CHAT_MODEL_CATALOG,
    }


@app.post("/api/chat")
def api_chat(payload: dict[str, object]) -> StreamingResponse:
    agent_id = payload.get("agent_id")
    if agent_id is not None and not isinstance(agent_id, str):
        raise HTTPException(status_code=400, detail="agent_id must be a string")
    agent: dict[str, object] | None = None
    if agent_id:
        try:
            agent = runtime_agents.get_agent(agent_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_id}") from exc

    provider_id = (agent["provider"] if agent else payload.get("provider")) or "nvidia"
    if not isinstance(provider_id, str):
        raise HTTPException(status_code=400, detail="provider must be a string")
    messages = _chat_messages(payload.get("messages"))
    chat_id = payload.get("chat_id")
    if chat_id is not None and not isinstance(chat_id, str):
        raise HTTPException(status_code=400, detail="chat_id must be a string")
    if chat_id:
        try:
            file_context = chat_files.context(chat_id)
        except (FileNotFoundError, PermissionError) as exc:
            raise _http_error(exc) from exc
        if file_context:
            messages = [{"role": "system", "content": f"[Tệp đính kèm của chat]\n{file_context}"}, *messages]
    model = runtime_agents.resolve_provider(agent)["model"] if agent else payload.get("model")
    if agent and model is None:
        model = payload.get("model")
    if model is not None and not isinstance(model, str):
        raise HTTPException(status_code=400, detail="model must be a string")
    session_id = payload.get("session_id")
    if session_id is not None and not isinstance(session_id, str):
        raise HTTPException(status_code=400, detail="session_id must be a string")
    system_prompt = agent.get("system_prompt") if agent else None
    if system_prompt is not None and not isinstance(system_prompt, str):
        raise HTTPException(status_code=400, detail="agent system_prompt must be a string")
    skill_contents, skills_truncated = _chat_skills(payload.get("skills"))
    system_prompt = _system_prompt_with_skills(system_prompt, skill_contents)
    skill_notice = "Một phần nội dung skill đã bị cắt do giới hạn prompt." if skills_truncated else None

    tool_policy = (
        {
            "permission": agent["permission"],
            "allowed_tools": list(agent.get("allowed_tools") or []),
            "allowed_paths": list(agent.get("allowed_paths") or []),
        }
        if agent
        else None
    )
    request = execution.ExecutionRequest(
        correlation_id=session_id or "chat", provider_id=provider_id, model=model, messages=messages,
        session_id=session_id, system_prompt=system_prompt, tool_policy=tool_policy,
    )
    route = execution.gateway(request)
    if route.error is not None:
        raise HTTPException(status_code=400, detail=route.error.message)

    def events():
        try:
            for item in execution.execute(request, result=route):
                item_type = item.get("type")
                if item_type == "reasoning":
                    yield _sse("reasoning", {"text": item.get("text", "")})
                elif item_type == "delta":
                    yield _sse("delta", {"text": item.get("text", "")})
                elif item_type in {"tool_call", "tool_result"}:
                    yield _sse(item_type, {key: value for key, value in item.items() if key != "type"})
                elif item_type == "done":
                    done_payload: dict[str, object] = {
                        "usage": item.get("usage", {}),
                        "model": item.get("model") or model or provider_id,
                        "session_id": item.get("session_id"),
                    }
                    if skill_notice:
                        done_payload["skill_notice"] = skill_notice
                    yield _sse("done", done_payload)
                elif item_type == "error":
                    yield _sse("error", {"message": item.get("message", ""), "code": item.get("code")})
        except Exception:
            yield _sse("error", {"message": "Chat stream error", "code": None})

    return StreamingResponse(events(), media_type="text/event-stream")


@app.get("/api/skills")
def api_skills() -> list[dict[str, object]]:
    return runtime_skills.list_skills()


@app.get("/api/search")
def api_search(q: str = "") -> list[dict[str, str]]:
    return search.search(q)


@app.get("/api/skills/names")
def api_skill_names() -> list[str]:
    return sorted(skill_library.list_skill_names())


@app.get("/api/skills/{skill_id}/usage")
def api_skill_usage(skill_id: str) -> dict[str, object]:
    try:
        return runtime_skills.skill_usage(skill_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@app.get("/api/skills/{skill_id}")
def api_skill(skill_id: str) -> dict[str, object]:
    try:
        return runtime_skills.get_skill(skill_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@app.get("/api/runs")
def api_runs() -> list[dict[str, object]]:
    return runs.list_runs()


@app.post("/api/runs/trigger")
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


@app.get("/api/runs/stream/{stream_id}")
def api_run_stream(stream_id: str) -> StreamingResponse:
    try:
        return StreamingResponse(trigger.stream_events(stream_id), media_type="text/event-stream")
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc


@app.get("/api/runs/budget/{stream_id}")
def api_run_budget(stream_id: str) -> dict[str, object]:
    try:
        return trigger.budget_status(stream_id)
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc


@app.get("/api/runs/compare")
def api_run_compare(a: str = Query(..., min_length=1), b: str = Query(..., min_length=1)) -> dict[str, object]:
    try:
        return runs.compare_runs(a, b)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@app.get("/api/runs/{run_id}")
def api_run(run_id: str) -> dict[str, object]:
    try:
        return runs.get_run(run_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@app.get("/api/runs/{run_id}/artifact")
def api_run_artifact(run_id: str, rel: str = Query(..., min_length=1)) -> PlainTextResponse:
    try:
        return PlainTextResponse(runs.read_artifact(run_id, rel), media_type="text/plain; charset=utf-8")
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@app.get("/api/suites")
def api_suites() -> list[dict[str, object]]:
    return suites.list_suites()


@app.get("/api/suites/{suite_id}")
def api_suite(suite_id: str) -> dict[str, object]:
    try:
        return suites.get_suite(suite_id)
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc


@app.get("/api/tools")
@app.get("/api/tools/usage")
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


@app.get("/api/skill-library")
def api_skill_library() -> list[dict[str, object]]:
    return skill_library.list_skills()


@app.post("/api/skill-library")
def api_skill_library_create(payload: dict[str, object]) -> dict[str, object]:
    try: return skill_library.create_skill(payload)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put("/api/skill-library/{skill_id:path}")
def api_skill_library_update(skill_id: str, payload: dict[str, object]) -> dict[str, object]:
    try: return skill_library.update_skill(skill_id, payload)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.delete("/api/skill-library/{skill_id:path}")
def api_skill_library_delete(skill_id: str) -> dict[str, bool]:
    try: skill_library.delete_skill(skill_id)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc
    return {"ok": True}


@app.get("/api/skill-library/drift")
def api_skill_library_drift() -> list[dict[str, object]]:
    return skill_library.drift()


@app.get("/api/skill-library/deploy-log")
def api_skill_library_deploy_log() -> list[dict[str, object]]:
    return skill_library.deploy_log()


@app.get("/api/skill-library/{skill_id:path}")
def api_skill_library_detail(skill_id: str) -> dict[str, object]:
    try:
        return skill_library.get_skill(skill_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@app.post("/api/skill-library/{skill_id:path}/deploy")
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


@app.get("/api/runs/{run_id}/files")
def api_run_files(run_id: str) -> list[dict[str, object]]:
    try: return runtime_files.list_files(run_id)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.post("/api/runs/{run_id}/files")
async def api_run_files_upload(run_id: str, file: UploadFile = File(...)) -> dict[str, object]:
    try: return runtime_files.upload(run_id, file.filename or "", await file.read())
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.get("/api/runs/{run_id}/files/{name:path}")
def api_run_file_download(run_id: str, name: str) -> FileResponse:
    try: return FileResponse(runtime_files.download(run_id, name), filename=Path(name).name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.delete("/api/runs/{run_id}/files/{name:path}")
def api_run_file_delete(run_id: str, name: str) -> dict[str, bool]:
    try: runtime_files.delete(run_id, name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc
    return {"ok": True}


@app.get("/api/chats/{chat_id}/files")
def api_chat_files(chat_id: str) -> list[dict[str, object]]:
    try: return chat_files.list_files(chat_id)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.get("/api/chat-files")
def api_all_chat_files() -> list[dict[str, object]]:
    try: return chat_files.list_all_files()
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.post("/api/chats/{chat_id}/files")
async def api_chat_files_upload(chat_id: str, file: UploadFile = File(...)) -> dict[str, object]:
    try: return chat_files.upload(chat_id, file.filename or "", await file.read())
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.get("/api/chats/{chat_id}/files/{name:path}")
def api_chat_file_download(chat_id: str, name: str) -> FileResponse:
    try: return FileResponse(chat_files.download(chat_id, name), filename=Path(name).name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@app.delete("/api/chats/{chat_id}/files/{name:path}")
def api_chat_file_delete(chat_id: str, name: str) -> dict[str, bool]:
    try: chat_files.delete(chat_id, name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc
    return {"ok": True}


# --- C2a workflow routes ---
@app.get("/api/workflows")
def api_workflows() -> list[dict[str, object]]:
    return workflow.list_workflows()


@app.post("/api/workflows", status_code=201)
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


@app.get("/api/workflows/{workflow_id}/layout")
def api_workflow_layout(workflow_id: str, response: Response) -> dict[str, object]:
    try:
        response.headers["ETag"] = _etag(workflow.workflow_layout_path(workflow_id).read_bytes()) if workflow.workflow_layout_path(workflow_id).exists() else '"empty"'
        return {"nodes": workflow.read_layout(workflow_id)}
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put("/api/workflows/{workflow_id}/layout")
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


@app.put("/api/workflows/{workflow_id}/model")
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


@app.get("/api/workflows/{workflow_id}/source")
def api_workflow_source(workflow_id: str, response: Response) -> dict[str, str]:
    try:
        path = workflow.workflow_path(workflow_id)
        response.headers["ETag"] = _etag(path.read_bytes())
        return {"id": workflow_id, "yaml_text": path.read_text(encoding="utf-8")}
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc


@app.post("/api/workflows/validate")
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


@app.put("/api/workflows/{workflow_id}")
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


@app.delete("/api/workflows/{workflow_id}")
def api_workflow_delete(workflow_id: str) -> dict[str, bool]:
    try:
        workflow.delete_workflow(workflow_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise _http_error(exc) from exc
    return {"ok": True}


# --- end C2a workflow routes ---


# --- C2b workflow run routes ---
@app.post("/api/workflows/{workflow_id}/runs", response_model=None)
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


@app.get("/api/workflows/runs/{run_id}/artifacts")
def api_workflow_run_artifacts(run_id: str) -> dict[str, object]:
    try:
        return {"artifacts": runtime_artifacts.list_artifacts(run_id)}
    except (FileNotFoundError, PermissionError) as exc:
        raise HTTPException(status_code=404) from exc


@app.get("/api/workflows/runs/{run_id}/artifacts/{name}")
def api_workflow_run_artifact(run_id: str, name: str) -> dict[str, str]:
    try:
        return {"name": name, "text": runtime_artifacts.read_artifact(run_id, name)}
    except (FileNotFoundError, PermissionError) as exc:
        raise HTTPException(status_code=404) from exc


@app.post("/api/workflows/runs/{run_id}/interrupts/{interrupt_id}/resume")
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
# --- end C2b workflow run routes ---


@app.get("/api/artifacts")
def api_artifacts() -> dict[str, object]:
    try:
        return {"artifacts": runtime_artifacts.list_library_artifacts()}
    except (PermissionError, ValueError) as exc:
        raise _http_error(exc) from exc


@app.get("/api/artifacts/{artifact_id}")
def api_artifact(artifact_id: str) -> dict[str, object]:
    try:
        return runtime_artifacts.read_library_artifact(artifact_id)
    except (FileNotFoundError, PermissionError) as exc:
        raise HTTPException(status_code=404) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/artifacts")
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


@app.get("/api/artifacts/{artifact_id}/comments")
def api_artifact_comments(artifact_id: str) -> dict[str, object]:
    try:
        _require_artifact(artifact_id)
        return {"comments": artifact_comments.list_comments(artifact_id)}
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/artifacts/{artifact_id}/comments")
def api_artifact_comment_create(artifact_id: str, payload: dict[str, object]) -> dict[str, object]:
    quoted_text, author, body = payload.get("quoted_text"), payload.get("author"), payload.get("body")
    if not all(isinstance(value, str) for value in (quoted_text, author, body)):
        raise HTTPException(status_code=400, detail="quoted_text, author and body must be strings")
    try:
        _require_artifact(artifact_id)
        return artifact_comments.create(artifact_id, quoted_text, author, body)
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.patch("/api/artifacts/{artifact_id}/comments/{comment_id}")
def api_artifact_comment_resolve(artifact_id: str, comment_id: str, payload: dict[str, object]) -> dict[str, object]:
    resolved = payload.get("resolved")
    if not isinstance(resolved, bool): raise HTTPException(status_code=400, detail="resolved must be a boolean")
    try:
        _require_artifact(artifact_id)
        return artifact_comments.resolve(artifact_id, comment_id, resolved)
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete("/api/artifacts/{artifact_id}/comments/{comment_id}")
def api_artifact_comment_delete(artifact_id: str, comment_id: str) -> dict[str, bool]:
    try:
        _require_artifact(artifact_id)
        artifact_comments.delete(artifact_id, comment_id)
    except FileNotFoundError as exc: raise HTTPException(status_code=404) from exc
    except (PermissionError, ValueError) as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}


@app.get("/api/sessions")
def api_sessions() -> list[dict[str, object]]:
    return replay.list_sessions()


@app.get("/api/sessions/loops")
def api_session_loops() -> list[dict[str, object]]:
    return behavior.session_loops()


@app.get("/api/sessions/entropy")
def api_session_entropy() -> list[dict[str, object]]:
    return behavior.session_entropy()


@app.get("/api/sessions/{session}/replay")
def api_session_replay(session: str) -> dict[str, object]:
    try:
        return replay.session_replay(session)
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=config.PORT)
