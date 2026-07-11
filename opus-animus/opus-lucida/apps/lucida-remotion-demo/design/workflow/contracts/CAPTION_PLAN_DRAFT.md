> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# CaptionPlanDraft Contract

Caption presentation plan derived from `TimedScript` by G02.

## Required
- timed-script ID, revision, and hash
- ordered caption chunks and timing-cue references
- immutable source-text references
- readability, safe-area, and accessibility constraints
- registered caption-effect IDs where resolved

## Invariants
- display units may split but cannot rewrite approved text
- timing uses cue IDs rather than copied timestamps
- unresolved choices cannot become runtime IDs
- script or timing changes invalidate the draft
