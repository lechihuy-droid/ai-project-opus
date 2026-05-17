# Beyond Factor Aggregation: Gauge-Aware Low-Rank Server Representations for Federated LoRA

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.06733
**Published:** 2026-05-11 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Phát triển Gauge-Aware Low-Rank Server Representations -> Tăng cường hiệu suất cho Federated LoRA

arXiv:2605.06733v1 Announce Type: new 
Abstract: Federated LoRA enables parameter-efficient adaptation of large language models under decentralized data and limited client resources.However, directly averaging LoRA factors is representation-dependent: the same intrinsic update admits infinitely many gauge-equivalent factorizations, so factor-level aggregation can change under arbitrary coordinate choices while the underlying update remains unchanged. This reveals a semantic mismatch in existing federated LoRA aggregation rules. We propose \textbf{GLoRA}, a gauge-aware server representation for federated LoRA.Instead of aggregating raw factors, GLoRA estimates a consensus update subspace from client projectors and aggregates client updates in shared reference coordinates, thereby representi
