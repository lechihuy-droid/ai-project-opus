# Nautile-370M: Spectral Memory Meets Attention in a Small Reasoning Model

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.24809
**Published:** 2026-04-29 04:00 UTC
**Topic:** AI

arXiv:2604.24809v1 Announce Type: new 
Abstract: We present Nautile-370M, a 371-million-parameter small language model designed for efficient reasoning under strict parameter and inference budgets. Nautile-370M uses a hybrid backbone in which two SeqCond Attention (SCA) layers, a linear-time spectral sequence operator inspired by SeqCondenser, alternate with one transformer layer. This design aims to retain the long-context efficiency and state-tracking benefits of structured sequential models while preserving the expressive token-to-token routing of attention. The model was trained on a single Cloud TPU v4-64 pod slice provided through the Google TPU Research Cloud (TRC) program; the subsequent reinforcement learning stage was carried out on a single NVIDIA DGX Spark. We prove that the SC
