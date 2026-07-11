> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# ProjectSpec Contract

Normalized immutable production request created by G01.

## Required
- project and source-request IDs/hashes
- platform, aspect ratio, resolution, FPS, duration policy
- language, output, audio, and caption modes
- brand, rights, safety, renderer, and asset-source policy versions
- creative and motion budgets

## Invariants
- all defaults are resolved
- aspect ratio and dimensions are consistent
- duration is feasible for the approved script
- all referenced policies exist at explicit versions
- downstream gates must not reinterpret raw user aliases or defaults