---
title: "Agent-First vs Skill-First"
aliases: ["Agent-first tooling", "Skill-first methodology", "Agent-first vs skill-first AI adoption"]
topic: FDE
tags: [fde, ai-sdlc, agents, skills, methodology, human-in-the-loop, ai-adoption]
status: evergreen
confidence: medium
sources:
  - "The Verge: Google Gemini Spark / Antigravity updates, 2026-05-20"
  - "The Times of India: Google Antigravity 2.0 agent-first rebuild, 2026-05-20"
  - "arXiv: Evaluating AGENTS.md, 2026-02-12"
related: ["[[bd-rcd-ai-pack-pilot]]", "[[ears-for-rd-to-rcd]]", "[[ai-trend-radar]]", "[[outcome-based-fde-model]]"]
applied: []
open_questions:
  - "When should the BD/RCD workflow move from manual skill execution to agent orchestration?"
  - "Which skills must be stable before an agent is allowed to orchestrate them?"
  - "How much autonomy should an agent have before human gates become too weak?"
created: 2026-05-20
updated: 2026-05-20
---

# Agent-First vs Skill-First

## Summary
Agent-first and skill-first are not enemies. They answer different questions.

Agent-first is a tooling trend: platforms increasingly provide autonomous agents that can plan, call tools, execute tasks, and coordinate work. Skill-first is a methodology choice: before giving an agent autonomy, define the reusable capabilities, inputs, outputs, review gates, and failure modes.

For the BD/RCD pilot, the correct sequence remains skill-first, agent-later.

## Key Points
- Agent-first means the interface centers on autonomous agents, not manual commands or traditional editors.
- Skill-first means the workflow is decomposed into controlled capabilities before autonomy is introduced.
- Agent-first tooling is likely to become the dominant product direction for AI software platforms.
- Skill-first methodology is necessary for enterprise workflows where correctness, traceability, human approval, and auditability matter.
- FDE-lite should use agent-first tools only after the skills, prompts, expected outputs, human gates, and failure logs are stable.

## Agent-First
Agent-first means the user delegates goals to an AI agent that can plan, use tools, read/write files, call APIs, run commands, and produce artifacts.

Typical characteristics:
- Goal-based interaction
- Long-running tasks
- Tool use
- Planning and self-monitoring
- Multi-step execution
- Possible multi-agent orchestration
- Dashboard or manager view for observing agent work
- Verifiable artifacts such as plans, diffs, screenshots, logs, or reports

Examples of the trend include agent platforms such as Gemini Spark and agent-first coding environments such as Google Antigravity 2.0.

## Skill-First
Skill-first means the team first defines the smaller repeatable capabilities that an AI system should perform.

Each skill should define:
- purpose
- input
- output
- prompt template
- expected output format
- gate criteria
- failure cases
- optimization rule

In the BD/RCD pilot, examples include:
- Source classification
- Requirement candidate extraction
- EARS normalization
- Gap and conflict detection
- RCD consolidation
- BD generation from template
- AI self-review
- Human gate review pack

## Practical Difference

| Question | Agent-first | Skill-first |
|---|---|---|
| Starting point | What goal should the agent complete? | What capability must be made repeatable? |
| Unit of design | Agent / workflow run | Skill / prompt / output / gate |
| Main risk | Agent acts too broadly or hides mistakes | Workflow may be slower before automation |
| Best for | Mature workflows, coding tasks, execution | Ambiguous upstream workflows, requirements, BD/RCD |
| Human role | Supervisor of agent work | Designer and gate owner of the workflow |
| Success measure | Agent completes task | Workflow becomes reviewable and repeatable |

## Why Skill-First For BD/RCD
BD/RCD is an upstream delivery artifact. If AI makes a wrong assumption in RCD or BD, the error propagates into design, development, testing, and customer clarification.

Therefore, the workflow should not start by asking an agent to create BD autonomously. It should first define controlled skills and human gates:
- input source authority
- EARS normalization
- RCD traceability
- BD source labeling
- AI self-review
- human approval
- failure log
- measurement

## When To Move Toward Agent-First
Move from skill-first to agent orchestration only after:
- sample 1 has produced a failure log
- sample 2 has validated repeatability
- each skill has stable inputs and outputs
- human gates are explicit
- failure types are known
- the team knows which steps are safe to automate

A safe evolution path:
1. Manual skill execution
2. Prompt pack
3. Skill pack
4. Semi-agent orchestration
5. Agent-first workflow for selected low-risk steps

## Trend Direction
The market is moving toward agent-first products. Users will increasingly delegate goals, not commands. Development tools will likely move from editor-centered assistance to agent-centered orchestration.

However, in enterprise adoption, agent-first tooling will create a stronger need for skill-first methodology. The more autonomous the agent, the more important it becomes to define source authority, permissions, review gates, observability, and success metrics.

## Application To OPUS ANIMUS
For Consilium and FDE-lite, agent-first is a signal about where tooling is going. Skill-first remains the operating principle for methodology.

Recommended rule:

> Use agent-first tools, but design skill-first workflows.

For the BD/RCD case:
- Do not start by building an autonomous BD agent.
- First prove Input → RCD → BD as repeatable skills with human gates.
- Then let an agent orchestrate stable steps.

## Open Questions
- Which BD/RCD skills are safe to automate after sample 2?
- Should RCD approval always remain human-only?
- Can AI self-review reduce human review time without weakening accountability?
- What artifacts should an agent produce to make its work auditable?

## Applied
- 2026-05-20 — Created after reviewing market signals around Google Gemini Spark, Antigravity 2.0, and AGENTS.md/context-file research. Used to clarify why FDE-lite remains skill-first even as tooling trends agent-first.

## See Also
- [[bd-rcd-ai-pack-pilot]]
- [[ears-for-rd-to-rcd]]
- [[ai-trend-radar]]
- [[outcome-based-fde-model]]

## Sources
- The Verge — Google Gemini Spark and Antigravity updates, 2026-05-20.
- The Times of India — Google Antigravity 2.0 agent-first rebuild, 2026-05-20.
- arXiv — Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?, 2026-02-12.
