---
title: "AI Trend Radar"
aliases: ["AI Trends", "Trend Radar"]
topic: AI
tags: [ai-trends, decision-brain, agents, coding-agents]
status: evergreen
confidence: medium
sources: []
related: ["[[current-beliefs]]", "[[open-questions]]", "[[reskill-roadmap]]", "[[investment-theses]]", "[[competitor-business-model-radar]]", "[[openai-codex-base-instructions]]", "[[llm-agents-2025]]", "[[human-in-the-loop-systems-for-agentic-workflows]]", "[[ai-evals-bottleneck]]", "[[agent-first-vs-skill-first]]"]
applied: []
open_questions: ["Which trend is strong enough to change weekly action?"]
created: 2026-05-19
updated: 2026-05-20
---

# AI Trend Radar

## Summary
This hub tracks AI trends worth discussing with Codex. It should absorb high-signal seed pages and convert repeated signals into conclusions.

## Key Points
- Coding agents and agentic workflows are the primary trend to watch.
- Current synthesis: coding agents should be treated as workflow infrastructure, not standalone assistants. The actionable layer is reliability: evals, HITL, sandboxing, observability, and debugging loops.
- Evaluation, observability, HITL, and sandboxing are the reliability layer.
- Model efficiency and inference cost matter because agents multiply token usage.
- Enterprise AI adoption matters only when it changes workflows, budgets, labor structure, or competitor business models.
- Agent-first tooling is accelerating, but FDE-lite methodology should remain skill-first until workflows, gates, and failure modes are stable.

## Why It Matters
The goal is not to know every AI update. The goal is to identify which AI trends change work, learning, product strategy, or investment theses.

## Details
Trend buckets:
- Coding agents and software automation
- Agent reliability, HITL, evals, observability
- AI infra, inference cost, memory, model efficiency
- Enterprise adoption and workflow redesign
- Competitor AI business models and SIer/consulting monetization patterns
- Open model ecosystem and local/cloud tradeoffs
- Multimodal and voice agents when they affect real workflows

### 2026-05-20 Signal: agent-first tooling vs skill-first methodology
New market signals suggest major AI platforms are moving toward agent-first products: always-on assistants, cloud-running agents, agent-first coding platforms, CLI/SDK support, and repository-level context files.

Interpretation:
- Tooling trend: agent-first.
- Methodology rule for Consilium/FDE-lite: skill-first, agent-later.

Why:
- Agent-first tools let users delegate broader goals to autonomous systems.
- Enterprise workflows such as BD/RCD still need source authority, input control, traceability, human gates, and failure logs before autonomy is safe.
- AGENTS.md and context files are useful governance artifacts, but they should stay minimal and action-oriented; unnecessary instructions can increase cost and make agent tasks harder.

Recommended wiki action:
- Treat this as a strong trend signal.
- Keep BD/RCD pilot skill-first.
- Use agent-first tools only after sample 1 and sample 2 validate repeatability.
- Maintain [[agent-first-vs-skill-first]] as the methodology bridge between market trend and FDE-lite operating rule.

## Application To OPUS ANIMUS
Use this hub when asking Codex for an AI trend brief. Codex should cite source pages, then say whether each trend is actionable now, watch-only, or noise.

## Open Questions
- Which trend should become a weekly experiment?
- Which trend is investment-relevant but not personally actionable?
- Which trend is personally actionable but not investable?
- Which BD/RCD skills should become agent-orchestrated after sample 2?

## Applied
- 2026-05-20 — Added agent-first tooling vs skill-first methodology signal and linked [[agent-first-vs-skill-first]].

## See Also
- [[competitor-business-model-radar]]
- [[openai-codex-base-instructions]]
- [[llm-agents-2025]]
- [[human-in-the-loop-systems-for-agentic-workflows]]
- [[ai-evals-bottleneck]]
- [[large-language-models-debugging]]
- [[agent-first-vs-skill-first]]

## Sources
- The Verge — Google Gemini Spark and Antigravity updates, 2026-05-20.
- The Times of India — Google Antigravity 2.0 agent-first rebuild, 2026-05-20.
- arXiv — Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?, 2026-02-12.
- arXiv — Configuring Agentic AI Coding Tools: An Exploratory Study, 2026-02-16.
