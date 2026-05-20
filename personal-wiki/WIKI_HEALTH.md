---
title: "Wiki Health Log"
aliases: []
topic: Personal
tags: [wiki, health, ingest]
status: seed
confidence: medium
sources: []
related: []
applied: []
open_questions: []
created: 2026-05-17
updated: 2026-05-20
---

# Wiki Health Log
*Tracks every ingest run — quality signal over time*

## Legacy Stats Snapshot (stale)
*Updated: 2026-05-20 05:39*

| Metric | Value |
|---|---|
| Total wiki pages | 450 |
| Topics | AI: 15 · Tech: 3 · Stock: 0 · Personal: 0 |
| Raw articles (processed) | 198 |
| processed.txt entries | 198 |

---

## Corrected Snapshot - 2026-05-20 22:20

| Metric | Value |
|---|---|
| Total wiki pages | 450 |
| Topics | AI: 351; Stock: 79; Personal: 7; FDE: 6; Tech: 3; Research: 2; Business: 1; root: 1 |
| Status mix | seed: 415; evergreen: 21; missing status: 14 |
| Source-seed pages | 382 |
| Orphan pages | 359 after 2026-05-20 hub promotion |
| Broken wikilinks | 0 |
| Frontmatter errors | 0 |
| Raw articles | 752 |
| processed.txt entries | 609 |
| INDEX coverage | 448 links; 2 pages not indexed (`WIKI_HEALTH.md`, `Personal/reflection-2026-W19.md`) |

## Current Assessment

The vault is structurally healthy but synthesis-heavy work is lagging collection. The collector has produced a large body of seed pages, and link/schema integrity is good. The main risk is not data loss; it is decision dilution from too many unpromoted source pages.

Decision label: **test**. Keep ingest available, but treat the next maintenance cycle as promotion and pruning work, not collection.

## Git State Triage - 2026-05-20

Repository root is `C:\Users\HUY\AI`, so Consilium status is mixed with unrelated workspace changes. Current `git status --short` has 528 changed/untracked entries:

| Group | Count | Action |
|---|---:|---|
| Consilium vault | 340 | Review as one content batch after promotion pass |
| Consilium raw articles | 144 | Commit/archive separately from curated wiki pages |
| Consilium code/docs | 18 | Review separately; may include pipeline changes |
| Consilium logs | 1 | Keep only if needed for audit trail |
| Opus Lucida unrelated | 10 | Do not mix with Consilium commit |
| Opus Actio unrelated | 1 | Do not mix with Consilium commit |
| Workspace parent unrelated | 14 | Do not mix with Consilium commit |

Recommended commit batches:
- Batch 1: decision-page promotions and `WIKI_HEALTH.md`.
- Batch 2: generated seed pages under `personal-wiki/AI` and `personal-wiki/Stock`.
- Batch 3: `raw/articles` and `processed.txt`.
- Batch 4: Consilium pipeline code/docs if intentional.
- Leave Opus Lucida, Opus Actio, Obsidian, and root scripts outside the Consilium commit.

## Operational Notes - 2026-05-20

- Local lint should use the workspace Python: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`.
- `python` from PATH may point to an interpreter without `python-dotenv`; use the explicit Python 3.11 path or `wiki_lint.bat`.
- `run_wiki.py lint --no-telegram` is available for local verification without sending a Telegram message.
- Latest `logs/intel_reviews/2026-05-20.json` has `fallback_llm_error` from Claude CLI, so daily intelligence generation should be treated as failed for that run.
- `.last_error.json` reports a `run_daily` Groq/LiteLLM error; daily pipeline reliability still needs a separate fix.

## Promotion Pass - 2026-05-20

Promoted seed clusters into decision pages:
- Agent workflow infrastructure: [[work-with-codex-from-anywhere]], [[seas-view-on-the-future-of-agentic-software-development-with-codex]], [[simplex-rethinks-software-development-with-codex]], [[running-codex-safely-at-openai]]
- Enterprise Codex workflows: [[how-business-operations-teams-use-codex]], [[how-data-science-teams-use-codex]], [[how-sales-teams-use-codex]]
- Agent safety and auditability: [[securing-ai-agents-how-aws-and-cisco-ai-defense-scale-mcp-and-a2a-deployments]], [[towards-security-auditable-llm-agents-a-unified-graph-representation]], [[shepherd-a-runtime-substrate-empowering-meta-agents-with-a-formalized-execution]]
- Memory/context/skill reuse: [[when-continual-learning-moves-to-memory-a-study-of-experience-reuse-in-llm-agent]], [[rohitg00agentmemory]], [[zilliztechclaude-context]], [[skilllens-adaptive-multi-granularity-skill-reuse-for-cost-efficient-llm-agents]], [[toward-scalable-terminal-task-synthesis-via-skill-graphs]]
- AI infra and Japan/APAC thesis signals: [[nvidia-and-sap-bring-trust-to-specialized-agents]], [[nvidia-and-servicenow-partner-on-new-autonomous-ai-agents-for-enterprises]], [[japans-softbank-enters-battery-business-to-power-ai-data-centers]], [[japans-kao-ajinomoto-boost-chip-material-operations-on-ai-demand]], [[kioxias-rising-shares-signal-japan-market-shift-from-autos-to-chips]], [[hitachi-advantest-ride-ai-boom-to-lead-japan-inc-profit-bonanza]], [[voice-ai-startup-verbex-to-move-headquarters-from-singapore-to-japan]], [[vietnams-workers-power-japan-inc-but-face-ai-risks-at-home]]

## Run History

| Date | Source | Fetched | Passed Filter | Saved to raw/ | Ingested | Wiki Pages After | Notes |
|---|---|---|---|---|---|---|---|
| 2026-04-28 06:35 | content-collector | — | — | ~15 | 15 | 18 | Initial batch, no filter, incl. arXiv noise |
| 2026-04-29 05:30 | content-collector | — | — | 0 | 5 | 18 | Re-ingest bug (dedup fail), fixed 2026-04-29 |

---

## Filter Config (per source)
Sources marked with `keyword_filter` in config.yaml — articles not matching are dropped before raw/.

| Source | Tier | Filter |
|---|---|---|
| simon-willison | 1 | none (trusted) |
| hf-blog | 1 | none (trusted) |
| import-ai | 1 | none (trusted) |
| anthropic-blog | 1 | none (trusted) |
| interconnects | 2 | none (trusted) |
| the-gradient | 2 | none (trusted) |
| arxiv-ai | 2 | keyword_filter active |
| arxiv-lg | 2 | keyword_filter active |
| nikkei-asia | 3 | keyword_filter active |
| 2026-05-12 00:43 | content-collector | 107 | 49 dropped | 58 | 28 | 0 | 21 | simon-willison:2→2; hf-blog:3→3; import-ai:1→1; interconnects:2→2; arxiv-ai:11→10; arxiv-lg:24→10; nikkei-asia:23→10; hf-papers:11→10; github-trending-ai:12→10; itmedia-enterprise:8→0; everest-group:10→0 |
| 2026-05-12 00:55 | content-collector | 121 | 49 dropped | 72 | 24 | 0 | 21 | openai-news:10→10; microsoft-official-blog:1→1; microsoft-azure-blog:2→2; simon-willison:3→3; hf-blog:3→3; import-ai:1→1; interconnects:2→2; arxiv-ai:11→10; arxiv-lg:24→10; nikkei-asia:23→10; hf-papers:11→10; github-trending-ai:12→10; itmedia-enterprise:8→0; everest-group:10→0 |
| 2026-05-13 00:51 | content-collector | 130 | 58 dropped | 72 | 31 | 0 | 21 | openai-news:10→10; simon-willison:6→6; hf-blog:4→4; import-ai:1→1; interconnects:1→1; arxiv-ai:15→10; arxiv-lg:24→10; nikkei-asia:16→10; hf-papers:14→10; github-trending-ai:13→10; itmedia-enterprise:16→0; everest-group:10→0 |
| 2026-05-13 01:14 | content-collector | 165 | 62 dropped | 103 | 39 | 0 | 21 | openai-news:10→10; microsoft-azure-blog:1→1; google-ai-blog:3→3; aws-ml-blog:12→10; nvidia-blog:6→6; techcrunch-ai:11→10; simon-willison:6→6; hf-blog:4→4; import-ai:1→1; interconnects:2→2; arxiv-ai:15→10; arxiv-lg:24→10; nikkei-asia:17→10; hf-papers:14→10; github-trending-ai:13→10; itmedia-enterprise:16→0; everest-group:10→0 |
| 2026-05-17 22:52 | content-collector | 112 | 37 dropped | 75 | 41 | 15 | 35 | openai-news:10→10; google-ai-blog:1→1; aws-ml-blog:13→10; nvidia-blog:5→5; techcrunch-ai:11→10; simon-willison:4→4; hf-blog:3→3; import-ai:1→1; interconnects:2→2; nikkei-asia:21→10; hf-papers:14→10; github-trending-ai:15→9; itmedia-enterprise:2→0; everest-group:10→0 |
| 2026-05-20 03:09 | content-collector | 157 | 56 dropped | 101 | 81 | 0 | 450 | openai-news:10→10; google-ai-blog:7→6; aws-ml-blog:12→10; nvidia-blog:5→5; techcrunch-ai:10→10; venturebeat-ai:1→1; simon-willison:2→2; hf-blog:6→6; import-ai:1→1; interconnects:1→1; arxiv-ai:10→10; arxiv-lg:19→10; nikkei-asia:20→10; hf-papers:11→10; github-trending-ai:15→9; itmedia-enterprise:18→0; everest-group:9→0 |
| 2026-05-20 05:39 | content-collector | 163 | 60 dropped | 103 | 7 | 0 | 450 | openai-news:10→10; microsoft-azure-blog:1→1; google-ai-blog:7→6; aws-ml-blog:12→10; nvidia-blog:5→5; techcrunch-ai:10→10; venturebeat-ai:1→1; simon-willison:2→2; hf-blog:7→7; import-ai:1→1; interconnects:1→1; arxiv-ai:10→10; arxiv-lg:19→10; nikkei-asia:22→10; hf-papers:11→10; github-trending-ai:15→9; itmedia-enterprise:20→0; everest-group:9→0 |
