# Visual Treatment v3 — "Dùng AI viết email kính ngữ tiếng Nhật trong 5 phút"

- **Status:** APPROVED — user duyệt 2026-07-16 (kèm quyết định: M6.1 gồm CẢ 2 gap — window addable + transform thu gọn/dịch vị trí)
- **Scope:** Loop 0 (thiết kế bằng chữ, trước map/render) cho `ai-email-keigo`, thay v2 (gate 3 v2 bị từ chối: thiếu terminal AI riêng, chỉ có 1 cửa sổ mail đổi title)
- **Script + giọng:** `approved-script.json` — 14 câu, 6 segment, 58s, FROZEN, không đổi lời
- **Parent:** `docs/review-design-before-render.md` (mục 1, 4)

⚠ **COMPONENT GAP — xem mục Component Check.** Treatment này có 1 beat (seg-002) chưa build được với component hiện có. Cần patch M6.1 trước khi map.

## ACTORS

| Actor | Component | Ghi chú |
|---|---|---|
| Mail window | `MechanismWindow` (variant email) | Có sẵn |
| AI terminal | `MechanismWindow` (variant chat) | **CẦN M6.1** — hiện continuous mode chỉ cho 1 environment window, chưa addable như element thứ 2 |
| Con trỏ soạn thảo | cursor gắn theo window đang active | Có sẵn, đi kèm window |
| Đồng hồ | `TimerMorph` | Có sẵn |
| Chip ngữ cảnh | `ContextChip` | Có sẵn |
| Diff kính ngữ | `DiffHighlight` | Có sẵn |

Rule check: chủ đề "dùng AI viết email" → có đủ actor AI (terminal) + email (mail window) ✓.

## BEATS

| Segment | Thời lượng | Cảnh thấy được | Actors hiện diện |
|---|---|---|---|
| seg-001 | ~10s (hook) | Mail window giữa màn hình, bản nháp JP chưa đạt lễ (`すみません、納期が遅れます。`); con trỏ xóa-viết trong ô soạn; đồng hồ chạy tới 29:58 | Mail window · con trỏ · đồng hồ |
| seg-002 | ~5s | Mail window THU GỌN, dịch lên trên; AI terminal trượt vào từ dưới; text email được "dán" sang terminal — **thấy cả 2 cửa sổ cùng lúc** (beat sửa đúng lỗi v2) | Mail window · AI terminal |
| seg-003 | ~21s | 3 chip ngữ cảnh bay lần lượt vào terminal theo nhịp đọc: Quan hệ = khách lâu năm (~0s) · Mục đích = xin lỗi giao trễ (~8.7s) · Đầu ra = 2 phiên bản (~13.2s); cuối segment terminal "trả kết quả" — bản keigo hiện trong terminal | AI terminal · chip ngữ cảnh (x3) |
| seg-004 | ~4s | Kết quả từ terminal áp NGƯỢC vào mail window (text mail đổi thành bản keigo); chip Kiểm tra (Tên · Số · Ngày) xuất hiện cạnh mail | Mail window · AI terminal · chip kiểm tra |
| seg-005 | ~6s | Terminal + chip nhường chỗ; DiffHighlight TRƯỚC/SAU (`すみません` → `誠に申し訳ございませんが`, highlight đỏ/vàng + chú thích); đồng hồ morph 30:00 → 05:00 | Diff kính ngữ · đồng hồ |
| seg-006 | ~8s | Mail window chuyển state SENT; chip Lucida/Follow xuất hiện 4 giây cuối | Mail window · chip Lucida |

## COMPONENT CHECK

| Actor/Beat | Component cần | Trạng thái |
|---|---|---|
| Mail window (seg-001, 004, 006) | `MechanismWindow` variant email | OK |
| Đồng hồ (seg-001, 005) | `TimerMorph` | OK |
| Chip ngữ cảnh (seg-003) | `ContextChip` x3, bay tuần tự | OK |
| Chip kiểm tra (seg-004) | `ContextChip` variant kiểm tra | OK |
| Diff kính ngữ (seg-005) | `DiffHighlight` + chú thích | OK |
| Chip Lucida/Follow (seg-006) | `ContextChip`/CTA chip | OK |
| **AI terminal xuất hiện song song mail window (seg-002, 003, 004)** | `MechanismWindow` addable làm element thứ 2 trong continuous mode | **⚠ COMPONENT GAP — cần build M6.1 trước khi map.** Hiện continuous mode chỉ cho 1 environment window; chưa có variant chat/terminal addable song song mail window |
| **Mail window thu gọn + dịch vị trí (seg-002)** | Transform position/scale qua transition trên `MechanismWindow` | Gap phụ — chưa xác nhận có trong scope M6.1 hay không, cần chốt trước khi map |

---

**User duyệt 2026-07-16.** Gap chính + gap phụ đều vào scope M6.1 (BD-visual-mechanism Phase E). Map v3 chỉ build sau khi M6.1 verify xong.
