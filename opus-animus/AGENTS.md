# AGENTS.md — opus-animus

Project state lives in:
- `ai/status.md` — current objective + active sub-system
- `todo.md` — task details per sub-system

Session start:
- Use the user's latest instruction as the active task.
- Read `ai/status.md` only when the user asks to resume prior project state or the task depends on current project ownership.
- Do not use retired Codex handoff anchors.

Rules:
- Do not rely on conversation history as source of truth for project goals
- No new feature without RD doc approved (see `dev-approach/README.md`)
- No changes to files in `raw/` — immutable sources
- Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Windows Task Scheduler instead of cron

During work:
- Keep current task aligned with `ai/status.md`
- If making architecture decisions → note in `docs/` (SA-system-architecture.md)
- Do not update `ai/status.md`, session logs, or `todo.md` after every small command.
- Only update project-state files at meaningful checkpoints: task switch, completed slice, before stopping, after risky context-changing work, or when the user explicitly asks for handoff/status persistence.
- For normal implementation steps, command runs, smoke tests, and small UI/code edits, report status in chat only.

When user says "cập nhật trạng thái":
1. Review entire conversation
2. Update `ai/status.md`: objective + next step + current owner
3. Create session log at `ai/sessions/YYYY-MM-DD-[task].md`
4. Update `todo.md` with completed items

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

For Lucida, do not use `ai/status.md` or Codex handoff files as the live handoff source. The live resume files are:

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
