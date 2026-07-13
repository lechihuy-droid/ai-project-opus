# RD — Audio Pipeline (S2 Audio & Timing + S4 audio render)

- **Status:** approved 2026-07-14 — BD: `docs/BD-audio-pipeline.md`
- **Date:** 2026-07-14
- **Scope:** milestone M3 của FLOW_V1 — sinh giọng đọc từ ApprovedScript, khóa timeline bằng WhisperX, render video có audio + caption word-sync
- **Role:** requirements doc (SDD)
- **Owner layer:** workflow SOP
- **Parent:** `design/workflow/FLOW_V1.md` (S2, S4)
- **Supersedes:** (none)
- **Superseded by:** (none)

File này trả lời: **để video Lucida có tiếng và caption khớp lời đọc, hệ thống phải làm được gì — và cái gì chưa cần làm?**

Nền tảng kỹ thuật: `design/research/AUDIO_FIRST_VIDEO_PRODUCTION_FLOW.md` (đã có đầy đủ kiến trúc). RD này **chốt scope MVP = Slice 1 + Slice 2** của tài liệu đó, cộng thêm VieNeu adapter.

---

## 1. Quyết định đã chốt

| Quyết định | Giá trị | Lý do |
|---|---|---|
| TTS engine | **VieNeu-TTS v3 Turbo, CPU ONNX INT8** tại `opus-lucida/apps/VieNeu-TTS/` | User chọn 2026-07-14; đã cài và test OK trên Surface Laptop 2 |
| Alignment | WhisperX (`scripts/run-whisperx.ps1`, venv `.venv-whisperx` có sẵn) | Đã chạy thành công với tiếng Việt (`input/whisperx-transcripts/AI Tự Quản Lý.json`) |
| Text truth | ApprovedScript — WhisperX chỉ cung cấp timing, không được sửa text | Nguyên tắc nền tảng của audio-first doc |
| Timeline truth | VoiceTrack — composition duration lấy từ audio duration | như trên |
| Caption style | `sentence-first-word-highlight`, max 2 lines, ≤12 từ/chunk, active word scale 1.04 | Đã lock trong brand contract `docs/market-research/11-pipeline-contract.md` |
| Chuẩn audio master | WAV PCM 48 kHz mono, -14 LUFS, true peak -1 dBTP | Đề xuất của research doc, theo chuẩn platform |

## 2. Usage — người dùng thấy gì

```text
1. Có approved-script.json (từ skill topic-script-writer)
2. npm run voice:generate -- --script input/scripts/<slug>/approved-script.json
   → gọi VieNeu (CPU) → normalize → public/runs/<run-id>/audio/voice.wav + voice-track.json
   (máy cắm sạc, Best performance; chạy nền, có thể lâu với script dài)
3. npm run voice:align -- --run <run-id>
   → WhisperX → đối chiếu script → timed-script.json (word + phrase timestamps)
4. script-template-mapper đọc timed-script → scene duration theo lời đọc thật
5. npm run render → mp4 CÓ audio, caption đổi trang theo phrase, chữ đang đọc được highlight
6. render-report.json ghi voice checksum, duration, caption drift
```

## 3. Functional requirements

- **FR1 — VieNeu adapter.** Script sinh giọng từ `voiceoverText` của ApprovedScript qua VieNeu (`uv run`, API `Vieneu().infer(text, voice, style)`). Voice preset + style đọc từ file config, không hardcode. Kết quả cuối là **một file voice liền mạch** cho cả script (cách chunk/ghép do BD quyết sau spike).
- **FR2 — Normalize + probe.** Chuẩn hoá về audio master (mục 1) bằng ffmpeg; probe duration/sampleRate/checksum bằng tool (không để LLM đoán); xuất `voice-track.json` gắn `scriptChecksum`.
- **FR3 — TimedScript.** Chạy WhisperX trên voice.wav; reconcile với ApprovedScript (script là text truth); xuất `timed-script.json` với word timestamps, phrase groups (theo caption policy), khoảng lặng; timestamp thiếu phải được đánh dấu tường minh, không nội suy im lặng.
- **FR4 — Audio trong Remotion.** Global audio layer render voice track; composition duration derive từ voice duration (`calculateMetadata`); scene cuối không cắt lời.
- **FR5 — Caption word-sync.** `SubtitleBar` (hoặc component thay thế) đổi caption page theo phrase boundary và highlight active word theo timestamp — **bỏ hẳn chia đều tuyến tính**. Style theo brand contract (mục 1).
- **FR6 — Preflight.** Thiếu voice.wav, checksum không khớp script revision, hoặc timed-script không khớp voice checksum → fail TRƯỚC khi render.
- **FR7 — Render report.** Ghi voice checksum, duration, audio stream check, caption drift so với QA threshold.
- **FR8 — Mapper dùng timing thật.** `script-template-mapper` nhận timed-script; scene duration lấy từ narration range (MVP: ranh giới scene theo `segmentId` của script), thay cho ước lượng.

## 4. Out of scope (M3 không làm)

- Slice 3–5 của research doc: NarrativeBeatMap, VisualCuePlan, asset binding theo cue.
- Provider khác (ElevenLabs, Edge TTS), music/SFX, ducking, mix automation.
- Voice cloning / giọng tùy chỉnh — dùng preset voices của VieNeu.
- Giọng Nhật (VOICEVOX lane của slide-agent — không thuộc lane này).
- G02 gate machine đầy đủ (checksum graph tự động invalidate) — chỉ làm preflight check FR6.

## 5. Acceptance (Definition of Done)

Theo DoD Slice 1 + Slice 2 của research doc:

1. MP4 output có audio stream, duration khớp voice duration.
2. Thiếu/sai audio fail trước render, không ra video câm.
3. Caption đổi trang tại phrase boundary; active word chạy theo word timestamp; drift trong QA threshold.
4. Script text không bị thay đổi bởi pipeline (diff = 0 so với ApprovedScript).
5. Render report đầy đủ checksum + duration + drift.
6. Chạy end-to-end được với 1 script thật (đề xuất: "AI Tự Quản Lý" — đã có transcript WhisperX).

## 6. Open questions (chốt trong BD)

1. **Default voice preset:** user cần nghe thử — chạy `uv run python scripts\test_cpu_tts.py` trong `apps/VieNeu-TTS/` và nghe `outputs/cpu_test.wav`; hoặc mở Web UI (`start-vieneu-cpu.ps1`) thử từng preset rồi báo tên voice.
2. **Chunk strategy:** VieNeu infer cả bài một lần hay từng câu rồi ghép (chất lượng ngắt nghỉ vs tốc độ CPU) — BD làm spike đo thử trước khi chốt.
3. **Tốc độ đọc thật** của VieNeu (từ/giây) — đo từ spike, cập nhật ngược vào `topic-script-writer/references/topic-selection-rules.md`.

## 7. Link downward

- Build plan: BD-audio-pipeline (viết sau khi RD được approve; code giao Codex).
- Runtime: `src/Composition.tsx`, `src/templateRegistry.tsx` (SubtitleBar), `scripts/render-run.mjs`, `scripts/run-whisperx.ps1`.
- Engine: `opus-lucida/apps/VieNeu-TTS/LOCAL_CPU_GUIDE.md`.
