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


def _for_each_ref(ref_prefix: str) -> list[dict[str, str]]:
    raw = _run_git([
        "for-each-ref",
        f"--format=%(refname:short){_SEP}%(committerdate:iso-strict){_SEP}%(contents:subject)",
        ref_prefix,
    ])
    branches: list[dict[str, str]] = []
    for line in raw.splitlines():
        parts = line.split(_SEP)
        if len(parts) != 3 or not parts[0]:
            continue
        name, date, subject = parts
        if name.endswith("/HEAD"):
            continue
        branches.append({"name": name, "last_commit_date": date, "last_commit_subject": subject})
    return branches


def get_local_branches() -> list[dict[str, str]]:
    return _for_each_ref("refs/heads")


def get_remote_branches() -> list[dict[str, str]]:
    return _for_each_ref("refs/remotes/origin")


def get_current_branch() -> str:
    return _run_git(["branch", "--show-current"])


def get_branches() -> dict[str, object]:
    return {
        "local": get_local_branches(),
        "remote": get_remote_branches(),
        "current": get_current_branch(),
    }


def get_worktrees() -> list[dict[str, str]]:
    """Parse `git worktree list --porcelain`. Blocks are separated by a blank
    line; a block can omit `branch` (detached HEAD) or `HEAD` (prunable)."""
    raw = _run_git(["worktree", "list", "--porcelain"])
    worktrees: list[dict[str, str]] = []
    current: dict[str, str] = {}
    for line in raw.splitlines() + [""]:
        if not line.strip():
            if current.get("path"):
                worktrees.append({
                    "path": current.get("path", ""),
                    "head": current.get("head", ""),
                    "branch": current.get("branch", ""),
                })
            current = {}
            continue
        key, _, value = line.partition(" ")
        if key == "worktree":
            current["path"] = value
        elif key == "HEAD":
            current["head"] = value
        elif key == "branch":
            current["branch"] = value.removeprefix("refs/heads/")
    return worktrees


def get_recent_commits(limit: int = 10) -> list[dict[str, str]]:
    raw = _run_git([
        "log",
        f"-n{max(1, min(limit, 100))}",
        f"--format=%H{_SEP}%an{_SEP}%aI{_SEP}%s",
    ])
    commits: list[dict[str, str]] = []
    for line in raw.splitlines():
        parts = line.split(_SEP, 3)
        if len(parts) != 4:
            continue
        sha, author_name, date, subject = parts
        commits.append({"sha": sha, "author_name": author_name, "date": date, "subject": subject})
    return commits
