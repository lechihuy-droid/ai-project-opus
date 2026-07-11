> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# ResourcePlan Contract

Abstract resource needs produced by G06.

## Required
- scene ID
- resource role and category
- required/optional priority
- quantity, content-capacity, format, rights, and accessibility constraints
- reuse preference and fallback strategy

## Prohibited
Concrete asset IDs, component IDs, font files, or motion preset IDs.