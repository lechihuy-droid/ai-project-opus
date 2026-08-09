---
name: validate-data
description: Verify SQL, source selection, methodology, calculations, and analytical conclusions against fresh evidence.
---

# Validate Data

Use this skill as an independent quality gate for analysis.

1. Restate the question, decision, population, time window, and expected grain.
2. Verify source authority and data quality prerequisites.
3. Review SQL or transformations for filters, joins, fanout, nulls, time zones, units, and leakage.
4. Recalculate representative results independently and reconcile totals.
5. Check whether conclusions follow from results and whether uncertainty or alternatives are omitted.
6. Return pass, fail, or blocked per check with exact evidence.

Do not validate by agreeing with the original analyst. Missing query output or source access means blocked, not passed.
