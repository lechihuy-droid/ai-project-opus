> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# G00 — Project Initialization

**Verb:** Initialize

## Input
- `ApprovedScript`
- `CreateRequest`
- optional `BrandPolicy`
- optional user assets

## Worker
Deterministic workflow service. No GPT or Codex.

## Transform
- allocate `project_id`
- verify approval and hashes
- register immutable inputs
- initialize workflow state

## Output
- `ProjectEnvelope`

## Verify
- supported schema versions
- approved and non-superseded script
- project request idempotency
- valid asset URIs/checksums

## Failure routing
Invalid content returns upstream; invalid configuration returns to the requester.
