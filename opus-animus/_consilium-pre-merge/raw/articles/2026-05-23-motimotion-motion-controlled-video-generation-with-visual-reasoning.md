# MotiMotion: Motion-Controlled Video Generation with Visual Reasoning

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.22818
**Published:** 2026-05-22 23:36 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Current motion-controlled image-to-video generation models rigidly follow user-provided trajectories that are often sparse, imprecise, and causally incomplete. Such reliance often yields unnatural or implausible outcomes, especially by missing secondary causal consequences. To address this, we introduce MotiMotion, a novel framework that reformulates motion control as a reasoning-then-generation problem. To encourage causally grounded and commonsense-consistent interactions, we leverage a training-free vision-language reasoner to refine image-space coordinates of primary trajectories and to hallucinate plausible secondary motions. To further improve motion naturalness, we propose a confidence-aware control scheme that modulates guidance strength, enabling the model to closely follow high-c
