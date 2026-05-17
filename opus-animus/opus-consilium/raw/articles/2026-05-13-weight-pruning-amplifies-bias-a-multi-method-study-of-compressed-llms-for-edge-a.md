# Weight Pruning Amplifies Bias: A Multi-Method Study of Compressed LLMs for Edge AI

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.08137
**Published:** 2026-05-12 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 4
**Relevance:** Weight pruning làm tăng bias. -> Cẩn thận khi áp dụng weight pruning cho Edge AI trong SDLC

arXiv:2605.08137v1 Announce Type: new 
Abstract: Weight pruning is widely advocated for deploying Large Language Models on resource-constrained IoT and edge devices, yet its impact on model fairness remains poorly understood. We conduct a controlled empirical study of three instruction-tuned models (Gemma-2-9b-it, Mistral-7B-Instruct-v0.3, Phi-3.5-mini-instruct) across three pruning methods (Random, Magnitude, Wanda) at four sparsity levels (10-70%) on 12,148 BBQ bias benchmark items with 5 random seeds, totaling 2,368,860 inference records. Our results reveal a Smart Pruning Paradox: activation-aware pruning (Wanda) preserves perplexity nearly perfectly (just 3.5% increase at 50% sparsity for Mistral-7B), yet produces the highest bias amplification, with Stereotype Reliance Score increasi
