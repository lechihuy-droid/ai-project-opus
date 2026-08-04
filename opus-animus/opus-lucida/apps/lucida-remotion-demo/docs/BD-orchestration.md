# BD - Orchestration + Publish Handoff (M5/W2)

- **Status:** W2 enforcement implemented 2026-07-16
- **Scope:** host orchestration, n8n trigger/polling, explicit approvals, and manual publish handoff.
- **Owner layer:** workflow SOP

## Architecture

n8n runs in Docker/Linux and only triggers, polls, and reports. The host runner executes VieNeu, WhisperX, Chrome/Remotion rendering, and publish-bundle preparation through the local HTTP bridge at `127.0.0.1:8790`.

Publishing to a platform remains manual. `publish:handoff` creates a reviewable bundle only; it does not upload.

## Run Contract

`flow:run` requires an approved production contract and creates its output directory once:

```console
npm run flow:run -- --script <approved-script.json> --video-map <video-map.json> --run-envelope <run-envelope.json> --approvals <approvals.json> --run-id <production-run>
```

`runEnvelope` is a `lucida-run/v1` production envelope in `promotion_pending` state. `approvals` must include approved `visual-treatment` and `video-map` records whose hashes exactly match the supplied files. The command writes `awaiting_final_approval` after render; it never invokes publish handoff. An existing `output/render/flow-runs/<runId>/` is immutable and is rejected rather than overwritten.

## Approval And Finalization

After review, provide an approved `final-video` record for the exact rendered `video.mp4`:

```console
npm run flow:finalize -- --run-id <production-run> --approvals <approvals-including-final-video.json>
```

Finalization computes a publishable candidate, stages its envelope and approvals inside the run directory, and asks `publish:handoff` to validate those explicit staged inputs. Only after handoff succeeds are the publishable envelope, approvals, and report atomically replaced. A failed handoff leaves the persisted run in its prior `awaiting_final_approval` state.

`publish:handoff` independently validates production lane/status, approval references, approved script and source-map hashes, and the final-video hash before writing `output/publish/<runId>/`.

## HTTP Bridge And n8n

Start the bridge on the host:

```console
npm run flow:server
```

- `POST /run` payload: `{ "script", "videoMap", "runEnvelope", "approvals", "runId" }`.
- `POST /promote` payload: `{ "sourceRunId", "productionRunId", "approval", "productionApprovals" }`.
- `POST /finalize` payload: `{ "runId", "approvals" }`.
- `GET /status/<runId>` returns the flow report.

All supplied repository files are resolved with `fs.realpathSync` for both root and target, so a symlink that escapes the repository is rejected. The server writes detached-process logs to `output/render/flow-logs/<runId>.log`; it does not create a render run directory.

`n8n/workflows/lucida-flow.json` passes the full W2 `/run` payload. It polls until `failed`, `awaiting_final_approval`, or `publishable`. `awaiting_final_approval` is a successful render result that requires a separate final approval; n8n must not treat an individual completed stage as terminal.

## Verification

Run `npm run test:operating-model`, the contract validators, `npx tsc --noEmit`, and `node --check` on changed scripts. Rendering, TTS, WhisperX, Docker, and platform upload are not part of these checks.
