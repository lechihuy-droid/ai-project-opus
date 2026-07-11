> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# CreativePlan Contract

Creative decisions produced by G07.

## Required
- dominant and supporting visual families
- selected style/motion/caption/transition IDs with versions
- per-section and per-scene strategy
- visual-beat mappings to sentence, caption-chunk, or word cue IDs
- continuity, novelty, energy, and reduced-motion decisions
- decision rationale and rejected alternatives

## Invariants
All selected resources are retrieved candidates that pass hard constraints; no unregistered runtime ID is permitted.