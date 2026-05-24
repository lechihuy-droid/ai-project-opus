# Block-Based Double Decoders

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.18807
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.18807v1 Announce Type: new 
Abstract: Encoder-decoder models offer substantial inference-time savings over decoder-only models, but their pretraining objectives suffer from sparse supervision and dynamic sequence lengths, keeping them out of practice at scale. We propose block-based double decoders, a novel transformer architecture that utilizes doubly-causal block-based attention masks to train with full loss supervision and static sequence packing, combining decoder-only training efficiency with encoder-decoder inference efficiency. In scaling law experiments, block-based double decoders strongly outperform encoder-decoders and closely track decoder-only models across scales. At inference time, they cut KV-cache memory and per-token compute by at least 2/3 without sacrificing 
