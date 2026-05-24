# STARFlow2: Bridging Language Models and Normalizing Flows for Unified Multimodal Generation

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.08029
**Published:** 2026-05-11 15:54 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Phát triển STARFlow2 cho tạo nội dung đa phương tiện -> Tăng cường hiệu suất cho các mô hình AI

Deep generative models have advanced rapidly across text and vision, motivating unified multimodal systems that can understand, reason over, and generate interleaved text-image sequences. Most existing approaches combine autoregressive language modeling with diffusion-based image generators, inheriting a structural mismatch between causal text generation and iterative visual denoising. We observe that autoregressive normalizing flows are autoregressive Transformers--sharing the same causal mask, KV-cache mechanism, and left-to-right structure as LLMs--making them the most natural paradigm for true unified multimodal generation. We present STARFlow2, built on the Pretzel architecture that vertically interleaves a pretrained VLM stream with a TarFlow stream via residual skip connections, bot | 👍 6
