> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# PublicationBundle Contract

Final release package produced by G12.

## Required
- final video artifact and checksum
- render report
- captions/subtitles and thumbnails when required
- platform metadata
- provenance, attribution, rights record, and workflow history
- source VideoSpec and approval IDs
- publication targets and per-target status

## Invariants
A bundle cannot be marked published until all mandatory artifacts, approvals, rights checks, and target-specific metadata pass.