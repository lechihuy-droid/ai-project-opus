# CP-MoE: Consistency-Preserving Mixture-of-Experts for Continual Learning

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.20247
**Published:** 2026-05-21 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.20247v1 Announce Type: new 
Abstract: Catastrophic forgetting remains a major obstacle to continual learning in large language models (LLMs) and vision--language models (VLMs). Although Mixture-of-Experts (MoE) architectures offer an efficient path to scaling, existing LoRA-based MoE continual learning methods still face a fundamental trade-off: they either isolate experts too aggressively, limiting knowledge transfer across tasks, or allow task-specific updates to overwrite important existing parameters, leading to severe forgetting. To address this, we propose CP-MoE, a continual learning framework built around a transient expert that captures early task-specific updates and guides their integration into stable experts. CP-MoE introduces a consistency-preserving routing bias, 
