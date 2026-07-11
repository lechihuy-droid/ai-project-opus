# G04 — Story Planning

**Verb:** Plan

## Input
- `ApprovedScript`
- `TimedScript`
- validated `CreativeBrief`
- `ProjectSpec`

## Worker
GPT narrative planner with deterministic sentence, timing, and coverage helpers. Codex: none.

## Transform
- group locked script units into narrative sections and renderable scenes
- assign intent, key message, sentence/caption references, energy, and target duration
- preserve immutable script wording and timing anchors

## Output
- `StoryPlan`

## Verify
- substantive script coverage >= configured threshold
- no hallucinated content
- scene ranges cover the caption timeline without illegal overlap/gaps
- unique continuous scene order
- every scene has intent, evidence, timing, and information priority

## Failure routing
Repair only affected sections/scenes. Timing conflict routes to G02; brief defect routes to G03; impossible production constraints route to G01.