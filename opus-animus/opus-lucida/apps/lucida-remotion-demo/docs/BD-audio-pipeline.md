# BD — Audio Pipeline (M3, Slice 1+2 + VieNeu adapter)

- **Status:** approved-for-build 2026-07-14
- **Date:** 2026-07-14
- **Scope:** build plan cho `docs/RD-audio-pipeline.md` — thực thi bởi Codex, từng phase một
- **Role:** build plan (SDD)
- **Owner layer:** workflow SOP
- **Parent:** `docs/RD-audio-pipeline.md`
- **Supersedes:** (none)
- **Superseded by:** (none)

## Bối cảnh code hiện tại (đã xác minh)

- `src/Root.tsx` — `calculateMetadata` tính `durationInFrames` = tổng duration các scene (line 6–13). Chưa có audio.
- `src/templateRegistry.tsx:742` — `SubtitleBar`, caption chia đều tuyến tính; dùng tại line ~993.
- Không file nào trong `src/` import `<Audio>` của remotion.
- `scripts/run-whisperx.ps1` — gọi `whisperx` CLI (`--language vi --model small --device cpu --compute_type int8 --output_format json`), yêu cầu whisperx trên PATH; venv có sẵn tại `.venv-whisperx/`.
- VieNeu-TTS tại `../VieNeu-TTS/` (sibling trong `opus-lucida/apps/`), chạy qua `uv run`, API: `Vieneu().list_preset_voices()`, `.infer(text, voice=..., style="tu_nhien")`, `.save(audio, path)`. CPU-only INT8.
- `video-map.json` → `src/data.ts` (TS cast) → Root. Render qua `scripts/render-run.mjs`.
- ffmpeg đã dùng trong repo (`scripts/render-terminal-demo-ffmpeg.mjs`) — vẫn phải preflight check PATH.

## Nguyên tắc chung cho mọi phase

- Không phá flow cũ: video-map KHÔNG có `audio` block vẫn render như hiện tại (fallback legacy).
- Timestamp canonical là **milliseconds**; chỉ đổi sang frame tại boundary Remotion (fps từ config).
- Script text là bất biến — mọi bước chỉ đọc, không sửa `approved-script.json`.
- Mỗi phase xong: `npm run lint` pass (eslint + tsc), script mới chạy được bằng lệnh ghi trong phase.
- File mới đặt tên/kiểu nhất quán với `scripts/*.mjs` hiện có (ESM, `node:` imports, args `--flag value`).

---

## Phase 1 — Spike + `voice:generate` (FR1, FR2)

### 1a. VieNeu adapter (Python, đặt tại `../VieNeu-TTS/scripts/lucida_generate.py`)

- Input: `--input <job.json>` = `{ "chunks": [{"id","text"}], "voice": "<id|default>", "style": "tu_nhien", "outDir": "<abs path>" }`.
- `voice: "default"` → dùng preset đầu tiên từ `list_preset_voices()`; ghi voice id thực vào manifest.
- Infer từng chunk → `<outDir>/<id>.wav`; xuất `<outDir>/manifest.json` (voice id, style, elapsed giây/chunk, sample rate).
- Verify: `uv run python scripts/lucida_generate.py --input <fixture>` với 2 câu ngắn tạo đủ wav + manifest.

### 1b. Spike chunk strategy (quyết định open question #2)

- Chạy adapter 2 chế độ trên cùng 4–6 câu: (A) cả đoạn 1 chunk, (B) mỗi câu 1 chunk rồi concat (ffmpeg concat + 250ms silence giữa câu).
- Đo: elapsed, ngắt nghỉ tự nhiên (nghe/waveform), độ dài chênh lệch.
- Ghi kết quả + quyết định vào `docs/spike-vieneu-chunking.md` (ngắn, 1 trang). Mặc định chọn (B) per-sentence nếu chất lượng ngắt nghỉ chấp nhận được — an toàn hơn cho script dài trên CPU và cho phép regenerate từng câu.

### 1c. `scripts/voice-generate.mjs` + npm script `voice:generate`

```text
npm run voice:generate -- --script input/scripts/<slug>/approved-script.json [--run-id <id>] [--voice <id>] 
```

- Đọc approved-script → build job.json theo chunk strategy đã chốt → spawn `uv run --directory <abs VieNeu-TTS> python scripts/lucida_generate.py ...`.
- Concat (nếu per-sentence) → normalize ffmpeg: `loudnorm=I=-14:TP=-1`, `-ar 48000 -ac 1`, WAV PCM → `public/runs/<run-id>/audio/voice.wav`.
- Probe ffprobe → `public/runs/<run-id>/audio/voice-track.json`: `{ provider:"vieneu", voice, style, durationMs, sampleRate:48000, channels:1, checksum:"sha256:...", scriptId, scriptRevision, scriptChecksum, chunkStrategy, generatedAt }`.
- Config mặc định tại `pipeline/config/voice-config.json` (`voice`, `style`, `chunkStrategy`, `gapMs`).
- Preflight: ffmpeg/ffprobe/uv có trên PATH, script status = approved; fail sớm với message rõ.
- Verify: chạy với fixture script ngắn (tạo `pipeline/fixtures/audio/approved-script.fixture.json` 3 câu) → ffprobe xác nhận 48kHz mono; voice-track.json đủ trường.

## Phase 2 — `voice:align` → TimedScript (FR3)

### 2a. `scripts/voice-align.mjs` + npm script `voice:align`

```text
npm run voice:align -- --run-id <id> --script input/scripts/<slug>/approved-script.json
```

- Chạy WhisperX qua venv có sẵn: `.venv-whisperx/Scripts/python.exe -m whisperx <voice.wav> --language vi --model small --device cpu --compute_type int8 --output_format json --output_dir public/runs/<run-id>/audio/whisperx/` (không phụ thuộc whisperx trên PATH — khác run-whisperx.ps1).
- Reconcile với ApprovedScript (script = text truth):
  - normalize 2 phía (lowercase, bỏ dấu câu) rồi align tuần tự word-level (greedy/DTW đơn giản);
  - word khớp → lấy `startMs/endMs` từ WhisperX; word không có timestamp → `timing: null` (tường minh, KHÔNG nội suy);
  - tỷ lệ mismatch > 15% → exit code ≠ 0 kèm report (không ghi timed-script).
- Phrase grouping theo caption policy: ≤12 từ/phrase, ngắt tại dấu câu hoặc pause ≥ 300ms, không vượt ranh giới câu.
- Output `public/runs/<run-id>/audio/timed-script.json`:

```json
{
  "schemaVersion": "1.0",
  "scriptId": "...", "scriptRevision": 1, "scriptChecksum": "sha256:...",
  "voiceChecksum": "sha256:...", "durationMs": 0,
  "sentences": [{ "sentenceId": "sent-001", "segmentId": "seg-001", "startMs": 0, "endMs": 0 }],
  "phrases": [{ "phraseId": "ph-001", "sentenceId": "sent-001", "text": "...", "startMs": 0, "endMs": 0,
                 "words": [{ "text": "...", "startMs": 0, "endMs": 0 }] }],
  "pauses": [{ "afterSentenceId": "sent-001", "durationMs": 0 }],
  "alignment": { "matchedWordRatio": 0.98, "missingTimestamps": 0 }
}
```

- Verify: chạy trên voice.wav của fixture Phase 1 → mọi sentence có range; matchedWordRatio ≥ 0.85; text trong phrases ghép lại đúng bằng script gốc (diff = 0, so trên bản chưa normalize).

## Phase 3 — Audio trong Remotion + duration từ voice (FR4)

- Mở rộng type props (`src/data.ts` / nơi khai báo `MyCompositionProps`): thêm optional `audio?: { src: string; durationMs: number; checksum: string }` và optional `timedCaptions?: <đường dẫn hoặc inline TimedScript phrases>` — chọn cách inline data vào props khi build `src/data.ts` để render deterministic, không fetch runtime.
- `src/Root.tsx` `calculateMetadata`: nếu `audio` có → `durationInFrames = Math.ceil(durationMs/1000 * fps)`; không có → giữ tính tổng scene như cũ.
- `src/Composition.tsx`: nếu `audio` có → render `<Audio src={staticFile(audio.src)} />` (import từ `remotion`) ở layer global, trước các scene. `audio.src` là đường dẫn tương đối trong `public/`.
- Scene timeline: khi có audio, tổng scene duration được scale/pad để phủ đúng voice duration (MVP: scene cuối kéo dài tới hết audio; cảnh báo nếu chênh > 1s).
- Verify: build `src/data.ts` từ video-map fixture + audio fixture → `npx remotion render` → ffprobe mp4 output: có audio stream `aac`, duration = voice duration ±1 frame.

## Phase 4 — Caption word-sync (FR5)

- `SubtitleBar` (`src/templateRegistry.tsx:742`): thêm nhánh mới — khi scene có `timedPhrases` (lọc từ `timedCaptions` theo range của scene):
  - caption page = phrase; hiển thị trong `[startMs, endMs)` của phrase (đổi ms→frame theo fps);
  - active word: word có `startMs ≤ t < endMs` → scale 1.04 + màu active (giữ token màu hiện có của SubtitleBar);
  - word `timing: null` → không highlight (giữ style thường), không đoán;
  - max 2 lines (đã đảm bảo bởi grouping ≤12 từ — giữ nguyên cách wrap hiện tại).
- Không có `timedPhrases` → giữ nguyên logic chia đều cũ (không đổi hành vi flow legacy).
- Verify: render still tại 3 timestamp đã biết trước từ timed-script fixture → đúng phrase hiển thị + đúng word highlight; chạy `npm run lint`.

## Phase 5 — Preflight, report, apply timing vào video-map (FR6, FR7, FR8)

- `scripts/apply-timed-durations.mjs` + npm `map:apply-timing`: đọc video-map + timed-script → gán mỗi scene `startMs/endMs` từ range các `segmentId` tương ứng (video-map scene cần trường `segmentIds: []` — thêm vào schema `schemas/video-map.schema.json`, optional) → ghi video-map mới + báo scene nào không map được.
- Preflight trong `scripts/render-run.mjs` (và `validate:videomap` nếu hợp): khi props có `audio` → check file tồn tại, checksum khớp voice-track.json, `timedCaptions.voiceChecksum` khớp — sai bất kỳ → fail trước render.
- `render-report.json` thêm: `voiceChecksum`, `voiceDurationMs`, `audioStream: true/false` (ffprobe output), `captionDriftMs` (max |phrase.startMs − frame hiển thị thực tế quy đổi| — tính tĩnh từ dữ liệu, ngưỡng cảnh báo 80ms).
- Verify: chạy preflight với checksum cố tình sai → fail đúng chỗ; render fixture đầy đủ → report đủ trường.

## Phase 6 — E2E + DoD

- Chạy chuỗi đầy đủ trên fixture: `voice:generate` → `voice:align` → `map:apply-timing` → build data → render.
- Check toàn bộ DoD trong RD mục 5 (6 điểm). Ghi kết quả vào `docs/BD-audio-pipeline.md` mục Kết quả (Codex append).
- Regression: `npm run preflight` + render 1 video-map cũ KHÔNG audio → vẫn pass như trước.

## Files được phép sửa/tạo

```text
tạo:  scripts/voice-generate.mjs, scripts/voice-align.mjs, scripts/apply-timed-durations.mjs
      pipeline/config/voice-config.json, pipeline/fixtures/audio/*
      docs/spike-vieneu-chunking.md
      ../VieNeu-TTS/scripts/lucida_generate.py
sửa:  package.json (scripts), src/Root.tsx, src/Composition.tsx, src/data.ts (types),
      src/templateRegistry.tsx (chỉ SubtitleBar + chỗ truyền props),
      schemas/video-map.schema.json, scripts/render-run.mjs
CẤM:  design/**, docs/market-research/**, các adapter scene khác trong templateRegistry,
      mọi file trong ../VieNeu-TTS ngoài scripts/lucida_generate.py
```

## Kết quả build (Codex append sau mỗi phase)

- Phase 1 (2026-07-14): tạo VieNeu adapter, `voice:generate`, voice config và approved-script fixture. PASS: `node --check scripts/voice-generate.mjs`; `uv run --directory VieNeu-TTS python -m py_compile scripts/lucida_generate.py`; `npm run lint`. Không chạy TTS inference/spike.
- Phase 2 (2026-07-14): tạo `voice:align`, reconcile/grouping exports, WhisperX mock và unit test không chạy model. PASS: `node --check` cho hai script; `node scripts/test-voice-align.mjs`. `npm run lint` không hoàn tất trong giới hạn 60 giây nên đã dừng an toàn, không ghi nhận lỗi lint.
- Phase 3–4 (2026-07-14): tích hợp audio-driven duration/playback, kéo dài scene cuối khi cần, và caption word-sync inline theo millisecond với fallback legacy; thêm timed-caption fixture 3 câu. PASS: `npm run lint` (eslint + tsc). `npx remotion compositions` không chạy được trong sandbox do esbuild bị chặn tạo subprocess (`spawn EPERM`); không render video thật.
- Phase 5–6 prep (2026-07-14): thêm mapper timing theo `segmentIds`, schema audio/brand/timing, render audio preflight + report, và checker artifact E2E theo run; thêm fixture map/timed-script 2 scene. PASS: `node --check` cho `apply-timed-durations.mjs`, `test-audio-e2e.mjs`, `render-run.mjs`; `npm run lint`; `npm run validate:videomap`; fixture apply-timing cho kết quả 4.5s (scene 2.0s + 2.5s). Không chạy TTS, WhisperX hoặc Remotion render thật.
- **Phase 6 E2E thật (Claude verify, 2026-07-14): PASS toàn bộ DoD.** Chuỗi fixture 3 câu: `voice:generate` (VieNeu, giọng "Minh Đức", per-sentence) → `voice:align` → `map:apply-timing` → render props → `npm run render` → mp4 h264 + **AAC audio stream**, duration 6.955s khớp voice 6.9s, captionDriftMs 13.33 (<80), `test:audio-e2e` 10/10 PASS, negative preflight (checksum sai) fail đúng chỗ, frame check: caption 2 dòng + active word highlight vàng đúng thời điểm. Các fix trong quá trình verify:
  1. `voice-align.mjs`: thêm `PYTHONIOENCODING=utf-8` khi spawn (UnicodeEncodeError cp1252 với tiếng Việt).
  2. **Chuyển WhisperX → faster-whisper** (`scripts/fw-transcribe.py`): whisperx VAD/align trong `.venv-whisperx` load model lỗi ("UNEXPECTED weights") sinh timestamps rác cố định (bằng chứng: audio kéo dài 2×/3× vẫn ra timestamps y hệt). faster-whisper word timestamps cho kết quả chuẩn (matched ratio 0.95).
  3. `voice-align.mjs` line 82: đảo `{...word, ...sentence}` → `{...sentence, ...word}` (sentence.text đè word.text làm caption render nguyên câu lặp lại).
  4. `remotion.config.ts`: `Config.setConcurrency(1)` — Chrome hết RAM trên Surface Laptop 2 với concurrency mặc định.
  5. Fixture video-map: scene-002 ôm thêm `seg-003` để phủ kín timeline (hở >1s làm test fail).
