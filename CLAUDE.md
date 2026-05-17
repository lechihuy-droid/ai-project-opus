# AI Workspace — Global Rules

Parent-level context for all projects under `C:/Users/HUY/AI/`.

---

## SDD — Spec-Driven Development (MANDATORY)

**Rule:** Do not code any new feature without an approved Requirements Doc (RD).

**Toolkit:** `C:/Users/HUY/AI/SDD-toolkit/`
- Process: `SDD-toolkit/workflow/sdd-process.md`
- Checklist: `SDD-toolkit/workflow/checklist.md`
- Templates: `SDD-toolkit/templates/` (RD, SD, BD, BACKLOG)
- Bootstrap new project: `python SDD-toolkit/scripts/scaffold.py`

**Phase gates:**
1. **RD** (Requirements Doc) — usage-first, functional reqs, open questions → APPROVE before design
2. **SD** (System Design) — architecture, interface contracts → APPROVE before build
3. **BD** (Build Plan) — step-by-step, test plan → APPROVE before code
4. **Implementation** — follow BD, no scope creep
5. **Review** — test checklist pass → Done

**When to skip RD:** Bug fix < 1h, config change, adding <20 clearly scoped lines.

---

## Workflow Orchestration

### Plan Mode
- Task with 3+ steps → enter plan mode first (`/plan`), write spec, wait for approval
- If going off-track mid-task → STOP, re-plan immediately, do not continue
- Simple bug report → fix directly, no plan needed

### Subagent Strategy
- Use subagents to keep the main context window clean
- One subagent = one specific task, never vague multi-purpose tasks
- Complex problems: break into pieces + throw more compute, don't cram into one conversation

### Self-Improvement Loop
- After any correction: write a new rule into `tasks/lessons.md` (if file exists)
- Rules must be specific enough to prevent that exact mistake — no generic platitudes
- Re-read `lessons.md` at session start if the file exists

### Verification Before Done
- Never mark a task complete without proving it works
- Self-check: "Would a staff engineer approve this?" — if not, fix it first
- Run tests, check logs, demonstrate correctness — never assume

---

## Coding Behavior (Karpathy Principles)

**Tradeoff:** These rules prioritize correctness over speed. Use judgment for simple tasks.

### 1. Think Before Coding
- State assumptions explicitly before coding. If unsure, ask.
- If a request has multiple interpretations, present all of them — never silently pick one.
- If there's a simpler approach, say so. Push back when warranted.

### 2. Simplicity First
- Write the minimum code that correctly solves the problem. No unrequested features.
- No abstractions for single-use code. No "flexibility" or "configurability" nobody asked for.
- No error handling for scenarios that cannot happen.
- Ask: "Would a senior engineer call this overcomplicated?" — if yes, rewrite.

### 3. Surgical Changes
- Only touch code directly related to the request. Do not "improve" surrounding code.
- Do not refactor what isn't broken. Preserve existing style.
- If unrelated dead code is spotted — mention it, do not delete it.
- Every changed line must be traceable to the user's request.

### 4. Goal-Driven Execution
- Convert vague tasks into concrete, verifiable criteria before starting.
- For multi-step tasks, state the plan as: `[Step] → verify: [check]`
- For bugs: write a test that reproduces the bug first, then fix.

---

## Python

- Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Use `.env` for credentials, never hardcode
- Do not modify files in `raw/` — immutable sources

## Shell / Scheduler

- Use Windows Task Scheduler instead of cron
- Bash tool: use `cmd //c "schtasks ..."` for Task Scheduler commands
- **Response language: Vietnamese** — keep responses concise

## Projects

| Folder | Description |
|---|---|
| `opus-animus/` | Personal AI agent — knowledge accumulation + self-transformation |
| `SDD-toolkit/` | Reusable SDD methodology (templates, checklist, scaffold) |
| `html-kit/` | Shared HTML/CSS/JS kit for self-contained document output |

---

## HTML Output Kit

**Rule:** Khi tạo documentation, report, diagram, comparison, hoặc bất kỳ structured output — ưu tiên single self-contained HTML file thay vì markdown.

**Kit location:** `C:/Users/HUY/AI/html-kit/`

| File | Vai trò |
|---|---|
| `styles.css` | McKinsey-style shared stylesheet — **không bao giờ output lại trong HTML** |
| `diagram.js` | SVG renderer cho flowchart + sequence diagram từ JSON |
| `template.html` | Khung HTML tối giản với đầy đủ component examples |

**Token saving:** Link CSS externally thay vì inline `<style>` → tiết kiệm ~44% tokens.

```html
<link rel="stylesheet" href="./styles.css">
<script src="./diagram.js" defer></script>
```

### Khi nào dùng HTML

| Use case | Format |
|---|---|
| So sánh options, trade-off | Cards + compare 2 cột |
| Sprint report, incident post-mortem | Cards + timeline + table |
| Code review, PR writeup | Diff + annotated sections |
| Architecture, API flow | Flowchart / Sequence diagram |
| Research, explainer | Tabs + collapsible |
| Presentation | Slide deck |

### Diagram — JSON only, không viết SVG tay

**Flowchart** (shapes: `rect`, `diamond`, `terminal`):
```html
<div class="diagram" data-chart='{
  "type": "flow",
  "nodes": [{"id":"s","label":"Start","shape":"terminal"}, ...],
  "edges": [{"from":"s","to":"d","label":"Yes"}, ...]
}'></div>
```

**Sequence** (`"return": true` → dashed arrow):
```html
<div class="diagram" data-chart='{
  "type": "sequence",
  "actors": ["Client","API","DB"],
  "steps": [{"from":"Client","to":"API","msg":"POST /login"}, ...]
}'></div>
```

### CSS classes nhanh

`badge` `badge green/red/gray/navy` · `card` `card-grid` · `compare` · `callout` `callout warn/risk` · `timeline` · `tabs` + `tab-btn` + `tab-panel` · `details/summary` · `diff-add` `diff-del` `diff-ctx` · `diagram`

**Slash command:** `/html [mô tả]` — available in Claude Code

---

## Session Start — MANDATORY (project có `ai/` folder)

**STOP. Trước khi response message đầu tiên — ask:**

> "Bạn muốn **tiếp tục** session trước hay **bắt đầu mới**?
> - Tiếp tục → tôi sẽ đọc `ai/status.md` và `ai/handoff-claude.md` của project hiện tại
> - Mới → cho tôi biết bạn muốn làm gì"

**Do NOT skip this even if:**
- The user's first message seems like a clear task
- The user jumps straight into a question
- The project context seems obvious

**Exception:** Skip nếu user nói rõ "fresh start" / "bắt đầu mới" trong message đầu, HOẶC project hiện tại không có folder `ai/`.

**Project root detection:** Walk up từ cwd cho đến khi tìm folder có subfolder `ai/`. Nếu không có (vd `html-kit/`, `apps/pmp-quiz/` chưa setup) → skip Session Start, làm việc bình thường.

---

### Nếu user chọn Continue:
1. Read `ai/status.md` — current owner + objective + active sub-systems
2. Read `ai/handoff-claude.md` (owner Claude) HOẶC `ai/handoff-codex.md` (owner Codex theo status.md) — exact next action
3. Confirm: "Tôi hiểu task hiện tại là [X], tiếp tục từ bước [Y]. Đúng không?"
4. Wait for user confirmation before proceeding

### Nếu session involves opus-animus (after the above):
- Ask "Bạn muốn làm việc với sub-system nào?" — list từ `opus-animus/ai/status.md`
- Read only that section của `todo.md`
- Track progress với TaskCreate/TaskUpdate trong session

---

### End of session — type `/handoff`:

Slash command `/handoff` (global, ở `~/.claude/commands/handoff.md`) sẽ:
1. Auto-detect project root (folder gần nhất có `ai/`)
2. Overwrite `ai/handoff-claude.md` (Claude) theo schema
3. Update `ai/status.md` (current owner + updated date)
4. Tạo `ai/sessions/YYYY-MM-DD-[task].md`
5. Update `todo.md` nếu có

**Schema chuẩn:** `ai/status.md` chứa state owner-agnostic (objective, sub-systems, locked decisions). `ai/handoff-{owner}.md` chứa state per-tool (exact next action, files touched, validation). KHÔNG duplicate "next step" giữa hai file.

## CLI — Use terminal instead of sidebar for long sessions

```
claude --resume      # resume most recent session
claude --continue    # same
```
Sidebar extension may lose history index. Terminal is more stable for long-running work.
