# Technical Report: Activation Residual Hessian Quantization (ARHQ) for Low-Bit LLM Quantization

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.00140
**Published:** 2026-05-04 04:00 UTC
**Topic:** AI

arXiv:2605.00140v1 Announce Type: new 
Abstract: We present Activation Residual Hessian Quantization (ARHQ), a post-training weight splitting method designed to mitigate error propagation in low-bit activation-weight quantization. By constructing an input-side residual Hessian from activation quantization residuals (G_x), ARHQ analytically identifies and isolates error-sensitive weight directions into a high-precision low-rank branch. This is achieved via a closed-form truncated SVD on the scaled weight matrix W G^{1/2}_x . Experimental results on Qwen3-4B-Thinking-2507 demonstrate that ARHQ significantly improves layer-wise SNR and preserves downstream reasoning performance on ZebraLogic even under aggressive quantization. The code is available at https://github.com/BeautMoonQ/ARHQ.
