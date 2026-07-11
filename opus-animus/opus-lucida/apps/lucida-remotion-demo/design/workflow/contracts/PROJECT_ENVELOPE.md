> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# ProjectEnvelope Contract

Immutable workflow-run envelope created by G00.

## Required
- project, run, request, and approved-script IDs
- exact input versions, hashes, and registration timestamps
- registered user-asset references
- initial state, correlation IDs, idempotency key, and creation actor

## Invariants
- the script is approved and non-superseded
- one idempotency key cannot create competing active runs
- inputs are immutable; G00 records inputs but does not normalize defaults
