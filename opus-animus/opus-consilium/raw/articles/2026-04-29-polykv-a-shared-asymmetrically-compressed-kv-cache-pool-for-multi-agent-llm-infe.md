# PolyKV: A Shared Asymmetrically-Compressed KV Cache Pool for Multi-Agent LLM Inference

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.24971
**Published:** 2026-04-29 04:00 UTC
**Topic:** AI

arXiv:2604.24971v1 Announce Type: new 
Abstract: We present PolyKV, a system in which multiple concurrent inference agents share a single, asymmetrically compressed KV cache pool. Rather than allocating a separate KV cache per agent -- the standard paradigm -- PolyKV writes a compressed cache once and injects it into N independent agent contexts via HuggingFace DynamicCache objects. Compression is asymmetric: Keys are quantized at int8 (q8_0) to preserve softmax stability, while Values are compressed using TurboQuant MSE -- a Fast Walsh-Hadamard Transform (FWHT) rotation followed by 3-bit Lloyd-Max quantization with centroids tuned to N(0,1). We evaluate across two model scales (SmolLM2-1.7B-Instruct and Llama-3-8B-Instruct), three context lengths (600-7,194 tokens), and up to 15 concurren
