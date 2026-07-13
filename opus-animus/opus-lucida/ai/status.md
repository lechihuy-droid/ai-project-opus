# STATUS - opus-lucida
**Updated:** 2026-07-14
**Current owner:** Claude (Remotion Flow v1 design)
**Previous owner:** Codex (2026-07-11)

## Latest (2026-07-14) — Remotion Flow v1 approved

- User đã duyệt thiết kế flow production hoàn chỉnh cho `apps/lucida-remotion-demo`: **S0 Topic&Script → S1 Ingest → S2 Audio&Timing → S3 Mapping → S4 Render → S5 QA → S6 Publish**, 3 điểm user duyệt (script / video-map / video final).
- Owner file: `apps/lucida-remotion-demo/design/workflow/FLOW_V1.md`. G00–G12 giữ làm north star, không implement full.
- Milestones: M1 thiết kế ✅ → M2 skill `topic-script-writer` ✅ (`ai/skills/topic-script-writer/`) → M3 RD xong (`apps/lucida-remotion-demo/docs/RD-audio-pipeline.md`, TTS = VieNeu-TTS CPU) → M4 brand gate → M5 n8n + publish.
- RD approved 2026-07-14 → BD viết xong (`docs/BD-audio-pipeline.md`, 6 phase) → Codex đang build Phase 1 (VieNeu adapter + voice:generate). User còn nợ: nghe thử preset voice VieNeu để chốt giọng mặc định (`uv run python scripts\test_cpu_tts.py` trong `apps/VieNeu-TTS`, nghe `outputs/cpu_test.wav`).

## Active sub-systems

| Sub-system | Status | Note |
|---|---|---|
| Wake Lane (slide-agent) | Active | Full 17-slide agent render/export verified end-to-end |
| TTS Bilingual Pipeline | Active | VieNeu (VI) terms-only adapter fixed; long JP sentences stay Japanese for VOICEVOX lane |
| Remotion n8n Starter | Active | Local n8n compose + render orchestration scaffold under `apps/lucida-remotion-demo/n8n/` |
| Slide Agent Renderer | Active | `apps/slide-agent/`; Mustache templates + JSON schemas + Playwright frame export |
| Schema-first HTML Prototype | Archived | Moved to `99-archive/schema-html-prototype-pre-mcp/` as rollback reference |
| Language Generation Backbone | Active | runner pack + rule files are the core path |
| NotebookLM | Optional | support layer only |
| CrewAI automation | Defer | only start after human review of Wake 17-slide output |

## Current direction

> Lucida is on the slide-agent static HTML runtime -> PNG frames -> timed video path, with n8n added as an orchestration layer for `apps/lucida-remotion-demo/`.

## Current focus

1. Keep LLM/agents constrained to typed JSON only
2. Use `apps/slide-agent/` render + QA + Playwright export as production gate
3. Continue audio/video assembly from `production/00-active/wake-cluster/frames/`
4. Generate audio through the bilingual lane: VieNeu for Vietnamese narration + short phonetic grammar labels, VOICEVOX for long Japanese example sentences
5. Use archived React renderer only for rollback comparison

## Locked decisions

- LLM/agents output typed JSON only
- Renderer owns HTML/CSS
- JSON does not contain raw HTML, arbitrary CSS, or arbitrary absolute positioning
- Public 3-view labels: `Ý nghĩa - Dạng - Cách dùng`
- Default speaker-intent prompt: `Ở câu này, người nói đang muốn nói gì?`
- Avoid as learner-facing defaults: `Nghĩa - Hình - Dùng`, `Meaning / Form / Usage`, `Người nói đang làm gì?`

## Language generation backbone

Canonical files:
```
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
production/01-rules/slide-system/09-learner-facing-generation-spec.md
production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
automation/workflows/30-language-generation-runner-pack.md
```

Decision: NotebookLM = optional support; repo-native rule files + runner pack = core scalable path.

Decision: n8n is an orchestration wrapper for `apps/lucida-remotion-demo/`, not a replacement for the existing Remotion render flow.

## Slide Agent renderer

```
Active app: apps/slide-agent/
Verified flow: Wake 17 slides -> slide-plan.json -> JSON Schema validation -> Mustache renderer -> Playwright screenshots -> QA -> PASS
Rollback app: 99-archive/schema-html-prototype-pre-mcp/
```

## Wake lane status

```
Sprint 1 HTML: production/00-active/wake-cluster/wake-cluster-deck-01-05.html
Whole deck HTML: production/00-active/wake-cluster/wake-cluster-deck.html
Schema-first source: production/00-active/wake-cluster/wake-slide-plan.json + wake-typed-deck.json
Agent plan: apps/slide-agent/lessons/wake-cluster/slide-plan.json
Final deck: apps/slide-agent/lessons/wake-cluster/final-deck.html

Verification: template validation PASS (14 templates) | tests PASS (4/4) | render PASS | export 17/17 | qa PASS | reproducibility PASS
Review notes: apps/slide-agent/lessons/wake-cluster/VISUAL-REVIEW.md and AUDIO-SYNC.md
```

## Backlog

- **Audio/TTS pipeline cho `apps/lucida-remotion-demo/`** — video render hiện KHÔNG có audio track, caption timing chia đều tuyến tính. Cần RD riêng (chọn TTS engine, wire `<Audio>`, caption timing theo WhisperX word-timestamp) trước khi build. (Ghi nhận 2026-07-12, quyết định defer sau review flow create-video.)

## Current risks

1. Design rules are still only partially compiled into validation beyond the Wake-specific checks
2. Human review is still needed before audio/video lock
3. Browser plugin Node REPL was unavailable in the last session; verification used Playwright export + PNG spot-check
4. Docker is not installed / not on PATH in this environment, so n8n cannot be launched yet
5. Status must remain live resume source instead of ad-hoc context files

## Active truth files

```
10-project-architecture-map.md
11-current-operating-flow.md
12-repo-folder-status-map.md
automation/workflows/20-lesson-production-sop.md
automation/workflows/30-subagent-governance.md
automation/workflows/30-language-generation-runner-pack.md
production/00-active/wake-cluster/01-master-teaching-skeleton.md
production/00-active/wake-cluster/02-script.md
production/00-active/wake-cluster/03-slide-deck.md
production/00-active/wake-cluster/07-automation-status.md
production/00-active/wake-cluster/08-production-frame-map.md
production/00-active/wake-cluster/wake-slide-plan.json
production/00-active/wake-cluster/wake-typed-deck.json
apps/slide-agent/
99-archive/schema-html-prototype-pre-mcp/
```

## Constraints

- Sample-first: do not scale batch lesson until the public sample is stable
- Funnel-first: every content asset needs a path to lead magnet or waitlist
- SaaS boundary: do not build custom LMS/payment/analytics dashboard in beta phase

## If interrupted

-> Read `ai/status.md` for current project state and exact next action.
-> When Claude is current owner, read `ai/handoff-claude.md`.
