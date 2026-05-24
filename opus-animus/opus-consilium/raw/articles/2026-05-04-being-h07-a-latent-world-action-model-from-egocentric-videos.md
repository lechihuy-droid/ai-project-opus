# Being-H0.7: A Latent World-Action Model from Egocentric Videos

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.00078
**Published:** 2026-05-04 20:06 UTC
**Topic:** AI

Visual-Language-Action models (VLAs) have advanced generalist robot control by mapping multimodal observations and language instructions directly to actions, but sparse action supervision often encourages shortcut mappings rather than representations of dynamics, contact, and task progress. Recent world-action models introduce future prediction through video rollouts, yet pixel-space prediction is a costly and indirect substrate for control, as it may model visual details irrelevant to action generation and introduces substantial training or inference overhead. We present Being-H0.7, a latent world-action model that brings future-aware reasoning into VLA-style policies without generating future frames. Being-H0.7 inserts learnable latent queries between perception and action as a compact r
