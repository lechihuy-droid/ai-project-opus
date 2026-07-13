# Supplementary Reference — `chanktb/any2video`

> Phạm vi áp dụng: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Ngày đánh giá: 2026-07-13
>
> Phân loại: **tham khảo phụ trợ — non-authoritative**
>
> Repository: https://github.com/chanktb/any2video
>
> Snapshot đã kiểm tra: nhánh `master`, gồm Remotion path B và commit sửa audio/BGM `5c572239c4f93f3e920c8835e50a0a61727cedb7`.

---

## 1. Vai trò trong research của Lucida

`any2video` được lưu làm implementation reference cho một coding-agent video pipeline có các bước:

```text
source extraction
→ narrative planning
→ script approval
→ TTS + duration measurement
→ visual composition
→ scene gate
→ render
→ FFmpeg compose
```

Repository này **không phải kiến trúc nền, dependency hoặc implementation target của Lucida**. Các architecture decision, schema và roadmap chính vẫn nằm trong:

- `ASSET_COMPONENT_RENDER_ARCHITECTURE_REVIEW.md`;
- `AUDIO_FIRST_VIDEO_PRODUCTION_FLOW.md`;
- các contract và source hiện có của `lucida-remotion-demo`.

---

## 2. Các ý tưởng đáng tham khảo

### 2.1 Deep source extraction

Đối với GitHub input, pipeline clone repository, đọc manifest, tree, entry point, core files và recent commits thay vì chỉ tóm tắt README. Đây là reference hữu ích cho bước tạo `SourcePack` và evidence-backed narrative.

### 2.2 TTS trước visual layout

Audio được sinh và đo trước khi chốt duration scene. Nguyên tắc này phù hợp với định hướng audio-first của Lucida, dù Lucida tiếp tục dùng canonical `VoiceTrack`, forced alignment và `TimedScript` làm contract chính thức.

### 2.3 Hybrid real footage

Repository dùng Playwright để quay repo scroll hoặc author profile, sau đó nhúng footage MP4 vào Remotion. Pattern này có thể tham khảo cho `FootageProvider` hoặc `CinematicAssetAdapter` của Lucida.

### 2.4 Visual quality gate

HTML render path có các kiểm tra thực dụng:

- safe-zone và viewport overflow;
- text overlap;
- line-height;
- Vietnamese stacked diacritics bị cắt;
- broken image và empty block;
- scene gần như trùng với scene trước.

Các rule này đáng tham khảo khi xây screenshot-based QA cho Remotion, nhưng không được coi là thay thế cho schema validation và render report của Lucida.

### 2.5 Skin dưới dạng token

Remotion path tách skin thành palette, font, shape language và karaoke variant thay vì coi skin là layout. Ý tưởng này phù hợp với việc tách `adapter`, `preset` và `template` trong Lucida.

---

## 3. Các phần không nên đưa vào kiến trúc chính

### 3.1 Per-video TSX generation

Mỗi video Remotion được coding agent viết thành một file TSX riêng và đăng ký thủ công trong `Root.tsx`. Cách này tạo output bespoke nhưng không phù hợp với mục tiêu deterministic, batchable và schema-driven của Lucida.

### 3.2 Asset contract chưa thống nhất

Audio, footage, brand image và user media nằm ở nhiều directory/path khác nhau; chưa có canonical `AssetManifest` chứa metadata, checksum, provenance, license, slot compatibility và scene binding.

### 3.3 Caption Remotion chưa đúng Lucida policy

Karaoke component hiện hiển thị toàn bộ words của một scene rồi đổi màu theo active word. Lucida yêu cầu:

```text
một phrase ngắn xuất hiện đầy đủ
→ từng từ jump/highlight theo timestamp
→ hết phrase mới thay phrase tiếp theo
```

Do đó chỉ tham khảo word-timing và style variant; không reuse caption component nguyên trạng.

### 3.4 Timing ước lượng

Edge TTS có word boundary thật, nhưng Google Chirp và VieNeu path có thể dùng estimated word timing. Lucida tiếp tục ưu tiên forced alignment trên approved script và canonical voice track.

### 3.5 Dual render path và documentation drift

HTML/Playwright và Remotion path không có cùng mức automated QA; tài liệu về default renderer cũng chưa hoàn toàn đồng nhất. Lucida không nên nhân đôi pipeline theo mô hình này.

---

## 4. Kết luận sử dụng

Giữ `any2video` trong nhóm **supplementary implementation references** cho:

```text
source extraction
hybrid browser footage
TTS-before-layout
Vietnamese visual QA
skin tokenization
```

Không dùng repository này để thay đổi quyết định hiện tại về:

```text
VideoProjectInput
VoiceTrack / TimedScript
CaptionPlan
AssetManifest + scene asset bindings
adapter/preset/template registry
single generic Remotion composition
```

Mọi ý tưởng lấy từ repository phải được chuyển thành Lucida contract, validator và component riêng trước khi implementation.