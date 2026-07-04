# Opus Runtime Agent

**Status:** test
**Owner:** Codex / Claude / ChatGPT / Local Runner
**Purpose:** Define how Opus can move from control-plane documents to a safe runtime agent that executes approved local jobs.

---

## Summary

Opus currently has a control plane:

```text
operator-topology.md
wiki-eval-loop.md
skill-optimization-loop.md
scheduler-ops.md
plugin-packs/*/PACK.md
```

The missing layer is a runtime bridge:

```text
ChatGPT / GitHub / Telegram / Codex / Claude
        ↓
Command request
        ↓
Local Runtime Agent
        ↓
Approved job execution
        ↓
Logs / artifacts / Telegram / GitHub report
```

This file defines the target runtime agent. It does not mean the runtime is already implemented.

---

## Core Principle

The runtime agent must be conservative.

```text
No automatic execution without an explicit command.
No destructive write without allowlist and confirmation.
No local claim without logs.
No autonomy increase before observability.
```

The goal is not to create an all-powerful agent. The goal is to create a small, auditable command gateway for known Opus jobs.

---

## Runtime Boundary

### ChatGPT Can

- inspect and edit GitHub repo files through connector
- prepare command requests
- update reading list / wiki / pack docs
- summarize logs if they are committed or provided
- propose safe commands

### ChatGPT Cannot Directly

- run Windows Task Scheduler
- execute local Python jobs on Huy's machine
- read local env vars or local-only files
- trigger Telegram bot runtime unless a gateway exists

### Local Runtime Agent Can

- poll a command queue
- validate command schema
- run allowlisted local jobs
- capture stdout/stderr/exit code
- write execution logs
- optionally send Telegram notifications
- optionally commit or stage non-sensitive output artifacts

---

## MVP Architecture

```text
GitHub command queue
opus-animus/ai/runtime-queue/pending/*.json
        ↓
Local runner poller
scripts/runtime_agent.py
        ↓
Command validator
allowlist + schema + working directory + timeout
        ↓
Job executor
run_collect.py / run_daily.py / run_weekly.py / safe report scripts
        ↓
Output writer
runtime-queue/runs/YYYYMMDD-HHMMSS-<command_id>.json
        ↓
Notifier
Telegram / local console / GitHub commit summary
```

This is safer than letting ChatGPT run arbitrary shell commands.

---

## Command Queue Paths

Suggested repo paths:

```text
opus-animus/ai/runtime-queue/pending/
opus-animus/ai/runtime-queue/running/
opus-animus/ai/runtime-queue/done/
opus-animus/ai/runtime-queue/rejected/
opus-animus/ai/runtime-queue/runs/
```

Only `pending/*.json` is user/ChatGPT writable.

The local runtime agent moves or copies requests into `running`, then writes result logs into `runs`, then marks the request `done` or `rejected`.

---

## Command Schema

Each command request should be JSON.

```json
{
  "command_id": "cmd-20260704-001",
  "requested_by": "huy",
  "requested_from": "chatgpt",
  "created_at": "2026-07-04T00:00:00+09:00",
  "intent": "run_consilium_collect_dry_run",
  "job": "consilium_collect",
  "mode": "dry_run",
  "args": ["--dry-run"],
  "working_dir": "opus-animus/opus-consilium",
  "notify": false,
  "write_policy": "logs_only",
  "approval": "explicit",
  "decision_label": "test"
}
```

Required fields:

```text
command_id
requested_by
requested_from
created_at
intent
job
mode
args
working_dir
notify
write_policy
approval
decision_label
```

---

## Allowlisted Jobs

### 1. Consilium Collect Dry Run

```text
job: consilium_collect
allowed args: --dry-run
working_dir: opus-animus/opus-consilium
write_policy: logs_only
```

Command:

```bash
python run_collect.py --dry-run
```

Use when:

```text
Test source collection without ingestion or notification.
```

### 2. Consilium Collect No Ingest / No Notify

```text
job: consilium_collect_safe
allowed args: --no-ingest --no-notify
working_dir: opus-animus/opus-consilium
write_policy: local_outputs_allowed
```

Command:

```bash
python run_collect.py --no-ingest --no-notify
```

Use when:

```text
Collect signals without wiki ingestion or Telegram notification.
```

### 3. Consilium Weekly Dry Run

```text
job: consilium_weekly_dry_run
allowed args: --dry-run, --days <n>
working_dir: opus-animus/opus-consilium
write_policy: logs_only
```

Command examples:

```bash
python run_weekly.py --dry-run
python run_weekly.py --days 14 --dry-run
```

### 4. Daily Brief Manual Run

```text
job: consilium_daily
allowed args: none by default
working_dir: opus-animus/opus-consilium
write_policy: local_outputs_allowed
requires_confirm: true
```

Command:

```bash
python run_daily.py
```

Use carefully because it may publish or notify depending on current config.

---

## Rejected Commands

The runtime agent must reject:

- arbitrary shell commands
- commands outside allowlist
- commands containing `rm`, `del`, `format`, `curl | sh`, or package install by default
- commands that access secrets or env vars for display
- commands that write to `raw/` or `personal-wiki/` unless the job explicitly owns that output
- commands without `command_id`
- commands without explicit approval
- commands with unknown working directory
- commands that exceed timeout

---

## Execution Log Schema

Each run should produce a JSON log.

```json
{
  "command_id": "cmd-20260704-001",
  "job": "consilium_collect",
  "mode": "dry_run",
  "status": "success",
  "started_at": "2026-07-04T00:00:00+09:00",
  "finished_at": "2026-07-04T00:01:30+09:00",
  "duration_seconds": 90,
  "exit_code": 0,
  "stdout_tail": "...",
  "stderr_tail": "...",
  "artifacts": [],
  "notified": false,
  "decision_label": "test"
}
```

Statuses:

```text
queued
running
success
failed
rejected
timeout
needs_human_review
```

---

## Human Approval Levels

| Level | Meaning | Example |
|---|---|---|
| `read_only` | inspect files/logs only | summarize latest run log |
| `dry_run` | execute no-write or dry-run command | `run_collect.py --dry-run` |
| `logs_only` | may create runtime logs only | command result JSON |
| `local_outputs_allowed` | may produce local output files but no wiki/git write | collect no-ingest/no-notify |
| `notify_allowed` | may send Telegram notification | daily brief after confirmation |
| `repo_write_allowed` | may create Git commit | only through explicit GitHub/Codex flow |
| `blocked` | not allowed | arbitrary shell / destructive command |

Default for new commands:

```text
dry_run or logs_only
```

---

## Runtime Agent Loop

```text
1. Poll pending command queue.
2. Load JSON command.
3. Validate schema.
4. Check job allowlist.
5. Check args allowlist.
6. Check working directory.
7. Check approval level.
8. Move command to running.
9. Execute with timeout.
10. Capture stdout/stderr/exit code.
11. Write run log.
12. Move command to done or rejected.
13. Notify if allowed.
14. Optionally summarize result back into GitHub or Telegram.
```

---

## Runtime Agent Pseudocode

```python
while True:
    commands = list_pending_commands()
    for command in commands:
        result = validate(command)
        if not result.ok:
            reject(command, result.reason)
            continue

        job = resolve_allowlisted_job(command)
        if not job.ok:
            reject(command, "job_not_allowlisted")
            continue

        run = execute(job, timeout=job.timeout)
        write_log(command, run)
        mark_done_or_failed(command, run)

    sleep(POLL_INTERVAL_SECONDS)
```

---

## Integration With Existing Artifacts

| Artifact | Runtime Relation |
|---|---|
| `operator-topology.md` | defines where runtime agent sits in the topology |
| `scheduler-ops.md` | defines existing local jobs and safe commands |
| `news-research/PACK.md` | defines how collected signals are interpreted |
| `wiki-eval-loop.md` | defines when outputs become reading-list/wiki updates |
| `consilium-reading-list.md` | stores selected articles after human pick |
| `skill-optimization-loop.md` | updates packs when runtime/search behavior fails |

---

## MVP Implementation Plan

### Phase 1 — Manual Command Files

Create command queue folders and one sample dry-run command.

```text
pending/cmd-YYYYMMDD-001.json
```

Run local poller manually:

```bash
python scripts/runtime_agent.py --once
```

### Phase 2 — Local Poller

Add a small Python poller that runs every N minutes locally.

```bash
python scripts/runtime_agent.py --watch
```

### Phase 3 — GitHub Pull-Based Queue

Local runner pulls latest main, checks pending commands, executes approved commands, writes logs, commits logs if configured.

### Phase 4 — Telegram Command Gateway

Telegram sends high-level commands such as:

```text
/run collect dry-run
/run weekly dry-run 14d
/status runtime
```

Telegram commands still map to allowlisted JSON commands.

### Phase 5 — Observability

Add:

```text
latest runtime status
last successful run
last failed run
pending queue count
rejected command count
runtime health check
```

---

## First Safe Command To Support

Start with only:

```bash
python run_collect.py --dry-run
```

Reason:

```text
It tests the collection path without ingestion, wiki update, or Telegram notification.
```

Do not add more commands until this one produces stable logs.

---

## Open Questions

- Should runtime logs be committed to GitHub or kept local only?
- Should command files be deleted, moved, or marked done after execution?
- Should Telegram be notification-only or command-capable?
- Should `run_collect.py --no-ingest --no-notify` be considered safe enough after dry-run validation?
- What timeout should apply to each job?
- Where should secrets live, and how do we guarantee they are never printed into logs?

---

## Decision Label

`test`
