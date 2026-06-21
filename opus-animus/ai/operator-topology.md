# Opus Operator Topology

**Status:** test
**Owner:** Codex / Claude / ChatGPT
**Purpose:** Map operator surfaces to the Opus ai control layer and execution subsystems after the OneDrive → Git migration.

---

## Summary

Opus is a Git-based AI workspace. Multiple operator surfaces can interact with it, but durable behavior should be routed through a repo-owned control layer.

```text
Operator surfaces
ChatGPT / Codex / Claude Code / Scheduler / Telegram / GitHub connector
        ↓
Opus ai layer
status.md / handoff / PACK.md / skill loop / scheduler-ops / eval loop
        ↓
Execution subsystems
Consilium / Lucida / GitHub repo / personal-wiki / local jobs / Telegram outputs
```

This file is a topology map, not an automation runtime.

```text
Topology = routing map
Command gateway = button / command queue
Scheduler or daemon = execution engine
```

---

## Core Principle

Do not let each tool invent its own workflow.

Use the Opus ai layer to decide:

- which subsystem owns the task
- which pack or control artifact should be loaded
- whether the task is read-only, write-capable, or runtime-dependent
- whether the update requires user approval
- whether the output should be a chat answer, wiki update, repo commit, scheduler run, or handoff
- how the result should be verified

---

## Operator Surfaces

| Surface | Role | Can Read | Can Write / Trigger | Main Risk | Required Gate |
|---|---|---|---|---|---|
| ChatGPT | analysis, strategy, research, wiki planning, GitHub edits through connector | chat context, web, GitHub connector when requested | GitHub file updates through connector; cannot run local scripts directly | memory drift, wrong repo/path, over-promoting discussion | use pack; return changed files + commit hash + decision label |
| Codex | repo execution and code/file changes | local repo, AGENTS.md, project files | local file edits, tests, commits if configured | over-editing, loading wrong context, missing user intent | read status/handoff and relevant pack first |
| Claude Code | local agentic execution | local repo, hooks, scripts, project files | local file edits, commands, hooks if configured | context compaction, too much autonomy, local state drift | use handoff; verify outputs; avoid broad rewrites |
| Windows Task Scheduler | runtime automation | local config and Python entrypoints | runs collect/daily/weekly jobs | stale config, timezone drift, hidden failures | use scheduler-ops; dry-run before changing schedule |
| Telegram | notification / lightweight command surface | received messages / output links | notification only by default; commands require gateway | noise, accidental action from short command | require explicit command gateway before writes |
| GitHub connector | remote repo access from ChatGPT | repo files, commits, PRs | create/update files and commits | wrong path, stale SHA, conflicting edits | fetch before update; smallest safe edit |

---

## Opus ai Layer

The Opus ai layer is the repo-owned control plane for agentic operation.

It does not replace Consilium, Lucida, GitHub, or personal-wiki. It routes work to the right subsystem, stores current state and handoff context, defines task-specific packs, documents scheduler behavior, and provides feedback loops for improving skills without bloating `AGENTS.md`.

Current artifacts:

| Artifact | Role |
|---|---|
| `opus-animus/ai/status.md` | current state of active subsystems and next steps |
| `opus-animus/ai/handoff-*.md` | transfer package between tools, sessions, or operators |
| `opus-animus/ai/plugin-packs/wiki-ops/PACK.md` | chat/research/task → durable wiki update workflow |
| `opus-animus/ai/plugin-packs/news-research/PACK.md` | Tech / CEO / Competitor research filtering workflow |
| `opus-animus/ai/skill-optimization-loop.md` | bounded-edit loop for improving packs from failures |
| `opus-animus/ai/scheduler-ops.md` | scheduler job map and runtime notes |
| `opus-animus/ai/wiki-eval-loop.md` | planned eval artifact for wiki intake and replay cases |
| `opus-animus/ai/operator-topology.md` | this topology map |

---

## Execution Subsystems

| Subsystem | Role | Owned Artifacts |
|---|---|---|
| Consilium | decision brain, research, wiki intelligence, daily/weekly radar | `opus-animus/opus-consilium/`, `personal-wiki/`, collect/daily/weekly scripts |
| Lucida | artifact/content engine for slides, HTML, video, Japanese learning outputs | `opus-animus/opus-lucida/` and future Lucida design pack |
| GitHub repo | source of truth, audit trail, versioning, rollback | commits, Markdown, code, configs |
| personal-wiki | durable knowledge memory | Strategy, AI, Business, FDE, Stock, Personal pages |
| Scheduler jobs | local automation runtime | `run_collect.py`, `run_daily.py`, `run_weekly.py`, logs, raw/articles |
| Telegram outputs | notification and reading surface | reading lists, daily/weekly links, future commands if gateway exists |

---

## Routing Rules

### News / CEO / Competitor Research

```text
User asks: news, CEO brief, competitor signal, business radar, tech learning
→ read/use news-research/PACK.md
→ separate lanes: Tech Learning / CEO Business / Competitor Intelligence
→ apply source confidence, source mix, anti-repetition, action impact
→ no wiki update unless durable and user asks apply/update
```

### Strategic Article / Threat Lens

```text
User provides McKinsey / Gartner / arXiv / strategy article
→ classify as strategic_lens, threat_lens, or evidence
→ default target: Strategy layer, not daily news
→ update Strategy page only when user asks vault/wiki/apply
```

Primary target:

```text
opus-animus/opus-consilium/personal-wiki/Strategy/agentic-operating-model.md
```

### Wiki / Vault Update

```text
User asks: add to wiki, in vault, apply, update
→ use wiki-ops/PACK.md
→ classify insight
→ choose smallest correct page
→ no transcript / no raw dump
→ update only smallest safe section
→ return changed files, commit hash, decision label
```

### Scheduler Diagnosis / Runtime Jobs

```text
User asks: scheduler, daily job, collect, weekly, Telegram output
→ read scheduler-ops.md
→ diagnose code/config/status
→ ChatGPT can edit repo docs/config via GitHub connector
→ ChatGPT cannot run local Windows Task Scheduler directly
→ if local run needed, create handoff or command-gateway task
```

### Skill / Pack Failure

```text
User says: output was wrong, too tech, repeated, wrong target, missing CEO angle
→ use skill-optimization-loop.md
→ score failure
→ diagnose root cause
→ propose bounded edit
→ apply only if accepted
```

### Lucida Artifact Work

```text
User asks: slides, HTML content engine, video, Japanese learning artifact
→ route to Lucida subsystem
→ use current Lucida handoff/status if present
→ future: lucida-design/PACK.md
```

---

## Write Gates

Before any repo write, check:

```text
Intent: what did the user ask?
Target subsystem: Consilium / Lucida / ai layer / scheduler / wiki
Target file: exact path
Write permission: explicit apply/update/vault request?
Edit size: smallest safe edit?
Source confidence: enough for durable update?
Regression risk: could this break an existing route or pack?
Return contract: changed files + commit hash + decision label
```

Blocked writes:

- raw transcript dump
- raw news/article dump
- broad rewrite when a small section is enough
- new page when hub update is enough
- AGENTS.md expansion for workflow-specific rules
- local runtime claims without an actual runtime bridge
- editing scheduler runtime behavior without dry-run or handoff

---

## Runtime Boundary

ChatGPT can:

- analyze repo files
- fetch public sources when needed
- update GitHub files through connector
- create Markdown control artifacts
- prepare handoff instructions

ChatGPT cannot directly:

- run Windows Task Scheduler
- execute local Python jobs on Huy's machine
- access local files not in repo or upload context
- trigger Telegram bot runtime unless a command gateway exists

If a command requires local execution, use one of:

```text
manual handoff
GitHub command queue
local poller / daemon
Telegram command gateway
Codex / Claude local execution
```

---

## Control-Plane Artifacts To Build Next

Priority order:

1. `wiki-eval-loop.md` — eval targets, failure taxonomy, replay cases for wiki/vault updates.
2. `surface-compliance-matrix.md` — surface-by-surface capability and risk matrix.
3. `observability-readiness.md` — readiness gate before increasing automation.
4. `command-gateway.md` — optional design for ChatGPT/GitHub/Telegram → local runtime triggering.
5. `lucida-design/PACK.md` — task-specific pack for Lucida artifact generation.

---

## Replay Examples

### Example 1 — Daily research

```text
Input: Chạy tin hôm nay
Route: news-research/PACK.md
Output: brief only
Write: no update unless user asks apply/update
```

### Example 2 — Strategic article

```text
Input: Đọc bài McKinsey này, trong vault
Route: Strategy layer via wiki-ops/PACK.md
Target: Strategy/agentic-operating-model.md
Write: hub evidence or strategic lens section
```

### Example 3 — Threat paper

```text
Input: Add End of Software Engineering as threat lens
Route: Strategy layer
Target: Strategy/agentic-operating-model.md
Write: threat lens evidence and watch criteria
```

### Example 4 — Local scheduler run

```text
Input: Chạy run_collect.py thật
Route: scheduler-ops.md
ChatGPT action: explain/handoff; cannot run local job directly
Runtime action: Codex/Claude/local scheduler/command gateway runs it
```

---

## Decision Label

`test`
