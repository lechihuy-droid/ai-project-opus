# Rethinking How to Remember: Beyond Atomic Facts in Lifelong LLM Agent Memory

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.19952
**Published:** 2026-05-20 11:44 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

To enable reliable long-term interaction, LLM agents require a memory system that can faithfully store, efficiently retrieve, and deeply reason over accumulated dialogue history. Most existing methods adopt an extracted fact based paradigm: handcrafted static prompts compress raw dialogues into atomic facts, which are then stored, matched, and injected into downstream reasoning. Nevertheless, such fact-centric designs inevitably discard fine-grained details in original dialogues and fail to support deep reasoning over scattered isolated facts. Moreover, static prompts cannot maintain consistent extraction granularity across diverse dialogue styles. To address these limitations, we propose TriMem, which maintains three coexisting representation granularities, including raw dialogue segments | 👍 9
