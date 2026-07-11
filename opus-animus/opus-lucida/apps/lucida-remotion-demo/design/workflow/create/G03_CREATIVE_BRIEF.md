# G03 — Creative Brief

**Verb:** Frame

## Input
- `ProjectSpec`
- `ApprovedScript`
- validated `TimedScript`
- brand principles and upstream audience assumptions

## Worker
GPT creative-analysis worker; deterministic template fallback. Codex: none.

## Transform
Define the singular communication objective, core message, tone, pacing intent, information density, emotional arc, and explicit non-goals. Do not select style IDs, assets, components, or motion presets.

## Output
- `CreativeBrief`

## Verify
- valid taxonomy and schema
- all decisions link to script/config evidence
- no new facts or implementation IDs
- no unresolved critical ambiguity

## Failure routing
One constrained GPT repair, then human clarification. Input contradictions route to G01 or upstream content.