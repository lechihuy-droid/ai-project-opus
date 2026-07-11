> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# TimedScript Contract

Canonical script/audio timeline created by G02.

## Required
- script revision/hash and audio ID/hash
- FPS and timebase
- sentence IDs, immutable text, start/end times and frames
- word-level timing where available
- caption chunks, emphasis cues, and registered effect IDs

## Invariants
- text sequence exactly matches `ApprovedScript`
- sentence and word timings are ordered and non-overlapping
- every script sentence is covered
- caption chunks may split display but may not rewrite content
- visual synchronization references cue IDs, not duplicated hard-coded timestamps

Any script or audio change creates a new revision and invalidates dependent artifacts.