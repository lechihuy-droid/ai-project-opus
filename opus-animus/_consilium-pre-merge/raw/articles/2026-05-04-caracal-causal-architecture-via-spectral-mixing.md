# Caracal: Causal Architecture via Spectral Mixing

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.00292
**Published:** 2026-05-04 04:00 UTC
**Topic:** AI

arXiv:2605.00292v1 Announce Type: new 
Abstract: The scalability of Large Language Models to long sequences is hindered by the quadratic cost of attention and the limitations of positional encodings. To address these, we introduce Caracal, a novel architecture that replaces attention with a parameter-efficient, $\mathcal{O}(L \log L)$ Multi-Head Fourier (MHF) module. Our contributions are threefold: (1) We leverage the Fast Fourier Transform (FFT) for sequence mixing, inherently addressing both bottlenecks mentioned above. (2) We apply a frequency-domain causal masking technique that enforces autoregressive capabilities via asymmetric padding and truncation, overcoming a critical barrier for Fourier-based generative models. (3) Unlike efficient models relying on hardware-specific implement
