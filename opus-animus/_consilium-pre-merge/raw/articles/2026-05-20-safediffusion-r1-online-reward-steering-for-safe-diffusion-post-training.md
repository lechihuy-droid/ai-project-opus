# SafeDiffusion-R1: Online Reward Steering for Safe Diffusion Post-Training

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.18719
**Published:** 2026-05-19 18:01 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Diffusion models have been widely studied for removing unsafe content learned during pre-training. Existing methods require expensive supervised data, either unsafe-text paired with safe-image groundtruth or negative/positive image pairs, making them impractical to scale. Furthermore, offline reinforcement learning and supervised fine-tuning approaches that generate synthetic data offline suffer from catastrophic forgetting, degrading generation quality. We propose a novel online reinforcement learning framework that addresses both data scarcity and model degradation through post-training with Group Relative Policy Optimization (GRPO) on both negative and positive text prompts. To eliminate the need for fine-tuning specialized safe/unsafe reward models, we introduce a steering reward mecha | 👍 2
