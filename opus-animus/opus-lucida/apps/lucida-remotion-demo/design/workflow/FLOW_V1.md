# Lucida Production Flow v1 — Market Research → Render → Publish

- **Status:** active — approved 2026-07-14
- **Date:** 2026-07-14
- **Scope:** flow production end-to-end cho lane `apps/lucida-remotion-demo` (topic → script → audio → mapping → render → QA → publish)
- **Role:** operating flow
- **Owner layer:** operating flow
- **Parent:** `opus-lucida/11-current-operating-flow.md` (§5b), `design/workflow/README.md`
- **Supersedes:** (none — cụ thể hoá và mở rộng §5b của `11-current-operating-flow.md`)
- **Superseded by:** (none)

File này trả lời: **flow hoàn chỉnh từ market research đến video render/publish chạy theo thứ tự nào, bước nào đã có, bước nào phải build, và user duyệt ở đâu?**

---

## 1. Quyết định đã chốt (user approve 2026-07-14)

1. Flow v1 gồm 7 stage **S0–S6**. Bộ spec G00–G12 trong `create/` giữ nguyên làm **north star** — KHÔNG implement full (state machine, checksum, artifact store) ở v1.
2. Ba điểm user duyệt: **script (S0) → video-map (S3) → video final (S5)**. Mọi bước khác chạy tự động.
3. Thứ tự triển khai: **M1 (thiết kế) → M2 + M3 song song → M4 → M5**. M5 (n8n orchestration + publish) nằm trong scope v1.

## 2. Flow tổng thể

```text
[S0 Topic & Script]  market research → topic theo series → script → USER DUYỆT
        ↓  ApprovedScript + series + brand block
[S1 Ingest]          source-ingestor-cleaner → clean-brief.json
        ↓                    (+ pipeline/ collectors = visual evidence)
[S2 Audio & Timing]  TTS → voice.mp3 → WhisperX → TimedScript (timeline khóa)
        ↓
[S3 Mapping]         script-template-mapper → video-map.json
        ↓            GATE: validate:videomap + brand-check + USER DUYỆT
[S4 Build & Render]  remotion-video-builder → mp4 CÓ audio + caption word-sync
        ↓
[S5 QA]              remotion-visual-qa + brand quality gates → patch/re-render
        ↓            GATE: USER DUYỆT video final
[S6 Publish]         n8n orchestration + publish handoff
```

## 3. Chi tiết từng stage

### S0 — Topic & Script *(chưa có — build ở M2)*

- **Input:** `docs/market-research/04-growth-hypotheses.md`, `10-series-architecture.md`, `08-editorial-voice.md`, ý tưởng topic của user.
- **Worker:** skill mới `topic-script-writer` (Claude/GPT, prompt + template — không cần code).
- **Output:** `ApprovedScript` (sentence-addressable, theo contract `contracts/APPROVED_SCRIPT.md`) + `series` + brand block (theo `docs/market-research/11-pipeline-contract.md`).
- **Gate:** user duyệt script — script bị freeze sau khi duyệt.

### S1 — Ingest *(đang chạy)*

- **Input:** ApprovedScript + raw sources (URL, repo, PDF, ảnh).
- **Worker:** skill `source-ingestor-cleaner`.
- **Output:** `clean-brief.json` (M4 sẽ thêm trường brand/series).
- **Nhánh phụ (M4):** `pipeline/` collectors (`npm run collect:visual` …) trở thành nguồn **visual evidence** cấp cho S3, không còn là pipeline sinh video-map song song.

### S2 — Audio & Timing *(chưa có — build ở M3, cần RD trước)*

- **Input:** voiceoverText từ ApprovedScript.
- **Worker:** TTS engine (chọn trong RD) → `scripts/run-whisperx.ps1` → word timestamps.
- **Output:** `voice.mp3` + `TimedScript` (theo `contracts/TIMED_SCRIPT.md` / thiết kế trong `../history/workflow/CREATE_FLOW_v1.02_CAPTION_SYNC_EXTENSION.md`).
- **Nguyên tắc:** voice, caption, visual beats dùng **một timeline khóa duy nhất**.

### S3 — Mapping *(đang chạy — nâng cấp ở M3 + M4)*

- **Input:** `clean-brief.json` + `TimedScript` (M3: scene duration lấy từ TimedScript thay vì ước lượng).
- **Worker:** skill `script-template-mapper`.
- **Output:** `video-map.json` (M4: mang brand block; giữ per-scene `layout` + anti-monotony rules hiện có).
- **Gate:** `npm run validate:videomap` + brand-check (M4) + **user duyệt** — giữ nguyên approval gate bắt buộc trong `remotion-script-to-video/SKILL.md`.

### S4 — Build & Render *(đang chạy — nâng cấp ở M3)*

- **Input:** video-map.json đã duyệt + voice.mp3 + TimedScript.
- **Worker:** skill `remotion-video-builder` → `src/data.ts` → `npm run render`.
- **Nâng cấp M3:** adapter render `<Audio>`; `SubtitleBar` dùng word-timestamp từ TimedScript thay chia đều tuyến tính.
- **Output:** `out/video.mp4` (có audio) + still frames + render-report.

### S5 — QA & nghiệm thu *(đang chạy — nâng cấp ở M4)*

- **Input:** mp4 + still frames.
- **Worker:** skill `remotion-visual-qa` + checklist `docs/market-research/12-quality-gates.md` (M4).
- **Gate:** **user duyệt video final**. QA fail → route: sai nội dung/mapping → sửa video-map (S3); bug layout/render → sửa component (S4).

### S6 — Publish *(chưa có — build ở M5)*

- **Worker:** n8n (`n8n/docker-compose.yml`) orchestrate S1→S5 qua webhook/schedule + publish handoff (metadata, thumbnail, upload checklist).
- **Gate:** theo policy — publish ra kênh ngoài luôn cần user xác nhận.

## 4. Map G00–G12 (north star) → Flow v1

| G-gate spec | Stage v1 | Ghi chú |
|---|---|---|
| G00–G01 init/normalize | S0 + S1 | agent-driven, không có ProjectEnvelope/state machine |
| G02 script timing & caption lock | S2 | TimedScript là artifact duy nhất giữ nguyên tinh thần spec |
| G03–G07 brief/story/scene/resource/creative | S3 | gộp thành 1 bước LLM (`script-template-mapper`), có user approval |
| G08–G09 binding/VideoSpec | S3 output + `src/data.ts` | JSON-Schema validate, không immutable/versioned |
| G10 preview | S4/S5 stills + `qa:stills` | |
| G11 render | S4 | |
| G12 publish | S6 | M5 |

## 5. Milestones

| Mốc | Nội dung | Owner | Trạng thái |
|---|---|---|---|
| M1 | Thiết kế Flow v1 (file này) + sync docs | Claude (docs) | ✅ done 2026-07-14 |
| M2 | S0: skill `topic-script-writer` + ApprovedScript template + checklist duyệt | Claude (skill/prompt) | ✅ done 2026-07-14 — `opus-lucida/ai/skills/topic-script-writer/` |
| M3 | S2 + S4 audio: RD (TTS = **VieNeu-TTS**, chốt 2026-07-14) → BD → Codex build (VieNeu adapter, WhisperX→TimedScript, `<Audio>` layer, caption word-sync) | RD/BD: Claude; code: Codex | RD viết xong (`docs/RD-audio-pipeline.md`) — chờ approve → BD |
| M4 | Brand gate (brand block vào video-map schema + validate + quality-gates 12 vào QA) + hợp nhất `pipeline/` collectors làm visual evidence | BD: Claude; code: Codex | pending — sau M2/M3 |
| M5 | n8n orchestration end-to-end + publish handoff (S6) | BD: Claude; code: Codex | pending — sau M4 |

## 6. Link downward

- Skills: `opus-lucida/ai/skills/remotion-script-to-video/SKILL.md` (orchestrator), `source-ingestor-cleaner`, `script-template-mapper`, `remotion-video-builder`, `remotion-visual-qa`.
- Brand/market: `docs/market-research/` (đặc biệt 08, 10, 11, 12).
- Spec north star: `design/workflow/create/G00–G12`, `contracts/`, `governance/`, `validation/`.
- Thiết kế caption sync: `design/history/workflow/CREATE_FLOW_v1.02_CAPTION_SYNC_EXTENSION.md`.
- Scripts: `package.json` (`validate:videomap`, `render`, `qa:stills`, `visual-flow`), `scripts/run-whisperx.ps1`.
