# ai/ — Working State

Thư mục này là source of truth cho trạng thái làm việc hiện tại. Không phụ thuộc vào chat history hay session nào.

| File | Mục đích | Cập nhật khi nào |
|---|---|---|
| `STATUS.md` | Objective hiện tại, sub-system active, next step, owner | Mỗi khi objective hoặc next step thay đổi |
| `HANDOFF-claude.md` | Restart anchor cho Claude — exact next action | Cuối mỗi session Claude (dùng `/handoff`) |
| `sessions/` | Log tóm tắt từng session theo ngày | Tự động khi chạy `/handoff` |

## Cách dùng

**Đầu session:** dùng yêu cầu mới nhất của user. Khi cần resume trạng thái dự án, đọc `STATUS.md`.

**Cuối session:** Gõ `/handoff` → Claude tự điền tất cả.

**Sau compact:** Gõ "tiếp tục từ context cũ" → Claude đọc lại `STATUS.md` và handoff Claude nếu cần.
