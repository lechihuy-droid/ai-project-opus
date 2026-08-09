---
name: analyze-data-quality
description: Profile freshness, completeness, uniqueness, validity, grain, schema drift, broken joins, and disagreements between data sources.
---

# Analyze Data Quality

Use this skill before trusting a dataset or metric output.

1. Record source, extraction time, expected grain, keys, units, and freshness SLA.
2. Measure row counts, nulls, duplicates, domain violations, outliers, and schema changes.
3. Test key uniqueness, referential integrity, join cardinality, and fanout.
4. Reconcile totals across authoritative sources and preserve unresolved disagreements.
5. Rank issues by affected decisions, scope, severity, and confidence.

Return checks, observed evidence, caveats, and remediation owners. Never describe unexecuted checks as passed.
