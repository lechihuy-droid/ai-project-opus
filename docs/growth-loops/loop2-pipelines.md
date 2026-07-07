# LOOP 2 — Growth Strategist (Growth Architect)
Input: loop1-segments.md · Output cho Loop 3

## 1. Insight → Hypothesis → Pipeline matrix (8 pipeline cụ thể, theo priority Loop 1)

Route chuẩn: SNS signal → content hook → landing → app action → profile capture → share/referral moment.

### P-N2 (S1, priority 4.35) — archetype A1
- Hypothesis: "Người kẹt N2 sẽ rời TikTok để làm quiz 10 câu VÌ phiếu điểm chỉ đúng lỗ hổng của HỌ — thứ video đại trà không cho được. ≥30% làm hết, ≥8% đăng ký lưu tiến độ."
- Route: comment "học mãi quên" (SQS 3, volume cao) → hook nguyên văn "học 2 năm vẫn lẫn わけ/はず?" → landing = màn quiz đầu tiên (KHÔNG có trang giới thiệu) → quiz 10 câu → phiếu điểm + weak_tags vào profile → share card khi điểm ≥8/10
- KPI: quiz_start/landing ≥50% · complete ≥30% · signup_after_value ≥8%
- Kill: complete <15% sau 2 tuần + 1 iterate (n≥100)

### P-TAX (S5, 4.00) — A1 biến thể tool
- Hypothesis: "Người save video hoàn thuế sẽ dùng tool 3-input ra 'số tiền CỦA TÔI' vì save = định dùng mà chưa dùng được. ≥40% hoàn thành tool, ≥15% để lại email nhận checklist."
- Route: save-pattern → hook "bạn có thể đang bỏ quên X man tiền hoàn" → landing = form 3 ô (năm làm việc, lương range, loại bảo hiểm) → kết quả ước tính → email capture ("checklist tự làm từng bước") → không share (chủ đề tiền = riêng tư)
- KPI: tool_complete ≥40% · email ≥15%
- Kill: complete <20% (n≥100) → nghĩa là 3 ô vẫn nhiều quá → thử 2 ô, rồi kill

### P-VISA (S2, 3.90) — A3+A5
- Hypothesis: "Người sắp hạn visa cần XÁC NHẬN không sót — checklist tick được theo loại tư cách + reminder sẽ được dùng hết ≥25% và ≥12% đặt reminder."
- Route: group post hoảng loạn → hook "thiếu 1 trong 3 giấy này là bị trả hồ sơ" → landing = chọn loại tư cách (1 tap) → checklist tick → reminder qua email/LINE (= capture) → không share; trust asset = link nguồn 出入国在留管理庁 dưới MỖI mục
- KPI: checklist done ≥25% · reminder ≥12%
- Kill: done <10% (n≥100) → pain không phải checklist mà là "cần người làm hộ" → chuyển hypothesis sang workshop/tư vấn

### P-EVENT (S3+S8, 3.75/3.40) — A2, nhịp chậm 3-4 tuần/vòng
- Hypothesis: "Người cô đơn + người từng bị lừa sẽ đăng ký event khi trang event chứng minh được thay vì hứa: bảng chi phí từng khoản + recap ảnh thật + đếm chỗ thật. Click→register ≥15%, có mặt ≥70%."
- Route: DM/comment HOI_UY_TIN → hook = recap đợt trước (ảnh nhóm + "tổng chi ¥2,400/người, hóa đơn đây") → landing = trang event 1 cột → đăng ký + cọc ¥1,000 → profile: vùng, sở thích → share moment = ảnh nhóm sau event (tag nhau tự nhiên)
- KPI: register ≥15% click · attend ≥70% · re-register ≥30%
- Kill: attend <50% sau 2 event → cơ chế cọc hỏng hoặc chọn sai loại event

### P-CV (S6, 3.70) — A1+A5, theo mùa 就活
- Hypothesis: "Du học sinh trượt nhiều công ty sẽ up CV cho máy chấm vì 'nhờ người xem hộ' vốn là hành vi sẵn có nhưng xấu hổ — máy không phán xét. Upload→result ≥35%, dual-conversion ≥10%."
- Route: post than trượt 30 công ty → hook "3 lỗi CV khiến 90% hồ sơ bị loại vòng đầu" → landing = khung upload + dòng APPI "không đăng nhập = xóa ngay sau chẩn đoán" → kết quả 68/100 + 3 lỗi → login lưu HOẶC đăng ký course (dual) → share = không (SHAME); referral = "gửi link cho bạn cùng 就活"
- KPI: upload ≥35% landing · dual-conversion ≥10%
- Kill: upload <15% → rào tâm lý up file cao hơn dự đoán → đổi sang quiz chuẩn 就活 không cần file

### P-RETURN (S11, 3.30) — A3, gộp vận hành với P-TAX
- Hypothesis: "Người sắp về nước hẳn sẽ hoàn thành checklist 90-ngày-trước-khi-về vì nỗi sợ 'rời Nhật rồi không đòi lại được' có deadline thật. Done ≥25%, email ≥20% (cao hơn chuẩn vì urgency)."
- Route: search/group "về nước cần làm gì" → hook "9 thứ phải làm TRƯỚC khi trả thẻ ngoại kiều — quá hạn là mất" → landing = checklist 90/60/30 ngày → email capture để nhận nhắc theo mốc → share thấp
- KPI: done ≥25% · email ≥20%
- Kill: done <12% (n≥100)

### P-SALARY (S7, 3.50) — A7 nửa đầu, KHÔNG doanh thu Phase 1-2
- Hypothesis: "Người muốn đổi việc sẽ điền 4 field (ngành, năm KN, vùng, lương hiện tại) để xem mình đứng đâu so với phân phối — dữ liệu nghề nghiệp đắt nhất đổi bằng sự tò mò về chính mình. Complete ≥35%, đủ 4 field ≥60%."
- Route: search "chuyển việc lương" → hook "kỹ sư 3 năm KN ở Kanto: median X man — bạn trên hay dưới?" → landing = form 4 ô ẩn danh → kết quả percentile → mời tạo profile để "nhận cảnh báo khi thị trường đổi" → share = card percentile (ẩn số tuyệt đối)
- KPI: complete ≥35% · profile nghề ≥60% người complete · MỤC TIÊU CHIẾN LƯỢC: 500 profile nghề trước khi xin license
- Kill: complete <18%; LƯU Ý cold-start dữ liệu: 100 record đầu lấy từ khảo sát group + nguồn công khai, ghi rõ "dữ liệu tham khảo ban đầu"

### P-SCAM (S9, 2.55) — phòng thủ, không monetize
- Hypothesis: "Content cảnh báo lừa đảo (đỏ độc quyền) là máy xây trust rẻ nhất — share rate cao nhất mọi chủ đề vì người share trông như người tốt."
- Route: signal CANH_BAO → content "3 dấu hiệu kèo lừa" → landing = bài tips + nút 'kiểm tra kèo bạn đang xem' (checklist 5 câu) → không capture gì → share moment = chính content
- KPI: share rate ≥1.5% (gấp 3 chuẩn) · KHÔNG đo conversion — pipeline này mua trust, không mua user
- Kill: không kill theo số — chạy 1 content/2 tuần cố định như "thuế trust"

## 2. Pipeline Archetypes (chốt 6, bỏ A6 gộp vào A2)

| ID | Chain | Dùng khi | Không dùng khi | KPI đầu |
|---|---|---|---|---|
| A1 | Pain → Free Tool/Quiz → Save Progress → Paid | Pain đo được bằng test; trust thấp | Pain một-lần (không có gì để lưu) | complete, signup_after_value |
| A2 | Trust Proof → Event/Recap → Register+Cọc → Paid Event | Có ≥1 proof thật | Chưa từng chạy event (event #1 = phi lợi nhuận để sản xuất proof) | register, attend, re-register |
| A3 | Search Intent → Checklist/Guide → Capture → Consultation | Intent chủ động, pain có cấu trúc thủ tục | Pain cảm xúc mơ hồ (không ai search "hết cô đơn") | done, capture |
| A5 | Anxiety → Assessment → Workshop (chuyên gia thật) | Anxiety + hậu quả thật + CÓ chuyên gia | Không có chuyên gia đứng lớp — cấm bán anxiety suông | assessment, seat bán |
| A4 | Achievement → Share Card → Referral | Thành tựu thật + đúng mùa | Chủ đề xấu hổ; chưa có gì đáng khoe | sharecard, K-factor |
| A7 | Career Intent → Profile Pool → (P3) Partner | Nuôi tài sản dữ liệu | Bán lead trước khi có license — CẤM | profile hoàn chỉnh |

## 3. Scoring model chọn pipeline test trước (kế thừa v2, thêm 1 cột)

Score = pain .20 + speed .20 + cost .15 + monetize .15 + audience .10 + fit .10 + data .10 · Trust risk ≥4 = veto.
THÊM (từ Loop 1): nhân hệ số mùa vụ ×1.2 nếu đang trong trigger season (JLPT: T4-7 & T9-12; 就活: T3-6; thuế: T1-3; về nước: T12-3).

Xếp hạng khởi động (tháng 7, mùa JLPT): P-N2 (4.6×1.2) → P-EVENT (3.9) → P-TAX (3.8, trái mùa −) → P-CV (3.7, cuối mùa) → P-VISA (3.4, veto-risk cần trust asset) → P-SALARY (3.2) → P-RETURN (3.0) → P-SCAM (chạy nền cố định).

## Quality bar tự chấm (Loop 2)
Specificity 5 (8 pipeline có route+số) · Practicality 4 (P-SALARY có cold-start data phải xử lý — đã ghi chú) · Monetization 4 · Measurement 5 · Risk 4 → đạt, sang Loop 3.
