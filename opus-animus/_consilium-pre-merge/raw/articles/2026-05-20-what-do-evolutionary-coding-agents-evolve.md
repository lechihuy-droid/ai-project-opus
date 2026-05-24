# What Do Evolutionary Coding Agents Evolve?

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.20086
**Published:** 2026-05-20 11:44 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Recent work pairs LLMs with evolutionary search to iteratively generate, modify, and select code using task-specific feedback. These systems have produced strong results in mathematical discovery and algorithm design, yet a fundamental question remains: what do they actually evolve? Progress is typically summarized by the best score a run reaches under a task-specific evaluator, but that score can reflect several different mechanisms: new algorithmic structure, re-tuning an existing strategy, recombining ideas already in the model's internal knowledge, or overfitting to the evaluator. Distinguishing these mechanisms requires inspecting the search process itself, not only its final outcome. We introduce EvoTrace, a dataset of evolutionary coding traces spanning four evolutionary frameworks,
