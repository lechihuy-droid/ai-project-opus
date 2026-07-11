> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# G11 — Production Render

**Verb:** Render

## Input
- approved immutable `VideoSpec`
- valid `ApprovalRecord`
- production renderer profile

## Worker
Remotion render workers and media post-processing workers. No GPT. Codex is not a runtime renderer.

## Transform
Render scenes and transitions, assemble the final timeline, mux audio, captions, and metadata, and generate checksums and technical reports. Reuse scene cache where dependency hashes match.

## Output
- `VideoArtifact`
- `RenderReport`

## Verify
- expected frame count, FPS, dimensions, codecs, and duration
- audio presence/sync and peak policies
- subtitle/caption output policy
- file integrity and checksum
- no missing frames/assets/fonts

## Failure routing
Infrastructure failures retry with bounded backoff. Deterministic implementation defects return to G08/G09. Spec defects return to the owning planning gate.
