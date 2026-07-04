---
title: "Consilium Reading List"
aliases: ["Research Reading Queue", "Strategic Article Queue", "Consilium Reading DB"]
topic: Research
tags: [reading-list, research-intake, strategic-articles, consilium, decision-brain]
status: active
confidence: medium
created: 2026-06-22
updated: 2026-07-04
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

...

## Reading Queue

### RL-20260622-001 — The End of Software Engineering

(unchanged)

---

### RL-20260622-002 — Do Proactive Agents Really Need an LLM to Decide When to Wake and What to Anchor?

(unchanged)

---

### RL-20260622-003 — Agent Systems with Harness Engineering

```text
ID: RL-20260622-003
Title: Agent Systems with Harness Engineering
URL: https://github.com/RUCAIBox/awesome-agent-harness
Source: RUCAIBox / Research Survey
Source tier: tier_e_research
Layer: strategy, evidence
Lane: opus_architecture, ai_sdlc, tech_learning, governance_risk
Labels: harness-engineering, agent-operating-system, memory-system, workflow-engine, tool-orchestration, governance, opus-animus
Priority: P0
Status: reading
Reason to read: Directly aligned with Opus Animus architecture. Reframes agent success from model capability to harness capability including memory, workflow, planning, tools, and governance.
Expected use: Refine Jarvis, PM Agent, and Specialized Agent topology; define memory architecture, governance loops, and AI-native operating system principles.
Added date: 2026-06-22
Decision label: keep
```

---

### RL-20260625-004 — Model Context Protocol (MCP)

```text
ID: RL-20260625-004
Title: Model Context Protocol (MCP)
URL: https://modelcontextprotocol.io/
Source: Anthropic / MCP Documentation
Source tier: tier_c_platform
Layer: strategy, action, evidence
Lane: opus_architecture, ai_sdlc, fde_lite, governance_risk
Labels: mcp, context-protocol, tool-abstraction, agent-interoperability, context-routing, opus-animus
Priority: P0
Status: queued
Reason to read: MCP is relevant to Opus Animus because it defines a protocol layer for connecting agents, tools, files, memory, and working context.
Expected use: Inform Opus tool routing, Consilium context interface, PM Agent integration design, and the boundary between local memory, external connectors, and agent runtime.
Added date: 2026-06-25
Decision label: keep
```

---

### RL-20260626-005 — Agent Harness Research Pack 2026

```text
ID: RL-20260626-005
Title: Agent Harness Research Pack 2026
URL: https://arxiv.org/abs/2606.21856
Source: Deep Research / arXiv / OpenReview
Source tier: tier_e_research
Layer: strategy, evidence, action
Lane: opus_architecture, ai_sdlc, governance_risk, tech_learning, fde_lite
Labels: harness-engineering, agent-harness, agent-operating-system, observability, verification, governance, safety-harness, evaluation-harness, trace-grounded-evaluation, opus-animus
Priority: P0
Status: queued
Reason to read: Consolidates the newest 2026 research around LLM agent harnesses, including runtime governance, multi-user permissions, adaptive harness evolution, benchmarking, observability, safety, and trace-grounded repair/evaluation.
Expected use: Refine OPUS ANIMUS agent architecture; define Jarvis/PM/Specialized Agent harness layers; map Harness Engineering to BD/RD automation; derive evaluation, observability, and governance requirements for production-grade agents.
Added date: 2026-06-26
Decision label: keep
Verification note: Spot-checked key sources. Harness-MU, HarnessX, and Agent Harness Engineering: A Survey resolve to public arXiv/OpenReview full text. Remaining links require later source-by-source verification before wiki promotion.
Primary verified anchors:
- Harness-MU: A Safe, Governed, and Effective Harness for Multi-User LLM Agents — https://arxiv.org/abs/2606.21856
- HarnessX: A Composable, Adaptive, and Evolvable Agent Harness Foundry — https://arxiv.org/abs/2606.14249
- Agent Harness Engineering: A Survey — https://openreview.net/pdf/f358711a95aaaf61fdeffd4ef3fc60fba9b8da57.pdf
Research pack URLs:
- https://arxiv.org/html/2606.21856v1
- https://arxiv.org/html/2606.20950v1
- https://arxiv.org/abs/2606.14249
- https://arxiv.org/html/2606.08348v1
- https://arxiv.org/html/2606.06324v1
- https://arxiv.org/html/2605.27922v1
- https://arxiv.org/html/2605.27333v1
- https://arxiv.org/html/2605.24134v1
- https://arxiv.org/abs/2605.14271
- https://arxiv.org/html/2605.18747v1
- https://openreview.net/pdf/f358711a95aaaf61fdeffd4ef3fc60fba9b8da57.pdf
- https://arxiv.org/abs/2604.13630
- https://arxiv.org/abs/2604.25850
- https://arxiv.org/html/2603.28013v2
- https://arxiv.org/abs/2603.25723
- https://arxiv.org/abs/2603.00991
- https://arxiv.org/html/2602.06841v4
- https://arxiv.org/html/2602.22480v1
```

---

### RL-20260626-006 — Awesome Code as Agent Harness Papers

```text
ID: RL-20260626-006
Title: Awesome Code as Agent Harness Papers
URL: https://github.com/YennNing/Awesome-Code-as-Agent-Harness-Papers
Source: YennNing / GitHub curated research index
Source tier: tier_e_research
Layer: strategy, evidence, action
Lane: opus_architecture, ai_sdlc, governance_risk, tech_learning, fde_lite
Labels: code-as-agent-harness, harness-engineering, agent-harness, agent-operating-system, tool-orchestration, code-execution-substrate, verification, memory-system, multi-agent-coordination, opus-animus
Priority: P0
Status: queued
Reason to read: Curated navigation hub for the Code as Agent Harness research direction. Useful for tracking the taxonomy and selecting specific papers relevant to Opus Animus rather than reading the entire archive sequentially.
Expected use: Use as a research pack to identify papers for Jarvis/PM/Specialized Agent harness design, deterministic control flow, code-mediated agent execution, verification, traceability, memory, and multi-agent workflow orchestration.
Added date: 2026-06-26
Decision label: keep
Reading mode: Do not read sequentially. Use as a lookup index and promote only individually verified high-value papers to the main wiki.
Cross-reference: RL-20260622-003 — Agent Systems with Harness Engineering; RL-20260626-005 — Agent Harness Research Pack 2026.
```

---

### RL-20260704-007 — The Shift to Agentic AI: Evidence from Codex

```text
ID: RL-20260704-007
Title: The Shift to Agentic AI: Evidence from Codex
URL: https://arxiv.org/abs/2606.26959
Source: arXiv
Source tier: tier_e_research
Layer: strategy, evidence, action
Lane: tech_learning, opus_architecture, ai_sdlc, threat_lens, workforce_reskill
Labels: agentic-ai, codex, multi-agent-operation, skills, agent-adoption, concurrent-agents, opus-animus, software-delivery-threat
Priority: P0
Status: queued
Reason to read: Candidate evidence that agentic AI usage is shifting from single assistant interactions toward multi-agent operation, skill use, and more complex agent-managed workflows.
Expected use: Deep-read to validate whether the paper should update operator-topology.md, skill-optimization-loop.md, wiki-eval-loop.md, and the Strategy/agentic-operating-model.md threat lens.
Added date: 2026-07-04
Decision label: test
Verification note: Added from Consilium news scan. Verify abstract, methodology, and metrics before promoting to main wiki.
```

---

## Commands

...

## Decision Label

`test`
