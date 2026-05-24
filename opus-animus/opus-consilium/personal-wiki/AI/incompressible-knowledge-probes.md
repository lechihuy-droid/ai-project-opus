---
title: "Incompressible Knowledge Probes: Estimating Black-Box LLM Parameter Counts"
aliases: []
topic: AI
tags: ["incompressible-knowledge-probes", "llm-parameter-counts", "factual-capacity"]
status: seed
confidence: medium
sources: ["https://arxiv.org/abs/2604.24827"]
related: ["[[large-language-models-debugging]]"]
applied: []
open_questions: ["How can Incompressible Knowledge Probes be applied to real-world LLMs?"]
created: 2026-05-19
updated: 2026-05-19
---

# Incompressible Knowledge Probes: Estimating Black-Box LLM Parameter Counts

## Summary
Incompressible Knowledge Probes (IKPs) are a benchmark of 1,400 factual questions designed to estimate the parameter count of black-box Large Language Models (LLMs).

## Key Points
- IKPs are designed to isolate knowledge that cannot be derived by reasoning or compressed by architectural improvements.
- The benchmark consists of 7 tiers of obscurity, spanning a wide range of factual questions.

## Why It Matters
Incompressible Knowledge Probes provide a tighter intrinsic bound for estimating LLM parameter counts, which is essential for understanding the capabilities and limitations of these models.

## Details
The IKP benchmark is calibrated using a log-linear mapping from IKP accuracy to parameter count on 89 open-source LLMs. This allows for the estimation of parameter counts for closed-source models.

## Application To OPUS ANIMUS
Incompressible Knowledge Probes can be used to evaluate the capabilities of LLMs in OPUS ANIMUS, providing insights into their strengths and weaknesses.

## Open Questions
- How can Incompressible Knowledge Probes be applied to real-world LLMs?

## Applied

## See Also
- [[large-language-models-debugging]]

## Sources
- https://arxiv.org/abs/2604.24827