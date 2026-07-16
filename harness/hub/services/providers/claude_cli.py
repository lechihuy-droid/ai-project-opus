from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
import time
from pathlib import Path
from typing import Any, Iterator

import config
from services.providers import procs
from services.providers.base import ChatEvent, ProviderStatus

PROVIDER_ID = "claude"
_STATUS_TTL = 60.0
_status_cache: dict[str, Any] = {"ts": 0.0, "value": None}


def _base_cmd() -> list[str]:
    providers_cfg = getattr(config, "PROVIDERS", {})
    entry = providers_cfg.get("claude", {}) if isinstance(providers_cfg, dict) else {}
    cmd = entry.get("cmd") if isinstance(entry, dict) else None
    if isinstance(cmd, list) and cmd:
        return list(cmd)
    return ["claude"]


def _build_cmd(prompt: str, session_id: str | None) -> list[str]:
    cmd = _base_cmd()
    cmd += [
        "-p",
        prompt,
        "--output-format",
        "stream-json",
        "--verbose",
        "--permission-mode",
        "plan",
        "--disallowed-tools",
        "Edit",
        "--disallowed-tools",
        "Write",
        "--disallowed-tools",
        "Bash",
    ]
    if session_id:
        cmd += ["-r", session_id]
    return cmd


def status() -> ProviderStatus:
    now = time.monotonic()
    cached = _status_cache.get("value")
    if cached is not None and now - float(_status_cache.get("ts") or 0.0) < _STATUS_TTL:
        return cached  # type: ignore[return-value]

    available = False
    version: str | None = None
    detail = "not_installed"
    try:
        result = subprocess.run(
            procs.resolve_cmd([*_base_cmd(), "--version"]),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
            timeout=5,
        )
        if result.returncode == 0:
            available = True
            version = (result.stdout or result.stderr or "").strip() or None
            detail = "ok"
        else:
            detail = (result.stderr or result.stdout or "not_installed").strip() or "not_installed"
    except (OSError, subprocess.TimeoutExpired):
        detail = "not_installed"

    value: ProviderStatus = {
        "id": PROVIDER_ID,
        "available": available,
        "version": version,
        "detail": detail,
        "capabilities": {"stream": True, "resume": True, "models": None},
    }
    _status_cache["ts"] = now
    _status_cache["value"] = value
    return value


def _latest_user_prompt(messages: list[dict[str, str]]) -> str:
    for item in reversed(messages):
        if item.get("role") == "user":
            return item.get("content", "")
    return messages[-1].get("content", "") if messages else ""


def _text_from_assistant(data: dict[str, Any]) -> str:
    message = data.get("message")
    if not isinstance(message, dict):
        return ""
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return ""


def _usage_from_result(data: dict[str, Any]) -> dict[str, int]:
    result_usage = data.get("usage")
    if not isinstance(result_usage, dict):
        return {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    try:
        input_tokens = int(result_usage.get("input_tokens") or 0)
    except (TypeError, ValueError):
        input_tokens = 0
    try:
        output_tokens = int(result_usage.get("output_tokens") or 0)
    except (TypeError, ValueError):
        output_tokens = 0
    return {"input_tokens": input_tokens, "output_tokens": output_tokens, "total_tokens": input_tokens + output_tokens}


def _usage_file() -> Path:
    default = config.HUB_DIR / ".cache" / "chat_usage.jsonl"
    value = getattr(config, "CHAT_USAGE_FILE", default)
    return value if isinstance(value, Path) else default


def _append_usage_event(usage: dict[str, int]) -> None:
    try:
        usage_file = _usage_file()
        usage_file.parent.mkdir(parents=True, exist_ok=True)
        event = {
            "ts": dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z"),
            "source": "chat",
            "model": "cli:claude",
            "input_tokens": usage["input_tokens"],
            "output_tokens": usage["output_tokens"],
            "cache_read_tokens": 0,
            "cache_creation_tokens": 0,
            "total_tokens": usage["total_tokens"],
            "calls": 1,
        }
        with usage_file.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event, separators=(",", ":")) + "\n")
    except OSError:
        pass


def stream_chat(
    messages: list[dict[str, str]],
    session_id: str | None = None,
    model: str | None = None,
) -> Iterator[ChatEvent]:
    prompt = _latest_user_prompt(messages)
    cmd = _build_cmd(prompt, session_id)
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    timeout = float(getattr(config, "CHAT_CLI_TIMEOUT", 300))

    try:
        proc_id = procs.registry.spawn(
            cmd,
            cwd=getattr(config, "ROOT", None),
            env=env,
            timeout=timeout,
            provider=PROVIDER_ID,
            stdin=subprocess.DEVNULL,
        )
    except procs.BusyError as exc:
        yield {"type": "error", "message": str(exc), "code": 429}
        return

    process = procs.registry.get(proc_id)
    if process is None or process.stdout is None:
        procs.registry.unregister(proc_id)
        yield {"type": "error", "message": "claude process failed to start", "code": None}
        return

    usage = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    result_session_id: str | None = session_id
    timed_out = False
    try:
        for raw_line in process.stdout:
            line = raw_line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(data, dict):
                continue
            data_type = data.get("type")
            if data_type == "assistant":
                text = _text_from_assistant(data)
                if text:
                    yield {"type": "delta", "text": text}
            elif data_type == "result":
                usage = _usage_from_result(data)
                sid = data.get("session_id")
                if isinstance(sid, str) and sid:
                    result_session_id = sid
    finally:
        timed_out = procs.registry.is_timed_out(proc_id)
        procs.registry.unregister(proc_id)

    if timed_out:
        yield {"type": "error", "message": f"claude timed out after {int(timeout)}s", "code": None}
        return

    _append_usage_event(usage)
    yield {"type": "done", "usage": usage, "session_id": result_session_id}
