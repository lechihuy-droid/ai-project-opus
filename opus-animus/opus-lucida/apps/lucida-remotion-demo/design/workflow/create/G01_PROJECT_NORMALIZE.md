> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# G01 — Project Normalization

**Verb:** Normalize

## Input
- `ProjectEnvelope` containing the registered `CreateRequest`
- registered policies and defaults

## Worker
Deterministic parser and validator. No GPT or Codex.

## Transform
- normalize platform, language, duration, aspect ratio, FPS, resolution, output format, caption/audio modes
- resolve explicit policy versions
- estimate script production feasibility
- freeze normalized request

## Output
- `ProjectSpec`

## Verify
- schema and enum validity
- duration/script feasibility
- aspect-ratio and resolution consistency
- brand, rights, renderer, and asset-source policies resolve successfully

## Failure routing
No automatic retry. Return conflicts to the requester or upstream script workflow.
