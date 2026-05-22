# Weekly Report Prompt

Create a weekly status report for Project Sakura.

Inputs:
- Period start: `${input:period_start:2026-05-15}`
- Period end: `${input:period_end:2026-05-21}`
- Language: `${input:lang:en}`

Mandatory flow:
1. Call `get_project_facts` with the requested period.
2. Draft the 9 required sections from Facts only.
3. Validate with `validate_report`.
4. Fix any violations and validate again, up to 2 repair loops.
5. Export with `export_report` only after validation passes.

Rules:
- Use only values from `Facts.allowed_numbers` and `Facts.allowed_keys`.
- Preserve citations exactly as `[system:ref]`.
- Do not invent metrics, IDs, dates, percentages, commits, PRs, or ticket keys.
- For Japanese output, use business keigo.
