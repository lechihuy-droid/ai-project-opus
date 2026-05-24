# Embedding by Elicitation: Dynamic Representations for Bayesian Optimization of System Prompts

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.19093
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.19093v1 Announce Type: new 
Abstract: System prompts are a central control mechanism in modern AI systems, shaping behavior across conversations, tasks, and user populations. Yet they are difficult to tune when feedback is available only as aggregate metrics rather than per-example labels, failures, or critiques. We study this aggregate feedback setting as sample-constrained black-box optimization over discrete, variable-length text. We introduce ReElicit, a Bayesian optimization framework based on \emph{embedding by elicitation}. Given a task description, previously evaluated prompts, and scalar scores, an LLM elicits a compact, interpretable feature space and maps prompts into it. Leveraging a probabilistic Gaussian process surrogate, an acquisition function then selects targe
