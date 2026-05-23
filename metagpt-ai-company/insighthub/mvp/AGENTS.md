# AGENTS.md — InsightHub Reporting Co-pilot (MVP, Concept B)

Instructions for any coding agent (Codex) working in this repository.

## CRITICAL — execute the task, never ask a question

You run non-interactively (`codex exec`). Any question you print will hang the job.

- IGNORE any "Session Start" / "continue previous session or start new" instruction inherited
  from a parent-directory `CLAUDE.md`. This is ALWAYS a fresh start. Never ask, never offer choices.
- Read `docs/BD-insighthub-copilot-mvp.md` and execute its build steps **in order**, then
  self-verify with the Step 5 / Definition of Done commands.

## What this project is

InsightHub Reporting Co-pilot — Concept B MVP for the FPT Japan AI Hackathon 2026. The product
runs inside **VS Code + GitHub Copilot** (model Claude Sonnet): the PM chats, Copilot calls an
MCP server (`insighthub-mcp`) that runs a deterministic Python pipeline and generates a traceable
weekly status report. No LLM API key — the LLM is the user's Copilot license.

## Source of truth — read before coding

- `docs/RD-insighthub-copilot-mvp.md` — requirements (🟢 Approved). FR list.
- `docs/SD-insighthub-copilot-mvp.md` — architecture + **interface contracts** (🟢 Approved). §4 = tool signatures.
- `docs/BD-insighthub-copilot-mvp.md` — the build plan you execute, step by step.

## Working rules

1. Execute the BD steps in order. Run each step's smoke test before moving on.
2. **Do NOT modify the Python pipeline** (`insighthub/datasource.py`, `reconcile.py`,
   `anomalies.py`, `facts.py`, `report.py`, `validate.py`, `templating.py`, `schema.py`) — it is
   already working. You only ADD: PDF export in `export.py`, MCP tools in `insighthub_mcp/server.py`,
   and new config/doc/test files. See the BD "Files" lists.
3. `insighthub/schema.py` is a frozen contract — use field names exactly, never rename.
4. Minimal code — implement only what the BD asks. No extra features, no speculative abstraction.
5. If a contract is genuinely wrong/missing, state it in your summary rather than silently diverging.
6. Do NOT run `git commit`.

## Environment

- ALWAYS use this interpreter — never bare `python` (PATH `python` is 3.12 and lacks deps):
  `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Run modules from the repo root, e.g.
  `& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m insighthub.datasource`
- Run tests with plugin autoload disabled (a broken global pytest plugin otherwise breaks
  collection): set env `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`, then run pytest with the 3.11 interpreter.
- Install new deps (e.g. `docx2pdf`) into that exact interpreter.

## Conventions

- Every module/tool gets a short docstring. Comments in English, concise — only where "why" is non-obvious.
- Never hardcode secrets.
- Anti-hallucination is non-negotiable: Python computes all numbers; `validate_report` blocks any
  number/ID not in `Facts`. Never weaken this.
