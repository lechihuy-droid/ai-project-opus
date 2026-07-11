> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# VideoArtifact Contract

Production media output produced by G11.

## Required
- artifact, VideoSpec, and ApprovalRecord references
- immutable storage URI and checksum
- container, codecs, dimensions, FPS, frame count, and duration
- audio, caption, renderer, and dependency metadata

## Invariants
- technical metadata matches the approved VideoSpec
- checksum passes before G12
- replacement or post-processing creates a revision
- preview media cannot satisfy this contract
