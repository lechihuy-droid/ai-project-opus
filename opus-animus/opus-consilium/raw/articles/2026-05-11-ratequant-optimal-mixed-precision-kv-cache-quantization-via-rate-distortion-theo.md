# RateQuant: Optimal Mixed-Precision KV Cache Quantization via Rate-Distortion Theory

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.06675
**Published:** 2026-05-11 04:00 UTC
**Topic:** AI
**Tier:** 2
**Goal-Score:** 4
**Relevance:** Nghiên cứu về Mixed-Precision KV Cache Quantization -> FPT có thể tận dụng cho dịch vụ tư vấn về AI

arXiv:2605.06675v1 Announce Type: new 
Abstract: Large language models cache all previously computed key-value (KV) pairs during generation, and this KV cache grows linearly with sequence length, making it a primary memory bottleneck for serving. Quantizing the KV cache to fewer bits reduces this cost, yet all current quantizers assign the same bit-width to every attention head, ignoring the large variation in head importance. A natural idea is to allocate more bits to important heads and fewer to the rest. We show, however, that such mixed-precision allocation has a hidden pitfall: each quantizer follows a different distortion curve D(b)=alpha*beta^{-b}, and the decay rate beta varies from 3.6 to 5.3 across quantizer designs. Applying one quantizer's distortion model to another inverts th
