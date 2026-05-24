# MemQ: Integrating Q-Learning into Self-Evolving Memory Agents over Provenance DAGs

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.08374
**Published:** 2026-05-12 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 4
**Relevance:** Phương pháp mới để tích hợp Q-Learning vào mô hình ngôn ngữ -> FPT có thể ứng dụng phương pháp này để cải thiện FleziPT và tăng cường khả năng cạnh tranh.

arXiv:2605.08374v1 Announce Type: new 
Abstract: Episodic memory allows LLM agents to accumulate and retrieve experience, but current methods treat each memory independently, i.e., evaluating retrieval quality in isolation without accounting for the dependency chains through which memories enable the creation of future memories. We introduce MemQ, which applies TD($\lambda$) eligibility traces to memory Q-values, propagating credit backward through a provenance DAG that records which memories were retrieved when each new memory was created. Credit weight decays as $(\gamma\lambda)^d$ with DAG depth $d$, replacing temporal distance with structural proximity. We formalize the setting as an Exogenous-Context MDP, whose factored transition decouples the exogenous task stream from the endogenou
