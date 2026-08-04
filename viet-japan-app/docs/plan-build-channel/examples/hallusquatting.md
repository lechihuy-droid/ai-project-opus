# Topic Example: HalluSquatting

## Type

AI News / Security / FOMO

## Core idea

Coding agent có thể bịa ra tên hoặc URL GitHub không tồn tại. Kẻ tấn công có thể tạo repo giả đúng theo tên đó để dụ agent tải và chạy mã độc.

## Hook

> Nếu bạn đang dùng Claude Code, Copilot CLI hoặc Gemini CLI, đừng cho AI tự cài repo trước khi biết điều này.

## Viewer payoff

Luôn xác minh URL, chủ sở hữu và lịch sử commit trước khi cho agent cài package hoặc repository.

## Visual direction

```text
User prompt
→ AI hallucinates repository
→ Fake GitHub repository
→ Malicious code executes
```

## Test objective

Đo retention, share và hiệu quả của format cảnh báo bảo mật.
