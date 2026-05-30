---
title: "Research Source Map"
aliases: ["Intel Source Map", "Collector Source Map", "Research Sources"]
topic: Research
tags: [research, sources, collector, intel, raw-articles, opus-home]
status: evergreen
confidence: medium
sources: ["config.yaml:collect_sources", "run_collect.py", "tools/collect_tool.py", "api/intel.py", "run_weekly.py"]
related: ["[[intel-to-wiki-promotion]]", "[[research-audit-queue]]", "[[chat-to-wiki-classification-skill]]", "[[ai-trend-radar]]", "[[competitor-business-model-radar]]", "[[fde-adoption-radar]]", "[[investment-theses]]"]
applied: ["2026-05-19 - Created after auditing research sources and Intel/wiki sync.", "2026-05-23 - Added CEO Business Model Research as a parallel channel to Tech Learning Research.", "2026-05-30 - Added Competitor Intelligence as the third research lane and gated raw-to-wiki through audit."]
open_questions: ["Which source families should trigger automatic wiki promotion?", "Which sources are too noisy and should only remain raw evidence?", "Which CEO/business sources should be added for Japan SIer, offshore, pricing, and enterprise budget signals?"]
created: 2026-05-19
updated: 2026-05-31
---

# Research Source Map

## Summary
This page maps the research inputs that feed Opus Home Intel and Consilium. It separates raw source collection from durable wiki knowledge.

Consilium research now has three parallel lanes:
- **Tech Learning Research**: helps Huy learn tools, skills, AI workflows, and agent governance.
- **CEO Business Model Research**: helps Huy think like a tech-firm CEO: customer budget, competitor business model, offer/pricing, enterprise adoption, vertical opportunity, talent/operating model, and strategic risk.
- **Competitor Intelligence Research**: tracks concrete moves by SIers, consulting firms, platform vendors, and AI-SDLC competitors.

## Key Points
- `raw/articles/` is the durable event log for collected sources.
- `api/intel.py` enriches and ranks collected sources for Opus Home; it is not the long-term knowledge layer.
- `logs/intel_reviews/`, `logs/weekly/`, and `logs/business_briefs/` store synthesized reports, but those reports are not automatically durable wiki pages.
- `personal-wiki/` is the decision brain. Important Intel signals must be promoted into hub pages.
- Current config has `collect.auto_ingest: false`, so raw articles should pass the three-lane audit before becoming wiki pages.
- Tech Learning Research, CEO Business Model Research, and Competitor Intelligence Research should stay separated so technical news does not crowd out business or competitor evidence.

## Why It Matters
Without a source map, Consilium mixes four different things: raw evidence, dashboard review, synthesized reports, and durable wiki conclusions. This page keeps them distinct.

Huy already has enough technology-learning coverage. The next research gaps are CEO-level business model sensing and competitor evidence: what customers buy, what competitors sell, how AI changes pricing, where enterprise adoption is blocked, which verticals are opening, how delivery teams should be redesigned, which competitors have proof points, and what risks delay purchasing.

## Details

### Research channels

| Channel | Purpose | Primary Question | Primary Wiki Routes |
|---|---|---|---|
| Tech Learning Research | Learn skills, tools, workflow patterns, and AI-native operations | What should Huy learn, test, or improve? | [[ai-trend-radar]], [[reskill-roadmap]], [[fde-adoption-radar]] |
| CEO Business Model Research | Support business strategy, offer design, competitor understanding, and investment/business thesis formation | If Huy were CEO of a tech firm, what should change in strategy, offer, market focus, or operating model? | [[competitor-business-model-radar]], [[fde-adoption-radar]], [[fde-japan-gap-analysis]], [[fde-model]], [[investment-theses]], [[open-questions]] |
| Competitor Intelligence Research | Track concrete competitor moves, positioning, partnerships, proof points, and delivery models | Which competitor move changes Huy's strategy, offer, or FDE-lite benchmark? | [[competitor-business-model-radar]], [[fde-adoption-radar]], [[fde-japan-gap-analysis]], [[investment-theses]] |

### CEO Business Model Research categories

| Category | What To Track | CEO Question | Primary Wiki Route |
|---|---|---|---|
| Customer pain & budget shift | IT budget movement, outsourcing pressure, AI automation demand, buyer ownership, paid PoC vs ROI-based purchase | Are customers still buying man-months, or shifting toward outcome and automation? | [[fde-adoption-radar]], [[competitor-business-model-radar]], [[investment-theses]] |
| Competitor business model | SIer, offshore, consulting, and product-company monetization models; AI transformation packages; platform/pod/managed-service/outcome offers | How are competitors moving from labor arbitrage to AI-enabled delivery or outcome models? | [[competitor-business-model-radar]], [[fde-japan-gap-analysis]], [[fde-model]] |
| Offer & pricing intelligence | AI PoC package, diagnostic sprint, AI-SDLC modernization, governance/audit package, managed AI workflow, outcome-based pricing | What offer can customers pay for in the next 3-6 months? | [[competitor-business-model-radar]], [[fde-model]], [[investment-theses]] |
| Enterprise adoption patterns | Use cases moving from PoC to production, department-level adoption, blockers, failure reasons, ROI evidence | Where is AI adoption stuck, and can a tech firm sell a solution to that bottleneck? | [[fde-adoption-radar]], [[competitor-business-model-radar]] |
| Vertical / industry opportunities | Japan enterprise IT, SI/offshore, manufacturing, logistics, finance, HR, education, public sector, content automation | Which vertical has strong pain, visible budget, and manageable adoption barriers? | [[fde-japan-gap-analysis]], [[fde-adoption-radar]], [[investment-theses]] |
| Talent & operating model | New roles, FDE, AI workflow architect, solution consultant, AI product manager, AI-native delivery pods, junior developer training | What team model should a tech firm build to win AI delivery? | [[fde-model]], [[reskill-roadmap]], [[competitor-business-model-radar]] |
| Strategic risk & regulation | AI governance, data privacy, IP/copyright, security incidents, procurement rules, provider dependency, Japan policy | Which risks could delay customer buying or force a different delivery model? | [[open-questions]], [[investment-theses]], [[fde-adoption-radar]] |

### Current source families from `config.yaml`

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

For daily use, keep Tech Learning Research and CEO Business Model Research as separate briefs. A technology item should not dominate the CEO channel unless it changes offer design, customer budget, competitor strategy, operating model, or investment/business thesis.

## Open Questions
- Should Tier 0 sources automatically propose hub updates after each collect run?
- Should GitHub trending produce weekly tool-watch synthesis in [[reskill-roadmap]]?
- Which competitor sources are noisy enough to require stricter filters?
- Which additional CEO/business sources should be added for pricing, Japan SIer movement, offshore transformation, and enterprise procurement?

## Applied
- 2026-05-19 - Audited collector, Intel API, weekly reports, and current raw/log storage.
- 2026-05-23 - Added CEO Business Model Research channel and seven CEO research categories.
- 2026-05-30 - Added Competitor Intelligence Research as the third lane and made audit the default raw-to-wiki gate.

## See Also
- [[intel-to-wiki-promotion]]
- [[research-audit-queue]]
- [[chat-to-wiki-classification-skill]]
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
