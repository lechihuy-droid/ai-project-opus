# W9 E2E, KPI, And Pilot Rollout

## Current evidence

W8 evidence is approved and promoted into production. The approved canonical knowledge projection and r6 production/promotion approvals are recorded in `.generated/knowledge/manifest.json`, `.generated/knowledge/lucida-knowledge.db`, `pipeline/fixtures/w9/production-approvals-r6.approved.json`, and `pipeline/fixtures/w9/promotion-approval-r6.approved.json`.

Production run `w9-gpt-5-6-production-20260717-r6` passed the r6 TTS/timing, brand, pre-render QA, semantic QA, render-with-audio, and post-render QA path. The final MP4 is `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/video.mp4`, with hash `sha256:4db83ee4043bfa83d33bea1ade61569efc9d6d171bc14a78d34f50324703d039`. Its persisted flow state is exactly `awaiting_final_approval`.

Technical sampled stills passed 5/5 from that final MP4: `output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/stills/sampled-stills-report.json` records five `technical_pass` samples at `1080x1920`. Style review is `deferred_by_user` and visual approval is `not_claimed`; technical still checks do not constitute visual approval.

The current KPI report records RAG evidence coverage `1.0` (`PASS`), audio/caption `PASS` for one production run, first-pass still visual approval `NO_DATA`, and publish readiness `FAIL`. Its overall status is `FAIL`.

This candidate is not production-ready, publishable, or approved for publication.

## Rapid pilot history

Two rapid pilots use the same five-beat operating-model treatment:

- `w9-ai-weekly-auto-20260716`: auto Director selection, three package families, three layouts, five scenes.
- `w9-ai-weekly-locked-20260716`: explicit terminal lock with actor and reason, one package family, three layouts, five scenes.

Both remain `rapid-visual-pilot` and `non_publishable`. The auto run records numeric candidate scores and the locked run records the explicit decision actor. Their history remains separate from the approved W8 promotion and r6 production evidence.

## Factual binding

Production facts use `selectFactualKnowledge()` and canonical source IDs. Visual and factual evidence are merged for mapper provenance but remain isolated before ranking. A missing factual source fails before VideoMap generation.

## Renderer incident history

The rapid still workflow previously exposed browser and fixture failures. The preview wrapper was repaired to bundle once, reuse one browser, and bound browser cleanup. That pilot history does not replace the r6 production evidence: r6 has a completed final MP4, automated post-render QA pass, and technical sampled-stills pass.

## Remaining final gate

The only remaining gate is a human final-video approval bound to the exact r6 MP4 and hash above, followed by `flow:finalize`. Final hash approval and `flow:finalize` are pending. No test, technical still check, or existing candidate artifact may infer that approval.

After HUY explicitly approves the rendered bytes, run the commands documented in `design/reports/W9_AUTOMATED_DATA_FLOW_REPORT_2026-07-17.md`:

```powershell
npm run flow:prepare-final-approval -- --run-id w9-gpt-5-6-production-20260717-r6 --approved-by HUY --out output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/approvals.final.json
npm run flow:finalize -- --run-id w9-gpt-5-6-production-20260717-r6 --approvals output/render/flow-runs/w9-gpt-5-6-production-20260717-r6/approvals.final.json
```

Only a successful hash-bound finalization and publish handoff can change a later report's publishability status.
