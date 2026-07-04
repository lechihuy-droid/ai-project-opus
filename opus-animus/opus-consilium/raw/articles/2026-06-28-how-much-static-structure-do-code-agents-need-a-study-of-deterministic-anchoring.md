# How Much Static Structure Do Code Agents Need? A Study of Deterministic Anchoring

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2606.26979
**Published:** 2026-06-27 16:07 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Nghiên cứu code agent cần bao nhiêu cấu trúc tĩnh (call graph) thay vì chỉ keyword search. -> Read, áp dụng anchoring vào setup coding agent của mình.

LLM-based code agents navigate repositories through keyword search but miss the structural relationships, such as call graphs, inheritance hierarchies, and configuration dependencies, that define how software actually works. This makes agent navigation stochastic and difficult to reproduce across runs. We investigate whether lightweight static analysis can provide deterministic anchors for these agents: stable structural facts injected as plain-text comments that constrain probabilistic exploration and make navigation more predictable. Starting from a strong baseline, Codex from OpenAI, we systematically inject varying granularities of structural annotations and measure their effects on localization, trajectory behavior, and run-to-run stability. Our study identifies what we call the deter
