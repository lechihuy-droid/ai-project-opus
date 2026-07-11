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