# LKV: End-to-End Learning of Head-wise Budgets and Token Selection for LLM KV Cache Eviction

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.06676
**Published:** 2026-05-11 04:00 UTC
**Topic:** AI
**Tier:** 2
**Goal-Score:** 4
**Relevance:** Cung cấp giải pháp cho LLM KV Cache Eviction -> FPT có thể áp dụng cho dịch vụ SDLC

arXiv:2605.06676v1 Announce Type: new 
Abstract: Long-context inference in Large Language Models (LLMs) is bottlenecked by the linear growth of Key-Value (KV) cache memory. Existing KV cache compression paradigms are fundamentally limited by heuristics: heuristic budgeting relies on statistical priors rather than task objectives, causing resource misallocation, while heuristic selection relies on coupled query-key interactions or static inductive biases (e.g., attention sinks). To address this limitation, we introduce LKV (Learned KV Eviction), which formulates KV compression as an end-to-end differentiable optimization problem. LKV integrates LKV-H to learn task-optimized global budgets, and LKV-T to derive intrinsic KV importance without materializing attention matrices. This design bypa
