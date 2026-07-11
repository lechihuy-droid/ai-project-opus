# G07 — Creative Resolution

**Verb:** Decide

## Input
- `CreativeBrief`
- `StoryPlan`
- `SceneRequirements`
- `ResourcePlan`
- brand constraints
- retrieved Style/Motion candidates

## Worker
Hybrid retrieval and ranking plus GPT creative director for final selection among valid candidates. Codex: none.

## Transform
- select visual families and motion strategies by section/scene
- define continuity, novelty, energy, caption-effect, and transition plans
- map visual beats to caption/word cues
- state reasons and rejected alternatives

## Output
- `CreativePlan`

## Verify
- every selected ID exists and is allowed
- brand, license, aspect-ratio, renderer, and reduced-motion constraints pass
- style/motion budgets and continuity rules pass
- all visual-beat triggers reference valid `TimedScript` cues

## Failure routing
Retrieval shortage creates a candidate-development task or falls back to stable packages. Narrative mismatch returns to G04/G05. Human approval is recommended at this gate.