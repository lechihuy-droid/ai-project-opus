# CI/CD Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live CI/CD Dashboard page to Harness Hub that shows GitHub Actions pipeline status, project health, branch/worktree inventory, quality gates, and management rules — sourced from local git + the GitHub REST API instead of the hardcoded static `docs/cicd-dashboard.html`.

**Architecture:** A new backend service module (`services/cicd.py`) reads three sources — local git via `subprocess` with `security.subprocess_env()`, the GitHub REST API via `httpx` with a server-side token, and the filesystem via `pathlib`. A thin FastAPI router (`api/cicd.py`) exposes 12 read endpoints plus one POST cache-refresh; auth, CSRF, correlation-id and idempotency come free from the existing `server.py` middleware. The React SPA gets a typed client (`lib/cicdApi.ts`) and a single 5-tab page (`pages/CicdDashboardPage.tsx`) built only from existing `lib/ui.tsx` / `lib/Table.tsx` components. The GitHub token never reaches the browser.

**Tech Stack:** Python 3.11 · FastAPI · httpx 0.28.1 · pytest · React 19 · TypeScript · Vite · vitest · Tailwind v4 · lucide-react

**Spec:** `docs/cicd-dashboard-handoff.md` (plus the `/speckit-analyze` findings resolved below)

---

## Global Constraints

- **No new dependencies.** Backend uses only `httpx` (already in `harness/hub/requirements-hub.txt:6`), `subprocess`, `pathlib`, `threading`. Frontend adds no packages.
- **Token never leaves the server.** No GitHub token in any API response, in any log line, or in any frontend bundle. `get_github_token_status()` returns a boolean + reason only.
- **All git subprocesses** go through `subprocess.run([...], shell=False, env=security.subprocess_env(), text=True, encoding="utf-8", errors="replace", check=False)` — mirror `harness/hub/services/gitjobs.py:57-72`.
- **Graceful degradation is mandatory.** No endpoint may raise on a missing token, an offline GitHub, or a git failure. Return empty lists / `available: false` instead.
- **Repo root** is `config.ROOT`. Read it at call time (`config.ROOT`, not a module-level copy) so tests can monkeypatch it.
- **Frontend i18n:** every user-visible string comes from `t('cicd.…')`. `nav.*` keys live in `lib/i18n/common.ts` (existing convention), domain keys in the new `lib/i18n/cicd.ts`.
- **`Table` is a default export** (`lib/Table.tsx:17`). Import as `import Table, { TableRow, TableCell } from '../lib/Table'`.
- **Source files must be ASCII-safe UTF-8, LF, no BOM** — `pnpm build` runs `scripts/check-encoding.mjs` first.
- **Backend tests** run from `harness/hub/`: `python -m pytest tests/test_cicd.py -v`. **Frontend tests** from `harness/hub/web-v3/`: `pnpm test`.
- **Python:** `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`

## Decisions Locked (resolving `/speckit-analyze` findings)

| Finding | Decision |
|---|---|
| U1 — quality gates / management rules "real-time"? | Gate **definitions** are derived from `.github/workflows/*.yml` on disk; gate **history** and **enforcement counters** are derived from GitHub workflow runs. Management **rules** are a static constant in `services/cicd.py` (workspace policy, not machine state). Documented as such in the UI copy. |
| A2 — auto-refresh | **Out of v1.** Manual Refresh button only. |
| A3 — cache thread-safety | `threading.Lock` around the cache dict. |
| U3 — workflow-runs endpoint | No `workflow_id` → `GET /actions/runs`; with `workflow_id` → `GET /actions/workflows/{id}/runs`. |
| F1 — Table import | Default import (see Global Constraints). |
| F2 — `Promise.allSettled` mapping | Replaced by one `loadAll()` that awaits a keyed object; no positional indexing. |
| I1 — `server.py` services import | Not added. Only `include_router`. |
| I2 — config placement | Constants go next to `PORT` (~line 40), not at file end. |
| E2 — tests | `tests/test_cicd.py` (backend) + `src/lib/cicdApi.test.ts` (frontend) are required deliverables. Page component has no unit test (no React Testing Library in the repo); verified via build + lint + manual browser check in Task 9. |
| U4 — `gh` fallback | `subprocess.run(["gh", "auth", "token"], timeout=5)`, any exception → no token. |
| Remote branches | Read from `refs/remotes/origin` via local git, not the GitHub API — cheaper, works offline, no `protected` field (dropped from the shape). |

## File Structure

**Create:**
| File | Responsibility |
|---|---|
| `harness/hub/services/cicd.py` | All data access: git, GitHub, filesystem, cache. Only module that knows about tokens. |
| `harness/hub/api/cicd.py` | HTTP surface. Param validation only, no logic. |
| `harness/hub/tests/test_cicd.py` | Service unit tests over a temp git repo + endpoint contract tests. |
| `harness/hub/web-v3/src/lib/cicdApi.ts` | Typed client + all response types. |
| `harness/hub/web-v3/src/lib/cicdApi.test.ts` | URL / method / auth-header contract for the client. |
| `harness/hub/web-v3/src/lib/i18n/cicd.ts` | Dashboard copy. |
| `harness/hub/web-v3/src/pages/CicdDashboardPage.tsx` | The 5-tab page. |

**Modify:**
| File | Change |
|---|---|
| `harness/hub/config.py` (~line 40, next to `PORT`) | 5 GitHub constants + cache TTL |
| `harness/hub/server.py:19, :158` | import + `include_router` |
| `harness/hub/web-v3/src/lib/i18n/common.ts:4-5` | `nav.cicd`, `nav.zone.cicd` |
| `harness/hub/web-v3/src/lib/i18n/index.ts` | import + spread `cicd` |
| `harness/hub/web-v3/src/pages/index.tsx` | import + route |
| `harness/hub/web-v3/src/components/Sidebar.tsx:8-14` | new zone |
| `harness/hub/web-v3/src/components/Topbar.tsx:8` | title entry |

---

### Task 1: Config constants, token resolution, git helpers, cache

**Files:**
- Modify: `harness/hub/config.py:40`
- Create: `harness/hub/services/cicd.py`
- Test: `harness/hub/tests/test_cicd.py`

**Interfaces:**
- Consumes: `config.ROOT`, `services.security.subprocess_env()`
- Produces:
  - `config.GITHUB_OWNER: str`, `config.GITHUB_REPO: str`, `config.GITHUB_API_BASE: str`, `config.GITHUB_TOKEN: str`, `config.CICD_CACHE_TTL_SECONDS: int`
  - `cicd._get_github_token() -> str` (`""` when none)
  - `cicd.get_github_token_status() -> dict` — `{"available": bool, "reason": str}`
  - `cicd._run_git(args: list[str]) -> str` (stdout stripped; `""` on failure)
  - `cicd._cache_get(key: str) -> Any | None`, `cicd._cache_set(key: str, value: Any) -> None`, `cicd.refresh_cache() -> dict` (`{"ok": True}`)

- [ ] **Step 1: Write the failing test**

Create `harness/hub/tests/test_cicd.py`:

```python
from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import config
from services import cicd


def run_git(cwd: Path, *args: str) -> None:
    subprocess.run(
        ["git", "-C", str(cwd), *args],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", errors="replace", shell=False, check=True,
    )


@pytest.fixture()
def temp_repo(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init", "-b", "main", str(repo)], check=True,
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    run_git(repo, "config", "user.email", "hub-tests@example.test")
    run_git(repo, "config", "user.name", "Hub Tests")
    (repo / "README.md").write_text("# tmp\n", encoding="utf-8")
    run_git(repo, "add", "README.md")
    run_git(repo, "commit", "-m", "first commit")
    monkeypatch.setattr(config, "ROOT", repo)
    cicd.refresh_cache()
    return repo


def test_run_git_returns_stdout(temp_repo: Path) -> None:
    assert cicd._run_git(["branch", "--show-current"]) == "main"


def test_run_git_returns_empty_string_on_failure(temp_repo: Path) -> None:
    assert cicd._run_git(["cat-file", "-p", "does-not-exist"]) == ""


def test_token_status_unavailable_without_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    cicd.refresh_cache()
    status = cicd.get_github_token_status()
    assert status["available"] is False
    assert status["reason"]


def test_token_status_available_with_env_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "ghp_fake")
    cicd.refresh_cache()
    assert cicd.get_github_token_status() == {"available": True, "reason": ""}


def test_token_status_never_leaks_the_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "ghp_supersecret")
    cicd.refresh_cache()
    assert "ghp_supersecret" not in str(cicd.get_github_token_status())


def test_cache_expires_after_ttl(monkeypatch: pytest.MonkeyPatch) -> None:
    cicd.refresh_cache()
    cicd._cache_set("k", 1)
    assert cicd._cache_get("k") == 1
    monkeypatch.setattr(cicd.time, "time", lambda: 10_000_000.0)
    assert cicd._cache_get("k") is None
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `harness/hub/`): `python -m pytest tests/test_cicd.py -v`
Expected: FAIL — `ImportError: cannot import name 'cicd' from 'services'`

- [ ] **Step 3: Add config constants**

In `harness/hub/config.py`, immediately after `VGOV_BASE_URL = ...` (~line 41):

```python
# CI/CD Dashboard. Owner/repo default to this workspace's origin; override in
# .env for a fork. The token is server-side only and never reaches the SPA.
GITHUB_OWNER = os.environ.get("GITHUB_OWNER", "lechihuy-droid")
GITHUB_REPO = os.environ.get("GITHUB_REPO", "ai-project-opus")
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
CICD_CACHE_TTL_SECONDS = 300
```

- [ ] **Step 4: Write minimal implementation**

Create `harness/hub/services/cicd.py`:

```python
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add harness/hub/config.py harness/hub/services/cicd.py harness/hub/tests/test_cicd.py
git commit -m "feat(hub): add cicd service foundation - config, token resolution, git helper, cache"
```

---

### Task 2: Git-backed data — branches, worktrees, commits

**Files:**
- Modify: `harness/hub/services/cicd.py`
- Test: `harness/hub/tests/test_cicd.py`

**Interfaces:**
- Consumes: `_run_git`, `_cache_get`, `_cache_set`, `_SEP` (Task 1)
- Produces:
  - `get_local_branches() -> list[dict]` — `{"name": str, "last_commit_date": str, "last_commit_subject": str}`
  - `get_remote_branches() -> list[dict]` — same shape
  - `get_current_branch() -> str`
  - `get_branches() -> dict` — `{"local": list[dict], "remote": list[dict], "current": str}`
  - `get_worktrees() -> list[dict]` — `{"path": str, "head": str, "branch": str}`
  - `get_recent_commits(limit: int = 10) -> list[dict]` — `{"sha": str, "author_name": str, "date": str, "subject": str}`

- [ ] **Step 1: Write the failing test**

Append to `harness/hub/tests/test_cicd.py`:

```python
def test_local_branches_lists_current_branch(temp_repo: Path) -> None:
    branches = cicd.get_local_branches()
    names = [branch["name"] for branch in branches]
    assert "main" in names
    entry = next(branch for branch in branches if branch["name"] == "main")
    assert entry["last_commit_subject"] == "first commit"
    assert entry["last_commit_date"]


def test_remote_branches_empty_without_remote(temp_repo: Path) -> None:
    assert cicd.get_remote_branches() == []


def test_branches_bundle_shape(temp_repo: Path) -> None:
    data = cicd.get_branches()
    assert set(data) == {"local", "remote", "current"}
    assert data["current"] == "main"


def test_recent_commits_returns_newest_first(temp_repo: Path) -> None:
    (temp_repo / "second.txt").write_text("x\n", encoding="utf-8")
    run_git(temp_repo, "add", "second.txt")
    run_git(temp_repo, "commit", "-m", "second commit")
    cicd.refresh_cache()
    commits = cicd.get_recent_commits(5)
    assert commits[0]["subject"] == "second commit"
    assert commits[0]["author_name"] == "Hub Tests"
    assert len(commits[0]["sha"]) == 40


def test_commit_subject_with_pipe_is_not_split(temp_repo: Path) -> None:
    (temp_repo / "third.txt").write_text("x\n", encoding="utf-8")
    run_git(temp_repo, "add", "third.txt")
    run_git(temp_repo, "commit", "-m", "fix: a|b parsing")
    cicd.refresh_cache()
    assert cicd.get_recent_commits(1)[0]["subject"] == "fix: a|b parsing"


def test_worktrees_lists_the_main_checkout(temp_repo: Path) -> None:
    worktrees = cicd.get_worktrees()
    assert len(worktrees) == 1
    assert worktrees[0]["branch"] == "main"
    assert len(worktrees[0]["head"]) == 40


def test_git_functions_return_empty_outside_a_repo(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(config, "ROOT", tmp_path)
    cicd.refresh_cache()
    assert cicd.get_local_branches() == []
    assert cicd.get_worktrees() == []
    assert cicd.get_recent_commits(5) == []
    assert cicd.get_current_branch() == ""
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: FAIL — `AttributeError: module 'services.cicd' has no attribute 'get_local_branches'`

- [ ] **Step 3: Write minimal implementation**

Append to `harness/hub/services/cicd.py`:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add harness/hub/services/cicd.py harness/hub/tests/test_cicd.py
git commit -m "feat(hub): read branches, worktrees and commits from local git"
```

---

### Task 3: GitHub layer — workflows and workflow runs

**Files:**
- Modify: `harness/hub/services/cicd.py`
- Test: `harness/hub/tests/test_cicd.py`

**Interfaces:**
- Consumes: `_get_github_token`, `_cache_get`, `_cache_set` (Task 1)
- Produces:
  - `_github_get(path: str, params: dict[str, str | int] | None = None) -> Any | None` — `None` on any failure
  - `get_workflows() -> list[dict]` — `{"id": str, "name": str, "path": str, "state": str, "updated_at": str}`
  - `get_workflow_runs(workflow_id: str = "", per_page: int = 30) -> list[dict]` — `{"id": str, "name": str, "status": str, "conclusion": str, "branch": str, "duration_seconds": float | None, "created_at": str, "html_url": str}`

- [ ] **Step 1: Write the failing test**

Append to `harness/hub/tests/test_cicd.py`:

```python
class _FakeResponse:
    def __init__(self, payload: object, status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def json(self) -> object:
        return self._payload


class _FakeClient:
    """Stands in for httpx.Client. Records the paths it was asked for."""

    calls: list[tuple[str, dict[str, object] | None]] = []
    payload: object = {}
    raises: Exception | None = None

    def __init__(self, *args: object, **kwargs: object) -> None:
        pass

    def __enter__(self) -> "_FakeClient":
        return self

    def __exit__(self, *args: object) -> bool:
        return False

    def get(self, url: str, params: dict[str, object] | None = None, headers: object = None) -> _FakeResponse:
        _FakeClient.calls.append((url, params))
        if _FakeClient.raises is not None:
            raise _FakeClient.raises
        return _FakeResponse(_FakeClient.payload)


@pytest.fixture()
def fake_github(monkeypatch: pytest.MonkeyPatch) -> type[_FakeClient]:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "ghp_fake")
    monkeypatch.setattr(config, "GITHUB_OWNER", "acme")
    monkeypatch.setattr(config, "GITHUB_REPO", "widget")
    monkeypatch.setattr(cicd.httpx, "Client", _FakeClient)
    _FakeClient.calls = []
    _FakeClient.payload = {}
    _FakeClient.raises = None
    cicd.refresh_cache()
    return _FakeClient


def test_workflows_are_mapped_to_the_ui_shape(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflows": [
        {"id": 12, "name": "CI", "path": ".github/workflows/ci.yml",
         "state": "active", "updated_at": "2026-08-01T00:00:00Z"},
    ]}
    workflows = cicd.get_workflows()
    assert workflows == [{
        "id": "12", "name": "CI", "path": ".github/workflows/ci.yml",
        "state": "active", "updated_at": "2026-08-01T00:00:00Z",
    }]


def test_workflows_empty_without_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    cicd.refresh_cache()
    assert cicd.get_workflows() == []


def test_workflow_runs_use_the_repo_wide_endpoint_without_an_id(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": []}
    cicd.get_workflow_runs()
    url, params = fake_github.calls[0]
    assert url.endswith("/repos/acme/widget/actions/runs")
    assert params == {"per_page": 30}


def test_workflow_runs_use_the_workflow_scoped_endpoint_with_an_id(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": []}
    cicd.get_workflow_runs("12", 5)
    url, params = fake_github.calls[0]
    assert url.endswith("/repos/acme/widget/actions/workflows/12/runs")
    assert params == {"per_page": 5}


def test_workflow_run_duration_is_derived_from_timestamps(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": [{
        "id": 99, "name": "CI", "status": "completed", "conclusion": "success",
        "head_branch": "main", "created_at": "2026-08-01T10:00:00Z",
        "updated_at": "2026-08-01T10:02:30Z", "html_url": "https://example.test/99",
    }]}
    run = cicd.get_workflow_runs()[0]
    assert run["id"] == "99"
    assert run["branch"] == "main"
    assert run["duration_seconds"] == 150.0


def test_workflow_run_duration_is_none_when_still_running(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": [{
        "id": 100, "name": "CI", "status": "in_progress", "conclusion": None,
        "head_branch": "main", "created_at": "2026-08-01T10:00:00Z",
        "updated_at": "", "html_url": "",
    }]}
    run = cicd.get_workflow_runs()[0]
    assert run["duration_seconds"] is None
    assert run["conclusion"] == ""


def test_github_errors_degrade_to_empty_lists(fake_github: type[_FakeClient]) -> None:
    fake_github.raises = RuntimeError("boom")
    assert cicd.get_workflows() == []
    assert cicd.get_workflow_runs() == []


def test_workflows_are_cached_between_calls(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflows": []}
    cicd.get_workflows()
    cicd.get_workflows()
    assert len(fake_github.calls) == 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: FAIL — `AttributeError: module 'services.cicd' has no attribute 'httpx'`

- [ ] **Step 3: Write minimal implementation**

Add `import httpx` and `from datetime import datetime` to the imports of `harness/hub/services/cicd.py`, then append:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: PASS (21 tests)

- [ ] **Step 5: Commit**

```bash
git add harness/hub/services/cicd.py harness/hub/tests/test_cicd.py
git commit -m "feat(hub): fetch GitHub workflows and runs with cache and graceful degradation"
```

---

### Task 4: Project health, overview stats, recent activity

**Files:**
- Modify: `harness/hub/services/cicd.py`
- Test: `harness/hub/tests/test_cicd.py`

**Interfaces:**
- Consumes: `get_local_branches`, `get_remote_branches`, `get_worktrees`, `get_recent_commits` (Task 2); `get_workflows`, `get_workflow_runs` (Task 3); `get_github_token_status` (Task 1)
- Produces:
  - `get_project_health() -> dict` — `{"projects": [{"name": str, "path": str, "test_count": int, "file_count": int, "last_modified": str, "has_git": bool, "has_readme": bool}]}`
  - `get_overview_stats() -> dict` — `{"active_workflows": int, "total_projects": int, "test_files": int, "local_branches": int, "remote_branches": int, "worktrees": int, "recent_commits": int, "github_available": bool}`
  - `get_recent_activity(limit: int = 20) -> list[dict]` — `{"kind": "commit" | "run", "title": str, "detail": str, "status": str, "date": str}`

- [ ] **Step 1: Write the failing test**

Append to `harness/hub/tests/test_cicd.py`:

```python
def test_project_health_lists_top_level_dirs(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    (temp_repo / "alpha").mkdir()
    (temp_repo / "alpha" / "README.md").write_text("# alpha\n", encoding="utf-8")
    (temp_repo / "alpha" / "test_alpha.py").write_text("def test_x(): pass\n", encoding="utf-8")
    (temp_repo / ".hidden").mkdir()
    cicd.refresh_cache()

    projects = cicd.get_project_health()["projects"]
    names = [project["name"] for project in projects]
    assert "alpha" in names
    assert ".hidden" not in names
    alpha = next(project for project in projects if project["name"] == "alpha")
    assert alpha["test_count"] == 1
    assert alpha["file_count"] == 2
    assert alpha["has_readme"] is True
    assert alpha["has_git"] is False
    assert alpha["last_modified"]


def test_overview_stats_shape_without_github(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    cicd.refresh_cache()
    stats = cicd.get_overview_stats()
    assert set(stats) == {
        "active_workflows", "total_projects", "test_files", "local_branches",
        "remote_branches", "worktrees", "recent_commits", "github_available",
    }
    assert stats["github_available"] is False
    assert stats["active_workflows"] == 0
    assert stats["local_branches"] == 1


def test_recent_activity_merges_commits_and_runs_newest_first(
    temp_repo: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(cicd, "get_workflow_runs", lambda workflow_id="", per_page=30: [{
        "id": "1", "name": "CI", "status": "completed", "conclusion": "success",
        "branch": "main", "duration_seconds": 10.0,
        "created_at": "2099-01-01T00:00:00+00:00", "html_url": "",
    }])
    cicd.refresh_cache()
    activity = cicd.get_recent_activity(5)
    assert activity[0]["kind"] == "run"
    assert activity[0]["status"] == "success"
    assert any(item["kind"] == "commit" for item in activity)


def test_recent_activity_respects_the_limit(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(cicd, "get_workflow_runs", lambda workflow_id="", per_page=30: [])
    cicd.refresh_cache()
    assert len(cicd.get_recent_activity(1)) <= 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: FAIL — `AttributeError: module 'services.cicd' has no attribute 'get_project_health'`

- [ ] **Step 3: Write minimal implementation**

Append to `harness/hub/services/cicd.py` (add `from pathlib import Path` to the imports):

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: PASS (25 tests)

- [ ] **Step 5: Commit**

```bash
git add harness/hub/services/cicd.py harness/hub/tests/test_cicd.py
git commit -m "feat(hub): add project health, overview stats and merged activity feed"
```

---

### Task 5: Quality gates and management rules

**Files:**
- Modify: `harness/hub/services/cicd.py`
- Test: `harness/hub/tests/test_cicd.py`

**Interfaces:**
- Consumes: `get_workflow_runs` (Task 3), `_run_git` not needed
- Produces:
  - `get_quality_gates() -> dict` — `{"gates": [{"name": str, "description": str, "enabled": bool, "source": str}], "history": [{"gate": str, "result": str, "branch": str, "timestamp": str}], "enforcement": {"enforced": bool, "gate_count": int, "failed_runs": int, "detail": str}}`
  - `get_management_rules() -> dict` — keys `branch_naming`, `merge_rules`, `lifecycle`, `age_policy`, `deployment`, `data_safety`; each a `list[{"rule": str, "detail": str, "enforced": bool}]`

Gate definitions come from `.github/workflows/*.yml` on disk (works with no token); history and counters come from workflow runs. Management rules are workspace policy — a static constant, not machine state.

- [ ] **Step 1: Write the failing test**

Append to `harness/hub/tests/test_cicd.py`:

```python
def test_gates_are_derived_from_workflow_files(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    workflows_dir = temp_repo / ".github" / "workflows"
    workflows_dir.mkdir(parents=True)
    (workflows_dir / "ci.yml").write_text("name: Build and test\non: push\n", encoding="utf-8")
    (workflows_dir / "nameless.yml").write_text("on: push\n", encoding="utf-8")
    monkeypatch.setattr(cicd, "get_workflow_runs", lambda workflow_id="", per_page=30: [])
    cicd.refresh_cache()

    gates = cicd.get_quality_gates()["gates"]
    assert {gate["name"] for gate in gates} == {"Build and test", "nameless"}
    ci_gate = next(gate for gate in gates if gate["name"] == "Build and test")
    assert ci_gate["source"] == ".github/workflows/ci.yml"
    assert ci_gate["enabled"] is True


def test_gate_history_and_enforcement_come_from_runs(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (temp_repo / ".github" / "workflows").mkdir(parents=True)
    (temp_repo / ".github" / "workflows" / "ci.yml").write_text("name: CI\n", encoding="utf-8")
    monkeypatch.setattr(cicd, "get_workflow_runs", lambda workflow_id="", per_page=30: [
        {"id": "1", "name": "CI", "status": "completed", "conclusion": "failure",
         "branch": "main", "duration_seconds": 1.0, "created_at": "2026-08-01T00:00:00Z", "html_url": ""},
        {"id": "2", "name": "CI", "status": "completed", "conclusion": "success",
         "branch": "main", "duration_seconds": 1.0, "created_at": "2026-07-31T00:00:00Z", "html_url": ""},
    ])
    cicd.refresh_cache()

    data = cicd.get_quality_gates()
    assert data["history"][0] == {
        "gate": "CI", "result": "failure", "branch": "main", "timestamp": "2026-08-01T00:00:00Z",
    }
    assert data["enforcement"]["failed_runs"] == 1
    assert data["enforcement"]["enforced"] is True
    assert data["enforcement"]["gate_count"] == 1


def test_gates_empty_without_a_workflows_dir(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(cicd, "get_workflow_runs", lambda workflow_id="", per_page=30: [])
    cicd.refresh_cache()
    data = cicd.get_quality_gates()
    assert data["gates"] == []
    assert data["enforcement"]["enforced"] is False


def test_management_rules_expose_all_six_categories() -> None:
    rules = cicd.get_management_rules()
    assert set(rules) == {
        "branch_naming", "merge_rules", "lifecycle", "age_policy", "deployment", "data_safety",
    }
    for category in rules.values():
        assert category
        for item in category:
            assert set(item) == {"rule", "detail", "enforced"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: FAIL — `AttributeError: module 'services.cicd' has no attribute 'get_quality_gates'`

- [ ] **Step 3: Write minimal implementation**

Append to `harness/hub/services/cicd.py`:

```python
# Workspace policy, not machine state: these are the rules the agents and the
# user have agreed on. Kept as a constant so the dashboard has one place to
# read them from; move to a JSON file only when they need to change at runtime.
_MANAGEMENT_RULES: dict[str, list[dict[str, object]]] = {
    "branch_naming": [
        {"rule": "feat/<scope>-<slug>", "detail": "Feature work", "enforced": False},
        {"rule": "fix/<scope>-<slug>", "detail": "Bug fixes", "enforced": False},
        {"rule": "claude/<slug>", "detail": "Cloud agent branches", "enforced": False},
    ],
    "merge_rules": [
        {"rule": "Fetch and merge origin/main before every push", "detail": "Remote usually leads local", "enforced": False},
        {"rule": "Never force-push main", "detail": "Multiple agents share the branch", "enforced": False},
    ],
    "lifecycle": [
        {"rule": "Delete the branch after merge", "detail": "Keeps the remote list readable", "enforced": False},
        {"rule": "One worktree per active branch", "detail": "Avoids checkout collisions", "enforced": False},
    ],
    "age_policy": [
        {"rule": "Review branches older than 30 days", "detail": "Rebase or delete", "enforced": False},
        {"rule": "Delete merged branches older than 7 days", "detail": "Manual for now", "enforced": False},
    ],
    "deployment": [
        {"rule": "Hub runs locally on 127.0.0.1:8799", "detail": "No public exposure", "enforced": True},
        {"rule": "Secrets come from .env or GitHub Secrets", "detail": "Never committed", "enforced": True},
    ],
    "data_safety": [
        {"rule": "Never commit finance.db or data/_local/", "detail": "Real financial data", "enforced": True},
        {"rule": "Never commit personal health or profile data", "detail": "Private by policy", "enforced": True},
    ],
}


def _workflow_files() -> list[Path]:
    directory = config.ROOT / ".github" / "workflows"
    try:
        return sorted(path for path in directory.iterdir() if path.suffix in {".yml", ".yaml"})
    except OSError:
        return []


def _workflow_display_name(path: Path) -> str:
    """The workflow's `name:` field, falling back to the file stem."""
    try:
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("name:"):
                return line.split(":", 1)[1].strip().strip("'\"") or path.stem
    except OSError:
        pass
    return path.stem


def get_quality_gates() -> dict[str, object]:
    gates = [
        {
            "name": _workflow_display_name(path),
            "description": f"GitHub Actions workflow ({path.name})",
            "enabled": True,
            "source": f".github/workflows/{path.name}",
        }
        for path in _workflow_files()
    ]
    runs = get_workflow_runs(per_page=30)
    history = [
        {
            "gate": str(run["name"] or "workflow run"),
            "result": str(run["conclusion"] or run["status"]),
            "branch": str(run["branch"]),
            "timestamp": str(run["created_at"]),
        }
        for run in runs
    ]
    failed = sum(1 for item in history if item["result"] == "failure")
    return {
        "gates": gates,
        "history": history,
        "enforcement": {
            "enforced": bool(gates),
            "gate_count": len(gates),
            "failed_runs": failed,
            "detail": (
                f"{len(gates)} workflow gate(s) defined; {failed} failed run(s) in the last {len(history)}"
                if gates
                else "No workflow files found under .github/workflows"
            ),
        },
    }


def get_management_rules() -> dict[str, object]:
    return {key: list(value) for key, value in _MANAGEMENT_RULES.items()}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: PASS (29 tests)

- [ ] **Step 5: Commit**

```bash
git add harness/hub/services/cicd.py harness/hub/tests/test_cicd.py
git commit -m "feat(hub): derive quality gates from workflow files and runs, add management rules"
```

---

### Task 6: API router and server wiring

**Files:**
- Create: `harness/hub/api/cicd.py`
- Modify: `harness/hub/server.py:19`, `harness/hub/server.py:158`
- Test: `harness/hub/tests/test_cicd.py`

**Interfaces:**
- Consumes: every public function from Tasks 1-5
- Produces: 12 routes under `/api/cicd/*` (11 GET + 1 POST `refresh`), registered on the app

- [ ] **Step 1: Write the failing test**

Append to `harness/hub/tests/test_cicd.py`:

```python
from fastapi.testclient import TestClient


@pytest.fixture()
def client() -> TestClient:
    from server import app

    return TestClient(app)


def test_every_get_endpoint_answers_200(client: TestClient) -> None:
    paths = [
        "/api/cicd/overview", "/api/cicd/github-status", "/api/cicd/workflows",
        "/api/cicd/workflow-runs", "/api/cicd/branches", "/api/cicd/worktrees",
        "/api/cicd/commits", "/api/cicd/activity", "/api/cicd/projects",
        "/api/cicd/quality-gates", "/api/cicd/management-rules",
    ]
    for path in paths:
        response = client.get(path)
        assert response.status_code == 200, path


def test_refresh_is_a_post_and_clears_the_cache(client: TestClient) -> None:
    cicd._cache_set("k", 1)
    response = client.post("/api/cicd/refresh")
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert cicd._cache_get("k") is None


def test_commits_limit_is_validated(client: TestClient) -> None:
    assert client.get("/api/cicd/commits", params={"limit": 0}).status_code == 422
    assert client.get("/api/cicd/commits", params={"limit": 101}).status_code == 422
    assert client.get("/api/cicd/commits", params={"limit": 10}).status_code == 200


def test_workflow_runs_per_page_is_validated(client: TestClient) -> None:
    assert client.get("/api/cicd/workflow-runs", params={"per_page": 0}).status_code == 422
    assert client.get("/api/cicd/workflow-runs", params={"per_page": 101}).status_code == 422


def test_endpoints_require_the_hub_token(client: TestClient) -> None:
    response = client.get("/api/cicd/overview", headers={"X-Hub-Token": "wrong"})
    assert response.status_code == 403


def test_no_endpoint_leaks_the_token(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "ghp_supersecret")
    cicd.refresh_cache()
    body = client.get("/api/cicd/github-status").text
    assert "ghp_supersecret" not in body
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: FAIL — all `/api/cicd/*` GETs return 404

- [ ] **Step 3: Write minimal implementation**

Create `harness/hub/api/cicd.py`:

```python
from __future__ import annotations

from fastapi import APIRouter, Query

from services import cicd

router = APIRouter()


@router.get("/api/cicd/overview")
def api_cicd_overview() -> dict[str, object]:
    return cicd.get_overview_stats()


@router.get("/api/cicd/github-status")
def api_cicd_github_status() -> dict[str, object]:
    return cicd.get_github_token_status()


@router.get("/api/cicd/workflows")
def api_cicd_workflows() -> list[dict[str, object]]:
    return cicd.get_workflows()


@router.get("/api/cicd/workflow-runs")
def api_cicd_workflow_runs(
    workflow_id: str = "",
    per_page: int = Query(default=30, ge=1, le=100),
) -> list[dict[str, object]]:
    return cicd.get_workflow_runs(workflow_id, per_page)


@router.get("/api/cicd/branches")
def api_cicd_branches() -> dict[str, object]:
    return cicd.get_branches()


@router.get("/api/cicd/worktrees")
def api_cicd_worktrees() -> list[dict[str, str]]:
    return cicd.get_worktrees()


@router.get("/api/cicd/commits")
def api_cicd_commits(limit: int = Query(default=10, ge=1, le=100)) -> list[dict[str, str]]:
    return cicd.get_recent_commits(limit)


@router.get("/api/cicd/activity")
def api_cicd_activity(limit: int = Query(default=20, ge=1, le=100)) -> list[dict[str, object]]:
    return cicd.get_recent_activity(limit)


@router.get("/api/cicd/projects")
def api_cicd_projects() -> dict[str, object]:
    return cicd.get_project_health()


@router.get("/api/cicd/quality-gates")
def api_cicd_quality_gates() -> dict[str, object]:
    return cicd.get_quality_gates()


@router.get("/api/cicd/management-rules")
def api_cicd_management_rules() -> dict[str, object]:
    return cicd.get_management_rules()


@router.post("/api/cicd/refresh")
def api_cicd_refresh() -> dict[str, object]:
    return cicd.refresh_cache()
```

In `harness/hub/server.py`, add after line 13 (`from api.agents import ...`), keeping imports alphabetical:

```python
from api.cicd import router as cicd_router
```

And after `app.include_router(chat_router)` (line 160):

```python
app.include_router(cicd_router)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cicd.py -v`
Expected: PASS (35 tests)

- [ ] **Step 5: Run the whole backend suite for regressions**

Run: `python -m pytest tests/ -q`
Expected: no new failures versus the pre-change baseline

- [ ] **Step 6: Commit**

```bash
git add harness/hub/api/cicd.py harness/hub/server.py harness/hub/tests/test_cicd.py
git commit -m "feat(hub): expose the cicd API router"
```

---

### Task 7: Frontend API client and i18n strings

**Files:**
- Create: `harness/hub/web-v3/src/lib/cicdApi.ts`
- Create: `harness/hub/web-v3/src/lib/cicdApi.test.ts`
- Create: `harness/hub/web-v3/src/lib/i18n/cicd.ts`
- Modify: `harness/hub/web-v3/src/lib/i18n/index.ts`
- Modify: `harness/hub/web-v3/src/lib/i18n/common.ts:4-5`

**Interfaces:**
- Consumes: the endpoints from Task 6; `api` from `lib/api.ts`
- Produces: `cicd` client object and the exported types `GithubStatus`, `OverviewStats`, `Workflow`, `WorkflowRun`, `BranchInfo`, `BranchesData`, `WorktreeInfo`, `CommitInfo`, `ActivityItem`, `ProjectHealth`, `ProjectsData`, `QualityGate`, `GateHistoryItem`, `EnforcementStatus`, `QualityGatesData`, `RuleItem`, `ManagementRulesData`, plus `t('cicd.*')` keys

- [ ] **Step 1: Write the failing test**

Create `harness/hub/web-v3/src/lib/cicdApi.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cicd } from './cicdApi'

describe('cicd client hits the right URLs with the auth header', () => {
  beforeEach(() => {
    window.localStorage.setItem('hubToken', 'secret-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const ok = (body: string) => vi.mocked(fetch).mockResolvedValue(new Response(body, { status: 200 }))

  it('overview() GETs /api/cicd/overview with the token', async () => {
    ok('{}')
    await cicd.overview()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/cicd/overview')
    expect(init?.method ?? 'GET').toBe('GET')
    expect(new Headers(init?.headers).get('X-Hub-Token')).toBe('secret-token')
  })

  it('workflowRuns() omits workflow_id when none is given', async () => {
    ok('[]')
    await cicd.workflowRuns()
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/cicd/workflow-runs?per_page=30')
  })

  it('workflowRuns() passes workflow_id and per_page', async () => {
    ok('[]')
    await cicd.workflowRuns('12', 5)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/cicd/workflow-runs?workflow_id=12&per_page=5')
  })

  it('commits() and activity() send their limits', async () => {
    ok('[]')
    await cicd.commits(20)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/cicd/commits?limit=20')
    ok('[]')
    await cicd.activity(15)
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/cicd/activity?limit=15')
  })

  it('refresh() POSTs', async () => {
    ok('{"ok":true}')
    await cicd.refresh()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/cicd/refresh')
    expect(init?.method).toBe('POST')
  })

  it('propagates ApiError on a failed response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{"detail":"nope"}', { status: 403 }))
    await expect(cicd.overview()).rejects.toThrow('nope')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `harness/hub/web-v3/`): `pnpm test`
Expected: FAIL — `Failed to resolve import "./cicdApi"`

- [ ] **Step 3: Write the API client**

Create `harness/hub/web-v3/src/lib/cicdApi.ts`:

```typescript
import { api } from './api'

const base = '/api/cicd'

export type GithubStatus = { available: boolean; reason: string }

export type OverviewStats = {
  active_workflows: number
  total_projects: number
  test_files: number
  local_branches: number
  remote_branches: number
  worktrees: number
  recent_commits: number
  github_available: boolean
}

export type Workflow = { id: string; name: string; path: string; state: string; updated_at: string }

export type WorkflowRun = {
  id: string
  name: string
  status: string
  conclusion: string
  branch: string
  duration_seconds: number | null
  created_at: string
  html_url: string
}

export type BranchInfo = { name: string; last_commit_date: string; last_commit_subject: string }
export type BranchesData = { local: BranchInfo[]; remote: BranchInfo[]; current: string }
export type WorktreeInfo = { path: string; head: string; branch: string }
export type CommitInfo = { sha: string; author_name: string; date: string; subject: string }
export type ActivityItem = { kind: 'commit' | 'run'; title: string; detail: string; status: string; date: string }

export type ProjectHealth = {
  name: string
  path: string
  test_count: number
  file_count: number
  last_modified: string
  has_git: boolean
  has_readme: boolean
}
export type ProjectsData = { projects: ProjectHealth[] }

export type QualityGate = { name: string; description: string; enabled: boolean; source: string }
export type GateHistoryItem = { gate: string; result: string; branch: string; timestamp: string }
export type EnforcementStatus = { enforced: boolean; gate_count: number; failed_runs: number; detail: string }
export type QualityGatesData = { gates: QualityGate[]; history: GateHistoryItem[]; enforcement: EnforcementStatus }

export type RuleItem = { rule: string; detail: string; enforced: boolean }
export type ManagementRulesData = {
  branch_naming: RuleItem[]
  merge_rules: RuleItem[]
  lifecycle: RuleItem[]
  age_policy: RuleItem[]
  deployment: RuleItem[]
  data_safety: RuleItem[]
}

export const cicd = {
  overview: () => api<OverviewStats>(`${base}/overview`),
  githubStatus: () => api<GithubStatus>(`${base}/github-status`),
  workflows: () => api<Workflow[]>(`${base}/workflows`),
  workflowRuns: (workflowId = '', perPage = 30) =>
    api<WorkflowRun[]>(
      `${base}/workflow-runs?${workflowId ? `workflow_id=${encodeURIComponent(workflowId)}&` : ''}per_page=${perPage}`,
    ),
  branches: () => api<BranchesData>(`${base}/branches`),
  worktrees: () => api<WorktreeInfo[]>(`${base}/worktrees`),
  commits: (limit = 10) => api<CommitInfo[]>(`${base}/commits?limit=${limit}`),
  activity: (limit = 20) => api<ActivityItem[]>(`${base}/activity?limit=${limit}`),
  projects: () => api<ProjectsData>(`${base}/projects`),
  qualityGates: () => api<QualityGatesData>(`${base}/quality-gates`),
  managementRules: () => api<ManagementRulesData>(`${base}/management-rules`),
  refresh: () => api<{ ok: boolean }>(`${base}/refresh`, { method: 'POST' }),
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS (6 new tests, existing suites unchanged)

- [ ] **Step 5: Add the i18n strings**

Create `harness/hub/web-v3/src/lib/i18n/cicd.ts`:

```typescript
// UI copy for the CI/CD dashboard surface.
export const cicd = {
  'cicd.title': 'CI/CD Dashboard',
  'cicd.refresh': 'Refresh',
  'cicd.refreshing': 'Refreshing...',
  'cicd.loadFailed': 'Unable to load CI/CD data',
  'cicd.githubUnavailable': 'GitHub API unavailable - showing local git data only',
  'cicd.githubReason': 'Reason: {reason}',
  'cicd.githubConnected': 'GitHub connected',
  'cicd.tab.overview': 'Overview',
  'cicd.tab.pipelines': 'Pipelines',
  'cicd.tab.projects': 'Projects',
  'cicd.tab.quality': 'Quality gates',
  'cicd.tab.rules': 'Management rules',
  'cicd.tabsLabel': 'CI/CD sections',
  'cicd.overview.activeWorkflows': 'Active workflows',
  'cicd.overview.projects': 'Projects',
  'cicd.overview.tests': 'Test files',
  'cicd.overview.localBranches': 'Local branches',
  'cicd.overview.remoteBranches': 'Remote branches',
  'cicd.overview.worktrees': 'Worktrees',
  'cicd.overview.recentActivity': 'Recent activity',
  'cicd.overview.noActivity': 'No commits or workflow runs yet',
  'cicd.activity.kind': 'Kind',
  'cicd.activity.title': 'What',
  'cicd.activity.detail': 'Detail',
  'cicd.activity.status': 'Status',
  'cicd.activity.date': 'When',
  'cicd.activity.commit': 'Commit',
  'cicd.activity.run': 'Run',
  'cicd.pipelines.workflows': 'Workflows',
  'cicd.pipelines.runs': 'Recent runs',
  'cicd.pipelines.name': 'Workflow',
  'cicd.pipelines.state': 'State',
  'cicd.pipelines.path': 'File',
  'cicd.pipelines.status': 'Status',
  'cicd.pipelines.conclusion': 'Result',
  'cicd.pipelines.branch': 'Branch',
  'cicd.pipelines.duration': 'Duration',
  'cicd.pipelines.started': 'Started',
  'cicd.pipelines.noWorkflows': 'No workflows found',
  'cicd.pipelines.noRuns': 'No recent workflow runs',
  'cicd.projects.health': 'Project health',
  'cicd.projects.name': 'Project',
  'cicd.projects.tests': 'Tests',
  'cicd.projects.files': 'Files',
  'cicd.projects.lastModified': 'Last modified',
  'cicd.projects.hasGit': 'Git',
  'cicd.projects.hasReadme': 'README',
  'cicd.projects.branches': 'Branches',
  'cicd.projects.branchName': 'Branch',
  'cicd.projects.lastCommit': 'Last commit',
  'cicd.projects.lastCommitDate': 'Date',
  'cicd.projects.current': 'Current branch: {branch}',
  'cicd.projects.worktrees': 'Worktrees',
  'cicd.projects.worktreePath': 'Path',
  'cicd.projects.worktreeHead': 'HEAD',
  'cicd.projects.noProjects': 'No sub-projects found',
  'cicd.quality.gates': 'Quality gates',
  'cicd.quality.gatesNote': 'Derived from .github/workflows on disk',
  'cicd.quality.name': 'Gate',
  'cicd.quality.description': 'Description',
  'cicd.quality.enabled': 'Enabled',
  'cicd.quality.source': 'Source',
  'cicd.quality.history': 'Gate history',
  'cicd.quality.historyNote': 'Derived from the latest GitHub workflow runs',
  'cicd.quality.result': 'Result',
  'cicd.quality.timestamp': 'When',
  'cicd.quality.enforcement': 'Enforcement',
  'cicd.quality.noGates': 'No workflow files under .github/workflows',
  'cicd.quality.noHistory': 'No gate history available',
  'cicd.rules.note': 'Workspace policy - informational, not auto-enforced unless marked',
  'cicd.rules.branchNaming': 'Branch naming',
  'cicd.rules.mergeRules': 'Merge rules',
  'cicd.rules.lifecycle': 'Branch lifecycle',
  'cicd.rules.agePolicy': 'Age policy',
  'cicd.rules.deployment': 'Deployment',
  'cicd.rules.dataSafety': 'Data safety',
  'cicd.rules.rule': 'Rule',
  'cicd.rules.detail': 'Detail',
  'cicd.rules.enforced': 'Enforced',
  'cicd.yes': 'Yes',
  'cicd.no': 'No',
  'cicd.none': '-',
} as const
```

In `harness/hub/web-v3/src/lib/i18n/common.ts`, append to the `nav.*` run on line 4: `'nav.cicd': 'CI/CD dashboard',` and to the `nav.zone.*` run on line 5: `'nav.zone.cicd': 'CI/CD',`

In `harness/hub/web-v3/src/lib/i18n/index.ts`, add `import { cicd } from './cicd'` after the `misc` import and add `...cicd` to the `en` spread:

```typescript
export const en = { ...common, ...chat, ...workflows, ...usage, ...agents, ...skills, ...settings, ...approvals, ...artifacts, ...runs, ...misc, ...cicd } as const
```

- [ ] **Step 6: Verify types and encoding**

Run: `pnpm test && npx tsc -b && pnpm check:encoding`
Expected: tests PASS, no TypeScript errors, `encoding ok`

- [ ] **Step 7: Commit**

```bash
git add harness/hub/web-v3/src/lib/cicdApi.ts harness/hub/web-v3/src/lib/cicdApi.test.ts harness/hub/web-v3/src/lib/i18n/
git commit -m "feat(hub-web): add cicd API client and i18n strings"
```

---

### Task 8: The dashboard page

**Files:**
- Create: `harness/hub/web-v3/src/pages/CicdDashboardPage.tsx`

**Interfaces:**
- Consumes: `cicd` + all types from Task 7; `t` from `lib/i18n`; `Tabs`, `Panel`, `Alert`, `Button`, `Status`, `RunStatusBadge`, `EmptyState` from `lib/ui`; default `Table` plus `TableRow`, `TableCell` from `lib/Table`
- Produces: `export default function CicdDashboardPage()` — mounted by Task 9

Component signatures already in the codebase, for reference while writing:
`Tabs({ options: { value, label }[], value, onChange, 'aria-label' })` · `Panel({ header?, children })` · `Alert({ variant: 'error' | 'warning' | 'info' | 'success', title?, children })` · `Status({ kind: 'ready' | 'offline' | ..., label? })` · `RunStatusBadge({ kind: 'running' | 'success' | 'error' | 'interrupted' | 'queued' | 'neutral', label })` · `EmptyState({ title, description? })` · `Table({ headers: ReactNode[], children })`

- [ ] **Step 1: Write the page**

Create `harness/hub/web-v3/src/pages/CicdDashboardPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/api'
import {
  cicd,
  type ActivityItem, type BranchesData, type CommitInfo, type GithubStatus,
  type ManagementRulesData, type OverviewStats, type ProjectsData,
  type QualityGatesData, type RuleItem, type Workflow, type WorkflowRun, type WorktreeInfo,
} from '../lib/cicdApi'
import { t } from '../lib/i18n'
import Table, { TableCell, TableRow } from '../lib/Table'
import { Alert, Button, EmptyState, Panel, RunStatusBadge, Status, Tabs } from '../lib/ui'

type TabValue = 'overview' | 'pipelines' | 'projects' | 'quality' | 'rules'

type DashboardData = {
  overview: OverviewStats | null
  github: GithubStatus | null
  workflows: Workflow[]
  runs: WorkflowRun[]
  branches: BranchesData | null
  worktrees: WorktreeInfo[]
  commits: CommitInfo[]
  activity: ActivityItem[]
  projects: ProjectsData | null
  gates: QualityGatesData | null
  rules: ManagementRulesData | null
}

const emptyData: DashboardData = {
  overview: null, github: null, workflows: [], runs: [], branches: null, worktrees: [],
  commits: [], activity: [], projects: null, gates: null, rules: null,
}

/** Named awaits, so no call site depends on the order of a results array. */
async function loadAll(): Promise<DashboardData> {
  const [
    overview, github, workflows, runs, branches, worktrees, commits, activity, projects, gates, rules,
  ] = await Promise.all([
    cicd.overview(), cicd.githubStatus(), cicd.workflows(), cicd.workflowRuns(),
    cicd.branches(), cicd.worktrees(), cicd.commits(20), cicd.activity(20),
    cicd.projects(), cicd.qualityGates(), cicd.managementRules(),
  ])
  return { overview, github, workflows, runs, branches, worktrees, commits, activity, projects, gates, rules }
}

const runStatusKind = (conclusion: string, status: string) =>
  conclusion === 'success' ? 'success'
    : conclusion === 'failure' ? 'error'
    : conclusion === 'cancelled' ? 'interrupted'
    : status === 'in_progress' ? 'running'
    : status === 'queued' ? 'queued'
    : 'neutral'

const formatDate = (value: string) => (value ? new Date(value).toLocaleString() : t('cicd.none'))
const formatDuration = (seconds: number | null) =>
  seconds === null ? t('cicd.none') : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
const yesNo = (value: boolean) => (value ? t('cicd.yes') : t('cicd.no'))

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Panel className="min-w-0">
      <div className="text-caption text-muted">{label}</div>
      <div className="mt-space-1 text-heading font-semibold text-primary">{value}</div>
    </Panel>
  )
}

function RuleTable({ title, items }: { title: string; items: RuleItem[] }) {
  return (
    <Panel header={<span className="text-label font-semibold text-primary">{title}</span>}>
      <Table headers={[t('cicd.rules.rule'), t('cicd.rules.detail'), t('cicd.rules.enforced')]}>
        {items.map(item => (
          <TableRow key={item.rule}>
            <TableCell>{item.rule}</TableCell>
            <TableCell className="text-secondary">{item.detail}</TableCell>
            <TableCell>{yesNo(item.enforced)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </Panel>
  )
}

export default function CicdDashboardPage() {
  const [tab, setTab] = useState<TabValue>('overview')
  const [data, setData] = useState<DashboardData>(emptyData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    let cancelled = false
    loadAll()
      .then(next => { if (!cancelled) { setData(next); setError('') } })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof ApiError ? reason.message : t('cicd.loadFailed'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => load(), [load])

  const refresh = () => { void cicd.refresh().catch(() => undefined).then(() => load()) }

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'overview', label: t('cicd.tab.overview') },
    { value: 'pipelines', label: t('cicd.tab.pipelines') },
    { value: 'projects', label: t('cicd.tab.projects') },
    { value: 'quality', label: t('cicd.tab.quality') },
    { value: 'rules', label: t('cicd.tab.rules') },
  ]

  const github = data.github
  const overview = data.overview

  return (
    <div className="flex h-full min-h-0 flex-col gap-space-4 p-space-6">
      <header className="flex items-center gap-space-3">
        <h1 className="text-heading font-semibold text-primary">{t('cicd.title')}</h1>
        <Status
          kind={github?.available ? 'ready' : 'offline'}
          label={github?.available ? t('cicd.githubConnected') : t('cicd.githubUnavailable')}
        />
        <div className="flex-1" />
        <Button onClick={refresh} disabled={loading}>
          {loading ? t('cicd.refreshing') : t('cicd.refresh')}
        </Button>
      </header>

      {error ? <Alert variant="error" title={t('cicd.loadFailed')}>{error}</Alert> : null}
      {github && !github.available
        ? <Alert variant="warning" title={t('cicd.githubUnavailable')}>{t('cicd.githubReason', { reason: github.reason })}</Alert>
        : null}

      <Tabs options={tabs} value={tab} onChange={setTab} aria-label={t('cicd.tabsLabel')} />

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'overview' ? (
          <div className="flex flex-col gap-space-4">
            <div className="grid grid-cols-2 gap-space-3 md:grid-cols-3 xl:grid-cols-6">
              <StatTile label={t('cicd.overview.activeWorkflows')} value={overview?.active_workflows ?? 0} />
              <StatTile label={t('cicd.overview.projects')} value={overview?.total_projects ?? 0} />
              <StatTile label={t('cicd.overview.tests')} value={overview?.test_files ?? 0} />
              <StatTile label={t('cicd.overview.localBranches')} value={overview?.local_branches ?? 0} />
              <StatTile label={t('cicd.overview.remoteBranches')} value={overview?.remote_branches ?? 0} />
              <StatTile label={t('cicd.overview.worktrees')} value={overview?.worktrees ?? 0} />
            </div>
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.overview.recentActivity')}</span>}>
              {data.activity.length ? (
                <Table headers={[t('cicd.activity.kind'), t('cicd.activity.title'), t('cicd.activity.detail'), t('cicd.activity.status'), t('cicd.activity.date')]}>
                  {data.activity.map((item, index) => (
                    <TableRow key={`${item.kind}-${item.date}-${index}`}>
                      <TableCell>{item.kind === 'run' ? t('cicd.activity.run') : t('cicd.activity.commit')}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell className="text-secondary">{item.detail}</TableCell>
                      <TableCell>{item.status ? <RunStatusBadge kind={runStatusKind(item.status, '')} label={item.status} /> : t('cicd.none')}</TableCell>
                      <TableCell className="text-secondary">{formatDate(item.date)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.overview.noActivity')} />}
            </Panel>
          </div>
        ) : null}

        {tab === 'pipelines' ? (
          <div className="flex flex-col gap-space-4">
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.pipelines.workflows')}</span>}>
              {data.workflows.length ? (
                <Table headers={[t('cicd.pipelines.name'), t('cicd.pipelines.state'), t('cicd.pipelines.path')]}>
                  {data.workflows.map(workflow => (
                    <TableRow key={workflow.id}>
                      <TableCell>{workflow.name}</TableCell>
                      <TableCell>{workflow.state}</TableCell>
                      <TableCell className="text-secondary">{workflow.path}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.pipelines.noWorkflows')} />}
            </Panel>
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.pipelines.runs')}</span>}>
              {data.runs.length ? (
                <Table headers={[t('cicd.pipelines.name'), t('cicd.pipelines.conclusion'), t('cicd.pipelines.branch'), t('cicd.pipelines.duration'), t('cicd.pipelines.started')]}>
                  {data.runs.map(run => (
                    <TableRow key={run.id}>
                      <TableCell>{run.name}</TableCell>
                      <TableCell><RunStatusBadge kind={runStatusKind(run.conclusion, run.status)} label={run.conclusion || run.status} /></TableCell>
                      <TableCell>{run.branch}</TableCell>
                      <TableCell className="text-secondary">{formatDuration(run.duration_seconds)}</TableCell>
                      <TableCell className="text-secondary">{formatDate(run.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.pipelines.noRuns')} />}
            </Panel>
          </div>
        ) : null}

        {tab === 'projects' ? (
          <div className="flex flex-col gap-space-4">
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.projects.health')}</span>}>
              {data.projects?.projects.length ? (
                <Table headers={[t('cicd.projects.name'), t('cicd.projects.tests'), t('cicd.projects.files'), t('cicd.projects.lastModified'), t('cicd.projects.hasGit'), t('cicd.projects.hasReadme')]}>
                  {data.projects.projects.map(project => (
                    <TableRow key={project.name}>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.test_count}</TableCell>
                      <TableCell>{project.file_count}</TableCell>
                      <TableCell className="text-secondary">{formatDate(project.last_modified)}</TableCell>
                      <TableCell>{yesNo(project.has_git)}</TableCell>
                      <TableCell>{yesNo(project.has_readme)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.projects.noProjects')} />}
            </Panel>
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.projects.branches')}</span>}>
              <p className="mb-space-2 text-caption text-muted">{t('cicd.projects.current', { branch: data.branches?.current || t('cicd.none') })}</p>
              <Table headers={[t('cicd.projects.branchName'), t('cicd.projects.lastCommit'), t('cicd.projects.lastCommitDate')]}>
                {[...(data.branches?.local ?? []), ...(data.branches?.remote ?? [])].map(branch => (
                  <TableRow key={branch.name}>
                    <TableCell>{branch.name}</TableCell>
                    <TableCell className="text-secondary">{branch.last_commit_subject}</TableCell>
                    <TableCell className="text-secondary">{formatDate(branch.last_commit_date)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </Panel>
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.projects.worktrees')}</span>}>
              <Table headers={[t('cicd.projects.worktreePath'), t('cicd.projects.branchName'), t('cicd.projects.worktreeHead')]}>
                {data.worktrees.map(worktree => (
                  <TableRow key={worktree.path}>
                    <TableCell>{worktree.path}</TableCell>
                    <TableCell>{worktree.branch || t('cicd.none')}</TableCell>
                    <TableCell className="text-secondary">{worktree.head.slice(0, 7)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </Panel>
          </div>
        ) : null}

        {tab === 'quality' ? (
          <div className="flex flex-col gap-space-4">
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.quality.gates')}</span>}>
              <p className="mb-space-2 text-caption text-muted">{t('cicd.quality.gatesNote')}</p>
              {data.gates?.gates.length ? (
                <Table headers={[t('cicd.quality.name'), t('cicd.quality.description'), t('cicd.quality.enabled'), t('cicd.quality.source')]}>
                  {data.gates.gates.map(gate => (
                    <TableRow key={gate.source}>
                      <TableCell>{gate.name}</TableCell>
                      <TableCell className="text-secondary">{gate.description}</TableCell>
                      <TableCell>{yesNo(gate.enabled)}</TableCell>
                      <TableCell className="text-secondary">{gate.source}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.quality.noGates')} />}
            </Panel>
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.quality.enforcement')}</span>}>
              <Status kind={data.gates?.enforcement.enforced ? 'ready' : 'offline'} label={data.gates?.enforcement.detail ?? t('cicd.none')} />
            </Panel>
            <Panel header={<span className="text-label font-semibold text-primary">{t('cicd.quality.history')}</span>}>
              <p className="mb-space-2 text-caption text-muted">{t('cicd.quality.historyNote')}</p>
              {data.gates?.history.length ? (
                <Table headers={[t('cicd.quality.name'), t('cicd.quality.result'), t('cicd.pipelines.branch'), t('cicd.quality.timestamp')]}>
                  {data.gates.history.map((item, index) => (
                    <TableRow key={`${item.gate}-${item.timestamp}-${index}`}>
                      <TableCell>{item.gate}</TableCell>
                      <TableCell><RunStatusBadge kind={runStatusKind(item.result, '')} label={item.result} /></TableCell>
                      <TableCell>{item.branch}</TableCell>
                      <TableCell className="text-secondary">{formatDate(item.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.quality.noHistory')} />}
            </Panel>
          </div>
        ) : null}

        {tab === 'rules' && data.rules ? (
          <div className="flex flex-col gap-space-4">
            <p className="text-caption text-muted">{t('cicd.rules.note')}</p>
            <RuleTable title={t('cicd.rules.branchNaming')} items={data.rules.branch_naming} />
            <RuleTable title={t('cicd.rules.mergeRules')} items={data.rules.merge_rules} />
            <RuleTable title={t('cicd.rules.lifecycle')} items={data.rules.lifecycle} />
            <RuleTable title={t('cicd.rules.agePolicy')} items={data.rules.age_policy} />
            <RuleTable title={t('cicd.rules.deployment')} items={data.rules.deployment} />
            <RuleTable title={t('cicd.rules.dataSafety')} items={data.rules.data_safety} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run (from `harness/hub/web-v3/`): `npx tsc -b && pnpm lint && pnpm check:encoding`
Expected: no TypeScript errors, no lint errors, `encoding ok`

- [ ] **Step 3: Commit**

```bash
git add harness/hub/web-v3/src/pages/CicdDashboardPage.tsx
git commit -m "feat(hub-web): add the CI/CD dashboard page with five tabs"
```

---

### Task 9: Route, navigation, title, and end-to-end verification

**Files:**
- Modify: `harness/hub/web-v3/src/pages/index.tsx`
- Modify: `harness/hub/web-v3/src/components/Sidebar.tsx:8-14`
- Modify: `harness/hub/web-v3/src/components/Topbar.tsx:8`

**Interfaces:**
- Consumes: `CicdDashboardPage` (Task 8), `nav.cicd` / `nav.zone.cicd` (Task 7)
- Produces: the `/cicd` route, reachable from the sidebar, with the correct topbar title

- [ ] **Step 1: Add the route**

In `harness/hub/web-v3/src/pages/index.tsx`, add the import after `import ArtifactDetailPage from './ArtifactDetailPage'`:

```typescript
import CicdDashboardPage from './CicdDashboardPage'
```

And add the entry after the `settings` route:

```typescript
  { path: 'cicd', element: <CicdDashboardPage /> },
```

- [ ] **Step 2: Add the sidebar zone**

In `harness/hub/web-v3/src/components/Sidebar.tsx`, add `GitBranch` to the existing `lucide-react` import, then insert this zone between the `monitoring` zone (line 13) and the `system` zone (line 14):

```typescript
  { label: t('nav.zone.cicd'), items: [[GitBranch, t('nav.cicd'), '/cicd']] },
```

- [ ] **Step 3: Add the topbar title**

In `harness/hub/web-v3/src/components/Topbar.tsx:8`, add to the `titles` object:

```typescript
cicd: t('nav.cicd'),
```

- [ ] **Step 4: Full build and test gate**

Run (from `harness/hub/web-v3/`): `pnpm test && pnpm lint && pnpm build`
Expected: tests PASS, no lint errors, `encoding ok`, build succeeds

Run (from `harness/hub/`): `python -m pytest tests/ -q`
Expected: no new failures

- [ ] **Step 5: Manual verification against a running hub**

Start the hub (`./open-hub.ps1`, or `python -m uvicorn hub.server:app --reload`), then:

```bash
curl "http://127.0.0.1:8799/api/cicd/overview" -H "X-Hub-Token: $(cat harness/hub/runtime/store/hub-token)"
curl "http://127.0.0.1:8799/api/cicd/github-status" -H "X-Hub-Token: $(cat harness/hub/runtime/store/hub-token)"
curl -X POST "http://127.0.0.1:8799/api/cicd/refresh" -H "X-Hub-Token: $(cat harness/hub/runtime/store/hub-token)"
```

Expected: JSON stats; `{"available":true,"reason":""}` with a token configured, `{"available":false,...}` without; `{"ok":true}` from the refresh.

Then open `http://127.0.0.1:8799/#/cicd` and confirm:
- The sidebar shows a **CI/CD** zone linking to the page, and the topbar title reads "CI/CD dashboard".
- All five tabs render without a console error.
- With `GITHUB_TOKEN` removed from `.env` and the hub restarted: the page still renders, shows the warning alert, and the Projects tab still lists branches and worktrees from local git.

- [ ] **Step 6: Commit**

```bash
git add harness/hub/web-v3/src/pages/index.tsx harness/hub/web-v3/src/components/Sidebar.tsx harness/hub/web-v3/src/components/Topbar.tsx
git commit -m "feat(hub-web): route, nav entry and title for the CI/CD dashboard"
```

---

## Out of Scope (confirmed with the spec, §10)

- Automated branch cleanup, GitHub branch-protection setup, SSE streaming of runs, multi-repo support, auto-refresh polling.
- `docs/cicd-dashboard.html` (the static prototype) is left untouched; deleting it is a separate decision.

## Prerequisites for the implementer

1. `GITHUB_TOKEN` in the repo-root `.env` (scopes: `repo`, `actions:read`). Optional — everything degrades without it, but the Pipelines tab will be empty.
2. Hub dependencies installed (`harness/hub/requirements-hub.txt`); `httpx==0.28.1` is already there.
3. `pnpm install` done in `harness/hub/web-v3`.
