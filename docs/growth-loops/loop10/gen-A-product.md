# LOOP 10 — Generator A: 10 ý tưởng mới (góc nhìn PRODUCT/TOOL)
Input: growth-plan-final.md + loop9-20-new-ideas.md · Ngày: 2026-07-08
Ràng buộc đã kiểm: không trùng ý cũ · không social/forum/chat/feed · không tư vấn thuế/visa 1-1 có phí · không dùng đề JLPT thật · khả thi solo founder 4-14h/tuần + AI coding.

---

### 1. Giải Mã Giấy Tờ Hành Chính (Paper Decoder)
- Mô tả: User chụp ảnh giấy tờ Nhật nhận được qua bưu điện (thông báo 住民税, thư nenkin, bưu thiếp 健康保険, thông báo từ 市役所) → app OCR + giải thích tiếng Việt TỪNG MỤC: đây là giấy gì, có phải trả tiền không, hạn khi nào, bước tiếp theo là gì. Chỉ giải thích thông tin chung in trên giấy — không tư vấn cá nhân hoá tình huống thuế/visa (né 税理士法/行政書士法).
- Segment phục vụ: Universal (đặc biệt S4 Fresh, S5 Cost-Optimizer, S10 Family)
- Vì sao khả thi solo founder: OCR + LLM dịch/giải thích là pipeline AI thuần, không cần content thủ công; build 1 lần, tự phục vụ mọi loại giấy.
- Rủi ro chính: Giải thích sai một mục quan trọng (hạn nộp, số tiền) gây hậu quả thật → phải có disclaimer rõ + confidence flag "mục này nên hỏi trực tiếp cơ quan".

### 2. Máy Soạn Câu Tình Huống (Keigo Composer)
- Mô tả: Chọn tình huống (xin nghỉ ốm, báo đi trễ, email hỏi 不動産, gọi điện đặt lịch bệnh viện, nhắn sếp xin về sớm) → app sinh câu tiếng Nhật đúng mức keigo, kèm bản phiên âm + giải thích vì sao dùng mẫu đó. Có nút "lưu câu hay dùng" — đúng động lực "cần lưu-dùng lại" của Loop 3.
- Segment phục vụ: Universal (mạnh nhất S4 Fresh, S6 Grad-Job-Hunter, S1 học kèm ngữ dụng)
- Vì sao khả thi solo founder: Template + LLM generation, không cần database nội dung lớn; mỗi tình huống mới chỉ là 1 prompt config.
- Rủi ro chính: Câu sinh ra sai sắc thái keigo trong ngữ cảnh công sở nhạy cảm → cần bộ tình huống được rà tay trước, không sinh tự do 100%.

### 3. Giải Mã Phiếu Lương (Payslip Decoder)
- Mô tả: User nhập (hoặc chụp) các con số trên 給与明細 → app giải thích từng dòng khấu trừ (所得税, 住民税, 厚生年金, 健康保険, 雇用保険) bằng tiếng Việt và tự đối chiếu: khấu trừ có nằm trong khoảng bình thường với mức lương này không, có dòng nào bất thường đáng hỏi lại công ty không. Khác tool thuế/nenkin đã có (tính hoàn thuế) — đây là education + anomaly flag hàng tháng.
- Segment phục vụ: S5 Cost-Optimizer, S7 Salary, S4 Fresh
- Vì sao khả thi solo founder: Công thức khấu trừ là bảng công khai của cơ quan nhà nước, logic tính thuần túy — AI code trong vài buổi.
- Rủi ro chính: Ranh giới với "tư vấn thuế cá nhân" — phải giữ ở mức giải thích chung + "khoảng bình thường", không kết luận "công ty bạn sai luật".

### 4. Trình Tạo 履歴書 Chuẩn Format Nhật (Rirekisho Builder)
- Mô tả: Form điền bằng tiếng Việt (học vấn, kinh nghiệm, lý do ứng tuyển) → app tự dịch + xuất PDF 履歴書/職務経歴書 đúng format chuẩn Nhật (kể cả quy tắc viết niên hiệu, ảnh thẻ, cách viết 退職理由 an toàn). Khác CV scorer đã có: scorer CHẤM cái đã viết, đây là TẠO từ đầu — hai đầu của cùng funnel P-CV.
- Segment phục vụ: S6 Grad-Job-Hunter, S4 Fresh
- Vì sao khả thi solo founder: Format rirekisho là chuẩn cố định, template PDF build 1 lần; phần dịch/gợi ý là LLM.
- Rủi ro chính: Mùa vụ mạnh (就活 T3-6) — ngoài mùa traffic thấp; nên launch bám lịch mùa như P-CV.

### 5. Kế Hoạch Học Ngược Từ Ngày Thi (Reverse Study Planner)
- Mô tả: User nhập ngày thi JLPT + số giờ rảnh/tuần + kết quả quiz hiện tại → app sinh lịch học tuần-theo-tuần đếm ngược, tự phân bổ theo weak_tags (ngữ pháp yếu học trước, luyện đề dồn tháng cuối). Mỗi tuần tự cập nhật lại theo tiến độ thật. Khác streak/nhật ký (ghi nhận quá khứ) — đây là bản đồ tương lai.
- Segment phục vụ: S1 N2-Plateau
- Vì sao khả thi solo founder: Tái dùng 100% data quiz/weak_tags đã có trong app; logic phân bổ là thuật toán đơn giản, không cần content mới.
- Rủi ro chính: Plan quá tham → user tụt lịch tuần 2 rồi bỏ; cần cơ chế "re-plan không phán xét" khi trễ.

### 6. Từ Điển Sống-Ở-Nhật (Life-Term Dictionary)
- Mô tả: Tra nhanh song ngữ các thuật ngữ đời sống mà từ điển thường không giải thích đủ ngữ cảnh: 敷金/礼金/更新料, 年末調整 vs 確定申告, 扶養, マイナンバー, 保証人… Mỗi mục = định nghĩa 2 câu + 1 tình huống thật + link tool liên quan trong app (tra 礼金 → gợi ý máy tính chi phí thuê nhà). Mỗi trang thuật ngữ là 1 trang SEO — cắm thẳng vào ý SEO đã GIỮ ở Loop 9.
- Segment phục vụ: Universal
- Vì sao khả thi solo founder: Viết dần 5-10 mục/tuần bằng AI + rà tay, ra content compounding; kiến trúc chỉ là static pages.
- Rủi ro chính: Nội dung tĩnh dễ bị copy — moat nằm ở internal link sang tool, không ở text.

### 7. Máy Tính Chi Phí Ban Đầu Thuê Nhà (Initial-Cost Calculator)
- Mô tả: Nhập tiền thuê tháng + khu vực → app tính vỡ ra toàn bộ chi phí ban đầu thường gặp (敷金, 礼金, 仲介手数料, 保証会社, 火災保険, chìa khóa) kèm khoảng min-max và cờ "khoản này có thể thương lượng". Khác dashboard giá thuê (đã có, PARK): không cần data submit từ user, chỉ cần công thức + khoảng thị trường công khai — nên làm được NGAY thay vì chờ.
- Segment phục vụ: S12 House-Mover, S4 Fresh
- Vì sao khả thi solo founder: Thuần công thức tính + bảng tham chiếu tĩnh, không cần database động hay đối tác.
- Rủi ro chính: Không được gợi ý công ty môi giới cụ thể (né trách nhiệm giới thiệu bên thứ ba) — chỉ dừng ở con số.

### 8. Quét Nhãn Thực Phẩm/Thuốc (Label Scanner)
- Mô tả: Chụp nhãn thành phần thực phẩm hoặc hộp thuốc OTC → app đọc và giải thích tiếng Việt: thành phần chính, chất gây dị ứng phổ biến, có chứa thịt heo/cồn không (nhu cầu thật của một bộ phận cộng đồng), liều dùng in trên hộp. Chỉ đọc-và-dịch thông tin in trên nhãn, không khuyên dùng thuốc.
- Segment phục vụ: Universal (mạnh với S10 Family — mua đồ cho con)
- Vì sao khả thi solo founder: OCR + dịch là pipeline AI có sẵn, giống kiến trúc Paper Decoder (#1) — build chung 1 nền.
- Rủi ro chính: Đọc sai nhãn thuốc là rủi ro sức khỏe → với thuốc chỉ hiển thị nguyên văn + bản dịch, tuyệt đối không diễn giải thêm.

### 9. Danh Bạ Hỗ Trợ Tiếng Việt (Support Directory)
- Mô tả: Bộ lọc tra cứu: bệnh viện có hỗ trợ đa ngôn ngữ, hotline tư vấn lao động/y tế/lãnh sự có tiếng Việt, cửa sổ tư vấn miễn phí của 国際交流協会 theo tỉnh — tổng hợp từ nguồn công khai của chính quyền/MHLW. Mỗi entry: làm gì, giờ mở, gọi thế nào (kèm câu mở đầu soạn sẵn từ tool #2). Cộng hưởng trực tiếp với partnership Kokusai Kouryu Kyoukai đã GIỮ ở Loop 9.
- Segment phục vụ: Universal (trust asset — cùng họ với cảnh báo thiên tai)
- Vì sao khả thi solo founder: Data là danh sách công khai, nhập dần theo tỉnh có đông người Việt trước (Aichi, Saitama, Osaka…); không cần API.
- Rủi ro chính: Data thối (đổi giờ, ngắt hotline) → cần trường "kiểm tra lần cuối" + nút báo lỗi 1 chạm.

### 10. Phòng Luyện Phỏng Vấn (Interview Simulator)
- Mô tả: Chọn loại phỏng vấn (就活, baito, gia hạn hợp đồng) → app hỏi từng câu phỏng vấn phổ biến bằng tiếng Nhật (text + TTS), user trả lời bằng ghi âm/gõ, AI chấm theo rubric: cấu trúc trả lời, keigo, độ dài, điểm cần tránh. Riêng tư tuyệt đối theo luật SHAME của Loop 3 — "máy không phán xét", không ai nghe thấy bạn vấp. Khác CV scorer (giấy tờ) — đây là phần NÓI của cùng hành trình xin việc.
- Segment phục vụ: S6 Grad-Job-Hunter, S4 Fresh
- Vì sao khả thi solo founder: TTS + speech-to-text + LLM rubric đều là API ghép sẵn; bộ câu hỏi phỏng vấn là kiến thức công khai, tự viết không vướng bản quyền.
- Rủi ro chính: Chi phí API voice theo lượt dùng → cần giới hạn free tier (3 câu/ngày) ngay từ đầu, cũng là đường lên premium tự nhiên.

---

## Ghi chú filter tự kiểm
- Không ý nào tạo social/forum/chat/feed.
- #1, #3 có ranh giới pháp lý với tư vấn thuế → đều giữ ở mức "giải thích thông tin chung", không tư vấn cá nhân, không thu phí 1-1.
- #8 phần thuốc chỉ dịch nguyên văn nhãn, không khuyến nghị y tế.
- #1 + #8 chung kiến trúc OCR-dịch-giải thích → build 1 nền dùng 2 nơi, tiết kiệm giờ solo founder.
- #4 + #10 là 2 mảnh bổ sung của funnel P-CV hiện có (viết → chấm → luyện nói), không trùng CV scorer.
