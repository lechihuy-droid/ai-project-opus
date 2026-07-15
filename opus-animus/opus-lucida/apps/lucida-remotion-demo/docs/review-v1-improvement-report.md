# Báo cáo cải thiện sau nghiệm thu Flow v1 — video "email-keigo"

**Ngày:** 2026-07-14
**Nguồn:** Đánh giá tổng thể của user sau khi xem `output/publish/email-keigo/video.mp4`
**Kết luận gate 3:** KHÔNG duyệt publish bản hiện tại. Video đạt về kỹ thuật (audio sync, brand token, render) nhưng chưa đạt về thiết kế: cảm giác "thay text vào template có sẵn", có lỗi logic 3-bước/4-bước.

Điểm user chấm: hoàn thiện hình ảnh 7/10 · dễ đọc 6/10 · nhịp chuyển động 5/10 · độc đáo 3/10 · giữ người xem 5/10.

---

## 1. Phân tích nguyên nhân gốc

7 vấn đề user nêu không phải 7 lỗi rời rạc — chúng quy về **4 nguyên nhân hệ thống** trong cách Flow v1 được thiết kế:

### RC1 — Flow không có bước "thiết kế visual concept" (nguyên nhân của vấn đề 1, 2, 4, 7)

Flow v1 hiện tại: S0 sinh **chữ** (script) → S3 chọn **template** theo intent (hook → cinematic-title-intro, process → progress-steps, comparison → split-screen...). Không có stage nào trả lời câu hỏi *"video này cần một cơ chế hình ảnh gì riêng cho chủ đề?"*

Hệ quả tất yếu:
- Mọi topic đều ra cùng chuỗi: typography lớn → card → steps → quote → trước/sau → CTA. Đây không phải lỗi của người chọn template — **registry chỉ có chừng đó khối, và mapping rule bắt buộc map intent → khối**.
- Không có "thế giới email" (cửa sổ soạn thư, con trỏ, đồng hồ 30:00→05:00) vì không có chỗ nào trong flow để một ý tưởng như vậy được sinh ra và đi vào video-map. Trường `assets: []` trong schema tồn tại nhưng chưa có gì produce/consume nó.
- Motion chỉ là chuyển slide (fade, stagger) vì đơn vị kể chuyện là "scene = 1 slide độc lập", không phải "1 không gian biến đổi liên tục".
- Trước/Sau chỉ là 2 panel chữ vì `split-screen` chỉ nhận text — không render được ví dụ email thật + highlight kính ngữ.

> Ví von: Flow v1 xây được một **dây chuyền in slide** rất chuẩn. Nhưng user muốn một **phim trường** — mỗi phim cần dựng bối cảnh riêng, dây chuyền in slide không làm được điều đó dù in đẹp đến đâu.

### RC2 — QA gate chỉ kiểm tra kỹ thuật, không kiểm tra ngữ nghĩa (nguyên nhân của vấn đề 3, 6)

`validate:brand` + S5 QA hiện check: schema hợp lệ, brand token đúng, caption drift, audio stream. Không check:
- **Số đếm trong claim vs số item hiển thị**: script nói "ba bước", scene `steps` render 4 mục → lọt qua mọi gate, brand score vẫn 1.00.
- **Headline trùng subtitle**: headline được sinh từ chính câu voiceover (xem RC3) nên gần như chắc chắn trùng, nhưng không gate nào bắt.

Bài học: brand score 1.00 ≠ video đúng. Gate đang đo "đúng màu, đúng font" chứ chưa đo "đúng logic, đúng hierarchy".

### RC3 — Quy tắc mapping "headline ≈ câu voiceover" phá hierarchy (nguyên nhân của vấn đề 6, một phần 5)

Khi build video-map, headline mỗi scene lấy gần nguyên văn câu voice-over ("AI xử lý tốt, nếu đưa đúng ngữ cảnh" vừa là headline giữa màn hình, vừa được subtitle đọc lại từng từ). Hai khối chữ trắng cùng tranh sự chú ý. Thiếu nguyên tắc **"voice kể — visual cho thấy"**: visual phải minh họa (chip "Khách lâu năm", "Xin lỗi giao trễ") chứ không viết lại câu nói.

### RC4 — Nhãn kỹ thuật và tỉ lệ typography lọt vào bản final (nguyên nhân của vấn đề 5, một phần 1)

- `kicker` ("01 / HOOK", "03 / BA BƯỚC") là nhãn cấu trúc phục vụ người dựng, được render vô điều kiện trong mọi layout (templateRegistry render `scene.kicker` ở cả 6 layout) → bản xuất trông như slide deck đánh số.
- Type scale hiện tại: headline rất lớn ở *mọi* scene + text phụ rất nhỏ → vừa lặp (mất tác dụng nhấn), vừa khó đọc trên điện thoại. Đã có known issue oversized-type clipping từ QA nghiệm thu, cùng gốc.

---

## 2. Action plan

Chia 2 tầng: **v1.1** (sửa để video email-keigo publish được, 1–2 buổi làm việc) và **v2 — Milestone M6 "Visual Mechanism"** (sửa gốc rễ, áp dụng từ video tiếp theo).

### Tầng 1 — v1.1 Quick fixes (sửa video hiện tại)

| # | Action | Sửa nguyên nhân | Việc cụ thể |
|---|--------|-----------------|-------------|
| A1 | Sửa lỗi 3/4 bước | RC2 (triệu chứng) | Giữ 3 bước input trong scene `steps`; chuyển "Chỉnh chi tiết" sang scene `caution` thành bước kiểm tra sau khi AI trả kết quả. Sửa cả script + video-map, re-run S2→S4. |
| A2 | Ẩn nhãn kỹ thuật | RC4 | Thêm flag `showKicker` (default `false` cho bản final) — bỏ "01 / HOOK"… khỏi bản xuất, giữ được khi debug. |
| A3 | Cân lại nhịp | RC1 (triệu chứng) | Rút CTA 8s → 3–4s, rút hook, dồn thời lượng cho `steps` và `payoff`. Quy tắc tạm: không scene tĩnh nào > 8s. |
| A4 | Tăng cỡ chữ phụ | RC4 | Nâng min font-size cho note/description/footer; test đọc trên viewport 375px. |
| A5 | Bớt trùng headline–subtitle | RC3 (triệu chứng) | Với scene `setup` và `caution`: rút headline thành cụm ngắn khác câu voice-over (vd. headline "Đưa đúng ngữ cảnh" thay vì nguyên câu). |

Kết quả kỳ vọng: video email-keigo đạt mức "publish được" (fix logic + sạch nhãn + nhịp đỡ tĩnh), chấp nhận vẫn còn generic — vì generic là bệnh cấu trúc, chữa ở tầng 2.

### Tầng 2 — v2 / M6 "Visual Mechanism" (sửa gốc rễ)

| # | Action | Sửa nguyên nhân | Việc cụ thể |
|---|--------|-----------------|-------------|
| B1 | Thêm bước "visual concept" vào S0 | RC1 | Mở rộng `approved-script.json` schema: trường `visualMechanism` bắt buộc (mechanism là gì, không gian duy nhất nào, payoff hình ảnh nào). Skill `topic-script-writer` phải đề xuất mechanism riêng theo topic — user duyệt mechanism cùng lúc duyệt script (gate 1 không tăng thêm lần duyệt). |
| B2 | Bộ component "email world" | RC1 | Build domain components: cửa sổ email (JP text), chip ngữ cảnh kéo-thả vào prompt, timer morph 30:00→05:00, diff-highlight kính ngữ trước/sau, con trỏ sửa text. Kiến trúc scene chuyển từ "6 slide rời" → "1 không gian liên tục + state transitions" (vẫn tái dùng Remotion sequence bên dưới). |
| B3 | Nâng QA gate ngữ nghĩa | RC2 | Thêm vào `validate:brand` (hoặc script QA mới): (a) số đếm trong headline/CTA vs số item render; (b) độ trùng lặp headline vs subtitle cùng scene (cảnh báo nếu > ~70% từ trùng); (c) max static-scene duration; (d) min font-size. |
| B4 | Quy tắc hierarchy vào mapping rules | RC3 | Ghi vào skill/mapping rules: headline ≤ 6 từ, không lặp nguyên văn voice-over; visual minh họa nội dung, subtitle là kênh duy nhất lặp lời thoại. |
| B5 | Art direction v2 | RC4 | Palette bổ sung theo góp ý: graphite / ivory-giấy / champagne gold / đỏ son (chỉ cho lỗi & correction). Typography lớn CHỈ cho hook. Card mang chất "cửa sổ email/tài liệu" thay vì card dashboard. |

Thứ tự làm: **B1 → B3 → B4** (rẻ, thay đổi rule + schema, chặn tái phạm ngay) rồi **B2 + B5** (đắt nhất — build component mới, nên làm cho đúng video tiếp theo thay vì retrofit email-keigo).

### Điểm cần user quyết

1. **Email-keigo**: chỉ chạy v1.1 rồi publish, hay đợi luôn v2 làm lại theo continuous narrative (script 58s giữ nguyên, dựng lại toàn bộ visual)?
2. **M6 scope**: bộ component "email world" làm riêng cho chủ đề email, hay thiết kế ngay dạng tổng quát (mechanism kit: window / chip / timer / diff) để topic sau tái dùng?

---

## 3. Bài học ghi vào flow

- Brand gate PASS ≠ video đạt. Cần thêm lớp "semantic QA" trước gate 3.
- Mỗi video phải có **một visual mechanism riêng gắn với chủ đề** — đây là yêu cầu ở S0 (lúc viết script), không phải trang trí ở S3.
- Template registry là **hộp LEGO nền** (tái dùng), mechanism là **mô hình lắp riêng cho từng chủ đề** — flow phải có chỗ cho cả hai.
