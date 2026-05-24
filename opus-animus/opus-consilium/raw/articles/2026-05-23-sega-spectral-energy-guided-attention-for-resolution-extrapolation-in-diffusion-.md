# SEGA: Spectral-Energy Guided Attention for Resolution Extrapolation in Diffusion Transformers

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.22668
**Published:** 2026-05-22 23:36 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Diffusion transformers (DiTs) have emerged as a dominant architecture for text-to-image generation, yet their performance drops when generating at resolutions beyond their training range. Existing training-free approaches mitigate this by modifying inference-time attention behavior, often through Rotary Position Embeddings (RoPE) extrapolation combined with attention scaling. However, these strategies apply a uniform and content-agnostic scaling across RoPE components with distinct frequency characteristics, inducing a trade-off between preserving global structure and recovering fine detail. We introduce SEGA, a training-free method that dynamically scales attention across RoPE components according to the latent's spatial-frequency structure at each denoising step. This adaptive scaling im | 👍 22
