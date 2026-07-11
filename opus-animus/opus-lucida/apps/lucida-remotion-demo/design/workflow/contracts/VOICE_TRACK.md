> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# VoiceTrack Contract

Canonical narration audio created or registered by G02.

## Required
- audio ID, revision, hash, storage URI, and provenance
- source script ID, revision, and hash
- codec, sample rate, channels, duration, and loudness metadata
- producer identity/version and pronunciation exceptions

## Invariants
- spoken text matches the approved script under normalization policy
- media metadata is machine-verified
- changed audio creates a revision and invalidates dependent timing
- storage and publication rights satisfy project policy
