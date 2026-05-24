# Advancing Narrative Long Video Generation via Training-Free Identity-Aware Memory

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.18733
**Published:** 2026-05-19 18:01 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Autoregressive video generation has improved rapidly in visual fidelity and interactivity, but it still suffers from long-term inconsistency and memory degradation. Most existing solutions either compress historical frames using predefined strategies or retrieve keyframes based on coarse implicit attention signals, both of which fail to handle evolving prompts with shifting entity references, leading to identity drift, character duplication, and attribute loss. To address this, we propose IAMFlow, a training-free identity-aware memory framework that explicitly models and tracks persistent entity identities, enabling consistent generation across prompt transitions. Specifically, an LLM extracts entities with visual attributes from each prompt and assigns unique global IDs for identity-aware
