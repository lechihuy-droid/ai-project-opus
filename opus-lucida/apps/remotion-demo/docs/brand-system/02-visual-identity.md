# 02. Visual Identity

## Visual concept

**Editorial intelligence illuminated by a signal beam.**

Lucida phải trông premium, rõ ràng và hiện đại; không giống dashboard SaaS thông thường và không giống video crypto/cyberpunk quá ồn.

## Signature motif: Lucida Beam

Một dải sáng hẹp hoặc đường quét dùng để:

- reveal con số hoặc keyword quan trọng;
- nối các node trong diagram;
- chuyển từ claim sang evidence;
- tạo transition giữa các section.

Beam là motif nhận diện, không phải hiệu ứng xuất hiện liên tục. Mỗi video dùng tối đa 3–4 lần tại các điểm có ý nghĩa.

## Palette

### Core

- `obsidian`: `#0B0D12` — background chính.
- `graphite`: `#171B24` — card, layer và panel.
- `ivory`: `#F2F0EA` — text chính, tránh trắng tuyệt đối.
- `mist`: `#9CA5B5` — text phụ.
- `signal-cyan`: `#73E3F3` — insight, active word, flow và data highlight.

### Semantic accents

- `warning-amber`: `#F0B45D` — cảnh báo, uncertainty, risk.
- `evidence-green`: `#82D6A3` — verified source hoặc confirmed outcome.
- `critical-red`: `#FF6B6B` — chỉ dùng cho risk nghiêm trọng, tối đa 5% frame.

### Ratio

```text
80% dark neutral
15% ivory / mist typography
5% accent
```

Không đổi palette theo từng style RAG. Style variant chỉ được điều chỉnh texture, depth và tỷ lệ accent.

## Typography

- Vietnamese/Latin: `Manrope`.
- Japanese: `Noto Sans JP`.
- Numbers and metrics: Manrope ExtraBold hoặc font mono đã được approved trong implementation.

### Hierarchy for 1080 × 1920

- Hook: 92–118 px, 2–4 dòng ngắn.
- Hero metric: 144–220 px.
- Section title: 62–78 px.
- Body: 42–54 px.
- Subtitle: 48–58 px.
- Source label: 24–30 px.

## Layout

- Safe margin ngang: 80 px.
- Safe margin trên: 150 px.
- Safe margin dưới: 250 px để tránh UI TikTok/Reels.
- Một frame chỉ có một dominant idea.
- Tối đa 7 visual objects; ưu tiên 3–5.
- Không để subtitle che hero metric hoặc diagram label.

## Component language

- Card: bán kính 22–28 px, border mảnh, depth nhẹ.
- Node: rounded rectangle hoặc pill; không dùng quá nhiều shape khác nhau.
- Connector: line mảnh với Lucida Beam chạy theo hướng logic.
- Evidence badge: source type + confidence, nhỏ và rõ.
- Metric block: con số lớn + một câu diễn giải, không biến thành infographic dày đặc.

## Logo and wordmark

Recommended mark: chữ `LUCIDA` kết hợp một aperture hoặc beam dọc tối giản.

### Placement

- Không bắt buộc intro logo dài.
- Series label nhỏ ở góc trên trong 1–2 giây đầu.
- Wordmark xuất hiện nhẹ ở end card hoặc watermark nhỏ.
- Không dùng full-screen logo animation quá 0,6 giây.

## Prohibited visual patterns

- Neon rainbow và gradient nhiều màu.
- Glassmorphism phủ toàn bộ video.
- Particle background liên tục.
- Icon ngẫu nhiên từ nhiều bộ khác nhau.
- Progress bar dưới đáy.
- Mỗi câu narration đổi layout hoàn toàn.
- Text wall hoặc screenshot không crop/focus.
