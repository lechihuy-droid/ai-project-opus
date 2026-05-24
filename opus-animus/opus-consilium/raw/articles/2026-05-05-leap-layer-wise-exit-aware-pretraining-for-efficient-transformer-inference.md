# LEAP: Layer-wise Exit-Aware Pretraining for Efficient Transformer Inference

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.01058
**Published:** 2026-05-05 04:00 UTC
**Topic:** AI

arXiv:2605.01058v1 Announce Type: new 
Abstract: Layer-aligned distillation and convergence-based early exit represent two predominant computational efficiency paradigms for transformer inference; yet we establish that they exhibit systematic incompatibility under standard deployment conditions for convergence-based early exit. Distillation objectives that align intermediate student layers to teacher representations suppress the representational convergence that early-exit mechanisms exploit, rendering such mechanisms ineffective on distilled models. We introduce LEAP (Layer-wise Exit-Aware Pretraining), an auxiliary training objective that reconciles this incompatibility. LEAP requires no architectural modifications; it augments standard distillation with a single constraint ensuring inte
