# G05 — Scene Analysis

**Verb:** Analyze

## Input
- validated `StoryPlan`
- relevant `TimedScript` ranges
- `CreativeBrief`
- controlled content taxonomy

## Worker
Deterministic entity/data detection plus GPT semantic classification for ambiguous scenes. Codex: none.

## Transform
For each scene identify content type, hierarchy, visual evidence needs, data/diagram requirements, text density, accessibility constraints, and forbidden representations. Define visual-beat opportunities using sentence, caption-chunk, or word cue IDs.

## Output
- `SceneRequirements`

## Verify
- classifications belong to taxonomy
- every requirement links to a scene and script/timeline evidence
- numeric claims exist in approved content
- no concrete style, asset, component, or motion ID is selected

## Failure routing
Narrative defects return to G04. Timing-reference defects return to G02. Taxonomy gaps create a governance task rather than allowing permanent free-form categories.