# W9 R6 Video Execution Log - 2026-07-17

Run: `w9-gpt-5-6-production-20260717-r6`

## Render and post-QA

- Final MP4: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/video.mp4` (`8,292,761` bytes, `sha256:4db83ee4043bfa83d33bea1ade61569efc9d6d171bc14a78d34f50324703d039`).
- Rerun: `npm run qa:production` with phase `post` and bound artifacts; completed at `2026-07-17T02:25:35.850Z`: `PASS 18/18`, `0 fail`.
- Post-QA evidence: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/qa-report.json` records `1080x1920`, `31.786667s`, mean `-16.9 dB`, peak `-4 dB`, `16` phrases, and maximum drift `13.333ms`.
- Sampled-still evidence: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/stills/sampled-stills-report.json` records `5/5 technical_pass`; `styleReview` is `deferred_by_user` and `visualApproval` is `not_claimed`.

## KPI and workflow state

- Rerun: `npm run report:operating-kpis -- --run-id w9-gpt-5-6-production-20260717-r6`; `overall FAIL` is expected. `RAG 1.0`, `provenance 1.0`, `layout repetition 1`, and `audio/caption 1` passed. Visual still approval and auto override are `NO_DATA`; publish readiness is `FAIL 0`.
- KPI source: `design/reports/W9_OPERATING_KPI_REPORT.json`.
- Flow source: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/flow-report.json` is `awaiting_final_approval`. A final approval artifact and publish handoff are absent.

## Assessment

Data flow is proved through render and post-QA. The run is not publish-ready. No human style or visual approval is claimed.

### Stage evaluation against `FLOW_V1`

| Stage | Result | Evidence and boundary |
|---|---|---|
| S0 Script | PASS | `approved-script.json` exists and the production run carries the required approval reference. |
| S0.5 Treatment | PASS | `run-envelope.json` carries the approved treatment reference for r6. |
| S1 Ingest | PASS | Raw, sanitized, normalized, and ContentBrief artifacts are persisted with provenance/checksum bindings. |
| S2 Audio and timing | PASS with reuse | TimedScript, aligned captions, audio, and checksums are valid. In this r6 invocation, `voice:generate` and `voice:align` were skipped because valid artifacts already existed, so r6 proves cache/reuse and downstream binding, not a fresh cold-start TTS execution in one invocation. |
| S3 Mapping and RAG | PASS | Auto mode queried visual and factual domains separately; visual retrieval matched 5/5 scenes, factual retrieval resolved 4/4 requested facts, and the map used three packages and three layouts with maximum consecutive layout repetition of one. |
| S4 Render | PASS | Final MP4 contains valid H.264 video, AAC audio, and timed captions at the required dimensions and duration. |
| S5 QA | PARTIAL | Automated post-render QA is 18/18 and sampled stills are 5/5 technical pass. Human final-video approval remains absent; style review was explicitly deferred. |
| S6 Publish | BLOCKED AS DESIGNED | The exact-hash final approval and publish handoff do not exist, so the flow correctly refuses publication. |

### Decision

- **Automated data flow:** PASS through S4 and automated S5 gates.
- **Control behavior:** PASS; missing human approval blocks S6 instead of being inferred from technical QA.
- **Production publish readiness:** NO-GO until exact-hash final approval and successful `flow:finalize` handoff.
- **Visual/style quality:** not evaluated in this run and not represented as passed.

### Follow-up evidence

1. Required to complete this candidate: bind HUY's explicit approval to the exact MP4 hash, run `flow:finalize`, and verify the generated publish handoff.
2. Optional workflow-strengthening proof: execute a new cold-start run with no reusable voice/alignment artifacts to measure S2 generation and alignment in the same invocation.
3. Deferred by scope: perform human visual/style review later to replace `firstPassStillQa: NO_DATA` with real evidence.
