---
title: "Outcome-Based FDE Model"
aliases: ["Outcome-Based Delivery", "FDE Outcome Model", "Man-Month To FDE"]
topic: Business
tags: [fde, outcome-based, offshore, business-models, ai-sdlc, consulting, decision-brain]
status: evergreen
confidence: medium
sources: []
related: ["[[competitor-business-model-radar]]", "[[fde-model]]", "[[fde-roadmap]]", "[[fde-adoption-radar]]", "[[investment-theses]]"]
applied: []
open_questions:
  - "Which current project is safest for an outcome-based FDE pilot?"
  - "Which outcomes are measurable enough to price without taking uncontrolled delivery risk?"
  - "How can an offshore delivery team gradually move from man-month to FDE without breaking customer trust?"
created: 2026-05-19
updated: 2026-05-19
---

# Outcome-Based FDE Model

## Summary
This page captures the transition from offshore man-month delivery to an FDE-style, outcome-based delivery model. The goal is not to abandon man-month pricing immediately, but to add a measurable outcome layer that moves the business from capacity sales toward workflow ownership and value-based delivery.

## Key Points
- Man-month offshore sells delivery capacity; FDE sells problem-solving, workflow ownership, and implementation judgment.
- Outcome-based pricing should be introduced gradually through measurable workflow outcomes, not broad business outcomes that the vendor cannot control.
- The safest bridge model is base fee + milestone fee + optional outcome bonus.
- The first target outcomes should be engineering/process outcomes such as cycle time reduction, documentation speed, test efficiency, bug leakage reduction, onboarding speed, or support triage improvement.
- The strategic direction is offshore delivery → FDE-lite pilot → measurable workflow improvement → managed outcome retainer → selective outcome-based pricing.

## Why It Matters
Traditional offshore delivery is often priced by headcount and time. This creates pressure toward commoditization because customers compare vendors by rate, availability, and delivery volume. An FDE/outcome-based model changes the conversation from "how many people can you provide?" to "which business or engineering workflow can you improve, and how will we measure it?"

For AI-SDLC, this shift is especially important because AI can reduce the value of raw coding capacity while increasing the value of workflow design, evaluation, reliability, and adoption. The durable business model is not selling AI tools or offshore seats. It is improving measurable enterprise workflows with a responsible delivery pod.

## Details

### Current offshore pattern

```text
Customer provides requirement
→ vendor provides engineers
→ billing is based on man-month
→ customer owns business outcome
```

This model is familiar and easy to buy, but it keeps the vendor in a capacity-provider position. The vendor may deliver output, but the customer's business outcome remains weakly connected to pricing.

### Target FDE / outcome-based pattern

```text
Customer has business or workflow pain
→ FDE-style team diagnoses the real process
→ measurable outcome is defined
→ workflow/tool/process is deployed
→ improvement is measured and iterated
→ pricing includes value, milestone, or outcome component
```

This model moves delivery closer to business impact. However, it also creates risk if the vendor accepts outcomes that depend heavily on customer-side behavior, data access, stakeholder adoption, or policy decisions.

### Recommended transition path

Do not move directly from man-month to full outcome-based pricing. Use a staged transition:

```text
Stage 1: Man-month + deliverable
Stage 2: Fixed scope + measurable milestone
Stage 3: Retainer + outcome KPI
Stage 4: Selective outcome-based / gain-share
```

The goal is to build evidence, trust, measurement habits, and repeatable delivery playbooks before taking large outcome risk.

### Commercial model: FDE-lite + outcome wrapper

Use a hybrid pricing structure:

```text
Base fee
+ milestone fee
+ optional outcome bonus
```

- Base fee protects delivery capacity and covers discovery, build, integration, and iteration.
- Milestone fee rewards completion of defined workflow assets or production deployment.
- Outcome bonus rewards measurable improvement after adoption.

This structure is safer than pure gain-share because it avoids putting all delivery risk on the vendor while still moving beyond man-month.

### Good first outcome types

Start with outcomes close to the delivery process, not broad corporate KPIs.

Good first outcomes:
- Reduce requirement clarification cycle time.
- Reduce time to generate design documents.
- Reduce manual test preparation time.
- Reduce regression testing effort.
- Reduce bug leakage after release.
- Reduce developer onboarding time.
- Increase ticket triage throughput.
- Reduce manual reporting workload.
- Improve code review or QA checklist completion rate.

Avoid early outcome pricing on:
- Total revenue increase.
- Company-wide cost reduction.
- Department-wide productivity transformation.
- Outcomes dependent on customer policy, data access, procurement, or organizational adoption outside the project team.

### FDE pod structure

An FDE-style pod should be smaller but stronger than a normal offshore staffing team.

Example pod:

```text
1 FDE lead / solution consultant
1 AI workflow engineer
1 domain engineer
1 QA / eval / process analyst
```

Required capabilities:
- Business process diagnosis.
- Solution prototyping.
- Stakeholder communication.
- AI workflow design.
- Outcome measurement.
- Reliability, QA, and human-in-the-loop design.

### Offer ladder

#### Offer A — Diagnostic Sprint

```text
Duration: 2-4 weeks
Goal: identify one workflow with measurable ROI
Output: pain map, baseline, opportunity map, pilot proposal
Pricing: fixed fee
```

#### Offer B — FDE Pilot

```text
Duration: 6-8 weeks
Goal: build and deploy one working workflow/prototype
Output: working workflow, measurement dashboard, adoption plan
Pricing: base fee + milestone fee
```

#### Offer C — Managed Outcome

```text
Duration: 3-6 months
Goal: operate, improve, and measure the workflow
Output: monthly KPI report, improvement backlog, adoption support
Pricing: retainer + outcome bonus
```

### Example: AI-SDLC requirement analysis

Pain:

```text
Requirement analysis takes too long and creates repeated clarification cycles.
```

Baseline:

```text
A ticket takes two days of clarification before implementation can start.
```

Target outcome:

```text
Reduce clarification cycle from two days to 0.5 day.
```

FDE work:

```text
Create AI-assisted requirement analyzer
+ checklist
+ missing-context detector
+ human review loop
+ dashboard for clarification cycle time
```

Commercial model:

```text
Base monthly fee
+ milestone fee for deployed workflow
+ bonus if cycle time decreases by agreed threshold
```

## Application To OPUS ANIMUS
This model should become a strategic lens when evaluating FDE, AI-SDLC, and competitor signals. The question is not only whether a company uses AI, but whether it can convert AI into a measurable workflow outcome that customers are willing to pay for repeatedly.

For Opus Animus, this page can be used to evaluate business opportunities, design FDE-lite pilots, and judge whether a project is suitable for outcome-based pricing.

## Application To Lucida
Lucida can use the same pattern at smaller scale. Instead of selling generic AI content generation, Lucida could move toward managed production outcomes such as lower lesson production time, higher QA consistency, faster script-to-slide cycles, or repeatable bilingual content production.

The relevant model is:

```text
Content workflow diagnosis
→ AI-assisted production system
→ quality/reliability layer
→ measured production improvement
→ managed production retainer
```

## Open Questions
- Which existing offshore project has the clearest measurable process pain?
- Which project has enough customer-side control to support outcome pricing?
- What baseline metrics are already available?
- What would be the smallest credible FDE pilot offer?
- Which outcomes can be measured in 6-8 weeks?
- What should be excluded from outcome responsibility in the contract?

## Applied
- 2026-05-19 — Captured as a strategic direction for moving from offshore man-month delivery toward FDE-lite and outcome-based delivery.

## See Also
- [[competitor-business-model-radar]]
- [[fde-model]]
- [[fde-roadmap]]
- [[fde-adoption-radar]]
- [[investment-theses]]

## Sources
