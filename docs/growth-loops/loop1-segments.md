# LOOP 1 — Segment Insight Researcher (Behavioral Researcher)
Ngày: 2026-07-07 · Input cho Loop 2

## 1. Insight taxonomy (kế thừa Growth OS v2, chốt làm chuẩn)

Signal = `DOMAIN × EMOTION × INTENT + strength(1-3) + nguồn + nguyên văn`

- DOMAIN: JLPT_N2_GRAMMAR · JLPT_MOTIVATION · VISA_RENEWAL · VISA_CHANGE · JOB_SEARCH · JOB_WORKPLACE · LIVING_COST · TAX_NENKIN · HOUSING · LONELINESS · EVENT_TRUST · SIDE_INCOME · FAMILY_SUPPORT · SCHOOL_APPLICATION · RETURN_HOME · SCAM_ALERT
- EMOTION: ANXIETY · CONFUSION · FRUSTRATION · SHAME · FOMO · DISTRUST · PRIDE
- INTENT: HOI_CACH_LAM · HOI_CHI_PHI · HOI_UY_TIN · NHO_LAM_HO · XA_STRESS · KHOE · TIM_BAN · CANH_BAO

## 2. Signal Quality Score (SQS) — chấm mỗi nguồn 0–6

SQS = Tin cậy (0–3) + Tín hiệu WTP (0–2) + Đo được bằng máy (0–1)

| Nguồn | Tin cậy | WTP | Đo máy | SQS | Ghi chú |
|---|---|---|---|---|---|
| DM | 3 | 2 | 0 | **5** | Vàng — không ai DM để diễn |
| Quiz result (own) | 3 | 1 | 1 | **5** | Signal tinh, tự động |
| Event feedback | 3 | 2 | 0 | **5** | Người đã bỏ tiền/thời gian |
| Save rate | 3 | 1 | 1 | **5** | Hành vi kín, không diễn |
| Search keyword | 3 | 1 | 0 | **4** | Intent chủ động |
| Live question | 3 | 0 | 0 | **3** | Nguyên văn = hook copy |
| Group post | 2 | 1 | 0 | **3** | Lộ workaround + giá đang trả |
| Comment | 2 | 0 | 1 | **3** | Volume lớn, nhiễu trend |
| Share rate | 1 | 0 | 1 | **2** | Đo identity, không đo pain |
| Poll | 1 | 0 | 1 | **2** | Chỉ validate, không khởi tạo |
| Reaction | 0 | 0 | 1 | **1** | Bổ trợ cluster |

Quy tắc: insight chỉ "đạt chuẩn" khi tổng SQS các nguồn ủng hộ ≥ 8 và có ≥2 loại nguồn.

## 3. 12 Segment Cards

Thang điểm 1–5. Priority = Pain×.25 + Urgency×.20 + WTP×.20 + Observability×.15 + AppAction×.10 + MonetizeFit×.10 − TrustPenalty (barrier≥4 → −0.5).

### S1 · N2-Plateau — "học mãi không lên" — PRIORITY 4.35 (#1)
- Trigger: trượt N2 / mock thấp / 3 tháng trước kỳ thi (7 & 12)
- Visible signal: comment "học xong quên hết", save mẹo ngữ pháp, xem hết video luyện đề
- Hidden need: feedback nhanh + cảm giác tiến bộ đo được (KHÔNG phải thêm tài liệu)
- Pain 4 · Urgency 4 (theo mùa thi) · WTP 3 · Trust barrier 1 · Observability 5 · AppAction 5 (quiz có sẵn) · MonetizeFit 4
- Evidence: quiz_complete ≥30%, D7 ≥15%

### S2 · Visa-Deadline — "sắp hết hạn chưa biết gì" — PRIORITY 3.90 (#3)
- Trigger: 30–90 ngày trước hạn gia hạn/đổi tư cách
- Visible: save checklist cao + share thấp (xấu hổ), DM riêng, search "gia hạn visa giấy tờ"
- Hidden: cần XÁC NHẬN không sót gì + một người tin được — không cần thêm thông tin
- Pain 5 · Urgency 5 · WTP 5 · Trust barrier 5 (−0.5) · Observability 3 (chìm trong DM) · AppAction 4 · MonetizeFit 4
- Evidence: checklist done ≥25%, ≥10 DM/tuần

### S3 · Weekend-Lonely — PRIORITY 3.75 (#4)
- Trigger: 3–18 tháng sau khi sang, hết sốc văn hoá
- Visible: "cho em theo với", tag bạn, TIM_BAN trong group
- Hidden: cớ an toàn để gặp người mới, không phải "sự kiện"
- Pain 4 · Urgency 2 · WTP 3 · Trust barrier 3 · Observability 5 · AppAction 4 · MonetizeFit 5 (event = doanh thu trực tiếp)
- Evidence: đăng ký→có mặt ≥70%, NPS ≥40, tái đăng ký ≥30%

### S4 · Fresh-Arrival (TTS/tokutei <6 tháng) — PRIORITY 3.05 (#8)
- Trigger: vừa sang, mọi thứ lạ
- Visible: hỏi giá mọi thứ, hỏi thủ tục cơ bản, bị chém không biết
- Hidden: khung giá chuẩn để không bị lừa
- Pain 3 · Urgency 3 · WTP 1 (chưa có tiền) · Trust 2 · Observability 4 · AppAction 3 · MonetizeFit 1 → segment NUÔI (chuyển hoá thành S1/S3)

### S5 · Cost-Optimizer (thuế/nenkin) — PRIORITY 4.00 (#2)
- Trigger: mùa 確定申告 (T2–3), nghỉ việc, chuẩn bị về nước
- Visible: save rất cao video hoàn thuế, share thấp, comment hỏi "trường hợp em thì sao"
- Hidden: con số CỦA MÌNH + sợ làm sai với sở thuế
- Pain 4 · Urgency 3 (mùa) · WTP 5 (tiền hoàn thấy được) · Trust 3 · Observability 4 · AppAction 5 (tool tính) · MonetizeFit 4
- Evidence: tool_complete ≥40%, email ≥15%

### S6 · Grad-Job-Hunter (du học sinh 就活) — PRIORITY 3.70 (#5)
- Trigger: năm cuối, mùa 就活; nộp N công ty chưa đậu
- Visible: post "nộp 30 công ty trượt hết", hỏi CV/面接, SHAME → DM
- Hidden: chuẩn Nhật trông thế nào + được chê một cách an toàn (máy không phán xét)
- Pain 4 · Urgency 4 · WTP 3 · Trust 3 · Observability 4 · AppAction 4 (CV tool có demo) · MonetizeFit 4 (B2C course + B2B trường tiếng)

### S7 · Job-Switcher (kỹ sư/nhân viên muốn đổi việc) — PRIORITY 3.50 (#6)
- Trigger: bất mãn lương/残業, đủ 1–3 năm KN, thấy bạn đổi việc lương cao
- Visible: search "chuyển việc lương", comment so lương, đọc bài工資
- Hidden: định giá bản thân trên thị trường
- Pain 3 · Urgency 2 · WTP 2 (bản thân) nhưng recruiter WTP 5 · Trust 3 · Observability 3 · AppAction 4 · MonetizeFit 5 (Phase 3)
- Ghi chú: giá trị là POOL PROFILE — đầu tư dài hạn, không phải doanh thu sớm

### S8 · Event-Burned — PRIORITY 3.40 (#7)
- Trigger: vừa mất tiền kèo lừa hoặc chứng kiến phốt
- Visible: HOI_UY_TIN ("bên X uy tín không?"), comment cảnh giác, share bài phốt
- Hidden: vẫn MUỐN đi — cần bằng chứng kiểm chứng được, không cần lời hứa
- Pain 4 · Urgency 2 · WTP 4 (sẵn trả cho uy tín) · Trust 5 (−0.5) · Observability 4 · AppAction 3 · MonetizeFit 4
- Là "segment cửa ngõ trust": chinh phục được S8 = trust asset cho mọi segment

### S9 · Side-Hustler — PRIORITY 2.55 (#11)
- Trigger: lương không đủ sống, thấy người khác khoe thu nhập phụ
- Visible: hỏi "việc làm thêm online", dính bài đa cấp
- Hidden: phân biệt cơ hội thật/lừa
- Pain 3 · Urgency 2 · WTP 1 · Trust 5 (−0.5) · Observability 4 · AppAction 2 · MonetizeFit 1
- PHÒNG THỦ: chỉ content cảnh báo (đỏ) — xây trust, không monetize

### S10 · Family-Anchor (vợ/chồng theo visa gia đình) — PRIORITY 3.00 (#9)
- Trigger: con đến tuổi 保育園/nhập học; mẹ ở nhà cô lập
- Visible: hỏi thủ tục trường trong group mẹ bỉm, deadline miss stories
- Hidden: timeline không được trễ + mạng lưới cùng cảnh
- Pain 4 · Urgency 4 (deadline cứng) · WTP 2 · Trust 3 · Observability 3 · AppAction 3 · MonetizeFit 2
- Thị trường bỏ trống nhưng nhỏ; giữ ở chế độ quan sát

### S11 · Return-Home Planner (chuẩn bị về VN hẳn) — PRIORITY 3.30 (mới, #~7)
- Trigger: quyết định về nước trong 3–6 tháng (hết hợp đồng TTS, chán, gia đình)
- Visible: hỏi hoàn nenkin/thuế lần cuối, bán đồ, chuyển tiền, huỷ hợp đồng nhà/SIM
- Hidden: sợ bỏ quên tiền/thủ tục không lấy lại được sau khi rời Nhật
- Pain 4 · Urgency 4 · WTP 5 (nenkin hoàn = hàng chục man) · Trust 3 · Observability 3 · AppAction 4 (checklist + tool) · MonetizeFit 4 (guide + tư vấn; đại lý đang lấy 10–20%)
- Overlap lớn với S5 — gộp vận hành, tách content

### S12 · House-Mover — PRIORITY 2.80 (#10)
- Trigger: đổi việc/vùng, hết hạn hợp đồng nhà, muốn thoát ký túc công ty
- Visible: hỏi "nhà không key money", "guarantor cho người nước ngoài", giá vùng
- Visible: save bảng chi phí ban đầu
- Hidden: sợ bị từ chối vì là người nước ngoài + phí đầu vào mờ ám
- Pain 3 · Urgency 3 · WTP 3 · Trust 4 (−0.5, môi giới nhà tai tiếng) · Observability 3 · AppAction 3 (calculator phí đầu vào — tool #12 trong plan) · MonetizeFit 3 (partner bất động sản, Phase 2+)

## 4. Bảng priority tổng (input trực tiếp cho Loop 2)

| # | Segment | Priority | Loại |
|---|---|---|---|
| 1 | S1 N2-Plateau | 4.35 | Tấn công ngay — máy khởi động OS |
| 2 | S5 Cost-Optimizer | 4.00 | Tấn công sớm — WTP cao nhất/trust vừa |
| 3 | S2 Visa-Deadline | 3.90 | Thận trọng — WTP cao nhưng trust barrier 5 |
| 4 | S3 Weekend-Lonely | 3.75 | Nhịp chậm — 1 event/3-4 tuần, sản xuất trust asset |
| 5 | S6 Grad-Job-Hunter | 3.70 | Theo mùa 就活 |
| 6 | S7 Job-Switcher | 3.50 | Nuôi pool, không doanh thu sớm |
| 7 | S8 Event-Burned | 3.40 | Cửa ngõ trust — phục vụ bằng minh bạch, không bán riêng |
| 7b | S11 Return-Home | 3.30 | Gộp vận hành với S5 |
| 8 | S4 Fresh-Arrival | 3.05 | Nuôi |
| 9 | S10 Family-Anchor | 3.00 | Quan sát |
| 10 | S12 House-Mover | 2.80 | Phase 2+ |
| 11 | S9 Side-Hustler | 2.55 | Phòng thủ (content đỏ) |

## Quality bar tự chấm (Loop 1)
Specificity 4 · Practicality 5 · Monetization clarity 4 · Measurement clarity 4 · Risk awareness 4 → đạt, sang Loop 2.
