# SD + BD — Opus Runtime (Option A) — Phase 1
**Date:** 2026-06-28 · **Status:** 🟡 In Review · **Author:** Claude (Opus 4.8)
**Upstream:** `RD-opus-runtime.md` (Q1 = **Option A** chốt: job orchestrator + git checkpoint, no API key)
**Thực thi:** Codex implement + test. Claude review.

---

## A. Kiến trúc (Option A)

Gắn vào **Hub server** (tái dùng SSE/UI/boundary). Agent job chạy trong **git worktree cô lập** off HEAD → KHÔNG đụng working tree user. HITL = gate **trước khi chạy** (approve brief/scope) + **sau khi chạy** (review diff → accept/rollback). Rollback an toàn vì mọi thay đổi nằm trong worktree riêng.

```
Hub UI #/jobs ── POST /api/jobs ──> tạo worktree (git worktree add) + job record (awaiting-approval)
   │  [GATE] Approve ─ POST /api/jobs/{id}/approve ─> spawn agent (codex exec --cd <worktree>)
   │                                                   status=running, SSE stream stdout
   │  GET /api/jobs/{id}/stream (SSE) ── live log + budget (time/steps cap, kill nếu vượt)
   │  agent exit ─> status=awaiting-review, tính git diff trong worktree
   │  [GATE] Accept  ─ POST .../accept   ─> giữ thay đổi (commit trong worktree), status=accepted
   │        Rollback ─ POST .../rollback ─> git reset --hard base, status=rolledback
   │        Reject   ─ POST .../reject   ─> gỡ worktree (chưa chạy), status=rejected
```

**An toàn:** agent chạy `cwd = worktree`. Dùng codex `-s workspace-write` (giới hạn ghi trong cwd) thay vì full bypass khi có thể; nếu workspace-write gây treo approval thì fallback bypass nhưng worktree vẫn là ranh giới chính. Gate approve-before-run là chốt chặn người.

---

## B. Data contract

### Job
```json
{ "id": "j-20260628-...", "brief": "<text>", "agent": "codex",
  "status": "awaiting-approval|running|awaiting-review|accepted|rolledback|rejected|failed",
  "worktree": "<abs path>", "branch": "opus-job/<id>", "base_sha": "<sha>",
  "created_at": "ISO", "started_at": "ISO|null", "finished_at": "ISO|null",
  "exit_code": null, "diffstat": { "files": 0, "insertions": 0, "deletions": 0 },
  "log": "jobs/<id>/stdout.log" }
```
Lưu tại `harness/hub/jobs/<id>/job.json` + `stdout.log` + `diff.patch` (khi review). `.cache`/`jobs` đã/được gitignore.

### Config thêm (`config.py`)
`JOBS_DIR = HUB_DIR / "jobs"`, `JOB_AGENT_CMD` (mặc định codex), `JOB_TIME_CAP_SECONDS = 1800`, `JOB_ALLOW_AGENTS = {"codex"}`.

---

## C. REST API (gắn vào hub server.py)

| Method | Path | Việc |
|---|---|---|
| GET | `/api/jobs` | list job (desc theo created_at) |
| POST | `/api/jobs` | body `{brief, agent?}` → tạo worktree + job (awaiting-approval) |
| GET | `/api/jobs/{id}` | job detail + diff (nếu có) |
| POST | `/api/jobs/{id}/approve` | spawn agent, status=running |
| GET | `/api/jobs/{id}/stream` | SSE stdout + exit |
| POST | `/api/jobs/{id}/accept` | commit trong worktree, status=accepted |
| POST | `/api/jobs/{id}/rollback` | git reset --hard base_sha, status=rolledback |
| POST | `/api/jobs/{id}/reject` | gỡ worktree, status=rejected |
| GET | `/api/jobs/{id}/diff` | trả `diff.patch` (text) |

Validate: `agent ∈ JOB_ALLOW_AGENTS`; `{id}` khớp regex `j-[0-9a-z-]+` và phải tồn tại trong JOBS_DIR (không dùng làm path thô — chống traversal); mọi path qua boundary.

---

## D. Build Plan — Phase 1 (giao Codex)

> FRESH START, do not ask. cwd = project root. Python: `.ih\Scripts\python.exe`. Chỉ tạo/sửa trong `harness/hub/`. Tránh non-ASCII punctuation trong source. Không LLM, không gói mới.

**Step 1 — `services/gitjobs.py` (core, no HTTP):**
- `create_job(brief, agent)`: validate agent; tạo `id`; `base_sha = git rev-parse HEAD`; `git worktree add -b opus-job/<id> <JOBS_DIR>/<id>/wt <base_sha>`; ghi job.json (awaiting-approval). Trả Job.
- `list_jobs()`, `get_job(id)` (id-validate, đọc job.json).
- `approve(id)`: nếu status!=awaiting-approval → ValueError; spawn `{agent_cmd} exec --cd <wt> -s workspace-write <brief>` (codex), stream lines (giống trigger.py); status=running→ on exit: status=awaiting-review, exit_code, tính `git -C <wt> diff <base_sha> --stat` → diffstat, lưu `git -C <wt> diff <base_sha> > diff.patch`. Time-cap kill khi vượt JOB_TIME_CAP_SECONDS.
- `accept(id)`: `git -C <wt> add -A && git -C <wt> commit -m "opus-job <id>"`; status=accepted.
- `rollback(id)`: `git -C <wt> reset --hard <base_sha>` + `git -C <wt> clean -fd`; status=rolledback.
- `reject(id)`: chỉ khi chưa chạy; `git worktree remove --force <wt>`; status=rejected.
- `diff(id)`: trả nội dung diff.patch.
- → verify: `tests/test_gitjobs.py` dùng một **repo git tạm** (tmp_path, git init, vài commit) chứ KHÔNG đụng repo thật: create→approve(agent giả: monkeypatch spawn để ghi 1 file)→awaiting-review có diffstat→rollback đưa worktree về sạch; reject gỡ worktree.

**Step 2 — endpoints (server.py) + boundary/validate** theo bảng C. Mock-test trong `test_api.py`: tạo job với agent lạ → 400; id traversal → 404.

**Step 3 — UI `#/jobs`:**
- Nav thêm "Jobs". List job (id, status badge, diffstat, created). Form tạo job (textarea brief + chọn agent). Job detail: nút **Approve / Reject** (khi awaiting-approval), panel **SSE stream** + budget (khi running), **diff view** + nút **Accept / Rollback** (khi awaiting-review).
- Tái dùng SSE pattern + renderBudget của Hub. Diff render đơn giản (pre/code, tô màu +/- như html-kit diff).

**Step 4 — gitignore:** thêm `jobs/` vào `harness/hub/.gitignore`.

**TEST tổng:** `.ih\Scripts\python.exe -m pytest harness/hub/tests -q` GREEN; `node --check harness/hub/web/app.js` pass. KHÔNG test trên repo thật (chỉ tmp git repo).

**Definition of Done Phase 1:** tạo job → approve → agent chạy trong worktree (không đụng working tree chính) → review diff → accept hoặc rollback hoạt động; pytest xanh; UI #/jobs thao tác được.

---

## E. Phase sau (không làm bây giờ)
- Phase 2: audit trail đầy đủ + budget token (khi agent có usage) + scope-violation warning (diff đụng path ngoài ý muốn).
- Phase 3: Option B (Agent SDK per-tool HITL) — RD riêng, cần API key.

---

*Opus Runtime — SD+BD Phase 1 | 2026-06-28*
