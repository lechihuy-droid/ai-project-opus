# RAVEN: Real-time Autoregressive Video Extrapolation with Consistency-model GRPO

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.15190
**Published:** 2026-05-17 13:42 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** RAVEN giúp tạo video thực tế với mô hình GRPO -> đọc và lưu để nghiên cứu sau

Causal autoregressive video diffusion models support real-time streaming generation by extrapolating future chunks from previously generated content. Distilling such generators from high-fidelity bidirectional teachers yields competitive few-step models, yet a persistent gap between the history distributions encountered during training and those arising at inference constrains generation quality over long horizons. We introduce the Real-time Autoregressive Video Extrapolation Network (RAVEN), a training-time test framework that repacks each self rollout into an interleaved sequence of clean historical endpoints and noisy denoising states. This formulation aligns training attention with inference-time extrapolation and allows downstream chunk losses to supervise the history representations  | 👍 7
