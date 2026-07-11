# G06 — Resource Planning

**Verb:** Specify

## Input
- `SceneRequirements`
- `StoryPlan`
- `ProjectSpec`
- `BrandPolicy`

## Worker
Rule engine for common mappings; GPT only for novel mixed scenes. Codex: none.

## Transform
Describe abstract needs such as icon roles, image roles, diagrams, charts, text treatments, backgrounds, audio cues, transitions, and reusable scene primitives. Do not bind concrete assets or implementations.

## Output
- `ResourcePlan`

## Verify
- every need is justified by a scene requirement
- no asset/component/preset ID is present
- resource quantities and content-capacity constraints are feasible
- rights and accessibility requirements are represented

## Failure routing
Missing scene intent returns to G05. Impossible resource demand returns to G04/G05 for simplification.