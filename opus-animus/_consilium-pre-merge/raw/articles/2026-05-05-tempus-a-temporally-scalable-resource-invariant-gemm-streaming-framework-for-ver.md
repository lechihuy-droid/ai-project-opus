# Tempus: A Temporally Scalable Resource-Invariant GEMM Streaming Framework for Versal AI Edge

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.00536
**Published:** 2026-05-05 20:30 UTC
**Topic:** AI

Scaling laws for Large Language Models (LLMs) establish that model quality improves with computational scale, yet edge deployment imposes strict constraints on compute, memory, and power. Since General Matrix Multiplication (GEMM) accounts for up to 90% of inference time, efficient GEMM acceleration is critical for edge AI. The Adaptive Intelligent Engines available in the AMD Versal adaptive SoCs are well suited for this task, but existing state-of-the-art (SOTA) frameworks maximize performance through spatial scaling, distributing workloads across hundreds of cores -- an approach that fails on resource-limited edge SoCs due to physical implementation failures, bandwidth saturation, and excessive resource consumption. We propose Tempus, a Resource-Invariant Temporal GEMM framework for the
