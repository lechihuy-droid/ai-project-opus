# LongLive-2.0: An NVFP4 Parallel Infrastructure for Long Video Generation

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.18739
**Published:** 2026-05-19 18:01 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

We present LongLive-2.0, an NVFP4-based parallel infrastructure throughout the full training and inference workflow of long video generation, addressing speed and memory bottlenecks. For training, we introduce sequence-parallel autoregressive (AR) training, instantiated as Balanced SP, which co-designs the efficient teacher-forcing layout with SP execution by pairing clean-history and noisy-target temporal chunks on each rank, enabling a natural teacher-forcing mask with SP-aware chunked VAE encoding. Combined with NVFP4 precision, it reduces GPU memory cost and accelerates GEMM computation during training, the proportion of which increases as video length grows. Moreover, we show that a high-quality infrastructure and dataset enable a remarkably clean training pipeline. Unlike existing Se | 👍 87
