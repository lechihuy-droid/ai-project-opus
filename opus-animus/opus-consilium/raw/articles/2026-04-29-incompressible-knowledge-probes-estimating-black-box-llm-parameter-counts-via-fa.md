# Incompressible Knowledge Probes: Estimating Black-Box LLM Parameter Counts via Factual Capacity

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.24827
**Published:** 2026-04-29 04:00 UTC
**Topic:** AI

arXiv:2604.24827v1 Announce Type: new 
Abstract: Closed-source frontier labs do not disclose parameter counts, and the standard alternative -- inference economics -- carries $2\times$+ uncertainty from hardware, batching, and serving-stack assumptions external to the model. We exploit a tighter intrinsic bound: storing $F$ facts requires at least $F/$(bits per parameter) weights, so measuring how much a model \emph{knows} lower-bounds how many parameters it \emph{has}. We introduce \textbf{Incompressible Knowledge Probes (IKPs)}, a benchmark of 1{,}400 factual questions spanning 7 tiers of obscurity, designed to isolate knowledge that cannot be derived by reasoning or compressed by architectural improvements.
  We calibrate a log-linear mapping from IKP accuracy to parameter count on 89 op
