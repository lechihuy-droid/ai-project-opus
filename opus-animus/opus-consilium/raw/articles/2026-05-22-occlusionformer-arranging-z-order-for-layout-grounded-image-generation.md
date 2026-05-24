# OcclusionFormer: Arranging Z-Order for Layout-Grounded Image Generation

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.21343
**Published:** 2026-05-21 20:30 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Recent layout-to-image models have achieved remarkable progress in spatial controllability. However, they still struggle with inter-object occlusion. When bounding boxes overlap, most existing methods lack explicit occlusion information, which makes the generation in intersection regions inherently ambiguous and hinders the determination of complex occlusion relationships. As a result, they often produce entangled textures or physically inconsistent layering in the overlapped areas. To address this issue, we first construct SA-Z, a large-scale dataset enriched with explicit occlusion ordering and pixel-level annotations. Building upon our proposed dataset, we introduce OcclusionFormer, a novel occlusion-aware Diffusion Transformer framework that explicitly models Z-order priority by decoup | 👍 7
