# Flow-OPD: On-Policy Distillation for Flow Matching Models

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.08063
**Published:** 2026-05-11 15:43 UTC
**Topic:** AI
**Tier:** 1
**Goal-Score:** 3
**Relevance:** Flow-OPD tăng hiệu suất cho mô hình Flow Matching. -> FPT có thể đề xuất giải pháp này cho khách hàng cần hiệu suất cao

Existing Flow Matching (FM) text-to-image models suffer from two critical bottlenecks under multi-task alignment: the reward sparsity induced by scalar-valued rewards, and the gradient interference arising from jointly optimizing heterogeneous objectives, which together give rise to a 'seesaw effect' of competing metrics and pervasive reward hacking. Inspired by the success of On-Policy Distillation (OPD) in the large language model community, we propose Flow-OPD, the first unified post-training framework that integrates on-policy distillation into Flow Matching models. Flow-OPD adopts a two-stage alignment strategy: it first cultivates domain-specialized teacher models via single-reward GRPO fine-tuning, allowing each expert to reach its performance ceiling in isolation; it then establish | 👍 71
