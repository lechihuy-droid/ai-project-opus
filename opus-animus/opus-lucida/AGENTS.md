# AGENTS.md - Opus Lucida

## Slash Commands

### `/handoff`

When the user sends exactly `/handoff`, treat it as a command, not a normal chat message.

Run the Lucida handoff workflow:

1. Review the current session and identify:
   - task being worked on
   - work completed
   - exact next actions
   - files touched or created
   - risks / blockers
   - validation commands and results
2. Update `ai/handoff-codex.md` (Codex) hoặc `ai/handoff-claude.md` (Claude) với:
   - active task
   - đã làm trong session
   - exact next action
   - files touched
   - risks / cần kiểm tra
   - validation commands
   - locked decisions (không re-open)
3. Update `ai/status.md` với:
   - current direction
   - current focus
   - locked decisions
   - active sub-systems / lane status
   - current risks
   - active truth files
   - current owner
4. Tạo session log: `ai/sessions/YYYY-MM-DD-[short-task-name].md`
5. Không tạo process file mới cho handoff trừ khi user yêu cầu.
6. Reply với:
   - files updated
   - session log path
   - exact next action

Lucida resume source of truth:

```text
ai/status.md
ai/handoff-codex.md     # nếu Codex là current owner
ai/handoff-claude.md    # nếu Claude là current owner
```

Không dùng old ad-hoc context files làm live handoff source.

## Project Rules

- Keep responses concise and in Vietnamese unless the user asks otherwise.
- Do not let LLM / agents generate raw HTML/CSS for Lucida slide production.
- Current slide architecture direction is:

```text
Skeleton / slide plan -> typed JSON -> deterministic renderer -> screenshots -> QA
```

- For the schema-first prototype, the main app is:

```text
apps/schema-html-prototype/
```

- Before starting new Lucida work after a resume, read:

```text
ai/status.md
ai/handoff-{owner}.md     # owner là codex hoặc claude
11-current-operating-flow.md
```
