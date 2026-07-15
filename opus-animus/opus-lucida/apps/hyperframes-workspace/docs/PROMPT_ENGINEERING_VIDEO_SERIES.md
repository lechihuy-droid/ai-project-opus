# Prompt Engineering Video Series

Series gồm 7 video motion graphics dọc cho TikTok/Reels. Mỗi tập dài 20 giây, 1080x1920, 30 fps và dùng tiếng Việt có dấu.

## Danh sách tập

| Tập | Chủ đề | File output |
| --- | --- | --- |
| 01 | V1: thất bại do thiếu context | `D:\HyperFrames\output\prompt-engineering-series\01-v1-context-failure.mp4` |
| 02 | V2: role và confidence boundary | `D:\HyperFrames\output\prompt-engineering-series\02-v2-confidence-boundary.mp4` |
| 03 | V3: system prompt và prompt caching | `D:\HyperFrames\output\prompt-engineering-series\03-v3-system-prompt-caching.mp4` |
| 04 | V4: thứ tự phân tích | `D:\HyperFrames\output\prompt-engineering-series\04-v4-order-of-analysis.mp4` |
| 05 | V5: structured output | `D:\HyperFrames\output\prompt-engineering-series\05-v5-structured-output.mp4` |
| 06 | Vision few-shot, prefill, extended thinking | `D:\HyperFrames\output\prompt-engineering-series\06-advanced-techniques.mp4` |
| 07 | Framework production V1-V5 | `D:\HyperFrames\output\prompt-engineering-series\07-production-framework.mp4` |

## Cấu trúc mỗi video

Mỗi video có năm scene, mỗi scene bốn giây:

1. Hook: vấn đề hoặc kết luận gây chú ý.
2. Prompt/Input: hiển thị instruction trong terminal.
3. Signal: output, failure hoặc thay đổi hành vi quan trọng.
4. Breakdown: ba điểm kỹ thuật cần nhớ.
5. Takeaway: kết luận và CTA dẫn sang tập kế tiếp.

Progress bar, header và footer được giữ liên tục để tạo cảm giác cùng một series. Layer dùng staggered entrance, wipe, scan line, cursor pulse, glow và floating micro-motion để tránh khoảng đứng yên cuối scene.

## Source of truth

- Nội dung và design tokens: `renderer/generate-prompt-series.mjs`
- Scene JSON đã sinh: `scene-schema/examples/prompt-engineering-series/`
- HyperFrames projects đã compile: `generated/prompt-engineering-series/`
- MP4: `D:\HyperFrames\output\prompt-engineering-series\`
- Temporary render files: `D:\HyperFrames\tmp\`

Không sửa trực tiếp file trong `generated/`. Thay nội dung trong generator, sinh lại manifest rồi compile/render.

## Workflow tái tạo

Sinh lại 7 Scene JSON:

```powershell
node renderer/generate-prompt-series.mjs
```

Chỉ compile toàn bộ:

```powershell
node renderer/render-prompt-series.mjs --compile-only
```

Render toàn bộ ở draft quality:

```powershell
node renderer/render-prompt-series.mjs --quality draft
```

Output và temp mặc định nằm trên ổ D. Có thể override cho một lần chạy:

```powershell
node renderer/render-prompt-series.mjs `
  --output-dir "D:\VideoExports\prompt-series" `
  --temp-dir "D:\VideoExports\tmp" `
  --quality high
```

Render riêng một tập:

```powershell
node renderer/render-prompt-series.mjs --episode 05 --quality draft
```

Render từ một tập cụ thể:

```powershell
node renderer/render-prompt-series.mjs --from 04 --quality draft
```

Đổi `draft` thành `standard` hoặc `high` cho bản phát hành cuối.

## QA checklist

- FFprobe: H.264, 1080x1920, 30 fps, 20 giây.
- Kiểm tra frame tại giây 2, 6, 10, 14 và 18.
- Kiểm tra đầy đủ dấu tiếng Việt ở hook, terminal, footnote và CTA.
- Không đặt text quan trọng ngoài vùng `x=84..996`, `y=78..1750`.
- Kiểm tra câu dài không tràn khỏi layer.
- Kiểm tra animation xuất hiện và emphasis cùng hoạt động trên một layer.

## Lưu ý render trên Windows

Render cần Node spawn Chrome Headless Shell và FFmpeg. Nếu batch dài gặp `Page.captureScreenshot: Unable to capture screenshot`, giữ các MP4 đã hoàn tất và retry riêng tập lỗi trong process mới:

```powershell
node renderer/render-prompt-series.mjs --episode 06 --quality draft
```

## Bước production tiếp theo

Video hiện là motion graphics không có audio. Trước khi đăng cần thêm voice-over tiếng Việt, music bed, SFX theo điểm xuất hiện và caption đồng bộ theo lời đọc. Sau khi mix audio, render bản `high` và kiểm tra lại loudness, safe area TikTok/Reels và độ rõ chữ sau khi nền tảng nén.
