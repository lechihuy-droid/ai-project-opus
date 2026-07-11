# LOOP 8 — Execution Brainstorm (Generate‑and‑Filter, vòng 2)
Input: loop7-brainstorm-new-ideas.md (4 ý được giữ ưu tiên) · Ngày: 2026-07-08
Mục tiêu: đưa 4 ý chiến lược của loop7 xuống mức đủ cụ thể để nhét thẳng vào roadmap — không brainstorm ý mới, brainstorm CÁCH LÀM.

---

## Phương pháp (lặp lại đúng khung Generate‑and‑Filter đã dùng ở loop7)

Với từng ý trong 4 ý top của loop7:
1. **Phân kỳ:** sinh 4-6 phương án thực thi cụ thể (raw).
2. **Hội tụ:** lọc theo 4 tiêu chí — (a) build/test được ≤1 tuần một mình, (b) chi phí ~0, (c) không mở phạm vi pháp lý mới ngoài cái loop5 đã liệt kê, (d) fit đúng archetype/KPI hệ thống hiện có (loop2/loop3).
3. **Risk pass:** giống loop5, bắt lỗi giả định mới nếu phát hiện.

---

## A. P-REMIT — kiều hối, dựng thành pipeline card

### Phân kỳ
1. Bảng so sánh tĩnh cập nhật tay hàng tháng (Wise / SBI Remit / Kyodai Remittance / Western Union / ngân hàng truyền thống) + link affiliate
2. Tool nhập số tiền → tự tính phí mỗi kênh (cần API tỷ giá — phức tạp)
3. Video "tôi thử gửi X man qua 3 cách, kết quả thế này"
4. Chỉ 1 affiliate partner trước (không so sánh nhiều kênh ngay)
5. Đưa "phí tháng này" vào email/LINE định kỳ thay vì làm landing riêng

### Hội tụ
- **Chọn #1 làm MVP** (build ≤1 ngày, không cần API) — không chọn #2 (Phase 2, cần dữ liệu tin cậy hơn).
- #3 dùng làm content hook dẫn vào #1.
- #4 hợp lý làm bước khởi động: bật 1 affiliate trước, mở rộng dần — giảm rủi ro so sánh sai/lỗi thời khi chỉ 1 người vận hành.
- #5 giữ làm kênh nurture bổ sung, không thay landing riêng.

**Pipeline card P-REMIT (archetype A3, gộp vào bảng pipeline chính):**
- Hypothesis: "Người gửi tiền về VN hàng tháng sẽ xem bảng so sánh phí vì mức chênh giữa các kênh không hiển nhiên. Landing→click affiliate ≥8%, n≥150."
- Route: hook "gửi 10 man về VN, kênh rẻ nhất — đắt nhất chênh bao nhiêu?" → landing = bảng so sánh (không phải trang giới thiệu) → click "đăng ký [kênh X]" (affiliate) → nhãn "PR/quảng cáo" ngay cạnh mỗi link
- KPI: landing→click ≥8% · click→signup đo qua affiliate dashboard (trễ, ngoài tầm đo trực tiếp)
- Kill: click <3% sau n≥150 + 1 iterate (đổi thứ tự bảng/copy)

### Risk mới phát hiện (bổ sung vào risk table loop5)
- **ステマ規制 (luật chống quảng cáo trá hình, hiệu lực 10/2023):** mọi link affiliate phải ghi rõ "PR"/"quảng cáo" — không được để trông như đánh giá khách quan không tài trợ. Áp dụng cho P-REMIT và affiliate SIM. **Hành động bắt buộc:** nhãn PR rõ trên mọi content + landing TRƯỚC KHI bật bất kỳ affiliate link nào (cùng nhóm việc với pipeline pháp lý tuần 1, không phải việc mới tách riêng).

## B. Facebook Groups — kênh song song TikTok

### Phân kỳ
1. Tự đăng bài trực tiếp trong 5-10 group lớn nhất (tay)
2. Xin làm "cộng tác viên nội dung" cho admin group đổi lấy quyền đăng thường xuyên
3. Facebook Ads nhắm riêng group đó
4. Native share từ tài khoản cá nhân founder trước, group sau
5. Trả lời câu hỏi có sẵn trong group (không tự đăng bài mới) — né rule "cấm quảng cáo" của nhiều group

### Hội tụ
- Loại #3 (tốn tiền, không MVP).
- #1 rủi ro bị coi spam nếu không đọc rule group trước → phải làm nhưng đứng sau.
- **Chọn thứ tự leo thang: #5 → #4 → #2 → #1** — 2-3 tuần đầu chỉ trả lời câu hỏi có giá trị thật (không link) để xây uy tín cá nhân trong group; sau đó mới native share có link; cuối cùng mới xin làm cộng tác viên nội dung định kỳ với admin.
- Thêm vào MUST tuần 0-2: "list 5-10 group mục tiêu + đọc rule đăng bài mỗi group".

## C. Partnership hội đồng hương / chùa / NPO

### Phân kỳ
1. Liên hệ trực tiếp 1 chùa/hội đồng hương gần founder nhất trước (warm)
2. Đề nghị co-host event #1: họ cho địa điểm/quảng bá tới cộng đồng, mình lo nội dung/vận hành
3. Liên hệ NPO hỗ trợ du học sinh xin làm "đối tác nội dung" cho mảng CV/việc làm
4. Đi qua network cá nhân (bạn giới thiệu) thay vì cold outreach hoàn toàn
5. Đề nghị NPO nhúng tool P-N2/P-CV vào chương trình hỗ trợ sẵn có của họ (white-label nhẹ)

### Hội tụ
- **#4 là điều kiện tiên quyết thực tế** (network cá nhân luôn hiệu quả hơn cold outreach) → làm trước #1.
- **#1+#2 gộp thành 1 hành động** cho SHOULD tuần 3-8 (event #1: co-host thay vì tự tổ chức 100%).
- #3 gắn vào P-CV launch T8+.
- #5 (white-label) hay nhưng đủ phức tạp (cần thoả thuận, đụng thương hiệu) → **PARK Phase 2**, không đưa vào 12 tuần đầu.

## D. P-SALARY-v2 (bản sửa lỗi A11)

### Phân kỳ
1. Dùng 賃金構造基本統計調査 (thống kê lương cơ bản, Bộ Lao động Nhật) làm neo, cập nhật tay 1 lần/năm
2. Dữ liệu tự khảo sát nhỏ chỉ để minh hoạ ví dụ, không công bố percentile
3. Đổi khung sản phẩm: "máy tra cứu khoảng lương tham khảo theo ngành/tuổi" thay vì "bạn đứng ở đâu so với người khác"
4. Trì hoãn hoàn toàn, giữ nguyên quyết định cắt của loop5

### Hội tụ
- **Chọn tổ hợp #1+#3**: định vị lại thành tool tra cứu thống kê chính thức, không phải bài test cá nhân hoá tự tính percentile — loại bỏ hoàn toàn rủi ro gốc của A11 (n nhỏ → percentile bịa).
- #2 chỉ dùng làm ví dụ minh hoạ trong content.
- **Bác #4**: vì #1+#3 đã sửa được lỗi gốc, không cần trì hoãn vô thời hạn nữa — nhưng vẫn xếp **Phase 2** (không phải 12 tuần đầu), ưu tiên thấp hơn P-N2/P-EVENT/P-REMIT.

---

## Quality bar tự chấm (Loop 8)
Specificity 5 (route/KPI/kill ra cho P-REMIT, hành động tuần-cụ-thể cho 3 ý còn lại) · Practicality 5 (mọi lựa chọn test được ≤1 tuần, chi phí ~0) · Risk 5 (phát hiện thêm ステマ規制, một lỗ hổng pháp lý mới ngoài 3 mảng loop5 đã liệt) · Monetization 4 · Measurement 4 → đạt.

## Việc cần vá vào growth-plan-final.md sau vòng này
1. Risk table (mục "Risk & trust"): thêm dòng **ステマ規制 (affiliate/PR label)** — mức Cao — hành động: nhãn PR rõ trên mọi link affiliate trước khi bật P-REMIT/affiliate SIM, gộp chung với pipeline pháp lý tuần 1.
2. Bảng ưu tiên pipeline: thêm **P-REMIT** ngay dưới P-EVENT (không thay thế, không theo mùa nên chạy song song quanh năm).
3. MUST tuần 0-2: thêm "list 5-10 FB group mục tiêu + đọc rule mỗi group".
4. SHOULD tuần 3-8: event #1 đổi mô tả từ "tự tổ chức" → "co-host với hội đồng hương/chùa qua network cá nhân trước".
5. P-SALARY: chuyển từ "cắt hẳn" sang "Phase 2, định dạng lại thành tool tra cứu thống kê" — không sửa ngay growth-plan-final, chỉ ghi nhận ở đây chờ vòng tổng hợp kế tiếp quyết định có đưa vào bản chính hay không.
