# PLAN TUẦN — Lịch vận hành lặp lại hàng tuần
Vòng 7 · 2026-07-07 · Khớp: growth-plan-final.md §9, time ledger 14h, luật FREEZE
Giả định khung giờ: có việc ban ngày → làm tối 21:00–23:00 các ngày thường + 2 block cuối tuần. Nếu khung giờ thật khác, giữ NGUYÊN thứ tự việc, chỉ dời giờ.

## 1. Tuần chuẩn (14h) — từng ngày, từng giờ

### Thứ 2 — REVIEW & DECIDE (21:00–22:30, 1.5h)
| Giờ | Việc | Deliverable |
|---|---|---|
| 21:00–21:30 | Mở dashboard 9 số; điền Weekly Review phần [SỐ]: mỗi pipeline sống ghi KPI dạng n/n so kill criteria | Weekly Review mục [SỐ] xong |
| 21:30–22:00 | Quyết định từng pipeline: SCALE / ITERATE (1 biến nào?) / KILL / FREEZE — viết 1 dòng lý do | Quyết định ghi vào Pipeline board |
| 22:00–22:15 | Cập nhật Monetization tracker: ai thấy offer, ai trả, nguyên văn phản ứng giá | Tracker cập nhật |
| 22:15–22:30 | Viết [HỌC] 3 dòng + [LÀM] tuần này; đếm "số ngày có log tuần trước" và "giờ đã dùng" | Weekly Review hoàn chỉnh |

### Thứ 3 — CLUSTER (21:00–22:00, 1h)
| Giờ | Việc | Deliverable |
|---|---|---|
| 21:00–21:30 | Quét Signal DB 7 ngày; gộp signal cùng giao điểm DOMAIN×EMOTION×INTENT; nâng/hạ strength | Signal DB đã cluster |
| 21:30–21:50 | Cập nhật Segment board: segment nào nóng lên/nguội đi tuần này | Segment board cập nhật |
| 21:50–22:00 | Chọn 1–3 insight strength ≥2 đưa sang backlog; đọc lại 10 dòng tag tuần trước (chống drift) | Shortlist insight |

### Thứ 4 — HYPOTHESIS + SCRIPT (21:00–22:45, 1.75h)
| Giờ | Việc | Deliverable |
|---|---|---|
| 21:00–21:30 | Viết Hypothesis card cho insight mới (falsifiable + ngưỡng); chấm score + veto pháp lý/trust | 0–2 Hypothesis card |
| 21:30–21:45 | Nếu <2 pipeline sống VÀ có hypothesis đủ điểm: viết Pipeline Card 15 trường, KILL CRITERIA TRƯỚC | Pipeline card (nếu có) |
| 21:45–22:45 | Viết 2 script video công thức 5 phần — hook lấy NGUYÊN VĂN từ Signal DB; điền content calendar | 2 script + calendar |

### Thứ 5 — BATCH QUAY (21:00–23:00, 2h)
| Giờ | Việc | Deliverable |
|---|---|---|
| 21:00–21:15 | Setup cố định (đèn, tripod, format đã khoá 8 tuần) | — |
| 21:15–22:30 | Quay 2 video (mỗi video quay 2–3 take là dừng — không cầu toàn) | 2 video thô |
| 22:30–23:00 | Cắt nhanh + text overlay + gắn link `?pid=P-xx-a/b` | 2 video sẵn đăng |

### Thứ 6 — ĐĂNG + REPLY (20:00–21:00, 1h)
| Giờ | Việc | Deliverable |
|---|---|---|
| 20:00–20:15 | Đăng TikTok video 1 (giờ vàng 20–22h) | Live |
| 20:15–20:30 | Recycle sang FB page + IG Reels (xóa watermark) | 2 kênh phụ live |
| 20:30–21:00 | Reply comment ngày trong tuần còn tồn; ghi signal mới | Signal DB +N dòng |

### Thứ 7 — COLLECT + ĐỆM (10:00–12:00, 2h)
| Giờ | Việc | Deliverable |
|---|---|---|
| 10:00–10:30 | Reply comment/DM; ghi signal (chuẩn ĐẠT = 5 dòng/ngày) | Signal DB |
| 10:30–11:00 | Khai thác mỏ công khai: 2 group FB + comment 1 kênh cùng ngách | Signal DB |
| 11:00–12:00 | ĐỆM: việc Codex (viết brief/nghiệm thu), chỉnh landing, chuẩn bị monetization test, hoặc NGHỈ nếu không có gì | Tuỳ tuần |

### Chủ nhật — ĐĂNG #2 + COLLECT (20:00–22:00, 2h)
| Giờ | Việc | Deliverable |
|---|---|---|
| 20:00–20:15 | Đăng video 2 (giờ vàng CN) | Live |
| 20:15–20:45 | Reply + signal | Signal DB |
| 20:45–21:30 | ĐỆM 2: đọc số giữa tuần KHÔNG quyết định gì (quyết định chỉ ở thứ 2) | — |
| 21:30–22:00 | Dọn: backup check, sắp tài liệu cho review thứ 2 | Sẵn sàng T2 |

**Tổng: 1.5+1+1.75+2+1+2+2 = 11.25h lịch cứng + ~2.75h reply rải rác các ngày (15-20'/ngày) = ~14h.**

## 2. Tuần EVENT (luật FREEZE — mọi pipeline giữ nguyên trạng)

Thay đổi so với tuần chuẩn: T4 bỏ hypothesis mới (không pipeline mới); T5 bỏ quay (dùng recycle + 1 video announce event đã làm sẵn tuần trước); T7 hoặc CN = chạy event.

| Ngày | Việc thêm | Giờ |
|---|---|---|
| T3 | Chốt danh sách + nhắn nhóm LINE người đã cọc (địa điểm, giờ, mang gì) | +30' |
| T5 | Mua đồ/chuẩn bị theo checklist event (in danh sách, tiền lẻ, biển tên) | 2h thay quay |
| T7/CN | EVENT: đến sớm 45', điểm danh bằng danh sách cọc, chụp ảnh nhóm (xin phép đăng), ghi chi phí THẬT từng khoản ngay tại chỗ | 5–7h |
| CN tối | Gửi form feedback (3 câu: NPS, giá ổn không, lần sau đi không) + cảm ơn | 30' |
| T2 sau | Review event như 1 pipeline: cọc→attend, NPS, chi phí thật vs dự kiến; viết recap (ảnh + bảng chi phí theo khoản mục) | trong review |

## 3. Tuần DUY TRÌ TỐI THIỂU (4h — chế độ chính thức, khai báo trước ở Weekly Review, không phải thất bại)

| Việc giữ | Giờ | Việc bỏ |
|---|---|---|
| Review thứ 2 (rút gọn: chỉ dashboard + quyết FREEZE toàn bộ) | 45' | Cluster, hypothesis |
| Reply comment/DM cách ngày | 1.5h | Quay video mới |
| 1 recycle/repost content cũ tốt nhất | 30' | Content mới |
| Log signal tối thiểu (3 dòng/ngày, 4 ngày) | 1h | Mỏ công khai |
| Backup + ghi "tuần duy trì" vào Weekly Review | 15' | Mọi thứ khác |

Quy tắc: tối đa 2 tuần duy trì liên tiếp; tuần thứ 3 phải quay lại chuẩn hoặc tuyên bố tạm dừng dự án có kế hoạch (khác với chết im lặng).

## 4. Checklist đầu tuần (dán lên màn hình — 5 câu hỏi thứ 2)

1. Tuần này là tuần gì? CHUẨN / EVENT / DUY TRÌ → chọn lịch tương ứng, không lai
2. Có ≤2 pipeline sống không? Nếu đang 2 → không nhận hypothesis mới dù hay đến đâu
3. Có flag pháp lý/trust nào tuần trước không? Có → xử lý TRƯỚC mọi việc khác
4. Tuần trước log mấy ngày? <4 → tuần này đơn giản hoá (3 cột tag thành 1 cột note cũng được)
5. Giờ tuần trước bao nhiêu? >14h → cắt theo thứ tự: video mới → pipeline mới → KHÔNG BAO GIỜ cắt reply & review

## 5. Template tuần (copy mỗi thứ 2 vào Weekly Review sheet)

```
TUẦN: 2026-__-__ → __-__   LOẠI: CHUẨN / EVENT / DUY TRÌ
[SỐ]  P-N2:    start __/__  complete __/__  signup __/__  → SCALE/ITERATE/KILL/FREEZE vì: ______
      P-EVENT: register __/__  cọc __/__  attend __/__   → ______
      ¥ tuần này: ______  luỹ kế: ______   Profile sống: ____
      Signal mới: ____ dòng / ____ ngày có log   Giờ: ____/14h   Trust flag: CÓ/KHÔNG
[HỌC] 1. ______  2. ______  3. ______
[LÀM] Pipeline/experiment tuần này: ______   1 biến iterate (nếu có): ______
      Việc giao Codex: ______   Việc pháp lý còn nợ: ______
```

## Quality bar tự chấm (Vòng 7)
Specificity 5 (đến từng giờ) · Practicality 5 (3 chế độ tuần + checklist 5 câu) · Monetization 4 (tracker có mặt trong nhịp T2) · Measurement 4 · Risk 4 (luật cắt tải, chống drift, flag-first) → đạt, sang Vòng 8.
