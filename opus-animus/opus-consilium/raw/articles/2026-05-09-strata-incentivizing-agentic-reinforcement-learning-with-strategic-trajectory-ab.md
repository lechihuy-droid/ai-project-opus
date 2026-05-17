# StraTA: Incentivizing Agentic Reinforcement Learning with Strategic Trajectory Abstraction

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.06642
**Published:** 2026-05-09 17:32 UTC
**Topic:** AI
**Tier:** 1
**Goal-Score:** 3
**Relevance:** Phương pháp StraTA cho học tăng cường -> Áp dụng kiến thức này cho AI-in-SDLC knowhow của FPT để cải thiện hiệu suất.

Large language models (LLMs) are increasingly used as interactive agents, but optimizing them for long-horizon decision making remains difficult because current methods are largely purely reactive, which weakens both exploration and credit assignment over extended trajectories. In this work, we present Strategic Trajectory Abstraction (StraTA), a simple framework that introduces an explicit trajectory-level strategy into agentic reinforcement learning (RL). StraTA samples a compact strategy from the initial task state, conditions subsequent actions on that strategy, and trains strategy generation and action execution jointly with a hierarchical GRPO-style rollout design, further enhanced by diverse strategy rollout and critical self-judgment. Experiments on ALFWorld, WebShop, and SciWorld  | 👍 16
