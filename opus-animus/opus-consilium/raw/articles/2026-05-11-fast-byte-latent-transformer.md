# Fast Byte Latent Transformer

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.08044
**Published:** 2026-05-11 15:43 UTC
**Topic:** AI
**Tier:** 1
**Goal-Score:** 3
**Relevance:** Fast Byte Latent Transformer tăng hiệu suất cho mô hình ngôn ngữ. -> FPT có thể áp dụng công nghệ này trong dịch vụ SDLC

Recent byte-level language models (LMs) match the performance of token-level models without relying on subword vocabularies, yet their utility is limited by slow, byte-by-byte autoregressive generation. We address this bottleneck in the Byte Latent Transformer (BLT) through new training and generation techniques. First, we introduce BLT Diffusion (BLT-D), a new model and our fastest BLT variant, trained with an auxiliary block-wise diffusion objective alongside the standard next-byte prediction loss. This enables an inference procedure that generates multiple bytes in parallel per decoding step, substantially reducing the number of forward passes required to generate a sequence. Second, we propose two extensions inspired by speculative decoding that trade some of this speed for higher gene | 👍 5
