---
title: "AI Trend Radar"
aliases: ["AI Trends", "Trend Radar"]
topic: AI
tags: [ai-trends, decision-brain, agents, coding-agents]
status: evergreen
confidence: medium
sources: []
related: ["[[current-beliefs]]", "[[open-questions]]", "[[reskill-roadmap]]", "[[investment-theses]]", "[[competitor-business-model-radar]]", "[[openai-codex-base-instructions]]", "[[llm-agents-2025]]", "[[human-in-the-loop-systems-for-agentic-workflows]]", "[[ai-evals-bottleneck]]", "[[agent-first-vs-skill-first]]", "[[research-audit-queue]]"]
applied: ["2026-05-31 - Promoted the three-lane audit seed queue into agent memory, eval/reliability, skill lifecycle, computer-use infrastructure, and autonomous workflow clusters."]
open_questions: ["Which trend is strong enough to change weekly action?", "Which memory/context pattern should be tested first in Codex or Consilium?", "Which agent evaluation should become the default gate before workflow automation?"]
created: 2026-05-19
updated: 2026-06-06
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
- 2026-05-20 synthesis: the strongest repeated signal is not "more agents" but agent operationalization: mobile/remote access, enterprise Codex use cases, secure runtimes, auditable traces, memory/context systems, and specialized workflow agents.
- 2026-06-06 synthesis: agentic software delivery is an operating-model change, not a coding-tool upgrade. The durable pattern is standardized machine-readable artifacts + knowledge infrastructure + human review gates + smaller supervisory pods.

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

### Promoted Signals - 2026-05-20

**Actionable now**
- Coding agents are moving from IDE helper to distributed work system: [[work-with-codex-from-anywhere]], [[seas-view-on-the-future-of-agentic-software-development-with-codex]], [[simplex-rethinks-software-development-with-codex]], and [[running-codex-safely-at-openai]] all support the belief that usage patterns, sandboxing, review, and delegation are now the main learning surface.
- Enterprise adoption is becoming workflow-specific rather than generic chatbot adoption: [[how-business-operations-teams-use-codex]], [[how-data-science-teams-use-codex]], and [[how-sales-teams-use-codex]] should be treated as examples of function-specific automation patterns.
- Agent safety is becoming infrastructure: [[securing-ai-agents-how-aws-and-cisco-ai-defense-scale-mcp-and-a2a-deployments]], [[towards-security-auditable-llm-agents-a-unified-graph-representation]], and [[shepherd-a-runtime-substrate-empowering-meta-agents-with-a-formalized-execution]] point toward traces, policy boundaries, and auditable execution as core platform capabilities.

**Watch closely**
- Agent memory and context are becoming product surfaces: [[when-continual-learning-moves-to-memory-a-study-of-experience-reuse-in-llm-agent]], [[rohitg00agentmemory]], and [[zilliztechclaude-context]] are weak individually but reinforce the need to track practical memory patterns.
- Skill reuse and task synthesis are emerging as the next layer above prompting: [[skilllens-adaptive-multi-granularity-skill-reuse-for-cost-efficient-llm-agents]] and [[toward-scalable-terminal-task-synthesis-via-skill-graphs]] are relevant to the Consilium skill-curation loop.
- Browser/web agents remain evaluation-heavy: [[weblica-scalable-and-reproducible-training-environments-for-visual-web-agents]] matters mainly as an eval and training-environment signal, not as an immediate product bet.

**Noise for now**
- Single paper seeds about exotic RL, model compression, or narrow benchmark wins should stay as weak evidence until they repeat across sources or connect to a weekly experiment.

### Promoted Signals - 2026-05-31

The current audit queue reinforces one main trend: agents are moving from "prompt a model" to managed runtime systems with memory, skills, evaluation, sandboxes, and task-specific orchestration. The individual seeds are still uneven, but the repeated pattern is strong enough to guide learning and Consilium pipeline design.

**Actionable now**
- Memory is becoming an engineering surface, not just a UX feature. [[from-storage-to-experience-a-survey-on-the-evolution-of-llm-agent-memory-mechani]], [[when-continual-learning-moves-to-memory-a-study-of-experience-reuse-in-llm-agent]], [[memq-integrating-q-learning-into-self-evolving-memory-agents-over-provenance-dag]], [[detecting-clinical-discrepancies-in-health-coaching-agents-a-dual-stream-memory]], and [[rohitg00agentmemory]] point to the same question: which memories are useful, how are they evaluated, and when should experience be reused instead of silently accumulated?
- Agent reliability needs domain-specific evals, not generic benchmark confidence. [[agentfloor-how-far-up-the-tool-use-ladder-can-small-open-weight-models-go]], [[armor-2025-a-military-aligned-benchmark-for-evaluating-large-language-model-safe]], [[robomemarena-a-comprehensive-and-challenging-robotic-memory-benchmark]], [[theory-grounded-evaluation-exposes-the-authorship-gap-in-llm-personalization]], and [[fidelity-diversity-and-privacy-a-multi-dimensional-llm-evaluation-for-clinical-d]] show evals fragmenting by tool-use level, safety context, memory, personalization, and privacy.
- Agent runtime infrastructure is becoming the product layer. [[trycuacua]], [[mksglucontext-mode]], [[agentreputation-a-decentralized-agentic-ai-reputation-framework]], and [[flashrt-towards-computationally-and-memory-efficient-red-teaming-for-prompt-inje]] are practical signals: desktop sandboxes, context-output reduction, trust/reputation layers, and prompt-injection testing are becoming default control surfaces for real workflows.

**Watch closely**
- Skill lifecycle is emerging as the layer above prompting. [[dynamic-skill-lifecycle-management-for-agentic-reinforcement-learning]], [[cocoda-co-evolving-compositional-dag-for-tool-augmented-agents]], and [[self-distilled-agentic-reinforcement-learning]] all point toward agents that create, retrieve, refine, and distill reusable skills. This matters for Consilium because skill curation should be measured by repeatable task success, not by having a large skill library.
- Agentic search may not require exotic retrieval by default. [[rethinking-agentic-search-with-pi-serini-is-lexical-retrieval-sufficient]] suggests that stronger reasoning loops can make simple retrieval surprisingly competitive. For Consilium, this supports keeping raw/wiki search simple until a specific failure mode justifies complexity.
- Autonomous workflow generation is getting closer, but should stay gated. [[think-it-run-it-autonomous-ml-pipeline-generation-via-self-healing-multi-agent-a]] and [[glm-5v-turbo-toward-a-native-foundation-model-for-multimodal-agents]] show more capable multimodal and multi-agent workflow construction, but the practical threshold is still traceability and repairability.

**Noise for now**
- [[multi-perspective-transformers-in-arc-agi-2-challenge]] and [[tripvvt-a-large-scale-triplet-dataset-and-a-coarse-mask-baseline-for-in-the-wild]] are useful as model capability/data signals, but they do not yet change Huy's near-term AI workflow, FDE-lite method, or investment thesis.

### Raw Ingest Signals - 2026-05-31

The raw ingest queue mostly confirms the same agent-operating-system thesis rather than creating new concept pages. These items should be treated as hub evidence and marked processed, not expanded into another layer of source pages.

**Add to active thesis**
- Managed agent runtimes are becoming the default shape of production AI. The Amazon Bedrock AgentCore items show persistent working memory, sandboxed code execution, shared memory, observability, and multi-agent orchestration moving into cloud-managed infrastructure.
- Long-term agent memory is converging on database-like responsibilities: growth control, semantic revision, forgetting, retrieval, provenance, and evolving graph connectivity. The memory raw files strengthen the existing memory/context cluster rather than requiring separate pages.
- Agent evaluation is moving toward work alignment and trajectory-level measurement. AgentAtlas, JobBench, and VitaBench point to the same gap: final answer accuracy is too shallow for agents acting in files, tools, occupations, and long-term user contexts.

**Keep as watchlist**
- AgentCo-op, SciAtlas, and MUSE-Autoskill suggest reusable skills, typed handoffs, scientific knowledge graphs, and self-repair loops are becoming research infrastructure. Useful for Consilium design, but not yet an immediate build commitment.
- Laguna's model-factory framing is relevant as an industrialization signal for coding models; it matters if more labs describe model development as versioned data, eval, training, and inference pipelines rather than one-off model releases.

Decision label: **test**. For Consilium, the next practical test should be a small memory/eval gate for Codex work: what should be remembered, what should be forgotten, and what evidence proves the memory improved a later task?

### 2026-06-06 Signal: McKinsey agentic software delivery operating model

McKinsey's article on rewiring software delivery for the agentic era reinforces that agentic AI is not merely a coding productivity tool. The useful enterprise pattern is an operating-model redesign: continuous delivery rhythm, standardized artifacts, human review gates, knowledge infrastructure, and smaller supervisory teams.

**Core lesson**
- Treat agentic delivery as a system redesign, not as a tool rollout.
- Agents need structured, machine-readable inputs; vague handoffs create unreliable automation.
- Human value shifts toward architecture judgment, domain modeling, review-gate design, cost/security/quality guardrails, and supervision.
- Knowledge infrastructure matters more than raw note volume. The wiki should accumulate decisions, methods, source-backed theses, open questions, and traceable context, not transcripts.
- Do not start with a top-down grand ontology. Let the graph evolve around live priority workflows such as News Research, Wiki Ops, Scheduler, and Lucida.

**Application to Opus**
- `operator-topology.md` should be treated as the next control-plane artifact: it maps ChatGPT/Codex/Claude/Scheduler/Telegram into the Opus ai layer and then to Consilium, Lucida, GitHub, personal-wiki, and local jobs.
- `PACK.md`, `status.md`, `handoff-*.md`, and `scheduler-ops.md` should stay machine-readable enough for agents to use as operational inputs.
- Wiki updates should remain gated: summarize durable insight, choose the smallest target page, avoid raw transcript storage, and require explicit apply/update before write.
- Automation should not increase before observability and write gates are clear.

**Decision label:** test. This is a high-signal methodology article and should update the active thesis, but it does not require a new source page yet.

## Application To OPUS ANIMUS
Use this hub when asking Codex for an AI trend brief. Codex should cite source pages, then say whether each trend is actionable now, watch-only, or noise.

## Open Questions
- Which trend should become a weekly experiment?
- Which trend is investment-relevant but not personally actionable?
- Which trend is personally actionable but not investable?
- Which BD/RCD skills should become agent-orchestrated after sample 2?
- What is the minimum useful operator-topology artifact before adding a command gateway or local daemon?

## Applied
- 2026-05-20 — Added agent-first tooling vs skill-first methodology signal and linked [[agent-first-vs-skill-first]].
- 2026-05-20 - Promoted high-signal seed pages into three active trend clusters: coding-agent workflow infrastructure, agent safety/auditability, and memory/context/skill reuse.
- 2026-05-31 - Promoted three-lane audit queue into five trend clusters: memory/context, eval/reliability, runtime infrastructure, skill lifecycle, and autonomous workflow generation.
- 2026-05-31 - Ingested 12 raw tech candidates as hub evidence instead of creating more source pages.
- 2026-06-06 - Added McKinsey agentic software delivery thesis as hub evidence for operating-model redesign, knowledge infrastructure, and operator topology.

## See Also
- [[competitor-business-model-radar]]
- [[openai-codex-base-instructions]]
- [[llm-agents-2025]]
- [[human-in-the-loop-systems-for-agentic-workflows]]
- [[ai-evals-bottleneck]]
- [[large-language-models-debugging]]
- [[agent-first-vs-skill-first]]
- [[research-audit-queue]]

## Sources
- McKinsey — Rewiring software delivery for the agentic era, 2026.
- The Verge — Google Gemini Spark and Antigravity updates, 2026-05-20.
- The Times of India — Google Antigravity 2.0 agent-first rebuild, 2026-05-20.
- arXiv — Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?, 2026-02-12.
- arXiv — Configuring Agentic AI Coding Tools: An Exploratory Study, 2026-02-16.
- `D:\Google Drive\AI-Raw-Assets\opus-consilium\raw\articles\2026-05-22-break-the-context-window-barrier-with-amazon-bedrock-agentcore.md`
- `D:\Google Drive\AI-Raw-Assets\opus-consilium\raw\articles\2026-05-23-agentatlas-beyond-outcome-leaderboards-for-llm-agents.md`
- `D:\Google Drive\AI-Raw-Assets\opus-consilium\raw\articles\2026-05-27-is-agent-memory-a-database-rethinking-data-foundations-for-long-term-ai-agent-me.md`
- `D:\Google Drive\AI-Raw-Assets\opus-consilium\raw\articles\2026-05-27-jobbench-aligning-agent-work-with-human-will.md`
- `D:\Google Drive\AI-Raw-Assets\opus-consilium\raw\articles\2026-05-27-muse-autoskill-self-evolving-agents-via-skill-creation-memory-management-and-eva.md`
- `D:\Google Drive\AI-Raw-Assets\opus-consilium\raw\articles\2026-05-29-rethinking-memory-as-continuously-evolving-connectivity.md`
