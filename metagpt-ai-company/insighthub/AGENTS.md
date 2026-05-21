# AGENTS.md — InsightHub Agent

Instructions for any coding agent (Codex) working in this repository. Codex reads
this file automatically at the start of every session.

## What this project is

InsightHub Agent — an AI reporting co-pilot (FPT Japan AI Hackathon 2026). It
ingests Jira / WBS / Slack / GitHub / meeting-minutes data, reconciles it across
sources, detects anomalies, and generates a traceable weekly status report.

## How the repo is built — MetaGPT SOP

The build follows a MetaGPT-style assembly line. See `WORKFLOW.md`.
Planning artifacts are already written — **do not rewrite them**:

- `docs/prd.md` — MVP scope.
- `docs/system_design.md` — architecture + frozen data contracts. **Source of truth.**
- `docs/task.md` — task breakdown and parallel allocation.
- `docs/tasks/TASK-*.md` — self-contained task briefs. You will be told which one to run.

## Working rules

1. You are given exactly ONE task brief (`docs/tasks/TASK-*.md`). Execute that brief, nothing else.
2. Only create or edit the files listed in your brief. **Do not touch other streams' files.**
3. `insighthub/schema.py` is a frozen contract. Use its field names exactly; never rename a field.
4. Before finishing, run the commands in your brief's **Definition of Done** and confirm they pass.
5. Minimal code — implement only what the brief asks. No extra features, no speculative abstraction.
6. If a contract is genuinely wrong/missing, state it explicitly in your summary rather than silently diverging.

## Environment

- Python 3.11. Interpreter: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Dependencies are in `requirements.txt`, already installed for that interpreter.
  If your `python` differs, run `pip install -r requirements.txt` first.
- Run modules from the repo root, e.g. `python -m insighthub.datasource`.

## Product context (rarely needed for a single task)

- The product's own LLM is Claude (`claude-opus-4-7`) via the `anthropic` SDK — this
  is the *product* calling an LLM, unrelated to which agent writes the code.
- External systems (Jira / Chat / GitHub) are reached through one MCP server
  (`insighthub_mcp/`) with file-backed adapters. No live API in the MVP.
- Sample data is already generated in `data/sample/` (regenerate with
  `python scripts/gen_sample_data.py`). `data/sample/_ground_truth.json` lists the
  15 seeded anomalies.

## Conventions

- Every module gets a short docstring. Code comments in English, concise.
- Never hardcode secrets; read `.env`.
- Do not run `git commit` — the orchestrator (`run-codex.ps1`) commits between stages.
