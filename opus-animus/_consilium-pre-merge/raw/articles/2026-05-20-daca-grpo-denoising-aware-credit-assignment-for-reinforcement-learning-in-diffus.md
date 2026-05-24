# DACA-GRPO: Denoising-Aware Credit Assignment for Reinforcement Learning in Diffusion Language Models

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.16342
**Published:** 2026-05-19 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.16342v1 Announce Type: new 
Abstract: Diffusion large language models are a compelling alternative to autoregressive models, yet existing RL methods for diffusion treat all denoising steps as equally important and rely on biased, high-variance likelihood estimates. We identify two fundamental weaknesses: the absence of temporal credit assignment across the denoising trajectory, and the systematic bias of mean-field likelihood estimates used for policy optimization. To address these, we propose Denoising-Aware Credit Assignment for GRPO (DACA-GRPO), a lightweight, plug-and-play enhancement for any GRPO-style trainer. DACA-GRPO introduces two complementary mechanisms: Denoising Progress Scores, which extract per-token importance weights from intermediate predictions at no addition
