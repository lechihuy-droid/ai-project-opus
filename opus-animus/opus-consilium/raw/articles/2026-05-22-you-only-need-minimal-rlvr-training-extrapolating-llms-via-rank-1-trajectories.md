# You Only Need Minimal RLVR Training: Extrapolating LLMs via Rank-1 Trajectories

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.21468
**Published:** 2026-05-21 20:30 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Reinforcement learning with verifiable rewards (RLVR) has become a dominant paradigm for improving reasoning in large language models (LLMs), yet the underlying geometry of the resulting parameter trajectories remains underexplored. In this work, we demonstrate that RLVR weight trajectories are extremely low-rank and highly predictable. Specifically, we find that the majority of downstream performance gains are captured by a rank-1 approximation of the parameter deltas, where the magnitude of this projection evolves near-linearly with training steps. Motivated by this, we propose a simple and compute-efficient method RELEX (REinforcement Learning EXtrapolation), which estimates the rank-1 subspace from a short observation window and extrapolates future checkpoints via linear regression, wi | 👍 39
