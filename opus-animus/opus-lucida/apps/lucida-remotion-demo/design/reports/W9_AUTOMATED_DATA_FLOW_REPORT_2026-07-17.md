# W9 Automated Data Flow Report - 2026-07-17

## Decision

The W9 production-flow retry series reached a rendered, post-render-QA-passing candidate at `r6`, but its persisted state is exactly `awaiting_final_approval`. The candidate is not production-ready, publishable, or approved for publication until a final-video approval binds to the `r6` render hash `sha256:4db83ee4043bfa83d33bea1ade61569efc9d6d171bc14a78d34f50324703d039`.

This report records automated evidence only. No style review result is claimed.

## Retry Lineage

| Retry | Persisted result | Exact evidence | Outcome and next repair |
|---|---|---|---|
| r1: `w9-gpt-5-6-production-20260717` | `voice:generate`, `voice:align`, timing map, and video-map validation completed; brand validation failed. | `output/render/flow-runs/w9-gpt-5-6-production-20260717/flow-report.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717/brand-check.json` | TTS and alignment passed. Brand gate recorded `video.language="en"` and missing `brand.series`; downstream stages were skipped. |
| r2: `w9-gpt-5-6-production-20260717-r2` | Brand gate passed; pre-render capacity gate failed. | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r2/brand-check.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r2/qa-pre-render.json` | `minimal-education-03` body length was `374` against capacity `360`; render was not started. |
| r3: `w9-gpt-5-6-production-20260717-r3` | Pre-render and semantic QA passed; render failed. | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r3/flow-report.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r3/semantic-report.json` | The retry observation was a Chrome-path failure. The persisted flow report records only `render exited with code 1` after `37,237 ms`; it does not retain a more specific Chrome diagnostic. |
| r4: `w9-gpt-5-6-production-20260717-r4` | Pre-render and semantic QA passed; render failed under the external 15-minute timeout. | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r4/flow-report.json` | The persisted render elapsed time is `873,556 ms` and ends with `render exited with code 1`; post-render QA was skipped. |
| r5: `w9-gpt-5-6-production-20260717-r5` | Render completed (`7,783,745` bytes); post-render QA failed. | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r5/render-output.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r5/qa-report.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r5/video.mp4` | `phrase-007` had null caption timestamps, and render integrity expected `20 s` while the decoded result was `31.786667 s`. The MP4 was retained as failed evidence, not an approved candidate. |
| r6: `w9-gpt-5-6-production-20260717-r6` | Render completed (`8,292,761` bytes); post-render QA passed; status is `awaiting_final_approval`. | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/flow-report.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/render-output.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/qa-report.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/video.mp4` | Automated checks passed, including audio stream, non-silence, clipping, 16 caption phrases with maximum drift `13.333 ms`, and render integrity for `1080x1920`, `31.786667 s`. Final hash approval remains required. |

## Evidence Scope

| Area | Status | Evidence |
|---|---|---|
| Canonical knowledge and approvals | PASS | `.generated/knowledge/manifest.json`; `.generated/knowledge/lucida-knowledge.db`; `pipeline/fixtures/w9/production-approvals-r6.approved.json`; `pipeline/fixtures/w9/promotion-approval-r6.approved.json`. |
| r6 brand, pre-render, and semantic gates | PASS | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/brand-check.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/qa-pre-render.json`; `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/semantic-report.json`. Semantic result is 4 pass, 0 warn, 0 fail. |
| r6 final automated QA | PASS | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/qa-report.json`, including render checksum `sha256:4db83ee4043bfa83d33bea1ade61569efc9d6d171bc14a78d34f50324703d039`. |
| Model-routing content | RECORDED | `pipeline/fixtures/w9/content-brief-production.json` and `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/video-map.json` identify Sol, Terra, and Luna; Terra is the balanced implementation model. This is content/model evidence, not a claim about the identity or model of an executing agent. |
| Style review | NOT RECORDED | No style-review artefact is cited or claimed by this report. |
| Final approval / publish handoff | PENDING | `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/flow-report.json` instructs `flow:finalize` with a final-video approval matching `video.mp4`; no final approval artifact is present here. |

## Fix Log

| Trigger | Repair applied for the next retry | Evidence / implementation record |
|---|---|---|
| r1 brand failure | Emit schema-valid brand metadata from the compiler and align brand validation with the existing `vi | en` VideoMap language contract. | r1 failure: `output/render/flow-runs/w9-gpt-5-6-production-20260717/brand-check.json`; r2 pass: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r2/brand-check.json`. |
| r2 content-capacity failure | Reduce `minimal-education-03` body content from `374` to within the `360`-character package capacity. | r2: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r2/qa-pre-render.json`; r3 pass: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r3/qa-pre-render.json`. |
| r3 Chrome-path failure | Correct the Chrome executable/path used by the render environment, then retry. | r3 persisted outcome: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r3/flow-report.json`; the exact Chrome-path diagnostic was external to the persisted flow report. |
| r4 external timeout | Retry with render capacity sufficient for the completed render/QA path. | r4 elapsed failure: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r4/flow-report.json`; r5 completed render: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r5/render-output.json`. |
| r5 caption and duration mismatch | Reuse the checksum-matching transcript, interpolate sparse alignment timestamps, and apply proportional scene timing where a usable segment binding is absent; make expected duration follow the repaired timed map. | Timing artefacts: `public/runs/w9-gpt-5-6-production-20260717-r6/audio/timed-script.json`, `public/runs/w9-gpt-5-6-production-20260717-r6/audio/whisperx/voice.json`; implementation: `scripts/voice-align.mjs`, `scripts/apply-timed-durations.mjs`; r6 QA: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/qa-report.json`. |
| SQLite projection unavailable | Rebuild the SQLite projection only when absent before retrieval/render staging. | Guard and rebuild instruction: `design/workflow/RAG_INGEST_AND_RETRIEVAL.md`; runtime absent-projection handling: `scripts/knowledge/repositories/sqlite-repository.mjs`; current projection: `.generated/knowledge/lucida-knowledge.db`. |

## Required Final Gate

1. Create a final-video approval that binds exactly to `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/video.mp4` and checksum `sha256:4db83ee4043bfa83d33bea1ade61569efc9d6d171bc14a78d34f50324703d039`.
2. Run the finalization path referenced by `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/flow-report.json`.
3. Only after that hash-bound approval and successful handoff may a later report assert `publishable`; this report makes no such assertion.

After HUY explicitly approves the rendered bytes, execute:

```powershell
npm run flow:prepare-final-approval -- --run-id w9-gpt-5-6-production-20260717-r6 --approved-by HUY --out output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/approvals.final.json
npm run flow:finalize -- --run-id w9-gpt-5-6-production-20260717-r6 --approvals output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/approvals.final.json
```

The helper refuses overwrite, unsafe run IDs, duplicate final approvals, output outside the project root, and symlink/junction path escape.
