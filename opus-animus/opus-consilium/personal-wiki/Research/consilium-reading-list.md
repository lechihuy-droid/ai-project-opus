---
title: "Consilium Reading List"
aliases: ["Research Reading Queue", "Strategic Article Queue", "Consilium Reading DB"]
topic: Research
tags: [reading-list, research-intake, strategic-articles, consilium, decision-brain]
status: active
confidence: medium
created: 2026-06-22
updated: 2026-06-22
---

# Consilium Reading List

## Purpose

This file stores articles that Huy has selected from search briefs for later deep reading.

It is not the main wiki and not a raw article archive.

```text
Search brief
→ human pick
→ reading list
→ deep read
→ wiki promotion
```

A reading-list entry means:

```text
This article looks useful enough to read later.
```

It does not mean:

```text
This article has already become a durable wiki thesis.
```

---

## Status Flow

```text
candidate
→ queued
→ reading
→ summarized
→ promoted
→ archived
```

Alternative path:

```text
candidate
→ ignored
```

| Status | Meaning |
|---|---|
| `candidate` | Found by search, not yet selected by Huy |
| `queued` | Selected by Huy and added to this reading list |
| `reading` | Currently being read or summarized deeply |
| `summarized` | Deep summary exists, but not yet promoted to main wiki |
| `promoted` | Insight has been added to Strategy / Radar / Evidence / Action layer |
| `archived` | Kept as reference, no further action |
| `ignored` | Not useful enough to keep |

---

## Label Taxonomy

### Layer Labels

```text
strategy
radar
evidence
action
```

### Lane Labels

```text
ceo_business
competitor_intelligence
tech_learning
dx_japan
ai_sdlc
impact_lens
fde_lite
opus_architecture
governance_risk
workforce_reskill
investment_thesis
```

### Source Tier Labels

```text
tier_a_strategy
tier_b_it_services
tier_c_platform
tier_d_practitioner
tier_e_research
tier_f_japan_dx
tier_g_news
tier_h_social_lead_only
```

### Priority Labels

```text
P0 = read deeply now; likely affects Strategy / Action
P1 = read this week
P2 = keep as watch evidence
P3 = reference only
```

### Action Labels

```text
deep_read
watch
promote_to_strategy
promote_to_radar
promote_to_evidence
update_pack
update_offer
ignore
```

---

## Intake Gate

Before adding an item, check:

```text
Source is clear.
Relevance to Huy is clear.
Layer and lane are clear.
Reason to read is explicit.
Expected use is explicit.
The item is not already stored.
```

If these are not clear, do not add. Return decision label `keep` or `reject`.

---

## Entry Template

```text
ID:
Title:
URL:
Source:
Source tier:
Layer:
Lane:
Labels:
Priority:
Status:
Reason to read:
Expected use:
Added date:
Decision label:
```

---

## Reading Queue

### RL-20260622-001 — The End of Software Engineering

```text
ID: RL-20260622-001
Title: The End of Software Engineering: How AI Agents Are Fundamentally Restructuring the Software Paradigm
URL: https://arxiv.org/html/2606.05608v1
Source: arXiv
Source tier: tier_e_research
Layer: strategy
Lane: impact_lens, ai_sdlc, opus_architecture, workforce_reskill
Labels: agentic-sdlc, software-engineering-impact, control-plane, eval-loop, fde-lite
Priority: P0
Status: promoted
Reason to read: Strong impact lens for code-centric software delivery, offshore/SI business models, and Opus control-plane design.
Expected use: Update Strategy/agentic-operating-model.md, operator-topology.md, and wiki-eval-loop.md.
Added date: 2026-06-22
Decision label: test
```

Promotion result:

```text
Promoted to: personal-wiki/Strategy/agentic-operating-model.md
Related control artifact: opus-animus/ai/operator-topology.md
```

---

### RL-20260622-002 — Do Proactive Agents Really Need an LLM to Decide When to Wake and What to Anchor?

```text
ID: RL-20260622-002
Title: Do Proactive Agents Really Need an LLM to Decide When to Wake and What to Anchor?
URL: https://arxiv.org/abs/2605.30152
Source: arXiv
Source tier: tier_e_research
Layer: strategy, evidence
Lane: opus_architecture, ai_sdlc, tech_learning
Labels: proactive-agent, wake-pattern, context-routing, temporal-graph-learning, always-on-trigger, on-device-agent, consilium
Priority: P0
Status: queued
Reason to read: Directly relevant to Consilium and Opus Animus architecture because it questions always-on LLM triggering and proposes a graph-first trigger/router for proactive assistants.
Expected use: Update Consilium wake-pattern design, Opus proactive-agent architecture, and evidence notes for when to wake an LLM versus using lightweight graph/routing models.
Added date: 2026-06-22
Decision label: keep
```

---

## Commands

### Add from search brief

```text
Add bài số <n> vào Consilium reading list
```

Expected behavior:

```text
Create or update an entry.
Add labels.
Set status = queued unless already promoted.
Return changed files, commit hash, decision label.
```

### Deep read

```text
Đọc bài RL-YYYYMMDD-XXX
```

Expected output:

```text
Deep summary
Strategic lens
Opportunity / risk
Implication for Opus / FDE-lite / CEO radar
Promotion target
Recommended wiki action
```

### Promote

```text
Promote bài này vào Strategy layer
```

Expected behavior:

```text
Update Strategy / Radar / Evidence / Action page.
Change reading list status to promoted.
Return changed files, commit hash, decision label.
```

---

## Decision Label

`test`
