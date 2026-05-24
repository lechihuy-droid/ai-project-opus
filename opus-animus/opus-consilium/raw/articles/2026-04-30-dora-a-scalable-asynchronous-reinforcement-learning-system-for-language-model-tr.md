# DORA: A Scalable Asynchronous Reinforcement Learning System for Language Model Training

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.26256
**Published:** 2026-04-30 04:00 UTC
**Topic:** AI

arXiv:2604.26256v1 Announce Type: new 
Abstract: Reinforcement learning (RL) has become a critical paradigm for LLM post-training, yet the rollout phase -- accounting for 50--80% of total step time -- is bottlenecked by skewed generation: long-tailed trajectories indispensable for model performance block the entire training pipeline. Asynchronous training offers a natural remedy by overlapping generation with training, but introduces a fundamental tension between efficiency and algorithmic correctness. We identify three constraints in asynchronous training to preserve convergence: intra-trajectory policy consistency, data integrity, and bounded staleness. Existing approaches fail to intrinsically address the long-tailed trajectory problem, which is further exacerbated by the imbalance char
