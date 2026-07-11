> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# Lucida Create Workflow

Version: 1.02

## Scope

The workflow begins with an approved, frozen script and production request. It ends with a validated publication bundle.

```text
ApprovedScript + CreateRequest
  -> G00 Project Init
  -> G01 Project Normalize
  -> G02 Script Timing & Caption Lock
  -> G03 Creative Brief
  -> G04 Story Plan
  -> G05 Scene Analysis
  -> G06 Resource Plan
  -> G07 Creative Resolution
  -> G08 Resource Binding
  -> G09 VideoSpec Compile
  -> G10 Preview & Validation
  -> G11 Render
  -> G12 Publish
```

## Governing principles

1. Every gate transforms versioned artifacts.
2. No gate consumes invalid, rejected, or superseded artifacts.
3. GPT and Codex are workers; the workflow engine owns state.
4. Script, audio, captions, and visual beats share one locked timeline.
5. Failures route to the smallest gate that owns the defect.
6. Scene-level changes invalidate only dependent scene artifacts where possible.
7. Human approval is required before production render unless project policy explicitly allows unattended publication.

See individual gate files for full contracts.
