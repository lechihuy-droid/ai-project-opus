"""Data layer for the CI/CD dashboard.

Three sources: local git (subprocess), the GitHub REST API (httpx), and the
filesystem. Every public function degrades to empty data rather than raising —
the dashboard has to render when GitHub is down or no token is configured.
The GitHub token is resolved here and never returned to a caller.
"""
from __future__ import annotations

import subprocess
import threading
import time
from typing import Any

import config
from services import security

_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = threading.Lock()

# Unit separator: git subjects and author names can contain "|" but not \x1f.
_SEP = "\x1f"


def _cache_get(key: str) -> Any | None:
    with _cache_lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        stored_at, value = entry
        if time.time() - stored_at > config.CICD_CACHE_TTL_SECONDS:
            _cache.pop(key, None)
            return None
        return value


def _cache_set(key: str, value: Any) -> None:
    with _cache_lock:
        _cache[key] = (time.time(), value)


def refresh_cache() -> dict[str, object]:
    with _cache_lock:
        _cache.clear()
    return {"ok": True}


def _run_git(args: list[str]) -> str:
    """Run git in the workspace root. Returns stripped stdout, "" on any failure."""
    try:
        result = subprocess.run(
            ["git", "-C", str(config.ROOT), *args],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
            env=security.subprocess_env(),
            check=False,
            timeout=30,
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    if result.returncode != 0:
        return ""
    return (result.stdout or "").strip()


def _gh_cli_token() -> str:
    """Fall back to the gh CLI's token when .env has none."""
    try:
        result = subprocess.run(
            ["gh", "auth", "token"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
            env=security.subprocess_env(),
            check=False,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    return (result.stdout or "").strip() if result.returncode == 0 else ""


def _get_github_token() -> str:
    return config.GITHUB_TOKEN.strip() or _gh_cli_token()


def get_github_token_status() -> dict[str, object]:
    cached = _cache_get("token_status")
    if cached is not None:
        return cached
    token = _get_github_token()
    status: dict[str, object] = (
        {"available": True, "reason": ""}
        if token
        else {"available": False, "reason": "No GITHUB_TOKEN in .env and gh CLI has no token"}
    )
    _cache_set("token_status", status)
    return status
