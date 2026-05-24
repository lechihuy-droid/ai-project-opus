# UCCI: Calibrated Uncertainty for Cost-Optimal LLM Cascade Routing

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.18796
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.18796v1 Announce Type: new 
Abstract: LLM cascades and model routing promise lower inference cost by sending easy queries to a small model and escalating hard ones to a large model, but most deployed routers use uncalibrated confidence scores and require per-workload threshold tuning. We present UCCI, a calibration-first router that maps token-level margin uncertainty to a per-query error probability via isotonic regression and selects the escalation threshold by constrained cost minimization. Under three explicit assumptions, threshold policies on the calibrated score are cost-optimal, and isotonic calibration achieves O(n^{-1/3}) sample complexity for expected calibration error (ECE). On a production named entity recognition workload of 75,000 queries served by 4B and 12B inst
