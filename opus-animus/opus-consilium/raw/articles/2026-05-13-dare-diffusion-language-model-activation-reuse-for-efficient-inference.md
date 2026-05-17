# DARE: Diffusion Language Model Activation Reuse for Efficient Inference

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.08134
**Published:** 2026-05-12 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 4
**Relevance:** Phương pháp mới để tái sử dụng hoạt động của mô hình ngôn ngữ -> FPT có thể ứng dụng phương pháp này để cải thiện FleziPT và tăng cường khả năng cạnh tranh.

arXiv:2605.08134v1 Announce Type: new 
Abstract: Diffusion Large Language Models (dLLMs) have emerged as a promising alternative to auto-regressive (AR) models, offering greater expressive capacity and potential for parallel generation and faster inference. However, open-source dLLMs remain immature, lagging behind AR models in both efficiency and quality.
  We identify an underexplored property of dLLMs: *token-wise redundancy* in bi-directional self-attention. Self-attention activations are highly correlated across tokens, and temporal changes in query representations can predict redundancy in corresponding key, value, and output activations.
  We introduce DARE, with two complementary mechanisms: DARE-KV, which reuses cached key-value (KV) activations, and DARE-O, which reuses output ac
