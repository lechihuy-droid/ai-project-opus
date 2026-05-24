# Borrowed Geometry: Computational Reuse of Frozen Text-Pretrained Transformer Weights Across Modalities

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.00333
**Published:** 2026-05-04 04:00 UTC
**Topic:** AI

arXiv:2605.00333v1 Announce Type: new 
Abstract: Frozen Gemma 4 31B weights pretrained exclusively on text tokens, unmodified, transfer across modality boundaries through a thin trainable interface. (1) OGBench scene-play-singletask-task1-v0: $+4.33$pt over published GCIQL at $n=3$ with std 0.74 -- a published-SOTA win on a robotic manipulation task the substrate has never seen. (2) D4RL Walker2d-medium-v2: Decision-Transformer parity ($76.2 \pm 0.8$, $n=3$) at $0.43\times$ DT's trainable count, with the frozen substrate compressing to a 5L slice ($+1.66$pt over the 6L baseline at $n=3$). (3) Associative recall as the cleanest pretraining-load-bearing case: the frozen slice + a 113K-parameter linear interface reaches L30 best-checkpoint per-bit error 0.0505 ($n=2$); a 6.36M-parameter from-
