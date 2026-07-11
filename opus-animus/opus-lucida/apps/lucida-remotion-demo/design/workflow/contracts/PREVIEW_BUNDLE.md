> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# PreviewBundle Contract

Review package produced by G10 from one immutable `VideoSpec`.

## Required
- VideoSpec ID, version, and hash
- contact-sheet and motion-proxy references
- renderer, dependency, and policy versions
- validation results, checksums, and retention metadata

## Invariants
- all preview assets trace to one VideoSpec hash
- preview media is not a production render
- changed dependencies create a new bundle version
