> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# StoryPlan Contract

Narrative structure produced by G04.

## Required
- ordered sections and scenes
- intent, key message, information priority, and energy
- source sentence/caption references
- start/end frames and duration
- narrative transition rationale
- lock status for human-approved scenes

## Invariants
- substantive content coverage meets policy
- scene timing covers the locked timeline
- no hallucinated content
- IDs and order are unique and continuous
- locked scenes require explicit unlock before regeneration