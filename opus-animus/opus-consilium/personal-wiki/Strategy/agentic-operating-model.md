---
title: "Agentic Operating Model"
aliases: ["Agentic SDLC Operating Model", "Agentic Delivery Strategy", "AI IT Strategic Lens"]
topic: Strategy
tags: [strategy, ai-it, agentic-sdlc, operating-model, decision-brain]
status: evergreen
confidence: medium
sources:
  - "McKinsey — Rewiring software delivery for the agentic era, 2026"
related: ["[[ai-trend-radar]]", "[[competitor-business-model-radar]]", "[[fde-model]]", "[[investment-theses]]", "[[open-questions]]"]
applied:
  - "2026-06-06 - Created strategic lens page to separate long-term strategic frameworks from daily CEO news and competitor evidence."
open_questions:
  - "Which strategic lenses deserve permanent radar categories?"
  - "Which daily CEO signals prove or weaken the agentic operating model thesis?"
  - "Which parts of Opus should become machine-readable control-plane artifacts first?"
created: 2026-06-06
updated: 2026-06-06
---

# Agentic Operating Model

## Purpose

This page stores strategic lenses for AI and IT operating-model change. It is not a daily news page and not a competitor-move page.

Use it to interpret CEO/business news, competitor signals, and Opus architecture decisions.

```text
Strategic lens = how to think
Radar = what to watch
Evidence = what happened
Action = what Opus / FDE-lite should do
```

---

## Core Thesis

Agentic AI changes software delivery and IT operations only when the operating model is rewired.

The useful enterprise pattern is not simply:

```text
AI coding tool → faster code
```

The more durable pattern is:

```text
standardized workflow
+ machine-readable artifacts
+ knowledge infrastructure
+ human review gates
+ cost / security / quality guardrails
+ smaller supervisory pods
= agentic operating model
```

---

## Strategic Lens

Do not evaluate AI/IT strategy only by model capability or coding speed.

Evaluate whether a company, tool, or service changes:

- workflow ownership
- artifact structure
- knowledge infrastructure
- governance and approval gates
- team structure
- delivery rhythm
- cost / ROI accountability
- security and compliance posture
- operating model of consulting, SI, or software teams

---

## What To Watch

### CEO Radar

Track whether enterprise buyers shift from tool experimentation to operating-model redesign:

- CIO/CFO commentary about AI cost discipline and ROI
- customers reporting productivity, quality, or team-size changes
- governance becoming part of delivery workflow
- enterprise AI moving from innovation budget to operating budget
- AI adoption blockers around security, compliance, data, and change management

### Competitor Radar

Track whether competitors sell operating-model redesign rather than tool implementation:

- consulting firms packaging agentic SDLC or AI delivery transformation
- SIers launching AI delivery practices, centers of excellence, or certified partner tracks
- offshore vendors moving from man-month delivery to workflow improvement retainers
- platform vendors turning coding agents into enterprise workflow systems
- hyperscaler + SIer alliances around secure agentic delivery

### Tech Learning Radar

Track technical capabilities only when they change the operating model:

- machine-readable specs, context files, and workflow packs
- knowledge graphs / memory systems for SDLC or IT operations
- evals, observability, and release gates for agentic workflows
- tool-call security boundaries and approval gates
- session continuity, handoff, compact, and status contracts

---

## Application To Opus

Opus should treat this page as a strategic north-star for workspace architecture.

Implications:

- `operator-topology.md` should map operator surfaces into the Opus ai control layer and execution subsystems.
- `PACK.md`, `status.md`, `handoff-*.md`, and `scheduler-ops.md` should stay structured enough for agents to use as operational inputs.
- Consilium wiki should accumulate decisions, methods, open questions, source-backed theses, and traceable context, not raw transcripts.
- Automation should not increase before observability and write gates are clear.
- Daily research should separate strategic lens, daily evidence, competitor proof, and action.

---

## Application To FDE-lite

The FDE-lite offer should not be framed as generic AI implementation.

Better framing:

```text
AI Workflow Diagnostic & Guardrail Sprint
```

Core deliverables:

- workflow pain map
- source / data / security risk map
- machine-readable artifact map
- human approval gate design
- cost / ROI assumption sheet
- small controlled pilot plan
- knowledge infrastructure / wiki handoff plan

This matches the thesis that buyers will pay for operating-model change, not just tooling.

---

## Source Map For Strategic AI/IT Lenses

Use these sources as inputs for the Strategy layer. They are not all daily-news sources.

### Tier A — Strategy / operating model

Use for long-term lenses and executive interpretation:

- McKinsey Technology / QuantumBlack
- BCG X / BCG Technology Advantage
- Bain Technology / AI strategy
- Deloitte Tech Trends / AI Institute
- PwC AI / Digital transformation reports
- Accenture Technology Vision
- Gartner research on AI, software engineering, IT operating model, AI TRiSM
- Forrester research on AI, software delivery, enterprise automation
- IDC research on IT spending, AI adoption, and enterprise platforms

### Tier B — IT services / SI / outsourcing market

Use for business-model and competitor interpretation:

- Everest Group
- HFS Research
- ISG Provider Lens
- Gartner Magic Quadrant / Market Guide where available
- Forrester Wave where available
- IDC MarketScape
- company IR / earnings from Accenture, Capgemini, NTT DATA, Fujitsu, NEC, Hitachi, TCS, Infosys, Wipro, Cognizant, HCLTech, FPT Software

### Tier C — Platform / cloud / system-of-record strategy

Use for platform moat and enterprise adoption:

- Microsoft Work Trend Index / Azure / GitHub / Copilot official material
- AWS enterprise AI / Bedrock / Q business material
- Google Cloud / Gemini for Workspace / Vertex AI material
- NVIDIA enterprise AI / full-stack AI infrastructure material
- ServiceNow, Salesforce, SAP, Workday, Snowflake official strategy and IR material

### Tier D — Practitioner / engineering strategy

Use for technical reality checks:

- Thoughtworks Technology Radar
- Martin Fowler / Thoughtworks engineering strategy essays
- GitHub Octoverse and GitHub engineering / Copilot studies
- Stack Overflow Developer Survey
- DORA / Google Cloud engineering productivity research
- Microsoft Research / Google Research / Anthropic Research / OpenAI Research
- Simon Willison, Latent Space, Import AI, Hugging Face engineering posts

### Tier E — Academic / primary research

Use for validation and mechanism-level understanding:

- arXiv papers with clear methodology
- ACM / IEEE software engineering papers
- empirical studies on GenAI in software engineering
- security advisories and vulnerability research for agentic workflows

---

## Promotion Criteria

A strategic article deserves this layer when it changes at least one of:

- how to interpret daily CEO news
- what competitor signal to watch
- how to design an offer
- how to structure Opus / Consilium / Lucida
- what skill to learn next
- what thesis to test or weaken

Do not promote an article if it is only inspirational, generic AI optimism, or a vendor pitch without a reusable framework.

---

## Output Format

When adding a strategic article, summarize it like this:

```text
Article:
Source type:
Strategic lens:
Core thesis:
Implication for CEO radar:
Implication for competitor radar:
Implication for Opus / FDE-lite:
Related daily signals:
Action / watchlist update:
Decision label:
```

---

## Evidence

### McKinsey — Rewiring software delivery for the agentic era

Strategic lens:

```text
Agentic software delivery is an operating-model redesign, not a coding-tool upgrade.
```

Core lesson:

- Agents need structured, machine-readable inputs.
- Human value shifts toward architecture judgment, domain modeling, review-gate design, and supervisory skill.
- Knowledge infrastructure is the memory layer for agentic work.
- Do not build a grand ontology first; let the knowledge graph evolve around live priority workflows.

Opus implication:

- Create `operator-topology.md` as the next control-plane artifact.
- Keep packs and status files structured enough for agents.
- Keep wiki updates selective and gated.
- Add observability before increasing autonomy.

Decision label: test.

---

## See Also

- [[ai-trend-radar]]
- [[competitor-business-model-radar]]
- [[outcome-based-fde-model]]
- [[investment-theses]]
- [[open-questions]]
