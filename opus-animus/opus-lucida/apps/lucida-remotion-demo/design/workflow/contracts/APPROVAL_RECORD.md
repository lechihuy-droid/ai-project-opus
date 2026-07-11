> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# ApprovalRecord Contract

Authorization to render or publish one exact artifact revision.

## Required
- approval ID, scope, decision, and timestamp
- approver or unattended-approval policy version
- approved artifact IDs, versions, and hashes
- conditions, accepted warnings, and review-source references

## Invariants
- approval applies only to recorded hashes
- material dependency changes invalidate approval
- rejection or requested changes cannot authorize G11
- unattended approval requires explicit project policy
