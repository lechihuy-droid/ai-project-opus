# STATUS - opus-animus
**Updated:** 2026-05-12
**Current owner:** Codex

## Active sub-systems

| Sub-system | Status | Note |
|---|---|---|
| CONS / News Research Tool | Active | Local dashboard + Intel/Reading views at `http://127.0.0.1:8765` |
| CONS / Content Collector | Active | Goal-aligned collect layer in `opus-consilium/run_collect.py` + `tools/collect_tool.py` |
| CONS / Module C Wiki | Running | wiki-poll + wiki-lint-weekly |
| LUCIDA / Wake Lane | Paused | Previous handoff remains in `opus-lucida/ai/handoff-codex.md` |
| HOME Dashboard | Merged into Consilium | FastAPI dashboard lives in `opus-consilium/run_dashboard.py` |

## Current objective

> **CONS-RESEARCH-TOOL**: make the local news/research dashboard reliable enough to use daily: collect goal-aligned articles, inspect Intel/Reading views, and trigger collect/research actions without hanging the UI.

## Current state

- FastAPI app imports cleanly with Python 3.11.
- `/api/dashboard` returns 200.
- `/api/articles?limit=3&days_back=7` returns 200 with article data.
- Dashboard is available at `http://127.0.0.1:8765` when `run_dashboard.py` is running.
- Action polling was fixed so long-running jobs do not block the poll request.

## Next step

1. Verify the dashboard visually in browser: Home, Intel, Reading, Actions.
2. Test a safe action flow from `/api/run/{action}` without triggering unwanted wiki writes.
3. Update `TODO.md` to mark completed Consilium dashboard/API steps and list remaining collect-layer work.
4. Continue CONS-REBUILD: source verification, digest engine design, then broken-loop fixes.

## Constraints

- Do not edit files in `opus-consilium/raw/`; raw sources are immutable.
- Follow `C:/Users/HUY/AI/opus-animus/AGENTS.md`.
- Use Python 3.11 at `C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe`.
- Windows Task Scheduler is the production scheduler.

## If interrupted

Read `ai/handoff-codex.md` first. The current active task is Consilium/news research tooling, not Lucida.
