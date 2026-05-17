# Audio Generation SOP
**Status:** Active v1  
**Date:** 2026-05-14  
**Scope:** Script audio adapter → bilingual TTS → optional RVC → Assembly cho một topic lesson  
**Phase:** 4 — Production Lane  
**Step:** 4.5 Video Build / Publish (audio sub-step)  
**Ref:** `35-automation-gated-execution-flow.md` · `36-automation-flow-matrix.md` · `37-automation-execution-contract.md`

---

## 0. Lane Contract

```text
Lane:         Production — Audio Generation
Step IDs:     4.5 (audio sub-steps: audio adapter → VI/JP TTS → RVC → Assembly)
Mode:         MANUAL_ESCALATION (requires human to trigger + review)
Runner pack:  34-runner-production.md

Upstream gate (must pass before running):
  Gate J — Production Readiness
  Cleared by: MAIN_AGENT
  File: 35-automation-gated-execution-flow.md §10 Step 4.4

Inputs:
  - production/00-active/<topic>/02-script.md         ← content-locked
  - production/00-active/<topic>/wake-cluster-deck.html
  - production/00-active/<topic>/08-production-frame-map.md
  - .env (GRADIO_API_URL, RVC params)

Writes:
  - production/00-active/<topic>/audio/02-script.vieneu-tts.md
  - production/00-active/<topic>/audio/slide-*.mp3
  - production/00-active/<topic>/audio-rvc/rvc-slide-*.wav  (if RVC active)
  - production/00-active/<topic>/video/raw-<topic>.mp4

Downstream:
  Step 5.1 Post-Video Decision Log
  Runner pack: 34-runner-production.md

Status update target:
  production/00-active/<topic>/07-automation-status.md

Success means:
  - video renders without error
  - audio pacing passes human review
  - VI/JP code-switching sounds natural

If revise:
  - rerun tts_agent only: --skip-rvc flag
  - rerun rvc only: --skip-screenshot --skip-tts flags
  - rerun assembly only: call assembly_agent directly

If block:
  - script content broken → return to Gate G (Slide/Script Sync QA)
  - runtime deck or timing map missing -> return to Step 4.0 HTML runtime build
```

---

## 1. Tech Stack

| Stage | Tool | Voice | Note |
|---|---|---|---|
| Script audio adapter | `automation/audio/generate_vieneu_from_script.py` + bilingual segmenter | — | creates lane-safe TTS text; never converts long JP sentences to VI phonetics |
| VI narration | VieNeu-TTS | selected VI reference voice | reads Vietnamese narration and short grammar labels adapted to learner-safe phonetics |
| JP sentence | Voicevox localhost:50021 | selected JP speaker | reads long Japanese examples in Japanese |
| Short grammar label in VI narration | terms-only pronunciation profile | VieNeu | e.g. `わけ` -> `quà kê`; protected from replacing inside full JP sentences |
| RVC conversion | gradio_client → Colab T4 | cloned voice | f0_up_key=0 bắt buộc |
| Assembly | ffmpeg / screenrecord_slides.py | — | HTML screen recording + RVC WAV (active path); PNG+WAV legacy fallback |

Config files: `automation/audio/generate_vieneu_from_script.py`, bilingual TTS dispatcher, and `automation/video/tts_agent.py` legacy path  
Credentials: `.env` ở root project

---

## 2. Prerequisite

**Gate phải pass trước khi chạy:**

| Gate | File | Owner |
|---|---|---|
| Gate G — Slide/Script Sync QA | `35` Step 2.8 | MAIN_AGENT |
| Gate J — Production Readiness | `35` Step 4.4 | MAIN_AGENT |
| Step 4.0 — Slide Build done | `34` §5, `35` Step 4.0 | AUTO_RUN |

**Checklist kỹ thuật:**

- [ ] `audio-rvc/rvc-slide-01.wav` ... `rvc-slide-17.wav` — đủ 17 files (active path)
- [ ] `wake-cluster-deck.html` load được, không lỗi console
- [ ] `video/slide-durations.json` đã generate từ WAV durations
- [ ] [Legacy fallback only] `frames/slide-NN*.png` — nếu HTML recording bị blocked. `assembly_agent.py` aligns frames to audio by numeric `slide-NN` prefix, so `slide-01-wake-01.png` is valid.
- [ ] Voicevox app đang chạy tại `http://localhost:50021`
- [ ] Colab notebook `automation/colabs/rvc_server.ipynb` đang chạy (nếu dùng RVC)
- [ ] `GRADIO_API_URL` đã set trong `.env` (để trống = skip RVC tự động)

---

## 3. Chạy từng bước

### Bước 1 — Audio adapter + bilingual TTS

**Contract bắt buộc:**

```text
02-script.md
-> audio script adapter
-> segment by voice lane:
   voice_vi = Vietnamese narration + short grammar labels
   voice_ja = long Japanese examples
-> VieNeu reads voice_vi
-> VOICEVOX JP reads voice_ja
-> concat per slide
-> audio/slide-NN.wav or audio/slide-NN.mp3
```

Rules:

- `voice_vi` may use `wake_vi` / `wake_vi_terms` to adapt short grammar labels such as `わけ` -> `quà kê`.
- `voice_ja` must keep long Japanese sentences unchanged and send them to VOICEVOX.
- Do not use full-sentence Vietnamese phonetic conversion for production audio.
- `wake_vi_all` is legacy/debug only; using it for final audio is a blocking error.
- If a line becomes mixed Japanese + Vietnamese phonetics, stop and fix segmentation before generating final audio.

Generate the lane-safe VieNeu script for review:

```powershell
cd "C:\Users\HUY\AI\OPUS ANIMUS\opus-lucida"

& "C:\Users\HUY\AI\VieNeu-TTS\.venv\Scripts\python.exe" automation/audio/generate_vieneu_from_script.py `
  --script production/00-active/wake-cluster/02-script.md `
  --out-dir D:\lucida-output\wake-cluster-vieneu-audio `
  --pronunciation-profile wake_vi `
  --write-tts-script production/00-active/wake-cluster/audio/02-script.vieneu-tts.md
```

Legacy command, only if the old edge-tts path is intentionally used:

```powershell
cd "C:\Users\HUY\AI\OPUS ANIMUS\opus-lucida"

python automation/video/tts_agent.py `
  production/00-active/wake-cluster/02-script.md `
  production/00-active/wake-cluster/audio `
  --slides 1-10
```

Output: `production/00-active/wake-cluster/audio/slide-01.mp3` ... `slide-10.mp3`

Log bình thường:
```
[VI] 'Hôm nay mình sẽ gỡ cả nhóm quà kê...'
[JP-sent] '行きたくないわけではありません。'   <- VOICEVOX
[VI] 'quà kê đê qua nai = không phải là...'
```

---

### Bước 2 — RVC voice conversion (nếu có model)

**Điều kiện bỏ qua:** để trống `GRADIO_API_URL` trong `.env` → pipeline tự skip.

```powershell
python automation/video/rvc_agent.py `
  production/00-active/wake-cluster/audio `
  production/00-active/wake-cluster/audio-rvc
```

Output: `audio-rvc/rvc-slide-01.wav` ... `rvc-slide-10.wav`

**Setup Colab (một lần):**
1. Upload `automation/colabs/rvc_server.ipynb` lên Colab
2. Runtime → T4 GPU
3. Chạy Cell 1 (install ~3 phút)
4. Chạy Cell 2 → upload `.pth` + `.index`
5. Chạy Cell 3 → copy URL `https://xxxx.gradio.live`
6. Paste vào `.env`: `GRADIO_API_URL=https://xxxx.gradio.live`

**Params quan trọng:**
```
f0_up_key  = 0      ← KHÔNG đổi, giữ JP pitch accent
f0_method  = rmvpe  ← tốt nhất cho speech
index_rate = 0.75   ← tune trong .env: RVC_INDEX_RATE
protect    = 0.33   ← tune trong .env: RVC_PROTECT
```

---

### Bước 3 — Assembly (HTML recording + audio → MP4)

**Active path — HTML screen recording:**

```powershell
# Bước 3a: tính slide duration từ WAV
python automation/video/compute_durations.py `
  production/00-active/wake-cluster/audio-rvc `
  --out production/00-active/wake-cluster/video/slide-durations.json

# Bước 3b: record HTML deck
python automation/video/screenrecord_slides.py `
  production/00-active/wake-cluster/wake-cluster-deck.html `
  production/00-active/wake-cluster/video/slide-durations.json `
  production/00-active/wake-cluster/video/html-record-wake-cluster.mp4

# Bước 3c: merge audio
python automation/video/merge_audio.py `
  production/00-active/wake-cluster/video/html-record-wake-cluster.mp4 `
  production/00-active/wake-cluster/audio-rvc `
  production/00-active/wake-cluster/video/raw-wake-cluster.mp4
```

Chi tiết: `automation/workflows/39-html-video-generation-sop.md`

**Legacy fallback — PNG assembly (nếu HTML recording bị blocked):**

```powershell
python automation/video/assembly_agent.py `
  production/00-active/wake-cluster/frames `
  production/00-active/wake-cluster/audio-rvc `
  production/00-active/wake-cluster/video/raw-wake-cluster.mp4
```

---

## 4. Chạy full pipeline (1 lệnh)

```powershell
cd "C:\Users\HUY\AI\OPUS ANIMUS\opus-lucida"

# Full pipeline (TTS + RVC nếu có URL + Assembly):
python automation/video/pipeline.py wake-cluster --skip-screenshot

# Skip RVC (test nhanh, dùng raw TTS audio):
python automation/video/pipeline.py wake-cluster --skip-screenshot --skip-rvc

# Reuse audio đã gen, chỉ chạy lại RVC + Assembly:
python automation/video/pipeline.py wake-cluster --skip-screenshot --skip-tts
```

---

## 5. Folder structure sau khi chạy xong

```
production/00-active/wake-cluster/
  wake-cluster-deck.html             <- locked HTML runtime
  08-production-frame-map.md         <- scene/state timing map
  frames/                            <- legacy support export only
    slide-01.png ... slide-10.png
  audio/
    slide-01.mp3 ... slide-10.mp3   ← TTS output
  audio-rvc/
    rvc-slide-01.wav ... rvc-slide-10.wav  ← RVC output (nếu có)
  video/
    raw-wake-cluster.mp4             ← assembly output
```

---

## 6. Tune audio quality

### Thay đổi voice / speed

Sửa đầu file `automation/video/tts_agent.py`:

```python
VI_VOICE         = "vi-VN-HoaiMyNeural"
VI_RATE          = "+20%"        # tốc độ VI: -10% đến +30%
VOICEVOX_SPEAKER = 16            # 九州そら Normal
BREATH_MS        = 420           # pause VI↔JP (ms)
```

### Voicevox speaker IDs thông dụng

| Tên | ID | Style |
|---|---|---|
| 九州そら | 16 | Normal ← đang dùng |
| 九州そら | 15 | あまあま |
| 四国めたん | 2 | Normal |
| ずんだもん | 3 | Normal |

Xem đầy đủ: `strategy/standards/02-japanese-reading-rules.md`

### Pause timing

Script writers dùng named markers (xem `02-script.md` §TTS marker convention).  
`tts_agent.py` map các marker này thành ms silence:

| Script marker | ms | Dùng khi |
|---|---|---|
| `[TTS_PAUSE_SHORT]` | 300ms | ngắt nhịp rất ngắn giữa câu |
| `[TTS_PAUSE_MED]` | 600ms | ngắt nhịp vừa để người học theo kịp |
| `[TTS_PAUSE_LONG]` | 1200ms | trước/sau diagnostic hoặc reveal đáp án |
| `[TTS_REVEAL]` | 800ms | ngay trước payoff / kết luận |
| `[PAUSE Xs]` | X × 1000ms | explicit pause theo giây trong script |
| *(auto)* VI↔JP | 420ms | `BREATH_MS` — tự inject, không cần viết vào script |
| *(auto)* `\n\n` | 280ms | `PARA_PAUSE` — tự inject giữa các đoạn |

**Rule cho subagent viết script:**
- Dùng `[TTS_PAUSE_SHORT/MED/LONG]` và `[TTS_REVEAL]` cho pacing intent
- Dùng `[PAUSE Xs]` khi cần độ dài tuyệt đối (quiz, diagnostic wait)
- Không cần viết pause ở VI↔JP transition — pipeline tự xử lý

**Tune config** (sửa đầu `tts_agent.py`):

```python
BREATH_MS  = 420   # auto VI↔JP — tăng nếu transition còn bị cắt
PARA_PAUSE = 280   # auto \n\n — tăng nếu đoạn dài nghe dồn
```

Để đổi mapping SHORT/MED/LONG, sửa `_NAMED_PAUSE_MS` trong `parse_script.py`.

---

## 7. Troubleshooting

| Lỗi | Fix |
|---|---|
| `No module named 'edge_tts'` | `pip install -r requirements.txt` |
| Voicevox timeout | Mở Voicevox app, đợi load xong |
| `GRADIO_API_URL not set` | Bình thường — pipeline skip RVC, dùng raw TTS |
| Colab session hết | Chạy lại Cell 3, copy URL mới vào `.env` |
| `No slide-*.png found` | Only relevant for the legacy screenshot support path; for active flow, validate the HTML runtime and timing map first |
| `Audio missing for slide-01-*` | Check audio folder has `slide-01.mp3`, `slide-01.wav`, or `rvc-slide-01.wav`; assembly aligns by numeric prefix |
| JP text đọc sai | Xem `strategy/standards/02-japanese-reading-rules.md` |
