# AGENTS.md — opus-animus

Project state lives in:
- `ai/status.md` — current objective + active sub-system
- `ai/handoff-codex.md` — exact next action (Codex-specific)
- `todo.md` — task details per sub-system

Session start — mandatory first message:

> "Bạn muốn **bắt đầu mới** hay **tiếp tục từ context cũ**?
> - Tiếp tục → tôi sẽ đọc `ai/status.md` và `ai/handoff-codex.md`
> - Mới → cho tôi biết muốn làm gì"

If user chọn tiếp tục:
1. Read `ai/status.md`
2. Read `ai/handoff-codex.md`
3. Confirm: "Tôi hiểu task hiện tại là [X], tiếp tục từ [bước Y]. Đúng không?"
4. Ask which sub-system to work on, confirm against status.md

Rules:
- Do not rely on conversation history as source of truth for project goals
- No new feature without RD doc approved (see `dev-approach/README.md`)
- No changes to files in `raw/` — immutable sources
- Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Windows Task Scheduler instead of cron

During work:
- Keep current task aligned with `ai/status.md`
- If making architecture decisions → note in `docs/` (SA-system-architecture.md)
- Do not update `ai/status.md`, `ai/handoff-codex.md`, session logs, or `todo.md` after every small command.
- Only update project-state files at meaningful checkpoints: task switch, completed slice, before stopping, after risky context-changing work, or when the user explicitly asks for handoff/status persistence.
- For normal implementation steps, command runs, smoke tests, and small UI/code edits, report status in chat only.

When user says "cập nhật handoff":
1. Review entire conversation
2. Fill `ai/handoff-codex.md`: task done, exact next action, files touched, risks
3. Update `ai/status.md`: objective + next step + current owner
4. Create session log at `ai/sessions/YYYY-MM-DD-[task].md`
5. Update `todo.md` with completed items

Resume CLI (use terminal, not sidebar):
- `codex resume --last`

---

## Project Override: opus-lucida

If working inside `opus-lucida/`, follow `opus-lucida/AGENTS.md`.

When the user sends exactly `/handoff` while the active task is Lucida-related:

1. Update `opus-lucida/HANDOFF.md`
2. Update `opus-lucida/STATUS.md`
3. Create a session log under `opus-lucida/ai/sessions/` only if that folder exists
4. Report files updated and the exact next action

For Lucida, do not use `ai/status.md` or `ai/handoff-codex.md` as the live handoff source. The live resume files are:

```text
opus-lucida/STATUS.md
opus-lucida/HANDOFF.md
```

---

## HTML Output

When asked to produce documentation, reports, comparisons, diagrams, or any
structured output — generate a single self-contained HTML file instead of
markdown. The file must work offline (no CDN), inline all CSS and JS, and
match one of these formats: exploration/planning, code review, design,
prototyping, diagrams, decks, research, reports, or custom editors.
See full guidance: https://thariqs.github.io/html-effectiveness/
