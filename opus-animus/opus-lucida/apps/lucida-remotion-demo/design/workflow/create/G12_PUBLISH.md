> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# G12 — Publication

**Verb:** Publish

## Input
- validated `VideoArtifact`
- `RenderReport`
- project publication policy
- required metadata and provenance

## Worker
Deterministic publication service with optional human release approval. No GPT or Codex.

## Transform
Package the final video, sidecar captions, thumbnails/previews, metadata, provenance, hashes, workflow history, and distribution targets.

## Output
- `PublicationBundle`

## Verify
- required artifacts and checksums exist
- rights and attribution requirements are satisfied
- publication metadata matches target platform
- artifact versions and lineage are complete
- release approval is valid

## Failure routing
Metadata defects remain in G12. Media defects return to G11. Rights/provenance defects return to the owning resource or content gate. Publication is never partially marked successful without an explicit partial-release state.
