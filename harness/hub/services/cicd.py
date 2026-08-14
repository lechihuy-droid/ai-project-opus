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
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx

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


def _github_get(path: str, params: dict[str, str | int] | None = None) -> Any | None:
    """GET https://api.github.com/repos/{owner}/{repo}{path}. Returns parsed
    JSON, or None for any failure (no token, 4xx/5xx, timeout, bad JSON)."""
    token = _get_github_token()
    if not token:
        return None
    url = f"{config.GITHUB_API_BASE}/repos/{config.GITHUB_OWNER}/{config.GITHUB_REPO}{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url, params=params, headers=headers)
            if response.status_code >= 400:
                return None
            return response.json()
    except Exception:  # noqa: BLE001 - dashboard must render regardless
        return None


def _parse_iso(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _run_duration_seconds(run: dict[str, Any]) -> float | None:
    started = _parse_iso(str(run.get("created_at") or ""))
    finished = _parse_iso(str(run.get("updated_at") or ""))
    if started is None or finished is None or run.get("status") != "completed":
        return None
    return (finished - started).total_seconds()


def get_workflows() -> list[dict[str, object]]:
    cached = _cache_get("workflows")
    if cached is not None:
        return cached
    payload = _github_get("/actions/workflows", {"per_page": 100})
    items = (payload or {}).get("workflows", []) if isinstance(payload, dict) else []
    workflows = [
        {
            "id": str(item.get("id", "")),
            "name": str(item.get("name", "")),
            "path": str(item.get("path", "")),
            "state": str(item.get("state", "")),
            "updated_at": str(item.get("updated_at", "")),
        }
        for item in items
    ]
    _cache_set("workflows", workflows)
    return workflows


def get_workflow_runs(workflow_id: str = "", per_page: int = 30) -> list[dict[str, object]]:
    per_page = max(1, min(per_page, 100))
    cache_key = f"runs:{workflow_id}:{per_page}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    path = f"/actions/workflows/{workflow_id}/runs" if workflow_id else "/actions/runs"
    payload = _github_get(path, {"per_page": per_page})
    items = (payload or {}).get("workflow_runs", []) if isinstance(payload, dict) else []
    runs = [
        {
            "id": str(item.get("id", "")),
            "name": str(item.get("name") or ""),
            "status": str(item.get("status") or ""),
            "conclusion": str(item.get("conclusion") or ""),
            "branch": str(item.get("head_branch") or ""),
            "duration_seconds": _run_duration_seconds(item),
            "created_at": str(item.get("created_at") or ""),
            "html_url": str(item.get("html_url") or ""),
        }
        for item in items
    ]
    _cache_set(cache_key, runs)
    return runs


_TEST_GLOBS = ("*test*.py", "*.test.ts", "*.test.tsx")


def _iter_files(directory: Path) -> list[Path]:
    try:
        return [path for path in directory.rglob("*") if path.is_file()]
    except OSError:
        return []


def _list_subprojects() -> list[Path]:
    """Top-level, non-hidden directories under the workspace root."""
    try:
        entries = sorted(config.ROOT.iterdir())
    except OSError:
        return []
    return [entry for entry in entries if entry.is_dir() and not entry.name.startswith(".")]


def _is_test_file(path: Path) -> bool:
    return any(path.match(pattern) for pattern in _TEST_GLOBS)


def get_project_health() -> dict[str, object]:
    cached = _cache_get("projects")
    if cached is not None:
        return cached
    projects: list[dict[str, object]] = []
    for directory in _list_subprojects():
        files = _iter_files(directory)
        mtimes = [file.stat().st_mtime for file in files if file.exists()]
        projects.append({
            "name": directory.name,
            "path": str(directory.relative_to(config.ROOT)),
            "test_count": sum(1 for file in files if _is_test_file(file)),
            "file_count": len(files),
            "last_modified": (
                datetime.fromtimestamp(max(mtimes)).isoformat(timespec="seconds") if mtimes else ""
            ),
            "has_git": (directory / ".git").exists(),
            "has_readme": (directory / "README.md").exists(),
        })
    data = {"projects": projects}
    _cache_set("projects", data)
    return data


def get_overview_stats() -> dict[str, object]:
    workflows = get_workflows()
    projects = get_project_health()["projects"]
    return {
        "active_workflows": sum(1 for workflow in workflows if workflow["state"] == "active"),
        "total_projects": len(projects),
        "test_files": sum(int(project["test_count"]) for project in projects),
        "local_branches": len(get_local_branches()),
        "remote_branches": len(get_remote_branches()),
        "worktrees": len(get_worktrees()),
        "recent_commits": len(get_recent_commits(100)),
        "github_available": bool(get_github_token_status()["available"]),
    }


def get_recent_activity(limit: int = 20) -> list[dict[str, object]]:
    limit = max(1, min(limit, 100))
    items: list[dict[str, object]] = [
        {
            "kind": "commit",
            "title": commit["subject"],
            "detail": f"{commit['author_name']} · {commit['sha'][:7]}",
            "status": "",
            "date": commit["date"],
        }
        for commit in get_recent_commits(limit)
    ]
    items += [
        {
            "kind": "run",
            "title": run["name"] or "workflow run",
            "detail": str(run["branch"]),
            "status": str(run["conclusion"] or run["status"]),
            "date": str(run["created_at"]),
        }
        for run in get_workflow_runs(per_page=limit)
    ]
    items.sort(key=lambda item: str(item["date"]), reverse=True)
    return items[:limit]
