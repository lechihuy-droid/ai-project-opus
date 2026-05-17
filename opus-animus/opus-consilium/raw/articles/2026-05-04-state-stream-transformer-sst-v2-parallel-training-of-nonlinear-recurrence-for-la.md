# State Stream Transformer (SST) V2: Parallel Training of Nonlinear Recurrence for Latent Space Reasoning

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.00206
**Published:** 2026-05-04 04:00 UTC
**Topic:** AI

arXiv:2605.00206v1 Announce Type: new 
Abstract: Current transformers discard their rich latent residual stream between positions, reconstructing latent reasoning context at each new position and leaving potential reasoning capacity untapped. The State Stream Transformer (SST) V2 enables parameter-efficient reasoning in continuous latent space through an FFN-driven nonlinear recurrence at each decoder layer, where latent states are streamed horizontally across the full sequence via a learned blend. This same mechanism supports continuous latent deliberation per position at inference time, dedicating additional FLOPs to exploring abstract reasoning before committing to a token. A two-pass parallel training procedure resolves the sequential dependency of the recurrence to allow compute-effic
