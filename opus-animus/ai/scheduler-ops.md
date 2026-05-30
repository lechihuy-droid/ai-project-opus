# Scheduler Operations

**Status:** test
**Owner:** Codex / Claude / ChatGPT
**Purpose:** Document how Consilium scheduler jobs run after the OneDrive → Git migration, and keep scheduler operations separate from `AGENTS.md`.

---

## Current Runtime Model

Consilium currently uses **Windows Task Scheduler + Python entrypoints**.

The repo does not contain a central in-app cron daemon. Scheduled execution is controlled outside the app by Windows Task Scheduler, while Python files act as job entrypoints.

```text
Windows Task Scheduler
→ Python entrypoint
→ raw/log/wiki output
→ Telegram notification
```

---

## Scheduler Jobs

### 1. Content Collector

Entrypoint:

```text
opus-animus/opus-consilium/run_collect.py
```

Purpose:

```text
fetch high-signal sources
→ dedupe
→ goal-align filter
→ save raw/articles
→ ingest personal-wiki
→ update WIKI_HEALTH
→ save daily synthesis
→ send Telegram reading list
```

Expected schedule:

```text
Daily, before the daily brief.
Current docs mention 05:30, but timezone must be verified in Windows Task Scheduler.
```

Key outputs:

```text
opus-animus/opus-consilium/raw/articles/*.md
opus-animus/opus-consilium/logs/intel_reviews/YYYY-MM-DD.json
personal-wiki/WIKI_HEALTH.md
Telegram reading list
```

Safe test commands:

```bash
python run_collect.py --dry-run
python run_collect.py --no-ingest --no-notify
```

---

### 2. Daily Brief

Entrypoint:

```text
opus-animus/opus-consilium/run_daily.py
```

Purpose:

```text
query personal-wiki
→ fallback to wiki/ if needed
→ generate brief via Claude CLI
→ publish Telegraph
→ write daily log
→ send Telegram
```

Expected schedule:

```text
Daily morning.
Current comments mention 06:00 ICT / 08:00 JST, but actual timezone depends on the Windows machine timezone and Task Scheduler configuration.
```

Key outputs:

```text
opus-animus/opus-consilium/logs/daily/YYYY-MM-DD.md
Telegraph article
Telegram daily brief link
```

---

### 3. Weekly Synthesizer

Entrypoint:

```text
opus-animus/opus-consilium/run_weekly.py
```

Purpose:

```text
read raw/articles from last N days
→ parse metadata
→ group AI / competitor / market / other
→ synthesize weekly research report via Claude CLI
→ save weekly JSON
→ send Telegram summary
```

Expected schedule:

```text
Sunday 06:00 JST according to status.md.
Task name mentioned in status.md: opus-weekly-research.
```

Key outputs:

```text
opus-animus/opus-consilium/logs/weekly/YYYY-Www.json
Telegram weekly summary
```

Safe test commands:

```bash
python run_weekly.py --dry-run
python run_weekly.py --no-notify
python run_weekly.py --days 14 --dry-run
```

---

## Source Taxonomy vs Research Lanes

Current code/config mainly uses these raw topics:

```text
AI
COMPETITOR
JP_STOCK
```

Current research pack uses these operating lanes:

```text
Tech Learning Research
CEO Business Model Research
Competitor Intelligence Research
```

Mapping:

| Raw Topic / Source Group | Operating Lane | Notes |
|---|---|---|
| `AI` official/company/research sources | Tech Learning Research or CEO Business Model Research | Decide by signal type: workflow/tool/security = Tech; adoption/pricing/market = CEO |
| `COMPETITOR` sources | Competitor Intelligence Research | Requires evidence: customer, KPI, revenue, bookings, partnership, org move, or packaging |
| `JP_STOCK` / market sources | CEO Business Model Research or Investment lens | Use only when it changes macro/market/business action |
| `raw/articles` weekly groups: AI / competitor / market / other | Weekly synthesis | Current grouping is coarse; use pack rules for interpretation |

Important rule:

```text
BD/RCD is not part of the default news/scheduler interpretation branch.
Only mention BD/RCD when explicitly requested or when a signal directly changes that project.
```

---

## Known Drift / Cleanup Items

### 1. Timezone comments need verification

Current files mention different schedule expressions:

```text
run_collect.py: daily batch 05:30
run_daily.py: 06:00 ICT / 08:00 JST
config.yaml: daily_brief_time 06:00 with ICT/JST comment
status.md: Content Collector daily 05:30 JST, Weekly Synthesizer Sunday 06:00 JST
```

Action:

```text
Check actual Windows Task Scheduler task settings on the machine.
Confirm machine timezone.
Then update comments/docs to one canonical timezone convention.
```

Recommended convention:

```text
Store and document scheduler times in JST, because the user is based in Japan.
If Windows machine timezone differs, explicitly note local machine time and JST equivalent.
```

---

### 2. `config.yaml` contains legacy Groq config

`status.md` says the main pipeline has migrated to Claude CLI via `utils/llm.py`, but `config.yaml` still has an old `llm.provider: groq` section.

Action:

```text
Do not delete or rewrite this blindly.
First check whether any legacy Module A or CrewAI path still reads `config.yaml.llm`.
If no active path uses it, mark it as legacy or move it under a legacy section.
```

Safe immediate interpretation:

```text
Current active daily/weekly/collector synthesis paths use Claude CLI helpers.
The Groq config appears stale or legacy, not the current runtime owner.
```

---

### 3. Source taxonomy should be aligned with 3 research lanes

Current collector source taxonomy is usable but coarse.

Recommended next bounded edit:

```text
Update comments and goal_filter text in config.yaml to align with:
- Tech Learning Research
- CEO Business Model Research
- Competitor Intelligence Research
```

Do not change source IDs or disable sources until a dry run verifies impact.

---

## Operational Checklist

Before changing scheduler behavior:

```text
1. Run dry-run first.
2. Do not edit raw/ sources.
3. Verify Telegram env only if notification is expected.
4. Confirm Claude CLI availability.
5. Confirm Windows Task Scheduler timezone.
6. Check output paths after run.
7. If behavior changes, update this file and return commit hash.
```

Useful commands from repo root or `opus-animus/opus-consilium`:

```bash
python run_collect.py --dry-run
python run_daily.py
python run_weekly.py --dry-run
```

---

## How This Relates To Packs

Scheduler jobs produce raw signals and summaries.

Packs decide how those signals should be interpreted:

```text
scheduler = collection/execution layer
news-research/PACK.md = interpretation/filtering layer
wiki-ops/PACK.md = durable wiki promotion layer
skill-optimization-loop.md = improvement layer
```

Do not put long scheduler rules into `AGENTS.md`. Keep operational detail here.

---

## Decision Label

`test`
