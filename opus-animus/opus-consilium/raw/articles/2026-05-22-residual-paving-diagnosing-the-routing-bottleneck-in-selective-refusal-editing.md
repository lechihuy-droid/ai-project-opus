# Residual Paving: Diagnosing the Routing Bottleneck in Selective Refusal Editing

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.20262
**Published:** 2026-05-21 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.20262v1 Announce Type: new 
Abstract: We study selective refusal editing as a three-way control problem: induce non-refusal on designated edit prompts while preserving benign behavior and harmful refusals outside the edit set. We introduce Residual Paving, a routed residual editing method for frozen instruction-tuned transformers that separates route selectivity, whether to intervene, from residual-edit capacity, what edit to apply. An early-layer router predicts a scalar gate and expert mixture; when active, prompt-conditioned bottleneck residual experts apply later-layer residual updates while leaving the backbone unchanged. This decomposition supports an oracle-routing diagnostic where only the learned scalar gate is replaced with the held-out edit/keep label, leaving the res
