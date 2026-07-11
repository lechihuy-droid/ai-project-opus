> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# Workflow Event Model

Every gate emits immutable events:

- `GATE_STARTED`
- `GATE_SUCCEEDED`
- `GATE_SUCCEEDED_WITH_WARNING`
- `GATE_FAILED`
- `GATE_RETRY_SCHEDULED`
- `ARTIFACT_CREATED`
- `ARTIFACT_VALIDATED`
- `ARTIFACT_INVALIDATED`
- `ARTIFACT_SUPERSEDED`
- `HUMAN_REVIEW_REQUESTED`
- `HUMAN_APPROVED`
- `HUMAN_REJECTED`
- `WORKFLOW_BLOCKED`
- `WORKFLOW_COMPLETED`

Each event records project, run, gate, artifact IDs, versions, causation/correlation IDs, timestamp, actor, worker version, and structured payload. Events are audit records; canonical artifact state remains in the artifact store.