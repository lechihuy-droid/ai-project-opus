> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# G07 — Creative Resolution

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
