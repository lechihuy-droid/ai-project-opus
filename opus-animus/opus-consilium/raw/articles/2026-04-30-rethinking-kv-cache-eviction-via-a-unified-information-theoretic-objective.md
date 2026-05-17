# Rethinking KV Cache Eviction via a Unified Information-Theoretic Objective

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.25975
**Published:** 2026-04-30 04:00 UTC
**Topic:** AI

arXiv:2604.25975v1 Announce Type: new 
Abstract: Key-value (KV) caching is essential for large language model inference, yet its memory overhead poses a critical bottleneck for long-context generation. Existing eviction policies predominantly rely on empirical heuristics, lacking a rigorous theoretical foundation. This work rethinks KV cache eviction through the lens of the Information Bottleneck principle. Under a linear-Gaussian surrogate of attention, we derive a closed-form mutual information objective that characterizes the effective information capacity of a retained KV cache subset. This formulation reveals that a wide range of existing eviction strategies can be interpreted as different approximations of the same capacity-maximization principle. Guided by this insight, we introduce
