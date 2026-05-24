# Auto-FlexSwitch: Efficient Dynamic Model Merging via Learnable Task Vector Compression

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2604.28109
**Published:** 2026-05-01 20:30 UTC
**Topic:** AI

Model merging has attracted attention as an effective path toward multi-task adaptation by integrating knowledge from multiple task-specific models. Among existing approaches, dynamic merging mitigates performance degradation caused by conflicting parameter updates across tasks by flexibly combining task-specific parameters at inference time, thereby maintaining high performance. However, these methods require storing independent parameters for each task, resulting in prohibitive storage overhead. To address this issue, we first experimentally demonstrate that the fine-tuned weight increments (referred to as task vectors) exhibit an impulse-like activation pattern and high robustness to low-bit representations. Driven by this insight, we propose T-Switch, which decomposes task vectors into
