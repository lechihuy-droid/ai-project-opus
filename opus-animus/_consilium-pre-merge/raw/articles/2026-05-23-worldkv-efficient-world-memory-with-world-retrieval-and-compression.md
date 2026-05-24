# WorldKV: Efficient World Memory with World Retrieval and Compression

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.22718
**Published:** 2026-05-22 23:36 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Autoregressive video diffusion models have enabled real-time, action-conditioned world generation. However, sustaining a persistent world, where revisiting a previously seen viewpoint yields consistent content, remains an open problem. Full KV-cache attention preserves this consistency but breaks real-time constraints: memory footprint and attention cost grow linearly with rollout length. Sliding window inference restores throughput but discards long-term consistency. We propose WorldKV, a training-free framework with two components: World Retrieval and World Compression. World Retrieval stores evicted KV-cache chunks in GPU/CPU memory and selectively retrieves scene-relevant chunks via camera/ action correspondence, inserting them back into the native attention window without re-encoding. | 👍 28
