> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# RenderReport Contract

Technical and provenance report produced by G11.

## Required
- render job, VideoArtifact, VideoSpec, and approval references
- timestamps, worker profile, attempts, and cache usage
- frame, audio, caption, codec, duration, and integrity checks
- warnings, failures, fallbacks, actions, and checksum result

## Invariants
- results refer to the exact VideoArtifact checksum
- failed mandatory checks block G12
- retries and fallbacks remain visible in workflow history
