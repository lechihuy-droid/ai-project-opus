> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# Workflow State Machine

## Workflow states

`CREATED -> INITIALIZED -> NORMALIZED -> TIMELINE_LOCKED -> PLANNED -> RESOLVED -> COMPILED -> PREVIEW_READY -> APPROVED -> RENDERED -> PUBLISHED`

Terminal or exception states:

- `BLOCKED_INPUT`
- `BLOCKED_RIGHTS`
- `BLOCKED_MISSING_RESOURCE`
- `REQUIRES_HUMAN_REVIEW`
- `QUALITY_FAILED`
- `RENDER_FAILED`
- `CANCELLED`
- `SUPERSEDED`

## Rules
- transitions require validated gate output
- state changes are event-driven and idempotent
- a changed dependency may move the run backward only to the smallest affected state
- approved states are invalidated by material artifact changes
- terminal failures require an explicit resume, revision, or cancellation action