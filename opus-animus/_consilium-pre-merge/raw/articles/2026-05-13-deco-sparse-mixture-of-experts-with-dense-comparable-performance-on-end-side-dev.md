# DECO: Sparse Mixture-of-Experts with Dense-Comparable Performance on End-Side Devices

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.10933
**Published:** 2026-05-12 15:48 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** DECO về Sparse Mixture-of-Experts. -> Áp dụng cho FleziPT để tăng hiệu suất

While Mixture-of-Experts (MoE) scales model capacity without proportionally increasing computation, its massive total parameter footprint creates significant storage and memory-access bottlenecks, which hinder efficient end-side deployment that simultaneously requires high performance, low computational cost, and small storage overhead. To achieve these properties, we present DECO, a sparse MoE architecture designed to match the performance of dense Transformers under identical total parameter budgets and training tokens. DECO utilizes the differentiable and flexible ReLU-based routing enhanced by learnable expert-wise scaling, which adaptively balances the contributions of routed and shared experts. Furthermore, we introduce NormSiLU, an activation function that normalizes inputs prior to | 👍 1
