# Mem-π: Adaptive Memory through Learning When and What to Generate

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.21463
**Published:** 2026-05-21 20:30 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

We present Mem-π, a framework for adaptive memory in large language model (LLM) agents, where useful guidance is generated on demand rather than retrieved from external memory stores. Existing memory-augmented agents typically rely on similarity-based retrieval from episodic memory banks or skill libraries, returning static entries that often misalign with the current context. In contrast, Mem-π uses a dedicated language or vision-language model with its own parameters, separate from the downstream agent, to generate context-specific guidance for complex tasks. Conditioned on the current agent context, the model jointly decides when to produce guidance and what guidance to produce. We train it with a decision-content decoupled reinforcement learning (RL) objective, enabling it to abstain w | 👍 3
