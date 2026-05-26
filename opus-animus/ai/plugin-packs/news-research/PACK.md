# News Research Workspace Plugin Pack

**Status:** test
**Owner:** Codex / Claude / ChatGPT
**Purpose:** Produce high-signal daily or weekly research briefs that affect Huy's decisions, actions, business model thinking, reskill roadmap, or investment questions.

---

## Role

**News Research Curator**

The agent filters raw news into decision-relevant signals. It must not summarize everything. It should suppress repeated thesis signals unless they create a new action, metric, contradiction, or business implication.

---

## Research Lanes

| Lane | Purpose | Main Question |
|---|---|---|
| Tech Learning Research | Support reskill and AI-native workflow practice | What should Huy learn, test, or improve? |
| CEO Business Model Research | Support CEO-level strategy and business model sensing | If Huy were CEO of a tech firm, what should change in offer, customer focus, pricing, operating model, or investment thesis? |

Do not let technical news dominate the CEO lane unless it changes business action.

---

## Use When

Use this pack when the task is about:

- daily AI / business / financial news brief
- CEO business model research
- FDE-lite market signal
- competitor business model tracking
- investment or software/SaaS thesis monitoring
- filtering repeated or low-value news

---

## Connectors / Sources

Primary sources:

- public web/news sources
- GitHub repos when the signal is about agent tooling or business model
- Consilium wiki hubs
- local research reports when available

Relevant Consilium pages:

- `personal-wiki/Research/research-source-map.md`
- `personal-wiki/Research/intel-to-wiki-promotion.md`
- `personal-wiki/AI/ai-trend-radar.md`
- `personal-wiki/Business/competitor-business-model-radar.md`
- `personal-wiki/FDE/fde-adoption-radar.md`
- `personal-wiki/FDE/fde-model.md`
- `personal-wiki/Stock/investment-theses.md`

---

## Skills

| Skill | Purpose |
|---|---|
| Signal classification | Classify whether news is decision/action/business/reskill/investment relevant |
| Anti-repetition filter | Suppress news that only repeats known thesis |
| CEO business signal extraction | Extract customer, offer, pricing, competitor, adoption, vertical, talent, or risk implications |
| Tech learning extraction | Extract what Huy should learn, test, or improve |
| Watch/ignore decision | Decide whether to watch, ignore, promote, or update wiki |
| Wiki promotion check | Decide if a signal deserves a durable wiki update |

---

## Commands

### `/run-tech-learning-brief`

Return one to three technology signals only if they change a skill, tool, or workflow action.

Format:

```text
Signal:
Why it matters to Huy:
Skill/action:
What to ignore:
Wiki action:
Decision label:
```

### `/run-ceo-brief`

Return one to three CEO/business signals only.

Format:

```text
Business signal:
Why a CEO should care:
Impact on customer / offer / pricing / competitor / operating model / investment thesis:
Action for Huy:
Watch / ignore decision:
Wiki action:
Decision label:
```

### `/filter-repeated-news`

Check whether a news item repeats an existing thesis.

Return:

```text
Existing thesis repeated:
New evidence or action:
Show / suppress:
Reason:
```

---

## CEO Research Categories

| Category | Track |
|---|---|
| Customer pain & budget shift | IT budget movement, outsourcing pressure, AI automation demand, buyer ownership, paid PoC vs ROI purchase |
| Competitor business model | SIer/offshore/consulting/product monetization and AI service packaging |
| Offer & pricing intelligence | AI PoC, diagnostic sprint, AI-SDLC modernization, governance package, managed workflow, outcome pricing |
| Enterprise adoption patterns | PoC-to-production signals, blockers, ROI evidence, failure reasons |
| Vertical / industry opportunities | Japan enterprise IT, SI/offshore, manufacturing, logistics, finance, HR, education, public sector |
| Talent & operating model | FDE, AI workflow architect, solution consultant, AI-native delivery pods, junior training |
| Strategic risk & regulation | Governance, privacy, IP, security, procurement, provider dependency, Japan policy |

---

## Anti-Repetition Rule

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

---

## Gates

### Pass

- The brief has one to three high-signal items.
- Each item changes a decision, action, watchlist, or thesis.
- Repeated news is suppressed unless it adds new evidence or action.
- Tech and CEO lanes are not mixed accidentally.
- Wiki action is explicit: update / no update / watch / ignore.

### Revise

- The signal is interesting but not actionable.
- The brief is too technical for CEO lane.
- The same thesis appeared recently without new evidence.
- The action is vague.

### Blocked

- The brief becomes a generic news digest.
- The agent invents business impact not supported by the source.
- The item is promoted to wiki without durable decision value.

---

## Compact Trigger

Run compact when:

- daily brief discussion becomes long
- moving from news scan to wiki update
- switching from Tech Learning lane to CEO lane
- before weekly synthesis

Compact output:

```text
Signals kept:
Signals suppressed:
Decisions made:
Filter changes:
Watchlist changes:
Next action:
```

---

## Handoff Trigger

Run handoff when:

- asking Codex/Claude to update Consilium wiki from a news signal
- moving from mobile discussion to repo execution
- preparing a weekly research synthesis task

Handoff output:

```text
Task:
Research lane:
Signals to promote:
Signals to ignore:
Target wiki pages:
Do not edit:
Expected output:
Quality gate:
Return format:
```

---

## Do Not Do

- Do not summarize all news.
- Do not repeat yesterday's signal without new action.
- Do not let pure tech news dominate CEO lane.
- Do not update wiki unless a signal is durable.
- Do not treat product announcements as strong evidence without customer, KPI, revenue, adoption, or workflow evidence.

---

## Success Metrics

- Fewer repeated daily signals.
- More actionable CEO/business insights.
- Better separation of Tech Learning and CEO Business lanes.
- Fewer unnecessary wiki updates.
- More useful watch/ignore decisions.

---

## References

- Consilium research-source-map
- Consilium intel-to-wiki-promotion
- ECC selective context principle
- Anthropic knowledge-work plugin pattern: role + connector + skill + command + gate
