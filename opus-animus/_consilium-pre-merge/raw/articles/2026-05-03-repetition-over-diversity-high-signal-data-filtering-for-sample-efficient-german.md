# Repetition over Diversity: High-Signal Data Filtering for Sample-Efficient German Language Modeling

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2604.28075
**Published:** 2026-05-03 08:17 UTC
**Topic:** AI

Recent research has shown that filtering massive English web corpora into high-quality subsets significantly improves training efficiency. However, for high-resource non-English languages like German, French, or Japanese, aggressive filtering creates a strategic dilemma: should practitioners prioritize diversity by training once on large amounts of lightly filtered web data, or prioritize quality by strictly filtering for a high-quality core and repeating it over multiple epochs? We investigate this trade-off for German by constructing hierarchical quality filters applied to 500M web documents, comparing multi-epoch training on the filtered subsets against single-pass training on a diverse corpus. Our experiments across multiple model scales and token budgets show that repeating high-quali
