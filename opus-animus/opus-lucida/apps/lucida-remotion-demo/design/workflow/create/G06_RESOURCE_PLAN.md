> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# G06 — Resource Planning

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
