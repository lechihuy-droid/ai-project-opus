---
title: "Intel To Wiki Promotion"
aliases: ["Intel Wiki Promotion", "Intel Sync Layer", "Research Promotion Rules"]
topic: Research
tags: [intel, wiki-promotion, research-flow, decision-brain, opus-home]
status: evergreen
confidence: medium
sources: ["api/intel.py", "dashboard/index.html:SimpleIntelView", "run_collect.py", "run_weekly.py", "personal-wiki/Research/research-source-map.md"]
related: ["[[research-source-map]]", "[[ai-trend-radar]]", "[[competitor-business-model-radar]]", "[[fde-adoption-radar]]", "[[investment-theses]]", "[[open-questions]]"]
applied: ["2026-05-19 - Created as the Intel-to-wiki sync contract.", "2026-05-23 - Added anti-repetition rule for daily research briefs."]
open_questions: ["Should marked-used Intel items automatically create update proposals?", "Should weekly reports file back into Personal reflection pages or topic hubs?", "Should repeated no-response categories be tracked as explicit negative feedback?"]
created: 2026-05-19
updated: 2026-05-23
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
- Daily briefs should not repeat old thesis signals unless there is a new decision, action, contradiction, metric, or business implication.

## Why It Matters
The Intel tab is a strong review UI, but it is ephemeral if conclusions stay in dashboard summaries or JSON logs. Consilium needs repeated signals to compound inside `personal-wiki/`.

Consilium should not become a news archive. A daily research brief should surface only what changes Huy's decisions, actions, projects, reskill priorities, business model thinking, or investment questions.

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
- Promote when the same pattern repeats across sources and changes confidence, priority, or action.
- Promote Tier 1 FDE or competitor signals by default unless they are clearly irrelevant.
- Do not promote single weak seed pages into conclusions.
- Do not rewrite whole hub pages for one signal.

### Daily brief anti-repetition rule
Do not surface a daily news item if it only repeats an existing Consilium thesis.

A repeated topic can be shown again only when it adds at least one of:
- new decision impact
- new action for Huy this week
- new business model or investment implication
- new metric, KPI, customer, revenue, adoption, or case-study evidence
- new contradiction that weakens an existing belief
- new tool or workflow worth testing immediately
- new filter rule for future research intake

Suppress or downgrade repeated signals such as:
- generic coding-agent adoption is increasing
- AI coding requires governance
- vibe coding creates quality risk
- agent-first tooling is accelerating
- enterprise AI needs accountability
- skill-first remains necessary before agent orchestration

These are already known Consilium theses. Daily research should reference them only when a new signal changes what Huy should do, believe, test, or track.

### Consilium daily relevance order
Daily research should prioritize in this order:
1. Huy decision impact
2. Immediate action or experiment
3. FDE / business model implication
4. Reskill priority change
5. Investment thesis impact
6. Tool or workflow worth testing
7. Pure technical interest

Pure technical interest should not appear in the daily brief unless it changes one of the higher-priority layers.

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
- Should no-response or repeated-ignore patterns become explicit filter data?

## Applied
- 2026-05-19 - Established the first explicit Intel-to-wiki promotion layer.
- 2026-05-23 - Added daily brief anti-repetition rule after repeated AI coding/governance signals were judged too similar to prior Consilium briefs.

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