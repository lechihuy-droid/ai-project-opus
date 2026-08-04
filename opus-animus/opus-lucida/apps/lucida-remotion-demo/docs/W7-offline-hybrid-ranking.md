# W7 Offline Hybrid Ranking And Diversity

## Goal

Select a production style package deterministically without network embeddings, while preserving evidence, content fit, continuity, render cost, and layout diversity in the Director trace.

## Ranking contract

`evaluateDirectorSelection()` evaluates only candidates allowed by `selection-rules.json` and applies hard content/component constraints before ranking. Accepted candidates receive:

- semantic fit: intent order, package traits, normalized lexical RAG score, and approved evidence quality;
- content fit: package-capacity utilization;
- continuity: previous-family compatibility;
- asset/component availability;
- rendering-cost score;
- bridge and repetition penalties.

The weighted total uses `design/directors/selection-rules.json#scoring`. Results are sorted by total, then original rule order, then package ID. This makes ties and fallbacks reproducible.

## Trace

Every scene records numeric `scores`, component breakdowns, `repetitionPenalty`, `selectedLayout`, `layoutCandidates`, evidence IDs, selected/rejected reasons, and the approval reference. Locked mode records the same audit fields but never claims RAG made the decision.

## Layout policy

The mapper carries selected-family and selected-layout history across scenes. Layout selection uses only the five renderer-supported macro layouts, avoids immediate repetition, favors the least-used compatible layout, and prevents `top-title` for hooks and takeaways. A five-scene output must use at least three distinct layouts and no layout may repeat more than twice consecutively.

## Verification

Run:

```powershell
node scripts/test-design-director.mjs
node --test tests/operating-model/w7-ranking.test.mjs
node --test tests/operating-model/director-integration.test.mjs
```

The W7 suite covers gold queries for all nine production packages, deterministic reruns, evidence-led reranking, explicit repetition penalties, five-scene diversity, and VideoMap layout passthrough.
