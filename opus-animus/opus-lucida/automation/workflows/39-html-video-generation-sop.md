# HTML Video Generation SOP
**Status:** Active v1
**Date:** 2026-05-06
**Scope:** HTML runtime → screen recording → audio merge → raw-<topic>.mp4
**Phase:** 4 — Production Lane
**Step:** 4.6 HTML Video Render (replaces screenshot-frame assembly)
**Ref:** `34-runner-production.md` · `35-automation-gated-execution-flow.md` · `38-audio-generation-sop.md` · `15-html-video-upgrade-plan.md`

---

## 0. Lane Contract

```text
Lane:         Production — HTML Video Render
Step ID:      4.6
Mode:         MANUAL_ESCALATION
Runner pack:  34-runner-production.md §9

Upstream gate (must pass before running):
  Gate J — Production Readiness
  RVC audio complete — rvc-slide-*.wav in audio-rvc/
  HTML runtime deck verified — wake-cluster-deck.html stable

Inputs:
  - production/00-active/<topic>/wake-cluster-deck.html
  - production/00-active/<topic>/audio-rvc/rvc-slide-*.wav
  - production/00-active/<topic>/08-production-frame-map.md

Writes:
  - production/00-active/<topic>/video/slide-durations.json
  - production/00-active/<topic>/video/html-record-<topic>.mp4  (silent)
  - production/00-active/<topic>/video/raw-<topic>.mp4          (final)

Status update target:
  production/00-active/<topic>/07-automation-status.md
```

---

## 1. Concept

Thay vì loop PNG tĩnh, pipeline mới record trực tiếp HTML runtime đang chạy:

```text
HTML deck (tự động chuyển slide theo timing từ WAV duration)
→ Playwright record_video
→ html-record-<topic>.mp4  (silent, giữ nguyên animation/transition)
→ ffmpeg merge với concatenated RVC WAV
→ raw-<topic>.mp4
```

**Lý do đổi:**
- Giữ animation, transition, reveal states của HTML deck
- Timing chính xác — slide advance theo actual audio duration
- Không cần export PNG từng frame

---

## 2. Prerequisite

| Gate | Artifact | Status cần |
|---|---|---|
| Gate J | Production Readiness | PASS |
| RVC audio | `audio-rvc/rvc-slide-*.wav` | tất cả files có mặt |
| HTML deck | `wake-cluster-deck.html` | mở được, không lỗi console |
| Frame map | `08-production-frame-map.md` | current |

Checklist kỹ thuật:

```text
[ ] rvc-slide-01.wav ... rvc-slide-17.wav đủ số
[ ] wake-cluster-deck.html load được trong browser
[ ] playwright install chromium đã chạy
[ ] ffmpeg available (imageio_ffmpeg hoặc system)
```

---

## 3. Timing Model

Mỗi slide HTML advance sau đúng duration của RVC WAV tương ứng.

```python
import wave, contextlib

def wav_duration(path) -> float:
    with contextlib.closing(wave.open(str(path), 'r')) as f:
        return f.getnframes() / f.getframerate()
```

HTML nhận timing qua JS injection trước khi record:

```javascript
window.__SLIDE_DURATIONS__ = [101.2, 47.4, 103.1, ...];
// deck-stage auto-advance dùng array này thay vì click thủ công
```

**Rule:** Timing phải derive từ actual WAV duration, không hardcode.

---

## 4. Bước thực thi

### Bước 1 — Tính slide duration

```powershell
python automation/video/compute_durations.py `
  production/00-active/wake-cluster/audio-rvc `
  --out production/00-active/wake-cluster/video/slide-durations.json
```

Output: `slide-durations.json`

```json
[
  {"slide": "01", "file": "rvc-slide-01.wav", "duration_s": 101.2},
  {"slide": "02", "file": "rvc-slide-02.wav", "duration_s": 47.4},
  ...
]
```

---

### Bước 2 — Record HTML với Playwright

```powershell
python automation/video/screenrecord_slides.py `
  production/00-active/wake-cluster/wake-cluster-deck.html `
  production/00-active/wake-cluster/video/slide-durations.json `
  production/00-active/wake-cluster/video/html-record-wake-cluster.mp4
```

Cơ chế:

```text
1. Playwright context với record_video_dir + 1920×1080
2. Load HTML deck, inject __SLIDE_DURATIONS__
3. Loop: goTo(i) → wait(duration_s × 1000ms) → goTo(i+1)
4. Sau slide cuối, đóng context → Playwright flush .webm
5. ffmpeg convert .webm → html-record-<topic>.mp4 (silent)
```

---

### Bước 3 — Merge audio vào video

```powershell
python automation/video/merge_audio.py `
  production/00-active/wake-cluster/video/html-record-wake-cluster.mp4 `
  production/00-active/wake-cluster/audio-rvc `
  production/00-active/wake-cluster/video/raw-wake-cluster.mp4
```

Cơ chế:

```text
1. Concatenate rvc-slide-01.wav ... rvc-slide-17.wav → temp_audio.wav
2. ffmpeg: replace audio track của html-record với temp_audio
3. Output: raw-wake-cluster.mp4
```

ffmpeg tương đương:

```bash
# concat audio
ffmpeg -f concat -safe 0 -i audio_list.txt -c copy temp_audio.wav

# merge
ffmpeg -y \
  -i html-record-wake-cluster.mp4 \
  -i temp_audio.wav \
  -c:v copy -c:a aac -b:a 192k \
  -map 0:v:0 -map 1:a:0 \
  -shortest \
  raw-wake-cluster.mp4
```

---

### Bước 4 — Human review

```text
[ ] Video không bị giật / drop frames giữa slide transitions
[ ] Audio sync khớp visual — lệch không quá 0.5s
[ ] Mỗi slide visible đủ thời gian trước khi chuyển
[ ] Reveal states hiển thị đúng thứ tự
[ ] Slide 17 (CTA) đọc xong trước khi video kết thúc
```

---

## 5. Pipeline command (sau khi scripts được build)

```powershell
# Full HTML record path:
python automation/video/pipeline.py wake-cluster --skip-screenshot --skip-tts --html-record

# Rerun record + merge only (reuse existing WAV):
python automation/video/pipeline.py wake-cluster --skip-screenshot --skip-tts --html-record --skip-rvc
```

---

## 6. Folder structure

```text
production/00-active/wake-cluster/
  video/
    slide-durations.json           ← timing per slide (từ WAV)
    html-record-wake-cluster.mp4   ← silent HTML recording
    raw-wake-cluster.mp4           ← final: HTML video + RVC audio
  audio-rvc/
    rvc-slide-01.wav ... rvc-slide-17.wav  ← PASS (17/17)
  frames/                          ← LEGACY SUPPORT ONLY
```

---

## 7. Scripts cần build

| Script | Role | Deps |
|---|---|---|
| `compute_durations.py` | WAV → slide-durations.json | wave (stdlib) |
| `screenrecord_slides.py` | Playwright record HTML deck | playwright, imageio_ffmpeg |
| `merge_audio.py` | Concat WAV + merge vào video | imageio_ffmpeg |

**Build priority:** `compute_durations.py` → `screenrecord_slides.py` → `merge_audio.py`

Các scripts này chưa tồn tại — cần build trước khi chạy pipeline.

---

## 8. Fallback

Nếu HTML recording bị blocked:

```text
assembly_agent.py (PNG path):
  frames/slide-NN*.png + audio-rvc/rvc-slide-NN.wav → raw-wake-cluster.mp4
  Numeric `slide-NN` prefix is the sync contract; descriptive suffixes are allowed.
```

Fallback không phải active production contract — chỉ dùng khi bị blocked.

---

## 9. Troubleshooting

| Lỗi | Fix |
|---|---|
| Playwright video blank | Set `record_video_dir` trước khi `goto()` |
| Audio lệch > 0.5s | Recheck WAV duration, đảm bảo không skip frames |
| `.webm` không convert | Check ffmpeg version, decode `libvpx` manually |
| HTML không auto-advance | Kiểm tra `__SLIDE_DURATIONS__` inject trước `goTo()` |
| Video kết thúc sớm | Đảm bảo context không close trước khi slide cuối xong |
