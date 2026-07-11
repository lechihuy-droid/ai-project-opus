> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# G09 — VideoSpec Compilation

**Verb:** Compile

## Input
- `ProjectSpec`
- `ApprovedScript`
- `VoiceTrack`
- `TimedScript`
- `CaptionPlanDraft`
- `StoryPlan`
- `CreativePlan`
- `ImplementationPlan`

## Worker
Deterministic spec compiler and schema validator. Codex may maintain the compiler implementation but does not make runtime creative decisions. GPT: none.

## Transform
Compile all approved plans into one immutable execution contract containing scene timeline, audio, captions, visual beats, styles, motion, assets, components, transitions, render configuration, and provenance.

## Output
- `VideoSpec`

## Verify
- full JSON Schema and cross-reference validation
- timeline/frame continuity
- caption/audio/script hash agreement
- all IDs and versions resolve
- no duplicated editable script copy inside renderer props
- dependency graph is complete and acyclic

## Failure routing
Route each error to the artifact-owning gate. The compiler must not silently repair creative or content decisions.
