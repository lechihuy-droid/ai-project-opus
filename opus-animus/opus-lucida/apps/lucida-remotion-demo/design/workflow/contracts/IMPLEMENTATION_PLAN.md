> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# ImplementationPlan Contract

Concrete runtime bindings produced by G08.

## Required
- scene/component bindings
- asset IDs, versions, checksums, and storage URIs
- motion, transition, caption, font, and audio bindings
- component prop mappings
- renderer compatibility and fallback resources
- rights and attribution records

## Invariants
Every dependency resolves at an immutable version and is permitted for the target publication policy.