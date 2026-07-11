> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# ApprovedScript Contract

Canonical frozen content handed off from the upstream content workflow.

## Required
- `schemaVersion`, `scriptId`, `revision`, `status`
- title and language
- immutable voice-over text
- sentence/segment IDs and order
- timing estimate
- editorial locks and permitted rewrite level
- entities, claims, pronunciation, required on-screen text
- approval record, provenance, and content hash

## Invariants
- status is `approved` or explicitly accepted `approved-with-notes`
- frozen text cannot be edited inside Create Workflow
- factual/statistical/historical claims meet verification policy
- every revision has a new hash; superseded revisions cannot start a new run

See G01 and G02 for normalization and timing requirements.