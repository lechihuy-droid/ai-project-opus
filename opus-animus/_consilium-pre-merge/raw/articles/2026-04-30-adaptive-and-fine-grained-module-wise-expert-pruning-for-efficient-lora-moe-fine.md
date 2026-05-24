# Adaptive and Fine-grained Module-wise Expert Pruning for Efficient LoRA-MoE Fine-Tuning

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.26340
**Published:** 2026-04-30 04:00 UTC
**Topic:** AI

arXiv:2604.26340v1 Announce Type: new 
Abstract: LoRA-MoE has emerged as an effective paradigm for parameter-efficient fine-tuning, combining the low training cost of LoRA with the increased adaptation capacity of Mixture-of-Experts (MoE). However, existing LoRA-MoE frameworks typically adopt a fixed and uniform expert configuration across heterogeneous Transformer modules (\eg, attention query/key projections and MLP gating networks), ignoring their distinct functional roles and capacity requirements. This design leads to localized over-provisioning, redundant trainable parameters, and unnecessary optimizer-state overhead. Moreover, prior methods enforce load balancing among experts throughout training. Although beneficial in the early stage, this constraint becomes restrictive once routi
