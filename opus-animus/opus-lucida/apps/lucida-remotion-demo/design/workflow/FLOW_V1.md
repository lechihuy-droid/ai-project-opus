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
[S0.5 Visual Treatment]  script → actors/beats/component-check → USER DUYỆT treatment
        ↓  visual-treatment.md
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

## 2b. Vòng lặp sản xuất (chính thức hóa 2026-07-16, từ bài học email-keigo v2)

Flow KHÔNG tuyến tính. Ba vòng lặp bắt buộc, học từ lần nghiệm thu M6 (Sonnet bắt 3 lỗi layout ở tầng still — rẻ; nếu để lộ ở bản render full sẽ tốn ~10 phút render + 1 lượt duyệt của user cho mỗi lỗi):

```text
LOOP 0 — Design level (RẺ NHẤT, chữ — mỗi vòng vài phút):
  script → VISUAL TREATMENT 1 trang:
    • ACTORS: thực thể hình ảnh của video. Rule: danh từ trung tâm của chủ đề
      bắt buộc có mặt (vd "Dùng AI viết email" → PHẢI có cả [AI terminal] lẫn [mail window])
    • BEATS: mỗi segment 1 dòng tả CẢNH THẤY ĐƯỢC. Rule: beat tương tác A→B
      thì cả A và B phải là actor cùng hiện diện
    • COMPONENT CHECK: map actor/beat sang component có sẵn.
      Không khớp → "COMPONENT GAP" → rẽ sang track engineering (RD/BD nhỏ → Codex build) → quay lại
  EXIT: USER DUYỆT treatment (gộp gate 1; video tái dùng script cũ thì duyệt riêng, nhẹ)

LOOP 1 — Map level (RẺ, lặp nhiều lần OK — mỗi vòng vài phút):
  build/sửa video-map (theo treatment đã duyệt ở Loop 0)
    → validate:videomap + validate:brand + validate:semantic   (máy, ~giây)
      (+ fidelity: actor coverage, beat↔transition coverage — sau khi M6.1/action 4 build xong)
    → render STILL storyboard (1 khung/scene + khung sau mỗi transition; TUẦN TỰ)
    → visual QA still (Sonnet subagent hoặc Claude soi trực tiếp)
    → còn lỗi? sửa map → lặp lại
  EXIT: validators 0 fail + still sạch → trình USER DUYỆT map (gate 2, bảng "HỨA — THẤY":
    mỗi beat 1 dòng, cột trái lời hứa treatment, cột phải still chứng minh)

LOOP 2 — Video level (ĐẮT, chỉ vào khi Loop 1 đã exit — mỗi vòng ~15 phút):
  flow:run (apply-timing → validate → render full → report → publish bundle)
    → check report: audioStream / voiceChecksum / drift / semanticQa
    → QA still trên video-map ĐÃ apply-timing (timing thật có thể xê dịch beat)
    → đối chiếu NGUYÊN VĂN feedback gần nhất của user, từng ý — không dùng bản tóm tắt
    → USER DUYỆT video final (gate 3)
    → user chê? PHÂN LOẠI lỗi trước khi sửa:
        (a) lỗi map (vị trí, beat, nội dung scene)      → quay về LOOP 1
        (b) lỗi component/renderer (thiếu khả năng)      → RD/BD patch → Codex → LOOP 1
        (c) lỗi script/voice (nội dung lời)              → quay về S0, revision mới
  EXIT: user duyệt gate 3 → S6 Publish
```

**RULE CẤM LÁCH:** Khi một beat không thể hiện được bằng component hiện có, mapper PHẢI dừng và báo "component gap" — cấm mọi hình thức lách (đổi title cửa sổ, mượn component sai vai, bỏ beat trong im lặng). Nguồn gốc rule: sự cố email-keigo v2 (2026-07-16), xem `docs/review-design-before-render.md`.

Quy tắc rút từ thực chiến:
- **Lỗi bắt ở Loop 0 là rẻ nhất** — chỉ tốn vài phút chữ, rẻ hơn Loop 1 (vài phút still) và Loop 2 (~15 phút render); lọt đến user tốn 1 lượt duyệt + niềm tin.
- **Không render full khi Loop 1 chưa exit.** Mọi lỗi bố cục phải chết ở tầng still.
- **Máy yếu:** mọi still render TUẦN TỰ từng frame; render full để nền; không chạy Codex song song với render.
- **QA still lần cuối phải chạy trên map đã apply-timing thật**, không phải map ước lượng — offset beat đổi theo giọng đọc.
- Feedback gate 3 của user là input quý nhất — ghi vào review doc và đối chiếu RD trước khi sửa (tránh vá triệu chứng).

## 3. Chi tiết từng stage

### S0 — Topic & Script *(chưa có — build ở M2)*

- **Input:** `docs/market-research/04-growth-hypotheses.md`, `10-series-architecture.md`, `08-editorial-voice.md`, ý tưởng topic của user.
- **Worker:** skill mới `topic-script-writer` (Claude/GPT, prompt + template — không cần code).
- **Output:** `ApprovedScript` (sentence-addressable, theo contract `contracts/APPROVED_SCRIPT.md`) + `series` + brand block (theo `docs/market-research/11-pipeline-contract.md`).
- **Gate:** user duyệt script — script bị freeze sau khi duyệt.

### S0.5 — Visual Treatment *(chưa có — build cùng M6.1/action 1-2, chính thức hóa 2026-07-16)*

- **Input:** ApprovedScript (S0).
- **Worker:** treatment step (Claude) dựng bản 1 trang ACTORS + BEATS + COMPONENT CHECK (chi tiết ở mục 2b Loop 0); COMPONENT GAP → rẽ track engineering (RD/BD → Codex) rồi quay lại.
- **Output:** `input/scripts/<slug>/visual-treatment.md`.
- **Gate:** user duyệt treatment (gộp gate 1 với S0 cùng lượt; video tái dùng script cũ thì duyệt riêng, nhẹ).

### S1 — Ingest *(đang chạy)*

- **Input:** ApprovedScript + raw sources (URL, repo, PDF, ảnh).
- **Worker:** skill `source-ingestor-cleaner`.
- **Output:** `clean-brief.json` (M4 sẽ thêm trường brand/series).
- **Nhánh phụ (M4):** `pipeline/` collectors (`npm run collect:visual` …) trở thành nguồn **visual evidence** cấp cho S3, không còn là pipeline sinh video-map song song.
- **RAG ingest:** collector output phải qua sanitize → human approval → canonical promotion → compile/build. Không query raw collector artifact. Contract vận hành: [`RAG_INGEST_AND_RETRIEVAL.md`](RAG_INGEST_AND_RETRIEVAL.md).

### S2 — Audio & Timing *(chưa có — build ở M3, cần RD trước)*

- **Input:** voiceoverText từ ApprovedScript.
- **Worker:** TTS engine (chọn trong RD) → `scripts/run-whisperx.ps1` → word timestamps.
- **Output:** `voice.mp3` + `TimedScript` (theo `contracts/TIMED_SCRIPT.md` / thiết kế trong `../history/workflow/CREATE_FLOW_v1.02_CAPTION_SYNC_EXTENSION.md`).
- **Nguyên tắc:** voice, caption, visual beats dùng **một timeline khóa duy nhất**.

### S3 — Mapping *(đang chạy — nâng cấp ở M3 + M4)*

- **Input:** `clean-brief.json` + `TimedScript` (M3: scene duration lấy từ TimedScript thay vì ước lượng).
- **Worker:** skill `script-template-mapper`.
- **RAG retrieval:** chạy build-time trước mapper; ghi `03-knowledge-selection.json`; mapper ưu tiên source family → approved RAG family → deterministic fallback. Renderer không mở SQLite.
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

### S6 — Publish *(✅ implemented 2026-07-14 — M5)*

- **Worker:** host runner `npm run flow:run` (chain S2→S5→handoff, flow-report per stage) + `npm run flow:server` (HTTP bridge 127.0.0.1:8790) + n8n workflow `n8n/workflows/lucida-flow.json` (webhook trigger → poll status). `npm run publish:handoff` tạo bundle: video.mp4, thumbnail.png, metadata.json, checklist.md (kèm non-negotiable failures từ quality gates 12).
- **Gate:** upload lên kênh ngoài là **manual** — user tự đăng theo checklist; hệ thống không auto-publish.

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
| M3 | S2 + S4 audio: VieNeu adapter, faster-whisper→TimedScript, `<Audio>` layer, caption word-sync, preflight/report | RD/BD: Claude; code: Codex | ✅ done 2026-07-14 — E2E PASS (mp4 có AAC, caption word-highlight đúng); RD/BD/spike: `docs/RD-audio-pipeline.md`, `docs/BD-audio-pipeline.md`, `docs/spike-vieneu-chunking.md` |
| M4 | Brand gate (brand block vào video-map schema + `validate:brand` + quality-gates 12 vào QA skill) + `evidence:export` hợp nhất collectors | BD: Claude; code: Codex | ✅ done 2026-07-14 — BD: `docs/BD-brand-gate.md`; skill updates: remotion-visual-qa, script-template-mapper, source-ingestor-cleaner |
| M5 | n8n orchestration end-to-end + publish handoff (S6): `flow:run`, `flow:server` (127.0.0.1:8790), `publish:handoff`, n8n workflow importable | BD: Claude; code: Codex | ✅ done 2026-07-14 — BD: `docs/BD-orchestration.md`; upload vẫn là manual gate |
| M6 | Visual Mechanism Kit: `visualMechanism` vào S0, kit 4 khối (window/chip/timer-morph/diff-highlight), continuous scene mode, hierarchy rules, semantic QA vào S5 | RD/BD: Claude; code: Codex | 🔨 RD draft 2026-07-14 — `docs/RD-visual-mechanism.md`; nguồn: gate 3 nghiệm thu v1 không duyệt (`docs/review-v1-improvement-report.md`); acceptance = dựng lại email-keigo |

## 6. Link downward

- Skills: `opus-lucida/ai/skills/remotion-script-to-video/SKILL.md` (orchestrator), `source-ingestor-cleaner`, `script-template-mapper`, `remotion-video-builder`, `remotion-visual-qa`.
- Brand/market: `docs/market-research/` (đặc biệt 08, 10, 11, 12).
- Spec north star: `design/workflow/create/G00–G12`, `contracts/`, `governance/`, `validation/`.
- Thiết kế caption sync: `design/history/workflow/CREATE_FLOW_v1.02_CAPTION_SYNC_EXTENSION.md`.
- Scripts: `package.json` (`validate:videomap`, `render`, `qa:stills`, `visual-flow`), `scripts/run-whisperx.ps1`.
