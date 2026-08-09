from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

import config
from api._shared import _http_error, _sse
from services import behavior, chat_files, execution, replay, runtime_agents, skill_library

router = APIRouter()


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


@router.get("/api/chat/models")
def api_chat_models() -> dict[str, object]:
    return {
        "models": config.CHAT_MODELS,
        "default": config.CHAT_DEFAULT_MODEL,
        "catalog": config.CHAT_MODEL_CATALOG,
    }


@router.post("/api/chat")
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
            messages = [{"role": "system", "content": f"[Tá»‡p Ä‘Ã­nh kÃ¨m cá»§a chat]\n{file_context}"}, *messages]
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
            "allowed_origins": list(agent.get("allowed_origins") or []),
            "allowed_capabilities": list(agent.get("capabilities") or []),
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


@router.get("/api/chats/{chat_id}/files")
def api_chat_files(chat_id: str) -> list[dict[str, object]]:
    try: return chat_files.list_files(chat_id)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.get("/api/chat-files")
def api_all_chat_files() -> list[dict[str, object]]:
    try: return chat_files.list_all_files()
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.post("/api/chats/{chat_id}/files")
async def api_chat_files_upload(chat_id: str, file: UploadFile = File(...)) -> dict[str, object]:
    try: return chat_files.upload(chat_id, file.filename or "", await file.read())
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.get("/api/chats/{chat_id}/files/{name:path}")
def api_chat_file_download(chat_id: str, name: str) -> FileResponse:
    try: return FileResponse(chat_files.download(chat_id, name), filename=Path(name).name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc


@router.delete("/api/chats/{chat_id}/files/{name:path}")
def api_chat_file_delete(chat_id: str, name: str) -> dict[str, bool]:
    try: chat_files.delete(chat_id, name)
    except (FileNotFoundError, PermissionError) as exc: raise _http_error(exc) from exc
    return {"ok": True}


@router.get("/api/sessions")
def api_sessions() -> list[dict[str, object]]:
    return replay.list_sessions()


@router.get("/api/sessions/loops")
def api_session_loops() -> list[dict[str, object]]:
    return behavior.session_loops()


@router.get("/api/sessions/entropy")
def api_session_entropy() -> list[dict[str, object]]:
    return behavior.session_entropy()


@router.get("/api/sessions/{session}/replay")
def api_session_replay(session: str) -> dict[str, object]:
    try:
        return replay.session_replay(session)
    except FileNotFoundError as exc:
        raise _http_error(exc) from exc
