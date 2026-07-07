# LOOP 3 — Conversion Designer (UX Conversion Specialist)
Input: loop2-pipelines.md · Output cho Loop 4

## 1. Nguyên lý gốc: vì sao user rời SNS?

Chỉ 3 động lực đủ mạnh (mọi CTA phải thuộc 1 trong 3):
1. **Kết quả CỦA TÔI** — cá nhân hoá mà video đại trà không cho được (điểm, số tiền, percentile)
2. **Cần lưu / dùng lại** — checklist, tiến độ, reminder có deadline thật
3. **Khan hiếm thật** — chỗ event đếm từ DB

Corollary: "Xem thêm tại web" / "link trong bio" trần trụi = không thuộc nhóm nào = thất bại được báo trước.

## 2. CTA library — copy thật cho từng pipeline

| Pipeline | CTA trên SNS (nói miệng + text overlay) | Vì sao mạnh |
|---|---|---|
| P-N2 | "10 câu này đề thật đấy — vào đo xem bạn đang hổng đúng chỗ nào, 2 phút, không cần đăng ký" | Kết quả CỦA TÔI + phá friction ngay trong câu ("không cần đăng ký") |
| P-TAX | "Nhập 3 số — biết ngay bạn đang bỏ quên bao nhiêu man tiền hoàn" | Con số CỦA TÔI + tiền cụ thể |
| P-VISA | "Checklist đủ 12 mục theo đúng loại visa của bạn — tick đến đâu chắc đến đó" | Cần lưu/dùng lại + giảm anxiety |
| P-EVENT | "16 chỗ, đã đặt 12 — chi phí từng khoản công khai ở trang này" | Khan hiếm thật + trust asset ngay trong CTA |
| P-CV | "Up CV — máy chấm trong 2 phút, không ai đọc ngoài bạn, không đăng nhập thì xoá ngay" | Kết quả CỦA TÔI + hoá giải SHAME + APPI thành lợi thế UX |
| P-SALARY | "4 ô, 30 giây — xem lương bạn đứng ở đâu so với người cùng ngành cùng năm kinh nghiệm" | Percentile CỦA TÔI + tò mò về chính mình |

Quy tắc viết CTA: (a) nói rõ mất bao lâu ("2 phút", "30 giây"); (b) phá friction lớn nhất NGAY trong câu; (c) không động từ mệnh lệnh sáo ("khám phá ngay", "đừng bỏ lỡ").

## 3. Landing promise — trang đích hứa gì (và không hứa gì)

Quy tắc vàng: **landing = chính hành động, không phải trang giới thiệu về hành động.** Hero của P-N2 là câu hỏi số 1 của quiz, không phải "Chào mừng đến với nền tảng học N2".

| Pipeline | Headline landing | Sub-promise (1 dòng) | KHÔNG được hứa |
|---|---|---|---|
| P-N2 | Câu 1/10: 「彼が来る___がない」 | "Xong 10 câu → phiếu điểm chỉ đúng lỗ hổng của bạn" | "Đỗ N2 sau 3 tháng" — phiếu điểm chỉ chẩn đoán, không cam kết đỗ |
| P-TAX | "Bạn có thể được hoàn bao nhiêu?" + 3 ô nhập | "Ước tính theo công thức chính thức, kèm link nguồn" | Con số chính xác tuyệt đối — luôn ghi "ước tính, hồ sơ thật có thể lệch" |
| P-VISA | "Visa của bạn là loại nào?" (4 nút to) | "Checklist theo đúng loại — nguồn: 出入国在留管理庁" | "Chắc chắn đậu" — chỉ cam kết "không sót mục nào theo danh sách chính thức" |
| P-EVENT | Tên event + ảnh recap đợt trước + bảng chi phí | "Giá này gồm những gì — từng khoản, có hoá đơn" | Trải nghiệm cảm xúc thổi phồng ("kỷ niệm để đời") |
| P-CV | Khung kéo-thả CV + dòng APPI ngay dưới | "3 lỗi lớn nhất + điểm, trong 2 phút" | "Đảm bảo được mời phỏng vấn" |

## 4. Timing rules — bánh răng theo mức cam kết

Chuỗi leo thang cam kết, mỗi bậc đổi bằng giá trị vừa nhận:

```
Bậc 0 · Vào landing        → không hỏi GÌ (kể cả cookie banner tối giản)
Bậc 1 · Làm xong action    → nhận full kết quả KHÔNG điều kiện (không "đăng ký để xem điểm")
Bậc 2 · Muốn LƯU kết quả   → bây giờ mới mời login (Google/LINE 1-tap) — "để giữ tiến độ"
Bậc 3 · Quay lại lần 2     → hỏi 1 field profile đổi 1 giá trị ("nhập vùng → giá chuẩn vùng bạn")
Bậc 4 · Nhận aha lần 2     → mời trả tiền lần đầu (offer nhỏ nhất, giá công khai)
Bậc 5 · Đỉnh cảm xúc dương → mời share (điểm cao/đỗ/ảnh event) — KHÔNG BAO GIỜ ở kết quả xấu
```

Vi phạm phổ biến phải tránh: hỏi email TRƯỚC khi cho kết quả tool (P-TAX dễ dính) — email hỏi SAU kết quả, đổi bằng "checklist từng bước gửi vào mail".

Ngoại lệ theo pipeline:
- P-CV: login mời ở bậc 2 nhưng mặc định là KHÔNG login + xoá file — APPI làm thành copy tăng conversion, không phải chướng ngại
- P-VISA/P-RETURN: bậc 2 là email/LINE (reminder cần kênh) — login đầy đủ không cần thiết, đừng đòi
- P-EVENT: nhảy thẳng bậc 0 → bậc 4 (đăng ký + cọc) là hợp lệ vì khan hiếm thật; profile hỏi trong form đăng ký (vùng, sở thích = 2 field, phục vụ chia nhóm)

## 5. Friction cut list — bỏ gì ở từng bước

| Bước | Friction phải bỏ | Thay bằng |
|---|---|---|
| SNS→landing | Trang chủ trung gian | Deep-link thẳng vào action (quiz câu 1, form 3 ô) |
| Bắt đầu action | Form "họ tên/email để bắt đầu" | Bắt đầu nặc danh 100% |
| Trong action | Quiz 20+ câu, form >4 ô | 10 câu / 3-4 ô — đủ chẩn đoán, không đủ mệt |
| Kết quả | "Đăng ký để xem chi tiết" | Full kết quả + login chỉ để LƯU |
| Login | Form đăng ký email+password | Google/LINE 1-tap; không bao giờ tạo password ở Phase 1 |
| Trả tiền | Chuyển khoản ngân hàng phức tạp | Konbini payment / PayPay — pattern Luma đã verify trong research |
| Quay lại | Phải nhớ URL | LINE OA reminder + email có deep-link |

## 6. Funnel UX rules (chốt cho DESIGN contract)

1. Landing = action. Không trang giới thiệu, không hero marketing ở đầu funnel.
2. Kết quả đầy đủ trước, login sau — không thương lượng (delayed signup là luật hệ thống).
3. Mỗi màn 1 việc; mobile 390px; nút chính 44px+; tổng ≤2 tap từ landing đến bắt đầu action.
4. Copy CTA ghi rõ thời gian + phá friction trong câu.
5. Đỏ = chỉ cảnh báo lừa đảo/an toàn (không dùng cho sale/urgency).
6. Mọi con số hệ thống nói ra phải đếm được từ DB (chỗ còn lại, số người đã làm quiz) — không số ảo.
7. Chủ đề SHAME (CV, visa, tiền): không leaderboard, không "X người đang xem", không public activity — riêng tư là feature.
8. Empty state / kết quả xấu: luôn kèm 1 hành động tiếp theo cụ thể ("điểm 4/10 → bắt đầu từ 3 câu わけ này").

## Quality bar tự chấm (Loop 3)
Specificity 5 (copy thật từng pipeline) · Practicality 5 · Monetization 4 (bậc 4 đã định nghĩa trigger, giá để Loop 4) · Measurement 4 · Risk 5 (APPI thành UX asset, SHAME rules) → đạt, sang Loop 4.
