# Architecture Determines Observability in Transformers

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.24801
**Published:** 2026-04-29 04:00 UTC
**Topic:** AI

arXiv:2604.24801v1 Announce Type: new 
Abstract: Autoregressive transformers make confident errors, but activation monitoring can catch them only if the model preserves an internal signal that output confidence does not expose. This preservation is determined by architecture and training recipe. We define observability as the linear readability of per-token decision quality from frozen mid-layer activations after controlling for max-softmax confidence and activation norm. The correction is essential. Confidence controls absorb 57.7% of raw probe signal on average across 13 models in 6 families.
  Observability is not a generic property of transformers. In Pythia's controlled suite, every tested run with the 24-layer, 16-head configuration collapses to rho_partial ~0.10 across a 3.5x parame
