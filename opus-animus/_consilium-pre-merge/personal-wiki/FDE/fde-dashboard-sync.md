---
title: "FDE Dashboard Sync"
aliases: ["FDE Opus Home Sync", "FDE Wiki Sync"]
topic: FDE
tags: [fde, dashboard, opus-home, sync, wiki-structure]
status: evergreen
confidence: medium
sources: ["dashboard/index.html:FDEView", "api/intel.py:get_fde_intel", "api/intel.py:get_fde_news"]
related: ["[[fde-model]]", "[[fde-japan-gap-analysis]]", "[[fde-roadmap]]", "[[fde-adoption-radar]]", "[[fde-research-queue]]"]
applied: ["2026-05-19 - Created to document how the Opus Home FDE tab maps to the Consilium wiki."]
open_questions: ["Should the dashboard eventually read FDE concepts from wiki markdown instead of api/intel.py constants?", "Which FDE updates should sync to GitHub mobile automatically?"]
created: 2026-05-19
updated: 2026-05-19
---

# FDE Dashboard Sync

## Summary
This page defines how the Opus Home FDE tab maps into the Consilium wiki. The dashboard remains the review UI; the wiki becomes the durable knowledge layer.

## Key Points
- Dashboard `Strategy` maps to [[fde-model]].
- Dashboard `Gap Analysis` maps to [[fde-japan-gap-analysis]].
- Dashboard `Roadmap` maps to [[fde-roadmap]].
- Dashboard `Benchmark` and `Daily News` map to [[fde-adoption-radar]].
- Dashboard `Resources` maps to [[fde-research-queue]].
- Dynamic raw article feeds should stay dynamic; durable conclusions should be written to the wiki.

## Why It Matters
Before this page, FDE knowledge lived mostly in `api/intel.py` constants and the dashboard UI. That made it visible on desktop but weak for ChatGPT mobile, wiki search, Obsidian linking, and Consilium decisions.

## Details
Current source of truth split:

| Dashboard Area | Current Source | Wiki Target |
|---|---|---|
| Strategy thesis | `FDE_STRATEGY_THESIS` | [[fde-model]] |
| Concepts | `FDE_CONCEPTS` | [[fde-model]] |
| Gap analysis | `FDE_GAP_ANALYSIS` | [[fde-japan-gap-analysis]] |
| Roadmap | `FDE_ROADMAP` | [[fde-roadmap]] |
| Actor benchmark | `FDE_ACTORS` | [[fde-adoption-radar]] |
| Daily news | `/api/intel/fde/news` | [[fde-adoption-radar]] when signal repeats |
| Research queue | `FDE_RESEARCH_QUEUE` | [[fde-research-queue]] |

Recommended next technical step:

1. Keep the current dashboard working.
2. Use the new `FDE/` wiki pages for mobile/Consilium reasoning.
3. Later, refactor `/api/intel/fde` to read stable thesis/concept/roadmap content from wiki markdown or a small structured YAML file.

## Application To OPUS ANIMUS
When Huy asks about FDE, Codex should read this page first, then the matching FDE topic page. Dashboard changes and wiki changes should not diverge for more than one review cycle.

## Open Questions
- Should `FDE/` become a top-level sidebar module in the GitHub mobile README?
- Should source ingestion tag FDE pages into `FDE/` instead of `AI/` when the source is about enterprise deployment model?
- Should the export repo include a sync script for local-to-GitHub and GitHub-to-local FDE updates?

## Applied
- 2026-05-19 - Created the first explicit sync contract between Opus Home FDE and Consilium wiki.

## See Also
- [[fde-model]]
- [[fde-japan-gap-analysis]]
- [[fde-roadmap]]
- [[fde-adoption-radar]]
- [[fde-research-queue]]

## Sources
- `dashboard/index.html:FDEView`
- `api/intel.py:get_fde_intel`
- `api/intel.py:get_fde_news`
