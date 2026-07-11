> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# VideoSpec Contract

Immutable execution contract compiled by G09.

## Required
- project/render configuration
- script, audio, and timing hashes
- scene timeline and transitions
- caption plan and caption cue references
- visual-beat mappings
- style, motion, component, asset, font, and audio bindings
- provenance and dependency graph

## Invariants
- schema and cross-references pass
- timeline is continuous and deterministic
- renderer receives no independent editable script copy
- every dependency is versioned and hash-addressed
- changes require a new VideoSpec version