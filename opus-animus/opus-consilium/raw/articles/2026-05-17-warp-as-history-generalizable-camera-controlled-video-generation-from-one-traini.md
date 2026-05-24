# Warp-as-History: Generalizable Camera-Controlled Video Generation from One Training Video

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.15182
**Published:** 2026-05-17 13:42 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Warp-as-History giúp tạo video với điều khiển camera -> đọc và lưu để nghiên cứu sau

Camera-controlled video generation has made substantial progress, enabling generated videos to follow prescribed viewpoint trajectories. However, existing methods usually learn camera-specific conditioning through camera encoders, control branches, or attention and positional-encoding modifications, which often require post-training on large-scale camera-annotated videos. Training-free alternatives avoid such post-training, but often shift the cost to test-time optimization or extra denoising-time guidance. We propose Warp-as-History, a simple interface that turns camera-induced warps into camera-warped pseudo-history with target-frame positional alignment and visible-token selection. Given a target camera trajectory, we construct camera-warped pseudo-history from past observations and fee | 👍 36
