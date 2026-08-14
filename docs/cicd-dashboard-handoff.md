# Handoff: CI/CD Dashboard — Full Implementation Plan

> **Status:** Plan approved, ready for implementation.
> **Created:** 2026-08-14
> **Author:** Claude Code (Opus) — planning phase
> **Reviewer:** Agent Main (Claude) — awaiting review
> **Repo:** `github.com/lechihuy-droid/ai-project-opus`

---

## 1. Context & Motivation

**Problem:** Workspace có 3 coding agents (Claude Code orchestrator + Codex worker + cloud agents) cùng push vào 1 GitHub repo với:
- Không có CI gate khi push → bug vào main
- 25+ remote branches, phần lớn stale >30 ngày
- Không có visibility về workspace health
- Static HTML dashboard (`docs/cicd-dashboard.html`) với dữ liệu hardcoded

**Goal:** Tích hợp 1 app CI/CD Dashboard **sống** vào Harness Hub hiện có (FastAPI + React SPA) — hiển thị real-time data từ GitHub API + local git: pipeline status, project health, branch management, quality gates, management rules.

**User:** Không biết git. App phải tự quản lý mọi thứ — user chỉ xem dashboard và approve decisions.

---

## 2. Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│  React SPA (web-v3)                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ CicdDashboardPage.tsx (5 tabs: Overview / Pipelines / Projects /     │  │
│  │  Quality Gates / Management Rules)                                   │  │
│  │  └─ cicdApi.ts → api<T>('/api/cicd/...')                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                      ↕ fetch + X-Hub-Token auth                            │
│  FastAPI server (127.0.0.1:8799)                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ api/cicd.py — 12 endpoints (/api/cicd/overview, /api/cicd/branches,  │  │
│  │  /api/cicd/workflows, /api/cicd/workflow-runs, /api/cicd/projects,   │  │
│  │  /api/cicd/commits, /api/cicd/worktrees, /api/cicd/quality-gates,    │  │
│  │  /api/cicd/management-rules, /api/cicd/github-status, /api/cicd/     │  │
│  │  activity, /api/cicd/refresh)                                         │  │
│  │  └─ services/cicd.py — data layer                                    │  │
│  │     ├─ local git (subprocess via security.subprocess_env())          │  │
│  │     ├─ GitHub REST API (httpx, GITHUB_TOKEN from .env)               │  │
│  │     └─ filesystem (pathlib)                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Token GitHub KHÔNG bao giờ đến frontend — tất cả gọi API từ server
- Cache 5 phút cho các endpoint đắt (workflow runs, remote branches)
- Graceful degradation: nếu GitHub API không có → trả về local data + error field
- Reuse 100% existing patterns (không introduce new libraries)

---

## 3. Files to Create (6 new files)

### 3.1 `harness/hub/services/cicd.py` — Service Layer

**Mô tả:** Module Python lấy data từ 3 nguồn: local git, GitHub REST API, filesystem.

**Data sources:**

| Source | Pattern | Reference |
|---|---|---|
| Local git | `subprocess.run(["git", "-C", ROOT, ...])` | `services/gitjobs.py:57-72` |
| GitHub API | `httpx.Client` với `GITHUB_TOKEN` từ `.env` | `api/system.py` vgov proxy |
| Filesystem | `pathlib.Path.iterdir()` | `services/governance.py` |

**Token resolution** (priority order):
1. `config.GITHUB_TOKEN` (từ `.env`)
2. Fallback: `subprocess.run(["gh", "auth", "token"])` — nếu gh CLI có
3. Nếu không có → trả về empty data + `unavailable` flag

**Caching:** In-memory dict `_cache: dict[str, tuple[float, Any]]` với 5-minute TTL. Pattern: `_cache_get(key)`, `_cache_set(key, data)`, `_cache_clear()`.

**Public functions:**

```python
get_github_token_status()       # → { available: bool, reason: str }
get_overview_stats()            # → { active_workflows, total_projects, test_files, ... }
get_workflows()                 # → [{ id, name, path, state, created_at, updated_at }]
get_workflow_runs(wf_id, n)     # → [{ id, name, status, conclusion, duration, ... }]
get_branches()                  # → { local_branches, remote_branches, current_branch }
get_local_branches()            # → [{ name, last_commit_date, last_commit_subject }]
get_remote_branches()           # → [{ name, protected, commit_sha }]
get_worktrees()                 # → [{ path, head_sha }]
get_recent_commits(n)           # → [{ sha, author_name, author_email, date, subject }]
get_recent_activity(n)          # → merged commits + workflow runs, sorted by date
get_project_health()            # → { projects: [{ name, has_tests, test_count, ... }] }
get_quality_gates()             # → { gates, history, enforcement }
get_management_rules()          # → { branch_naming, merge_rules, lifecycle, ... }
refresh_cache()                 # → { ok: True }
```

**Helper functions (private):**

```python
_get_github_token()             # resolve token (env → gh CLI → None)
_github_get(path)               # GET /repos/{owner}/{repo}{path}, return JSON or None
_run_git(args)                  # subprocess git in workspace root
_git_output(args)               # _run_git + strip stdout
_get_current_branch()           # git branch --show-current
_parse_duration(run)            # parse timing from workflow run
_count_subprojects()            # top-level non-hidden dirs
_count_test_files()             # rglob *test*.py + *.test.ts
_list_subprojects()             # detailed list with path
_has_tests(path)                # check for test files in dir
_count_tests_in_dir(path)       # count test files
_count_files_in_dir(path)       # count all files
_dir_last_modified(path)        # max mtime of files
_get_gate_definitions()         # static quality gate definitions
_get_gate_history()             # derived from workflow runs
_get_enforcement_status()       # current enforcement state
_get_branch_naming_conventions() # static rules
_get_merge_rules()              # static rules
_get_branch_lifecycle()         # static rules
_get_age_policy()               # static rules
_get_deployment_rules()         # static rules
_get_data_safety_rules()        # static rules
```

**Error handling:**
- `_github_get()` returns `None` on any error (403, timeout, connect error) — caller handles
- `_run_git()` raises `RuntimeError` on non-zero exit — callers catch and return `[]`
- No crashes — always graceful degradation

---

### 3.2 `harness/hub/api/cicd.py` — API Router

**Mô tả:** FastAPI router, 12 endpoints.

| Endpoint | Method | Query Params | Returns |
|---|---|---|---|
| `/api/cicd/overview` | GET | — | Aggregated stats |
| `/api/cicd/github-status` | GET | — | `{ available, reason }` |
| `/api/cicd/workflows` | GET | — | Workflow list |
| `/api/cicd/workflow-runs` | GET | `workflow_id?`, `per_page` (1-100, default 30) | Run list |
| `/api/cicd/branches` | GET | — | `{ local, remote, current }` |
| `/api/cicd/worktrees` | GET | — | Worktree list |
| `/api/cicd/commits` | GET | `limit` (1-100, default 10) | Commit list |
| `/api/cicd/activity` | GET | `limit` (1-100, default 20) | Merged activity |
| `/api/cicd/projects` | GET | — | `{ projects: [...] }` |
| `/api/cicd/quality-gates` | GET | — | `{ gates, history, enforcement }` |
| `/api/cicd/management-rules` | GET | — | `{ branch_naming, merge_rules, ... }` |
| `/api/cicd/refresh` | POST | — | `{ ok: True }` |

**Pattern:** Mirror `api/skills.py`:
```python
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from services import cicd

router = APIRouter()

@router.get("/api/cicd/overview")
def api_cicd_overview() -> dict[str, object]:
    return cicd.get_overview_stats()
```

Auth, CSRF, correlation-id, idempotency — tự động qua middleware trong `server.py`.

---

### 3.3 `harness/hub/web-v3/src/lib/cicdApi.ts` — Frontend API Module

**Mô tả:** Typed API client, mirror `lib/vgovApi.ts`.

**Types:** `GithubStatus`, `OverviewStats`, `Workflow`, `WorkflowRun`, `BranchInfo`, `BranchesData`, `WorktreeInfo`, `CommitInfo`, `ActivityItem`, `ProjectHealth`, `ProjectsData`, `QualityGate`, `GateHistoryItem`, `QualityGatesData`, `ManagementRulesData`

**API object:**
```typescript
export const cicd = {
  overview: () => api<OverviewStats>('/api/cicd/overview'),
  githubStatus: () => api<GithubStatus>('/api/cicd/github-status'),
  workflows: () => api<Workflow[]>('/api/cicd/workflows'),
  workflowRuns: (id?: string, perPage = 30) => api<WorkflowRun[]>(...),
  branches: () => api<BranchesData>('/api/cicd/branches'),
  worktrees: () => api<WorktreeInfo[]>('/api/cicd/worktrees'),
  commits: (limit = 10) => api<CommitInfo[]>(...),
  activity: (limit = 20) => api<ActivityItem[]>(...),
  projects: () => api<ProjectsData>('/api/cicd/projects'),
  qualityGates: () => api<QualityGatesData>('/api/cicd/quality-gates'),
  managementRules: () => api<ManagementRulesData>('/api/cicd/management-rules'),
  refresh: () => api<{ ok: boolean }>('/api/cicd/refresh', { method: 'POST' }),
}
```

---

### 3.4 `harness/hub/web-v3/src/pages/CicdDashboardPage.tsx` — Dashboard Page

**Mô tả:** Page component chính với 5 tabs.

**Layout:** `flex h-full min-h-0 flex-col gap-space-4 p-space-6`

**Header:** Title + GitHub status badge (`Status` component) + Refresh button

**Tabs (5):**

1. **Overview** — Stat tiles grid (6 tiles: workflows, projects, tests, branches, worktrees, commits), pipeline status bar, recent activity table
2. **Pipelines** — Workflow list table (name, state, path), recent runs table (name, status, conclusion, branch, duration, time)
3. **Projects** — Health matrix table (name, tests, files, last modified, git, readme), branch status (local + remote counts), worktree table
4. **Quality Gates** — Gate definition cards (name, description, enabled, source), history table, enforcement status
5. **Management Rules** — Rules sections by category (branch naming, merge, lifecycle, age policy, deployment, data safety)

**Components used (all existing):**
- `Tabs`, `Panel`, `Status`, `Chip`, `Alert`, `Button`, `EmptyState` from `lib/ui.tsx`
- `Table`, `TableRow`, `TableCell`, `TableHeaderCell` from `lib/Table.tsx`
- `RunStatusBadge` from `lib/ui.tsx` for workflow conclusions

**Data loading:**
```typescript
useEffect(() => {
  let cancelled = false
  Promise.allSettled([
    cicd.overview(), cicd.githubStatus(), cicd.workflows(),
    cicd.workflowRuns(), cicd.branches(), cicd.worktrees(),
    cicd.commits(20), cicd.activity(20), cicd.projects(),
    cicd.qualityGates(), cicd.managementRules(),
  ]).then(results => {
    if (cancelled) return
    // Set state from results
  })
  return () => { cancelled = true }
}, [refreshKey])
```

**Error handling:**
- `ApiError` → `Alert variant="error"`
- GitHub unavailable → `Alert variant="warning"` + local data only
- Loading → skeleton or `EmptyState`

**Auto-refresh:** Optional, 60s interval, controlled by `refreshKey` state

---

### 3.5 `harness/hub/web-v3/src/lib/i18n/cicd.ts` — i18n Strings

**Mô tả:** ~60 keys cho dashboard. Pattern: `lib/i18n/skills.ts`

```typescript
export const cicd = {
  'cicd.title': 'CI/CD Dashboard',
  'cicd.tab.overview': 'Overview',
  'cicd.tab.pipelines': 'Pipelines',
  'cicd.tab.projects': 'Projects',
  'cicd.tab.quality': 'Quality Gates',
  'cicd.tab.rules': 'Management Rules',
  'cicd.overview.activeWorkflows': 'Active Workflows',
  'cicd.overview.projects': 'Projects',
  'cicd.overview.tests': 'Test Files',
  'cicd.overview.branches': 'Branches',
  'cicd.overview.worktrees': 'Worktrees',
  'cicd.overview.commits': 'Recent Commits',
  'cicd.overview.githubStatus': 'GitHub Connection',
  'cicd.overview.connected': 'Connected',
  'cicd.overview.disconnected': 'Disconnected',
  'cicd.overview.recentActivity': 'Recent Activity',
  'cicd.overview.pipelineStatus': 'Pipeline Status',
  'cicd.pipelines.workflowName': 'Workflow',
  'cicd.pipelines.status': 'Status',
  'cicd.pipelines.trigger': 'Trigger',
  'cicd.pipelines.lastRun': 'Last Run',
  'cicd.pipelines.duration': 'Duration',
  'cicd.pipelines.branch': 'Branch',
  'cicd.pipelines.noRuns': 'No recent workflow runs',
  'cicd.pipelines.runs': 'Runs',
  'cicd.pipelines.refresh': 'Refresh',
  'cicd.projects.health': 'Project Health',
  'cicd.projects.name': 'Project',
  'cicd.projects.tests': 'Tests',
  'cicd.projects.files': 'Files',
  'cicd.projects.lastModified': 'Last Modified',
  'cicd.projects.hasGit': 'Git',
  'cicd.projects.hasReadme': 'README',
  'cicd.projects.branchStatus': 'Branch Status',
  'cicd.projects.worktrees': 'Worktree Inventory',
  'cicd.projects.localBranches': 'Local Branches',
  'cicd.projects.remoteBranches': 'Remote Branches',
  'cicd.quality.gates': 'Quality Gates',
  'cicd.quality.name': 'Gate',
  'cicd.quality.description': 'Description',
  'cicd.quality.enabled': 'Enabled',
  'cicd.quality.source': 'Source',
  'cicd.quality.history': 'Gate History',
  'cicd.quality.result': 'Result',
  'cicd.quality.timestamp': 'Time',
  'cicd.quality.enforcement': 'Enforcement',
  'cicd.quality.enforced': 'Enforced',
  'cicd.quality.violations': 'Violations',
  'cicd.rules.branchNaming': 'Branch Naming',
  'cicd.rules.mergeRules': 'Merge Rules',
  'cicd.rules.lifecycle': 'Branch Lifecycle',
  'cicd.rules.agePolicy': 'Age Policy',
  'cicd.rules.deployment': 'Deployment Rules',
  'cicd.rules.dataSafety': 'Data Safety',
  'cicd.rules.pattern': 'Pattern',
  'cicd.rules.enforced': 'Enforced',
  'cicd.rules.yes': 'Yes',
  'cicd.rules.no': 'No',
  'cicd.loadFailed': 'Failed to load CI/CD data',
  'cicd.githubUnavailable': 'GitHub API unavailable',
  'cicd.githubReason': 'Reason: {reason}',
  'cicd.refreshing': 'Refreshing...',
  'cicd.refreshed': 'Data refreshed',
  'nav.cicd': 'CI/CD Dashboard',
  'nav.zone.cicd': 'CI/CD',
} as const
```

---

### 3.6 `.env` — GITHUB_TOKEN entry

Thêm vào `.env` hiện có (gitignored):
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

User cần tạo token với scope: `repo` (read branches, read commits), `actions:read` (read workflow runs).

---

## 4. Files to Modify (6 files)

### 4.1 `harness/hub/config.py`

Add near bottom (after existing constants):
```python
# CI/CD Dashboard
GITHUB_OWNER = os.environ.get("GITHUB_OWNER", "lechihuy-droid")
GITHUB_REPO = os.environ.get("GITHUB_REPO", "ai-project-opus")
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
CICD_CACHE_TTL_SECONDS = 300
```

### 4.2 `harness/hub/server.py`

Add import (~line 13):
```python
from api.cicd import router as cicd_router
```

Add to services import (~line 22):
```python
from services import (..., cicd, ...)
```

Register router (~line 160):
```python
app.include_router(cicd_router)
```

### 4.3 `harness/hub/web-v3/src/pages/index.tsx`

Add import:
```typescript
import CicdDashboardPage from './CicdDashboardPage'
```

Add to `pages` array:
```typescript
{ path: 'cicd', element: <CicdDashboardPage /> },
```

### 4.4 `harness/hub/web-v3/src/components/Sidebar.tsx`

Add import:
```typescript
import { ..., GitBranch } from 'lucide-react'
```

Add to `zones` array (new zone between monitoring and system):
```typescript
{ label: t('nav.zone.cicd'), items: [[GitBranch, t('nav.cicd'), '/cicd']] },
```

### 4.5 `harness/hub/web-v3/src/lib/i18n/index.ts`

Add import:
```typescript
import { cicd } from './cicd'
```

Add to `en` merge:
```typescript
export const en = { ..., ...cicd } as const
```

### 4.6 `harness/hub/web-v3/src/components/Topbar.tsx`

Add to `titles` map:
```typescript
cicd: t('nav.cicd'),
```

---

## 5. Implementation Order

| Step | File | Depends On |
|---|---|---|
| 1 | `config.py` — add constants | None |
| 2 | `services/cicd.py` — service layer | Step 1 |
| 3 | `api/cicd.py` — API router | Step 2 |
| 4 | `server.py` — register router | Steps 2-3 |
| 5 | `lib/cicdApi.ts` — frontend API | Step 3 (type shapes) |
| 6 | `lib/i18n/cicd.ts` — i18n strings | None |
| 7 | `lib/i18n/index.ts` — merge cicd i18n | Step 6 |
| 8 | `pages/CicdDashboardPage.tsx` — dashboard page | Steps 5-7 |
| 9 | `pages/index.tsx` — add route | Step 8 |
| 10 | `Sidebar.tsx` — add nav entry | Step 6 |
| 11 | `Topbar.tsx` — add title | Step 6 |

**Batch strategy:**
- **Batch A (backend):** Steps 1-4 — config + service + router + server wiring
- **Batch B (frontend prep):** Steps 5-7 — API module + i18n
- **Batch C (frontend page):** Step 8 — dashboard page (largest file)
- **Batch D (wiring):** Steps 9-11 — route + nav + title

---

## 6. Key Reference Files

| File | Pattern |
|---|---|
| `harness/hub/services/gitjobs.py` | Git subprocess via `security.subprocess_env()` |
| `harness/hub/api/skills.py` | API router pattern |
| `harness/hub/api/system.py` | httpx proxy pattern |
| `harness/hub/services/governance.py` | JSON state persistence |
| `harness/hub/web-v3/src/lib/vgovApi.ts` | Frontend API module |
| `harness/hub/web-v3/src/pages/VgovReleasesPage.tsx` | Simple page pattern |
| `harness/hub/web-v3/src/pages/SkillsPage.tsx` | Full page pattern (search + filters + pagination) |
| `harness/hub/web-v3/src/lib/i18n/skills.ts` | i18n pattern |
| `harness/hub/web-v3/src/lib/ui.tsx` | UI components (Button, Alert, Status, Tabs, Panel, etc.) |
| `harness/hub/web-v3/src/lib/Table.tsx` | Table components |
| `harness/hub/web-v3/src/lib/api.ts` | Core API client |

---

## 7. Verification

| Check | Command / Action | Expected |
|---|---|---|
| Backend API | `curl localhost:8799/api/cicd/overview -H "X-Hub-Token: $(cat harness/hub/runtime/store/hub-token)"` | Valid JSON with stats |
| GitHub status | `curl localhost:8799/api/cicd/github-status -H "X-Hub-Token: ..."` | `{ available: true }` or `{ available: false, reason: "..." }` |
| Frontend | Navigate to `http://localhost:8799/#/cicd` | All 5 tabs render |
| Error handling | Remove GITHUB_TOKEN from .env → restart | Dashboard shows local data + warning alert |
| Build | `cd harness/hub/web-v3 && pnpm build` | No TypeScript errors |
| Lint | `cd harness/hub/web-v3 && npx oxlint src/` | No lint errors |
| Encoding | `node scripts/check-encoding.mjs` | Pass (required by build script) |

---

## 8. Pre-requisites

1. **GITHUB_TOKEN** trong `.env` — user cần tạo với scope `repo` + `actions:read`
2. **Hub đang chạy** — `python -m uvicorn hub.server:app --reload` hoặc `./open-hub.ps1`
3. **pnpm installed** — `cd harness/hub/web-v3 && pnpm install`
4. **httpx installed** — already in `requirements-hub.txt`

---

## 9. Potential Challenges

| Challenge | Mitigation |
|---|---|
| GitHub API rate limit (60/h unauth, 5000/h with token) | Token required + 5-min cache |
| `gh` CLI not installed | Fallback to httpx with env token |
| Large repo (many branches/runs) | `per_page` param + server-side cache |
| Subproject detection heuristic | Top-level non-hidden dirs; can add explicit config later |
| Worktree porcelain format varies | Defensive parser, handle missing fields |
| Encoding check fails on new files | Ensure UTF-8, no BOM, LF line endings |

---

## 10. Out of Scope (Future)

- Automated branch cleanup (nightly workflow) — separate task
- CI gate enforcement (branch protection on GitHub) — manual setup
- Real-time SSE streaming for workflow runs — enhancement
- Dark mode specific charts — uses existing theme tokens
- Multi-repo support — single repo for now

---

## 11. Decision Log

| Decision | Rationale |
|---|---|
| Integrate into Harness Hub (not standalone) | Reuse existing auth, UI components, routing, patterns |
| GitHub API via httpx (not PyGithub) | No new dependency, matches existing proxy pattern |
| In-memory cache (not Redis/file) | Simple, matches governance.py pattern |
| 5 tabs matching static dashboard | User already familiar with the layout |
| Token from .env (not GitHub Secrets) | Local dev only; CI workflows use GitHub Secrets separately |
| Graceful degradation (no crash) | Multi-agent workspace needs resilience |

---

*End of handoff. Agent Main: review plan → approve → implement.*