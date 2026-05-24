# Simply Stabilizing the Loop via Fully Looped Transformer

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.18797
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.18797v1 Announce Type: new 
Abstract: Scaling model performance typically requires increasing model size. Looped Transformer offers a compelling alternative by iteratively reusing the same Transformer blocks, trading additional computation for improved performance without increasing parameter count or context length. Because the number of loop iterations can be adjusted at inference, it also provides a natural mechanism for balancing performance and test-time compute. However, Looped Transformer still suffers from training instability when the number of loop iterations increases. Our analysis reveals that this instability stems from two sources: gradient oscillation and residual explosion. To address these two problems, we propose the Fully Looped Transformer, which introduces t
