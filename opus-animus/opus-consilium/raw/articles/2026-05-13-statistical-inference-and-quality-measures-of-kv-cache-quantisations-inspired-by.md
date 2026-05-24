# Statistical Inference and Quality Measures of KV Cache Quantisations Inspired by TurboQuant

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.08114
**Published:** 2026-05-12 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Nghiên cứu về các phương pháp lượng tử hóa -> FPT cần theo dõi các nghiên cứu này để cập nhật kiến thức và ứng dụng trong FleziPT.

arXiv:2605.08114v1 Announce Type: new 
Abstract: We analyse three KV cache quantization schemes under a fair bit budget: \textbf{KV} (scalar MSE baseline), \textbf{KQV} (WHT + MSE on $K$; WHT + MSE + QJL on $V$), and \textbf{QKQV} (WHT + MSE + QJL on both). Starting from the Beta distribution on the hypersphere, we trace how QJL on $K$ inflates inner product variance by $\pi/2$, which softmax amplifies nonlinearly via Jensen's inequality, and we present statistical inference and information metrics to highlight practical differences.
  Three empirical findings emerge. (1)~At $n=4$ (the practically dominant budget), KQV wins on every measure -- KL divergence, geometric $K$ error, and 6D distance -- across all distributions and ranks tested. (2)~The K--V asymmetry is unconditional: QKQV is c
