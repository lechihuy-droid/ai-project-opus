# AI Weekly GPT-5.6 RAG Flow Pilot Report

- **Run ID:** `ai-weekly-gpt-5-6-2026-07-16`
- **Date:** 2026-07-16 JST
- **Topic:** OpenAI ra mắt GPT-5.6
- **Decision:** technical flow PASS; publish readiness NO-GO
- **Source:** [OpenAI - GPT-5.6: Frontier intelligence that scales with your ambition](https://openai.com/index/gpt-5-6/), published 2026-07-09

## 1. Pilot objective

Kiểm tra flow mới theo đường thật:

```text
weekly AI news -> local script collector -> sanitize/normalize
-> knowledge compile/build -> SQLite RAG retrieval
-> scene mapping -> VideoMap validation -> still QA
-> Remotion render -> MP4 frame/stream QA
```

RAG trong pilot dùng để chọn visual family và style evidence. Nó không thay thế factual research source của tin tức.

## 2. Inputs

- Script: `input/news/gpt-5-6-weekly/script.vi.md`
- Flow config: `pipeline/fixtures/gpt-5-6-weekly-flow.json`
- Output run: `pipeline/runs/ai-weekly-gpt-5-6-2026-07-16/`
- Format: vertical `1080x1920`, `30 fps`, target `20s`
- Requested family metadata: `terminal`
- Knowledge repository: SQLite, projection refresh enabled

Factual claims retained from official source:

- GPT-5.6 launched on 2026-07-09.
- Model tiers: Sol, Terra, Luna.
- Availability: ChatGPT, Codex, OpenAI API.
- Programmatic Tool Calling and multi-agent are part of the release.

## 3. Flow results

| Stage | Result |
|---|---|
| Collect | PASS - 1 local script source |
| Sanitize/normalize | PASS - 5 events |
| Knowledge compile | PASS - 1 template, 1 adapter, 4 approved reference sources |
| SQLite build | PASS - integrity, foreign keys, FTS5 |
| RAG retrieval | PASS - 5/5 events matched |
| Scene mapping | PASS - 5 terminal scenes |
| VideoMap validation | PASS - 5 scenes, 20 seconds |
| Still QA v1 | FAIL - duplicated headline and subtitle overflow |
| Still QA v2 | PASS - 5 sampled MP4 frames clean |
| Full render | PASS - H.264 MP4 |
| Audio QA | FAIL - AAC stream is effectively silent |

## 4. RAG audit

- Manifest: `4bf7db5ba6f5cf3698fc54e0ab3813b1fe0fd2c55681565039d7f96d022e0a62`
- Queries: 5
- Matched events: 5
- Evidence links attached: 15
- Unique evidence chunks: 3
- Result family: terminal for all scenes

Unique approved evidence:

1. Terminal CSS source link review note.
2. Local reference theme tokens.
3. Fixture terminal repository overview.

Assessment: retrieval contract works and provenance is auditable. Corpus quality remains MVP-level: evidence is generic terminal style material, not broad enough for visual diversity or news-specific design.

## 5. Render output

- Video: `pipeline/runs/ai-weekly-gpt-5-6-2026-07-16/output/video.mp4`
- Duration: `20.053333s`
- Video: H.264, `1080x1920`, `30 fps`
- Audio: AAC, `20.053333s`, measured `mean/max -91 dB` (silence)
- Size: `6,609,745 bytes`
- Bit rate: `2,636,866 bps`
- SHA-256: `7b4a866ff8bf27dc0e4883e177bb32cb197f4d3b8a58ae0f9c90a5f34c08da82`
- Render mode: `concurrency=1`
- Final render wall time: about `11m 27s`

QA frames:

- `qa/frame-2-v2.png`
- `qa/frame-6-v2.png`
- `qa/frame-10-v2.png`
- `qa/frame-14-v2.png`
- `qa/frame-18-v2.png`

## 6. Defects found and fixes applied

### Fixed during pilot

1. Script collector dropped `family` and `tags`. Fixed by preserving visual metadata in normalized events.
2. RAG query ignored event metadata. Fixed by including family/tags in query text.
3. Scene headline used entire paragraph. Fixed by using first script line as title.
4. Terminal code body repeated subtitle content. Reduced by splitting terminal lines and removing exact title line when available.
5. Subtitle bar overflowed horizontally on long terminal scenes. Fixed: generated terminal/code scenes use `subtitleMode: none` because terminal body already contains text.
6. Parallel render risk on weak machine. Fixed: generated render uses `--concurrency=1`.

### Remaining

1. No TTS/timed captions in this visual-flow lane; AAC output is silent.
2. Five scenes use one terminal template, causing visual monotony.
3. Terminal body can still repeat title prefix because `makeBlock()` currently collapses script line breaks before compilation.
4. Preview wrapper timed out while another Remotion still process occupied machine resources; direct sequential still succeeded.
5. Current RAG corpus lacks approved dashboard/editorial references rich enough for mixed-style recommendation.

## 7. Decision

**Technical flow: PASS.** Collect, sanitize, compile/build DB, retrieval, mapping, validation, render, checksum, and frame QA all completed.

**Publish readiness: NO-GO.** Add voice/TTS timing, remove silent audio track, preserve structured script lines, and introduce at least one additional approved visual family before publishing.

## 8. Next actions

1. Route pilot through S2 TTS + TimedScript, then apply real scene duration.
2. Preserve structured `title/body` in normalized script records instead of flattening text.
3. Promote approved dashboard and editorial references; test mixed-family retrieval.
4. Add automatic overflow QA for generated subtitle/terminal text.
5. Record render contention and enforce one active Remotion render per workspace.

