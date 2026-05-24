# EMO: Pretraining Mixture of Experts for Emergent Modularity

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.06663
**Published:** 2026-05-09 17:32 UTC
**Topic:** AI
**Tier:** 1
**Goal-Score:** 3
**Relevance:** Phương pháp EMO pretrained MoE -> FPT có thể áp dụng cho COBOL PARK để nâng cao hiệu suấtlegacy modernization.

Large language models are typically deployed as monolithic systems, requiring the full model even when applications need only a narrow subset of capabilities, e.g., code, math, or domain-specific knowledge. Mixture-of-Experts (MoEs) seemingly offer a potential alternative by activating only a subset of experts per input, but in practice, restricting inference to a subset of experts for a given domain leads to severe performance degradation. This limits their practicality in memory-constrained settings, especially as models grow larger and sparser. We introduce EMO, an MoE designed for modularity-the independent use and composition of expert subsets-without requiring human-defined priors. Our key idea is to encourage tokens from similar domains to rely on similar experts. Since tokens withi | 👍 5
