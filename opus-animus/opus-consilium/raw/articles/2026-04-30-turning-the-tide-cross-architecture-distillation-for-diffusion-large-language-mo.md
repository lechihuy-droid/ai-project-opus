# Turning the TIDE: Cross-Architecture Distillation for Diffusion Large Language Models

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2604.26951
**Published:** 2026-04-30 03:37 UTC
**Topic:** AI

Diffusion large language models (dLLMs) offer parallel decoding and bidirectional context, but state-of-the-art dLLMs require billions of parameters for competitive performance. While existing distillation methods for dLLMs reduce inference steps within a single architecture, none address cross-architecture knowledge transfer, in which the teacher and student differ in architecture, attention mechanism, and tokenizer. We present TIDE, the first framework for cross-architecture dLLM distillation, comprising three modular components: (1) TIDAL, which jointly modulates distillation strength across training progress and diffusion timestep to account for the teacher's noise-dependent reliability; (2) CompDemo, which enriches the teacher's context via complementary mask splitting to improve pred | 👍 4
