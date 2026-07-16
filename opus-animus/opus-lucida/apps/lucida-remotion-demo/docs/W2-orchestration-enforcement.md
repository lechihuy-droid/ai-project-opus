# W2 Orchestration Enforcement

`visual-flow` is a Rapid Visual Pilot entrypoint. It validates and adapts v1/v2 config, writes `pipeline/runs/<runId>/run-envelope.json`, and always persists `lane: rapid-visual-pilot` with `publicationStatus: non_publishable`. It cannot start a production run or publish.

Promotion is explicit and leaves the pilot immutable:

```console
npm run flow:promote -- --source-run-id <rapid-run> --approval <promotion-approval.json> --production-run-id <production-run> --production-approvals <production-approvals.json>
```

The promotion approval must be an approved `promotion` record for the rapid run and its hash must equal `pipeline/runs/<rapid-run>/05-video-map.json`. The command creates a new `pipeline/runs/<production-run>/` with a `promotion_pending` production envelope, production approvals, and promotion provenance.

Production render requires an explicit envelope plus approved records for the exact approved script and source video map:

```console
npm run flow:run -- --script <approved-script.json> --video-map <video-map.json> --run-envelope <run-envelope.json> --approvals <approvals.json>
```

It renders and records `awaiting_final_approval`; it never calls publish handoff. A changed script or video-map hash blocks the run.

Finalization requires an approved `final-video` record for the exact `output/render/flow-runs/<runId>/video.mp4` bytes:

```console
npm run flow:finalize -- --run-id <production-run> --approvals <approvals-including-final-video.json>
```

Finalization first stages a publishable candidate envelope and approvals, then invokes `publish:handoff` with those explicit candidate files. Only a successful handoff atomically replaces the persisted envelope, approvals, and report with the publishable state; a failed handoff leaves the prior `awaiting_final_approval` state intact. `publish:handoff` independently repeats the production envelope, approval-reference, dependency-hash, and final-render-hash checks.

`flow-server` accepts `POST /run` with `script`, `videoMap`, `runEnvelope`, `approvals`, and `runId`; `POST /promote` with `sourceRunId`, `productionRunId`, `approval`, and `productionApprovals`; and `POST /finalize` with `runId` and `approvals`. It uses `fs.realpathSync` for repository-root and target containment, rejects symlink escapes, and stores detached-process logs outside immutable render run directories.
