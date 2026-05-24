---
title: "Research Source Map"
aliases: ["Intel Source Map", "Collector Source Map", "Research Sources"]
topic: Research
tags: [research, sources, collector, intel, raw-articles, opus-home]
status: evergreen
confidence: medium
sources: ["config.yaml:collect_sources", "run_collect.py", "tools/collect_tool.py", "api/intel.py", "run_weekly.py"]
related: ["[[intel-to-wiki-promotion]]", "[[ai-trend-radar]]", "[[competitor-business-model-radar]]", "[[fde-adoption-radar]]", "[[investment-theses]]"]
applied: ["2026-05-19 - Created after auditing research sources and Intel/wiki sync."]
open_questions: ["Which source families should trigger automatic wiki promotion?", "Which sources are too noisy and should only remain raw evidence?"]
created: 2026-05-19
updated: 2026-05-19
---

# Research Source Map

## Summary
This page maps the research inputs that feed Opus Home Intel and Consilium. It separates raw source collection from durable wiki knowledge.

## Key Points
- `raw/articles/` is the durable event log for collected sources.
- `api/intel.py` enriches and ranks collected sources for Opus Home; it is not the long-term knowledge layer.
- `logs/intel_reviews/`, `logs/weekly/`, and `logs/business_briefs/` store synthesized reports, but those reports are not automatically durable wiki pages.
- `personal-wiki/` is the decision brain. Important Intel signals must be promoted into hub pages.
- Current config has `collect.auto_ingest: true`, so raw articles can become seed pages automatically; this still does not replace hub-page synthesis.

## Why It Matters
Without a source map, Consilium mixes four different things: raw evidence, dashboard review, synthesized reports, and durable wiki conclusions. This page keeps them distinct.

## Details
Current source families from `config.yaml`:

| Family | Source IDs | Target Evidence Type | Default Wiki Route |
|---|---|---|---|
| Official AI company signals | `openai-news`, `anthropic-blog`, `google-ai-blog`, `aws-ml-blog`, `nvidia-blog` | Product, platform, model, enterprise adoption | [[ai-trend-radar]], [[reskill-roadmap]], [[investment-theses]] |
| Microsoft / platform competitor signals | `microsoft-official-blog`, `microsoft-azure-blog` | Copilot, Azure AI, enterprise platform moves | [[competitor-business-model-radar]], [[investment-theses]] |
| AI market news | `techcrunch-ai`, `venturebeat-ai` | Funding, launches, partnerships, market moves | [[ai-trend-radar]], [[competitor-business-model-radar]] |
| Trusted AI practitioners | `simon-willison`, `hf-blog`, `import-ai` | Practical tooling, model ecosystem, weekly AI context | [[ai-trend-radar]], [[reskill-roadmap]] |
| Research commentary | `interconnects`, `the-gradient` | Deeper model, RLHF, alignment, frontier AI analysis | [[ai-trend-radar]], [[open-questions]] |
| Papers | `arxiv-ai`, `arxiv-lg`, `arxiv-cl` disabled, `hf-papers` | Research seeds and technical directions | [[ai-trend-radar]], topic-specific AI pages |
| GitHub trending | `github-trending-ai` | Tools and repos that may affect workflow | [[ai-trend-radar]], [[reskill-roadmap]], [[fde-adoption-radar]] |
| Japan / market | `nikkei-asia` | Japan macro, yen, BOJ, market, industrial policy | [[investment-theses]], [[japan-economy]], [[asia-pacific-region]] |
| Competitor / SIer sources | `itmedia-enterprise`, `enterprisezine`, `zdnet-japan`, `monoist`, `prtimes-it` | Japan IT, SIer, AI-SDLC, enterprise modernization | [[competitor-business-model-radar]], [[fde-adoption-radar]] |
| Analyst sources | `everest-group`, `hfs-research` | Consulting, services, FDE, market structure | [[competitor-business-model-radar]], [[fde-model]], [[fde-adoption-radar]] |

Other research surfaces:

- `tools/search_tool.py`: saves web search results into raw research material.
- `tools/rss_tool.py`: fetches RSS and can save raw articles.
- `tools/wiki_tool.py`: writes research output into `raw/research/` for later ingest.
- `tools/research_radar_tool.py`: GitHub trending + arXiv research radar, partly superseded by collector and Intel tab.
- `run_weekly.py`: synthesizes raw articles into weekly JSON under `logs/weekly/`.
- `run_collect.py`: saves raw articles, optionally ingests to wiki, and saves daily Intel synthesis JSON.

Current storage counts from audit:

- `raw/articles/`: 610 files.
- `raw/inbox/`: 1 file.
- `raw/notes/`: 3 files.
- `logs/intel_reviews/`: 2 JSON reports.
- `logs/weekly/`: 1 JSON report.
- `logs/business_briefs/`: 1 JSON report.

## Application To OPUS ANIMUS
When a new research source is added, update this page and decide which hub page should receive durable synthesis. New sources should not only appear in `config.yaml`.

## Open Questions
- Should Tier 0 sources automatically propose hub updates after each collect run?
- Should GitHub trending produce weekly tool-watch synthesis in [[reskill-roadmap]]?
- Which competitor sources are noisy enough to require stricter filters?

## Applied
- 2026-05-19 - Audited collector, Intel API, weekly reports, and current raw/log storage.

## See Also
- [[intel-to-wiki-promotion]]
- [[ai-trend-radar]]
- [[competitor-business-model-radar]]
- [[fde-adoption-radar]]
- [[investment-theses]]

## Sources
- `config.yaml:collect_sources`
- `run_collect.py`
- `tools/collect_tool.py`
- `api/intel.py`
- `run_weekly.py`
