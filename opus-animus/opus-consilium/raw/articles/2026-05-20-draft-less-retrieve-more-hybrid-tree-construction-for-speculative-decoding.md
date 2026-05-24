# Draft Less, Retrieve More: Hybrid Tree Construction for Speculative Decoding

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.20104
**Published:** 2026-05-20 11:44 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Speculative decoding (SD) accelerates large language model inference by leveraging a draft-then-verify paradigm. To maximize the acceptance rate, recent methods construct expansive draft trees, which unfortunately incur severe VRAM bandwidth and computational overheads that bottleneck end-to-end speedups. While dynamic-depth pruning can reduce this latency by removing marginal branches, it also discards potentially valid candidates, preventing the acceptance rate from reaching the upper bound of dense trees. In this paper, we identify a critical opportunity in resource allocation: the transition from dense to pruned drafting frees up significant computational budget. To break this Pareto tradeoff, we introduce Graft, a compensation framework that couples pruning and retrieval as mutually r | 👍 1
