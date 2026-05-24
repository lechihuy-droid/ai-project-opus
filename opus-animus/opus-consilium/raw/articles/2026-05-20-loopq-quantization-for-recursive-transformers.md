# LoopQ: Quantization for Recursive Transformers

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.16343
**Published:** 2026-05-19 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.16343v1 Announce Type: new 
Abstract: Looped language models (LoopLMs) improve parameter efficiency by recursively reusing Transformer blocks, enabling deeper computation under a fixed model size. However, this reuse makes LoopLMs more fragile under post-training quantization (PTQ). We present the first systematic study of quantization in LoopLMs and identify three challenges: distribution shift across roles, state reuse across loop transitions, and recursive error accumulation. To address these challenges, we propose LoopQ, a loop-aware PTQ framework that preserves a shared quantized backbone while introducing lightweight adaptations. LoopQ combines activation scaling, selective transformation, cross-loop state alignment, and trajectory-aware optimization to reduce distribution
