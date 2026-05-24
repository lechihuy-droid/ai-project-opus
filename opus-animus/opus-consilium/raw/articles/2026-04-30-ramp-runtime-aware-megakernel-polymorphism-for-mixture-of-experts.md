# RaMP: Runtime-Aware Megakernel Polymorphism for Mixture-of-Experts

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.26039
**Published:** 2026-04-30 04:00 UTC
**Topic:** AI

arXiv:2604.26039v1 Announce Type: new 
Abstract: The optimal kernel configuration for Mixture-of-Experts (MoE) inference depends on both batch size and the expert routing distribution, yet production systems dispatch from batch size alone, leaving 10-70% of kernel throughput unrealized. We present RaMP, a routing-aware dispatch framework. A performance-region analysis derives, from hardware constants alone, when each optimization helps, correctly predicting all 8 tested architectures, including 3 unseen. A four-parameter wave cost model selects the fastest configuration from the runtime expert histogram, achieving 0.93% mean regret versus exhaustive search, fitted from just 10-24 minutes of one-time profiling per model. Because the model depends only on CTA grid geometry, it is kernel-agno
