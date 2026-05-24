# Accelerating RL Post-Training Rollouts via System-Integrated Speculative Decoding

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2604.26779
**Published:** 2026-04-30 03:37 UTC
**Topic:** AI

RL post-training of frontier language models is increasingly bottlenecked by autoregressive rollout generation, making rollout acceleration a central systems challenge. Many existing efficiency methods improve throughput by changing the rollout or optimization regime, for example, through off-policy execution, replay, or lower-precision generation. We study speculative decoding as a lossless acceleration primitive for RL rollouts that preserves the target model's output distribution. We implement speculative decoding in NeMo-RL with a vLLM backend, supporting both synchronous and asynchronous pipelines and enabling speculation during RL rollouts. This benefit is realizable across speculation mechanisms, such as pretrained MTP heads, small external draft models or even techniques such as Ea | 👍 3
