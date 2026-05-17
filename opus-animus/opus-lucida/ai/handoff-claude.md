# HANDOFF — opus-lucida (Claude)
**Updated:** 2026-05-14
**Owner:** Claude
**Active task:** TTS bilingual pipeline (VI + JA) cho audio lane của wake-cluster

## Đã làm trong session
- Cài đặt thành công **VieNeu-TTS** (Vietnamese TTS) tại `C:\Users\HUY\AI\VieNeu-TTS\`
  - Method: `uv sync` (CPU/Turbo mode, không group gpu)
  - Python 3.12.13, 87 packages
  - Model dùng: `pnnbao-ump/VieNeu-TTS-v2` (GGUF) + `neuphonic/distill-neucodec` codec
  - 7 preset voices: Binh, Tuyen, Vinh, Doan, Ly, Sơn, Ngoc
- Gen thử thành công 1 đoạn wake-up cluster bằng voice **Binh** (nam miền Bắc)
  - Output: `C:\Users\HUY\AI\VieNeu-TTS\outputs\wake_Binh.wav` (858KB, 24kHz mono)
  - Script: `C:\Users\HUY\AI\VieNeu-TTS\examples\wake_cluster.py`
- Đã research VoiceVox cho phần tiếng Nhật (chưa cài):
  - Repo: https://github.com/VOICEVOX/voicevox_engine (LGPL, free commercial)
  - API REST `localhost:50021` — `POST /audio_query` → `POST /synthesis`
  - Output 24kHz mono → **cùng sample rate với VieNeu, ghép trực tiếp không cần resample**
  - 3 cách cài: Docker / Windows installer / engine binary

## Exact next action
**Step 1 — Quyết định format input + cách cài VoiceVox** (RD-level decisions, chưa chốt):
1. Input format: explicit tags `<ja>/<vi>` vs auto-detect Unicode block vs JSON manifest
2. VoiceVox install: Docker vs native Windows installer vs engine binary only
3. Pause giữa segments: fixed 300ms vs configurable tag vs none
4. Scope: prototype 1-file vs CLI tool vs tích hợp vào Gradio web UI

**Step 2 — Sau khi chốt RD, build pipeline bilingual:**
```
script(JA+VI) → segmenter → dispatch(JA→VoiceVox / VI→VieNeu) → concat WAV → final.wav
```
Test case đầu tiên: 1 đoạn wake-cluster có chèn vài cụm tiếng Nhật (vd `あけだ`, `あけがない`) — ghép với phần dẫn tiếng Việt thành 1 audio liền.

## Files touched
- `C:\Users\HUY\AI\VieNeu-TTS\` (cài mới — ngoài repo opus-lucida)
- `C:\Users\HUY\AI\VieNeu-TTS\examples\wake_cluster.py` (script demo VI)
- `C:\Users\HUY\AI\VieNeu-TTS\outputs\wake_Binh.wav` (sample audio)

## Risks / cần kiểm tra
- VieNeu chạy CPU, gen 1 đoạn ~19s mất vài phút lần đầu (download model). Lần sau nhanh hơn.
- Console Windows phải set `PYTHONIOENCODING=utf-8` + `PYTHONUTF8=1` trước khi chạy, không là crash do cp1252 không in được Unicode VI/emoji.
- HuggingFace cache không dùng symlink trên Windows → tốn disk hơn (~vài GB cho cả 2 model).
- VoiceVox chưa cài → step tiếp cần Docker Desktop hoặc tải installer ~1GB.
- Chưa quyết model JA voice (VoiceVox có 30+ speakers × multiple styles).

## Validation commands
```powershell
# Verify VieNeu install
cd C:\Users\HUY\AI\VieNeu-TTS
$env:PYTHONIOENCODING="utf-8"; $env:PYTHONUTF8="1"
uv run python -u examples/wake_cluster.py
# Expect: outputs/wake_Binh.wav được tạo, ~850KB

# Launch web UI để A/B test voices
uv run vieneu-web
# → http://127.0.0.1:7860
```

## References
- VieNeu-TTS repo: https://github.com/pnnbao97/VieNeu-TTS
- VoiceVox engine: https://github.com/VOICEVOX/voicevox_engine
- VoiceVox Docker: `docker run -p 50021:50021 voicevox/voicevox_engine:cpu-latest`
