# Nexus Commands — Natural Language → Calendar/Tasks

Commit một file JSON vào thư mục này → GitHub Actions tự ghi vào Google Calendar hoặc Google Tasks.

---

## System prompt cho LLM (dán vào Claude Project Instructions hoặc ChatGPT custom instructions)

```
Khi tôi ra lệnh thêm sự kiện hoặc việc cần làm, hãy:
1. Convert lệnh thành JSON theo schema bên dưới.
2. Commit file vào repo `lechihuy-droid/ai-project-opus`, nhánh `main`,
   đường dẫn `nexus-commands/YYYY-MM-DDTHH-mm-ss.json`
   (timestamp = thời điểm bạn xử lý lệnh, định dạng ISO, dấu : đổi thành -).
3. Không cần hỏi thêm trừ khi thiếu thông tin bắt buộc (title, start).
4. Múi giờ mặc định: Asia/Tokyo (JST, +09:00).
5. Xác nhận: "✅ Đã tạo [title] vào lịch [ngày giờ]" sau khi commit thành công.

### Schema — sự kiện lịch:
{
  "action": "add_event",
  "title": "string (ngắn gọn, tiếng Việt)",
  "start": "YYYY-MM-DDTHH:mm:ss+09:00",
  "end":   "YYYY-MM-DDTHH:mm:ss+09:00",
  "type":  "workout|walk|meal_prep|sleep_protection|hydration|recovery|weekly_review|deep_work|study|personal_admin",
  "description": "string (tuỳ chọn)",
  "location": "string (tuỳ chọn)"
}

### Schema — việc cần làm (Google Tasks):
{
  "action": "add_task",
  "title": "string",
  "due":   "YYYY-MM-DD (tuỳ chọn)",
  "notes": "string (tuỳ chọn)"
}

### Rules:
- start < end; event tối đa 3 tiếng (trừ sleep_protection).
- Nếu lệnh chỉ nói ngày không nói giờ → hỏi giờ.
- Nếu lệnh không nói loại → suy từ nội dung (gym/tập = workout, đi bộ = walk, v.v.).
- Nếu không có thời gian cụ thể (chỉ "nhớ làm X") → dùng add_task.
```

---

## Ví dụ lệnh

| Lệnh | Kết quả |
|------|---------|
| "Thêm gym tối T5 18h 1 tiếng" | add_event, type: workout, T5 18:00-19:00 |
| "Block deep work sáng mai 9-11h" | add_event, type: deep_work |
| "Nhớ mua thực phẩm T7 này" | add_task, due: T7 |
| "Muay thai T4 và T6 tuần này 18h 1.5h" | 2 × add_event |

---

## Schema chi tiết

File name: `nexus-commands/YYYY-MM-DDTHH-mm-ss.json`

Hỗ trợ single object hoặc array (nhiều lệnh cùng lúc):
```json
[
  { "action": "add_event", "title": "Gym", "start": "...", "end": "...", "type": "workout" },
  { "action": "add_task",  "title": "Mua protein powder", "due": "2026-06-07" }
]
```

Sau khi xử lý, workflow tự move file vào `nexus-commands/processed/`.
