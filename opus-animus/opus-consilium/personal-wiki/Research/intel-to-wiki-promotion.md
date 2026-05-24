---
title: "Intel To Wiki Promotion"
aliases: ["Intel Wiki Promotion", "Intel Sync Layer", "Research Promotion Rules"]
topic: Research
tags: [intel, wiki-promotion, research-flow, decision-brain, opus-home]
status: evergreen
confidence: medium
sources: ["api/intel.py", "dashboard/index.html:SimpleIntelView", "run_collect.py", "run_weekly.py", "personal-wiki/Research/research-source-map.md"]
related: ["[[research-source-map]]", "[[ai-trend-radar]]", "[[competitor-business-model-radar]]", "[[fde-adoption-radar]]", "[[investment-theses]]", "[[open-questions]]"]
applied: ["2026-05-19 - Created as the Intel-to-wiki sync contract."]
open_questions: ["Should marked-used Intel items automatically create update proposals?", "Should weekly reports file back into Personal reflection pages or topic hubs?"]
created: 2026-05-19
updated: 2026-05-19
---

# Intel To Wiki Promotion

## Summary
This page defines when Opus Home Intel becomes durable Consilium wiki knowledge. Raw sources and dashboard reports are evidence; hub pages hold conclusions and decisions.

## Key Points
- Intel review is not enough. A signal becomes durable only after it updates a wiki hub page.
- Auto-ingest can create seed pages from raw articles, but hub-page synthesis is still required.
- `mark-used` means an item affected review; it does not by itself mean the wiki has absorbed the insight.
- Promotion should be small, explicit, and decision-oriented.
- Every promoted signal should map to one primary hub and optional secondary hubs.

## Why It Matters
The Intel tab is a strong review UI, but it is ephemeral if conclusions stay in dashboard summaries or JSON logs. Consilium needs repeated signals to compound inside `personal-wiki/`.

## Details
Promotion flow:

```text
raw/articles
-> api/intel.py enrichment
-> Opus Home Intel review
-> choose useful signal
-> update hub page
-> add source/evidence
-> update open question or decision if needed
-> push GitHub main
```

Primary routes:

| Signal Type | Primary Wiki Target | Secondary Targets |
|---|---|---|
| AI model/platform release | [[ai-trend-radar]] | [[reskill-roadmap]], [[investment-theses]] |
| Coding agent / AI-SDLC signal | [[ai-trend-radar]] | [[reskill-roadmap]], [[fde-adoption-radar]] |
| Enterprise AI deployment / FDE signal | [[fde-adoption-radar]] | [[fde-model]], [[competitor-business-model-radar]] |
| Competitor/SIer business model | [[competitor-business-model-radar]] | [[fde-japan-gap-analysis]], [[investment-theses]] |
| Japan macro / market / industrial policy | [[investment-theses]] | [[japan-economy]], [[asia-pacific-region]] |
| Tool or GitHub repo to practice | [[reskill-roadmap]] | [[ai-trend-radar]] |
| Unresolved uncertainty | [[open-questions]] | Relevant topic hub |
| Decision made | [[decisions]] | Relevant topic hub |

Promotion criteria:

- Promote when the signal changes a belief, roadmap, thesis, decision, or open question.
- Promote when the same pattern repeats across sources.
- Promote Tier 1 FDE or competitor signals by default unless they are clearly irrelevant.
- Do not promote single weak seed pages into conclusions.
- Do not rewrite whole hub pages for one signal.

Cloud prompt for ChatGPT mobile:

```text
Use opus-consilium.
Read README.md, SCHEMA.md, INDEX.md, research-source-map, and intel-to-wiki-promotion.
Given this Intel signal, decide whether to promote it to the wiki.
If yes, update the correct hub page only.
Keep the edit small.
Add source/evidence.
Return changed files, commit hash, and decision label.
```

Weekly promotion prompt:

```text
Use opus-consilium.
Read the latest logs/weekly report if available, then read intel-to-wiki-promotion.
Promote only durable weekly conclusions into:
- ai-trend-radar
- competitor-business-model-radar
- fde-adoption-radar
- investment-theses
- reskill-roadmap
- open-questions
Do not copy the report. Extract only decisions, repeated patterns, and questions.
```

## Application To OPUS ANIMUS
This page is the operating contract between Opus Home Intel and Consilium. Dashboard remains the review surface; wiki hub pages remain the decision memory.

## Open Questions
- Should `mark-used` in Opus Home create a pending promotion queue?
- Should `logs/weekly/*.json` automatically open a promotion checklist?
- Should there be an `Intel/` dashboard panel showing which hub pages were updated this week?

## Applied
- 2026-05-19 - Established the first explicit Intel-to-wiki promotion layer.

## See Also
- [[research-source-map]]
- [[ai-trend-radar]]
- [[competitor-business-model-radar]]
- [[fde-adoption-radar]]
- [[investment-theses]]
- [[open-questions]]

## Sources
- `api/intel.py`
- `dashboard/index.html:SimpleIntelView`
- `run_collect.py`
- `run_weekly.py`
- `personal-wiki/Research/research-source-map.md`
