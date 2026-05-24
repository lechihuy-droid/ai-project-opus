# Sparse Attention as a Range Searching Problem: Towards an Inference-Efficient Index for KV Cache

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.06763
**Published:** 2026-05-11 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Phát triển Sparse Attention sebagai Range Searching Problem -> Tối ưu hóa hiệu suất inferencing

arXiv:2605.06763v1 Announce Type: new 
Abstract: Sparse attention improves LLM inference efficiency by selecting a subset of key-value entries, but at the cost of potential accuracy degradation. In particular, omitting critical KV entries can induce substantial errors in model outputs. Existing methods typically operate under fixed or adaptive token budgets and provide empirical robustness or partial theoretical guarantees, yet they do not ensure zero false negatives in decoding steps, particularly since the set of relevant tokens is both query- and step-dependent. Our empirical observations confirm that missing even one critical key can lead to sharp error spikes, especially in long reasoning tasks where the set of important tokens varies throughout decoding. This observation motivates th
