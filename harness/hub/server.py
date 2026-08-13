from __future__ import annotations
import json, logging, re, secrets, sys, threading, uuid
from contextlib import asynccontextmanager
from pathlib import Path
HUB_DIR = Path(__file__).resolve().parent
if str(HUB_DIR) not in sys.path:
    sys.path.insert(0, str(HUB_DIR))
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response; from fastapi.staticfiles import StaticFiles
import config
from api._shared import _error_code, _http_error
from api.agents import router as agents_router
from api.chat import CHAT_SKILL_MAX_CHARS, _chat_skills, router as chat_router
from api.jobs import router as jobs_router
from api.memory import router as memory_router
from api.runs import router as runs_router
from api.skills import router as skills_router
from api.system import router as system_router
from api.workflows import router as workflows_router
# Tests reach these service objects through the server module; keep whole block.
from services import (
    behavior, artifact_comments, board, chat_files, chat, execution, gitjobs, governance,
    hooks, inspect_evals, integrity, replay, risk, runs, runtime_agents, runtime_artifacts,
    runtime_events, runtime_files, runtime_interrupts, runtime_memory, run_inputs,
    runtime_pipeline, runtime_policy, retention, runtime_skills, search, runtime_state,
    skill_library, suites, trigger, usage, workflow, workflow_exec,
)
from services.providers import list_providers
get_provider = execution.get_provider
@asynccontextmanager
async def lifespan(_app: FastAPI):
    threading.Thread(target=usage.warm, name="usage-warm", daemon=True).start()
    threading.Thread(target=behavior.warm, name="behavior-warm", daemon=True).start()
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
_IDEMPOTENT_COMMANDS = {("POST", "/api/jobs"), ("POST", "/api/agent/runs"), ("POST", "/api/runs/trigger")}
_LOGGER = logging.getLogger(__name__)
def _is_idempotent_command(request: Request) -> bool:
    if (request.method, request.url.path) in _IDEMPOTENT_COMMANDS:
        return True
    return request.method == "POST" and bool(re.fullmatch(
        r"/api/(?:jobs/[^/]+/(?:approve|accept)|memory/candidates/[^/]+/accept|"
        r"(?:agent|workflows)/runs/[^/]+/interrupts/[^/]+/resume|workflows/[^/]+/runs)", request.url.path))
@app.middleware("http")
async def _auth_guard(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or f"corr-{uuid.uuid4().hex}"
    request.state.correlation_id = correlation_id
    path = request.url.path
    # Gate the API, not the shell. The browser cannot attach a header to a
    # top-level navigation or to the <script> it pulls in, so gating index.html
    # and /assets meant the page could never boot and store its token -- every
    # visit answered 403 with JSON. The bundle holds no secrets; the token still
    # guards every /api call the loaded page makes. (The old exemption named
    # /static/, which nothing serves: the mount is /assets, see above.)
    if path.startswith("/api/") and path != "/api/health":
        # The cookie is what makes this work without the user carrying a token
        # around: GET / sets it (see api/system.py), and the browser then sends
        # it on every call from that origin. Header and ?k= stay for curl, for
        # tests, and for the dev server on another port, which shares no cookie.
        provided_token = (
            request.headers.get("X-Hub-Token")
            or request.query_params.get("k")
            or request.cookies.get("hub_token")
            or ""
        )
        if not secrets.compare_digest(provided_token, config.HUB_TOKEN):
            return await _http_exception(request, _http_error(HTTPException(status_code=403, detail="missing hub token")))
    if request.method not in _CSRF_SAFE_METHODS:
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin and not any(origin.startswith(allowed) for allowed in config.ALLOWED_ORIGINS):
            return await _http_exception(request, _http_error(HTTPException(status_code=403, detail="cross-origin blocked")))
    key = request.headers.get("Idempotency-Key")
    cache_key = (request.url.path, key) if key and _is_idempotent_command(request) else None
    if cache_key:
        with _IDEMPOTENCY_LOCK:
            cached = _IDEMPOTENCY_RESULTS.get(cache_key)
        if cached:
            status_code, body, content_type = cached
            response = Response(content=body, status_code=status_code, media_type=content_type)
            response.headers.update({"Idempotency-Replayed": "true", "X-Correlation-ID": correlation_id, "X-Schema-Version": _SCHEMA_VERSION})
            return response
    response = await call_next(request)
    response.headers.update({"X-Correlation-ID": correlation_id, "X-Schema-Version": _SCHEMA_VERSION})
    if response.media_type == "text/event-stream":
        response.body_iterator = _correlated_sse(response.body_iterator, correlation_id)
    if cache_key and response.status_code < 500:
        response.body_iterator = _cache_response(response.body_iterator, cache_key, response.status_code, response.media_type or "application/json")
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
    error: dict[str, object] = {"code": structured["code"] if structured else _error_code(normalized.status_code), "message": detail, "correlation_id": correlation_id}
    if structured and structured.get("details") is not None:
        error["details"] = structured["details"]
    return JSONResponse(status_code=normalized.status_code, content={"detail": detail, "schema_version": 1, "error": error}, headers={"X-Correlation-ID": correlation_id, "X-Schema-Version": _SCHEMA_VERSION})
@app.exception_handler(Exception)
async def _unexpected_exception(request: Request, exc: Exception) -> JSONResponse:
    return await _http_exception(request, _http_error(exc))
@app.exception_handler(RequestValidationError)
async def _validation_exception(request: Request, _exc: RequestValidationError) -> JSONResponse:
    return await _http_exception(request, _http_error(HTTPException(status_code=422, detail="Invalid request")))
app.include_router(system_router)
app.include_router(jobs_router)
app.include_router(agents_router)
app.include_router(memory_router)
app.include_router(workflows_router)
app.include_router(skills_router)
app.include_router(runs_router)
app.include_router(chat_router)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=config.PORT)
