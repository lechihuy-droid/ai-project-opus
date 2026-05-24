# SkillLens: Adaptive Multi-Granularity Skill Reuse for Cost-Efficient LLM Agents

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.08386
**Published:** 2026-05-12 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 4
**Relevance:** Phương pháp mới để tái sử dụng kỹ năng của mô hình ngôn ngữ -> FPT có thể ứng dụng phương pháp này để cải thiện FleziPT và tăng cường khả năng cạnh tranh.

arXiv:2605.08386v1 Announce Type: new 
Abstract: Skill libraries have become a practical way for LLM agents to reuse procedural experience across tasks. However, existing systems typically treat skills as flat, single-resolution prompt blocks. This creates a tension between relevance and cost: injecting coarse skills can introduce irrelevant or misleading context, while rewriting entire skills is expensive and often unnecessary. We propose SkillLens, a hierarchical skill-evolution framework that organizes skills into a four-layer graph of policies, strategies, procedures, and primitives, and retrieves them at mixed granularity. Given a task, SkillLens first retrieves semantically relevant skill seeds, expands them through degree-corrected random walk over the skill graph, and then uses a v
