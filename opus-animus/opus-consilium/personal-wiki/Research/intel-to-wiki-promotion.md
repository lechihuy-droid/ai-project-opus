---
title: "Intel To Wiki Promotion"
aliases: ["Intel Wiki Promotion", "Intel Sync Layer", "Research Promotion Rules"]
topic: Research
tags: [intel, wiki-promotion, research-flow, decision-brain, opus-home]
status: evergreen
confidence: medium
sources: ["api/intel.py", "dashboard/index.html:SimpleIntelView", "run_collect.py", "run_weekly.py", "personal-wiki/Research/research-source-map.md"]
related: ["[[research-source-map]]", "[[ai-trend-radar]]", "[[competitor-business-model-radar]]", "[[fde-adoption-radar]]", "[[investment-theses]]", "[[open-questions]]"]
applied: ["2026-05-19 - Created as the Intel-to-wiki sync contract.", "2026-05-23 - Added anti-repetition rule for daily research briefs.", "2026-05-23 - Added CEO Business Model Research promotion rules."]
open_questions: ["Should marked-used Intel items automatically create update proposals?", "Should weekly reports file back into Personal reflection pages or topic hubs?", "Should repeated no-response categories be tracked as explicit negative feedback?", "Should the CEO research channel get a separate daily/weekly report artifact?"]
created: 2026-05-19
updated: 2026-05-23
---

# Intel To Wiki Promotion

## Summary
This page defines when Opus Home Intel becomes durable Consilium wiki knowledge. Raw sources and dashboard reports are evidence; hub pages hold conclusions and decisions.

Consilium research now has two daily lanes:
- **Tech Learning Research**: skills, tools, AI-native workflows, coding agents, and operational practice.
- **CEO Business Model Research**: customer budget, competitor models, offer/pricing, enterprise adoption, vertical opportunity, talent/operating model, and strategic risk.

## Key Points
- Intel review is not enough. A signal becomes durable only after it updates a wiki hub page.
- Auto-ingest can create seed pages from raw articles, but hub-page synthesis is still required.
- `mark-used` means an item affected review; it does not by itself mean the wiki has absorbed the insight.
- Promotion should be small, explicit, and decision-oriented.
- Every promoted signal should map to one primary hub and optional secondary hubs.
- Daily briefs should not repeat old thesis signals unless there is a new decision, action, contradiction, metric, or business implication.
- CEO Business Model Research should be separated from Tech Learning Research so technical news does not crowd out strategic business signals.

## Why It Matters
The Intel tab is a strong review UI, but it is ephemeral if conclusions stay in dashboard summaries or JSON logs. Consilium needs repeated signals to compound inside `personal-wiki/`.

Consilium should not become a news archive. A daily research brief should surface only what changes Huy's decisions, actions, projects, reskill priorities, business model thinking, or investment questions.

As Huy's research system matures, the main gap is no longer technology awareness alone. A CEO-level channel is needed to answer: what customers buy, how competitors monetize, which offer/pricing patterns emerge, where enterprise adoption is stuck, which verticals are opening, what team model is needed, and what risks affect buying.

## Details
Promotion flow:

```text
raw/articles
-> api/intel.py enrichment
-> Opus Home Intel review
-> choose useful signal
-> classify as Tech Learning or CEO Business Model
-> update hub page if durable
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

### Research lane classification

| Lane | Include When | Suppress When | Default Output |
|---|---|---|---|
| Tech Learning Research | The signal changes what Huy should learn, test, automate, or improve in AI-native workflow | It is only a model/tool/news update with no practice implication | Skill/action brief and optional update to [[ai-trend-radar]] or [[reskill-roadmap]] |
| CEO Business Model Research | The signal changes business strategy, offer design, customer budget view, competitor model, operating model, vertical opportunity, or investment question | It is pure technical detail without CEO-level implication | CEO brief and optional update to [[competitor-business-model-radar]], [[fde-adoption-radar]], [[fde-model]], [[investment-theses]], or [[open-questions]] |

### CEO Business Model Research categories

| Category | Promote When Signal Shows | CEO Question | Primary Wiki Route |
|---|---|---|---|
| Customer pain & budget shift | Budget movement, outsourcing pressure, paid AI automation demand, buyer ownership, paid PoC vs ROI-based purchase | Are customers still buying man-months, or shifting toward outcome and automation? | [[fde-adoption-radar]], [[competitor-business-model-radar]], [[investment-theses]] |
| Competitor business model | SIer/offshore/consulting/product firm changes monetization, packaging, delivery model, or AI positioning | How are competitors moving from labor arbitrage to AI-enabled delivery or outcome models? | [[competitor-business-model-radar]], [[fde-japan-gap-analysis]], [[fde-model]] |
| Offer & pricing intelligence | AI PoC, diagnostic sprint, AI-SDLC modernization, governance/audit package, managed workflow, outcome-based pricing | What offer can customers pay for in the next 3-6 months? | [[competitor-business-model-radar]], [[fde-model]], [[investment-theses]] |
| Enterprise adoption patterns | Use cases moving from PoC to production, department-level adoption, blocker evidence, ROI evidence, failure reasons | Where is AI adoption stuck, and can a tech firm sell a solution to that bottleneck? | [[fde-adoption-radar]], [[competitor-business-model-radar]] |
| Vertical / industry opportunities | Japan enterprise IT, SI/offshore, manufacturing, logistics, finance, HR, education, public sector, content automation | Which vertical has strong pain, visible budget, and manageable adoption barriers? | [[fde-japan-gap-analysis]], [[fde-adoption-radar]], [[investment-theses]] |
| Talent & operating model | New roles, FDE, AI workflow architect, solution consultant, AI product manager, AI-native delivery pods, junior developer training | What team model should a tech firm build to win AI delivery? | [[fde-model]], [[reskill-roadmap]], [[competitor-business-model-radar]] |
| Strategic risk & regulation | AI governance, data privacy, IP/copyright, security incidents, procurement rules, provider dependency, Japan policy | Which risks could delay customer buying or force a different delivery model? | [[open-questions]], [[investment-theses]], [[fde-adoption-radar]] |

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

### CEO daily brief format

Use this format when the user asks for CEO/business research:

```text
1. Business signal
2. Why a CEO should care
3. Impact on customer / offer / pricing / competitor / operating model / investment thesis
4. Action for Huy
5. Watch / ignore decision
6. Wiki action
```

Default to one to three high-signal items. Do not include more items just because more news exists.

Cloud prompt for ChatGPT mobile:

```text
Use opus-consilium.
Read README.md, SCHEMA.md, INDEX.md, research-source-map, and intel-to-wiki-promotion.
Given this Intel signal, decide whether to promote it to the wiki.
Classify it as Tech Learning Research or CEO Business Model Research.
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
Separate Tech Learning Research from CEO Business Model Research.
```

## Application To OPUS ANIMUS
This page is the operating contract between Opus Home Intel and Consilium. Dashboard remains the review surface; wiki hub pages remain the decision memory.

Use the Tech Learning lane when the goal is reskill, tool practice, AI workflow improvement, or FDE-lite method learning.

Use the CEO Business Model lane when the goal is strategy: customer pain, budget, competitors, offer/pricing, enterprise adoption, verticals, talent model, risk, and investment/business thesis.

## Open Questions
- Should `mark-used` in Opus Home create a pending promotion queue?
- Should `logs/weekly/*.json` automatically open a promotion checklist?
- Should there be an `Intel/` dashboard panel showing which hub pages were updated this week?
- Should no-response or repeated-ignore patterns become explicit filter data?
- Should CEO Business Model Research have a separate weekly report artifact from Tech Learning Research?

## Applied
- 2026-05-19 - Established the first explicit Intel-to-wiki promotion layer.
- 2026-05-23 - Added daily brief anti-repetition rule after repeated AI coding/governance signals were judged too similar to prior Consilium briefs.
- 2026-05-23 - Added CEO Business Model Research lane, including seven CEO research categories and a CEO daily brief format.

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