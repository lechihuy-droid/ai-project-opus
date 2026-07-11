> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# Entry and Exit Criteria

## Entry criteria
A gate may start only when all required input artifacts:
- exist at supported schema versions
- have valid hashes and dependency references
- are not rejected or superseded
- satisfy upstream approval requirements
- are not stale relative to changed dependencies

## Exit criteria
A gate succeeds only when:
- output schema passes
- gate-specific hard and semantic checks pass
- provenance and worker versions are recorded
- output status is `validated`
- emitted events and dependency indexes are persisted

A warning outcome must name the accepting policy or human approver.