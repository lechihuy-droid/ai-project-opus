# PEEK: Context Map as an Orientation Cache for Long-Context LLM Agents

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.19932
**Published:** 2026-05-20 11:44 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Large language model (LLM) agents increasingly operate over long and recurring external contexts, like document corpora and code repositories. Across invocations, existing approaches preserve either the agent's trajectory, passive access to raw material, or task-level strategies. None of them preserves what we argue is most needed for repeated same-context workloads: reusable orientation knowledge (e.g., what the context contains, how it is organized, and which entities, constants, and schemas have historically been useful) about the recurring context itself. We introduce PEEK, a system that caches and maintains this orientation knowledge as a context map: a small, constant-sized artifact in the agent's prompt that gives it a persistent peek into the external context. The map is maintained
