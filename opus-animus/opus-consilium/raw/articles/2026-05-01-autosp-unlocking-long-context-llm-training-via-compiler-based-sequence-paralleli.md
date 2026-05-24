# AutoSP: Unlocking Long-Context LLM Training Via Compiler-Based Sequence Parallelism

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.27089
**Published:** 2026-05-01 04:00 UTC
**Topic:** AI

arXiv:2604.27089v1 Announce Type: new 
Abstract: Large-language-models (LLMs) demonstrate enormous utility in long-context tasks which require processing prompts that consist of tens to hundreds of thousands of tokens. However, existing LLM training libraries do not provide easy to use abstractions to optimize for long-context training, instead focusing on optimizations for models with large parameter counts through ZeRO-3/FSDP, Tensor and Pipeline parallelism. This forces users to rewrite LLM training libraries to incorporate compositions of various complex long-context optimizations, such as sequence-parallelism, to training pipelines; a process that requires in-depth expertise, reducing developer productivity. To tackle these challenges, we introduce AutoSP: the first automated solution
