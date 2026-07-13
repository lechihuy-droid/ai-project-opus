# Spike — VieNeu chunk strategy (BD-audio-pipeline Phase 1b)

- **Date:** 2026-07-14
- **Câu hỏi:** infer cả đoạn một lần (`single`) hay từng câu rồi ghép (`per-sentence`)?
- **Setup:** fixture 3 câu / 21 từ tiếng Việt (`pipeline/fixtures/audio/approved-script.fixture.json`), VieNeu v3 Turbo CPU INT8, voice preset `Minh Đức`, style `tu_nhien`, gap 250ms, chuẩn hoá 48kHz mono -14 LUFS.

## Kết quả đo

| | per-sentence (run `phase1-verify`) | single (run `spike-single`) |
|---|---|---|
| Duration | 6.90s | 6.96s |
| Wall time (gồm model load) | ~64s | ~63s |
| Silence ≥0.25s (silencedetect -35dB) | 2 pause, đúng tại 2 ranh giới câu (0.49s / 0.53s) | 3 pause: 0.37s **giữa câu đầu** (spurious), 0.43s / 0.54s tại ranh giới câu |

## Quyết định: `per-sentence` (default trong `pipeline/config/voice-config.json`)

Lý do:

1. Pause sạch — chỉ nằm ở ranh giới câu, kiểm soát được bằng `gapMs`; single-chunk xuất hiện pause lạ giữa câu.
2. Regenerate được từng câu khi sửa script (per-sentence cache) — quan trọng với CPU chậm khi script dài.
3. An toàn hơn với script dài: tránh giới hạn/độ trôi chất lượng của inference một đoạn văn lớn.
4. Tốc độ tương đương (chênh không đáng kể; model load chiếm phần lớn wall time).

## Số liệu phụ

- Tốc độ đọc VieNeu đo được: ~3.0 từ/giây (tính cả pause), ~3.6 từ/giây speech thuần — đã cập nhật guideline ước lượng duration trong `topic-script-writer/references/topic-selection-rules.md`.
- ⚠️ Chất lượng ngắt nghỉ mới đánh giá bằng silencedetect/waveform — **user cần nghe tai** `public/runs/phase1-verify/audio/voice.wav` để xác nhận + chốt voice preset (hiện default = preset đầu tiên "Minh Đức").
