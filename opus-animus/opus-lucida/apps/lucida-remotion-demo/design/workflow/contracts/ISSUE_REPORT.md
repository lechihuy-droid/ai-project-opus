> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# IssueReport Contract

Structured validation and review findings produced by G10.

## Required
- report and PreviewBundle IDs
- issue ID, severity, evidence, and affected artifacts
- owning gate, proposed route, retryability, and blocking status
- detector or reviewer identity/version

## Invariants
- every blocking issue has one owning route
- accepted warnings identify their policy or approver
- resolutions are auditable; findings are not deleted
