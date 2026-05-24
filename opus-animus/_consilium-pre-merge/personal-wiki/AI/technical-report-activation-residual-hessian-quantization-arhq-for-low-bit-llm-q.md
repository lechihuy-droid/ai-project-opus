---
title: "Technical Report: Activation Residual Hessian Quantization (ARHQ) for Low-Bit LLM Quantization"
aliases: []
topic: AI
tags: [source-seed, arxiv-lg]
status: seed
confidence: low
sources: ["raw/articles/2026-05-04-technical-report-activation-residual-hessian-quantization-arhq-for-low-bit-llm-q.md", "https://arxiv.org/abs/2605.00140"]
related: []
applied: []
open_questions: []
created: 2026-05-19
updated: 2026-05-19
---

# Technical Report: Activation Residual Hessian Quantization (ARHQ) for Low-Bit LLM Quantization

## Summary
arXiv:2605.00140v1 Announce Type: new Abstract: We present Activation Residual Hessian Quantization (ARHQ), a post-training weight splitting method designed to mitigate error propagation in low-bit activation-weight quantization. By constructing an input-side residual Hessian from activation quantization residuals (G_x), ARHQ analytically identifies and isolates error-sensitive weight directions into a high-precision low-rank branch. This is achieved via a closed-form truncated SVD on the scaled weight matrix W G^{1/2}_x . Experimental results on Qwen3-4B-Thinking-2507 demonstrate that ARHQ significantly improves layer-wise SNR and preserves downstream reasoning performance on ZebraLogic even under aggressive quantization. The code is available at https://github.com/BeautMoonQ/ARHQ.

## Key Points
- Seed ingest from raw research/news source.
- Needs later concept-first synthesis or merge into a stronger existing page.

## Why It Matters
This source was collected by Consilium as potentially relevant market, AI, technology, or research intelligence. It is preserved in the wiki so it can be queried, reviewed, and consolidated later.

## Details
- Source: arxiv-lg
- Published: 2026-05-04 04:00 UTC

## Application To OPUS ANIMUS
Review for possible implications to Opus Consilium intelligence, Opus Animus strategy, Lucida production workflows, or investment tracking.

## Open Questions
- Should this seed be merged into an existing concept page?
- What concrete decision, workflow, or research thread should this inform?

## Applied

## See Also

## Sources
- `raw/articles/2026-05-04-technical-report-activation-residual-hessian-quantization-arhq-for-low-bit-llm-q.md`
- https://arxiv.org/abs/2605.00140
