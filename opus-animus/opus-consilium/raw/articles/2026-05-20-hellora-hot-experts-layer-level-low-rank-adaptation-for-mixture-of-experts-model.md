# HELLoRA: Hot Experts Layer-Level Low-Rank Adaptation for Mixture-of-Experts Models

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.18795
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.18795v1 Announce Type: new 
Abstract: Low-Rank Adaptation (LoRA) dominates parameter-efficient fine-tuning of large language models, yet most variants target dense architectures. Mixture-of-Experts (MoE) models scale parameters at near-constant per-token compute, and their sparse activation patterns create untapped opportunities for more efficient adaptation. We propose Hot-Experts Layer-level Low-Rank Adaptation (HELLoRA), which attaches LoRA modules only to the most frequently activated experts at each layer. This simple mechanism reduces trainable parameters and adapter-induced FLOPs while improving downstream performance, an effect we attribute to a form of structured regularization that preserves pretrained expert specialization. To stress-test HELLoRA under extreme paramet
