# REVIEW — Phản biện thiết kế Agent Flow (góc nhìn chuyên gia AI)
2026-07-07 · Đối tượng review: `agent-flow.md` · Ràng buộc mới: tool stack thật = **Claude Code + Codex + Gemini**

**Kết luận:** thiết kế đúng về kỷ luật vận hành (gate, trace, luật pháp lý kế thừa Loop 5), nhưng sai ở 2 chỗ nền tảng khi soi bằng tool stack thật: (1) chia 12 agent trong khi founder chỉ vận hành nổi 4 phiên/tuần; (2) chọn Google Sheets làm database trong khi Claude Code không đọc được Sheets — CSV trong repo mới đúng. Ngoài ra Gemini vắng mặt hoàn toàn dù là tool đúng nhất cho đầu vào multimodal.

---

## Finding 1 — "12 agents" là kiến trúc trình diễn; thứ thật sự có là 4 phiên làm việc
**Mức độ: NGHIÊM TRỌNG (quyết định hệ có sống qua tuần 3 không)**

Mỗi "agent" = mở 1 phiên, dán input, đọc output. Lịch tối thứ 4 là chuỗi A4→A5→A6→A7→A12 — **5 phiên trong 1h45 sau giờ làm**. Không founder solo nào duy trì nổi; kết cục thực tế: dồn hết vào 1 phiên và 12 prompt thành giấy chết.

**Sửa:** giữ 12 *vai* làm cấu trúc logic, đóng gói thành **4 session prompt theo ngày**:

| File | Gói các vai | Chạy khi |
|---|---|---|
| `session-t2-review.md` | A9 → A12 → A10 | T2 21:00 |
| `session-t3-cluster.md` | A2 → A3 | T3 21:00 |
| `session-t4-build.md` | A4 → A5 → A6 → A7 → A12 | T4 21:00 |
| `session-collect.md` | A1 | T6/T7/CN sau reply |

Một phiên chạy tuần tự các vai bên trong, **dừng ở mỗi điểm founder phải duyệt**. Chi phí thật là số lần mở phiên, không phải số file prompt.

## Finding 2 — Google Sheets là mắt xích gãy đầu tiên
**Mức độ: NGHIÊM TRỌNG (phá vỡ chính giá trị lõi: trace)**

Claude Code không có kết nối Sheets. Copy-paste bảng markdown vào sheet hàng tuần sẽ lệch cột, trùng ID, mất trace — trong khi toàn bộ giá trị của hệ là "truy ngược từ decision về comment".

**Sửa (đảo ngược §7 của agent-flow.md):**
- Database = **file CSV trong repo**: `growth-ops/db/signals.csv`, `insights.csv`, `segments.csv`, `hypotheses.csv`, `pipelines.csv`, `experiments.csv`.
- Claude Code đọc/ghi file natively; **git commit mỗi tuần = lịch sử + trace miễn phí** (thư mục `runs/` thành thừa — git log chính là trace).
- Codex viết **script validate schema** (check cột, ID format, ID trùng, tag nằm trong taxonomy) chạy trước mỗi commit.
- Muốn xem trên điện thoại: export *ra* Google Sheets như **read-only view**. Chiều dữ liệu đảo lại: repo là nguồn sự thật, sheet là màn hình.

## Finding 3 — Gemini vắng mặt, trong khi nó là tool đúng nhất cho đầu vào
**Mức độ: CAO (bỏ phí 1/3 stack + đốt quota Claude vào việc lặp)**

Signal thật không phải text sạch: là **screenshot** comment TikTok, **ảnh** poll IG, **ảnh hagaki nenkin**, video của chính mình. Đó là việc multimodal + khối lượng lớn + cần rẻ — đúng sở trường Gemini (context dài, xử lý ảnh/video, free tier rộng).

**Phân vai lại theo năng lực model:**

| Việc | Tool | Vì sao |
|---|---|---|
| A1: OCR/trích signal từ screenshot, transcribe video | **Gemini** | Multimodal, rẻ, khối lượng lớn |
| A2: tag 3 trục hàng loạt (50–100 signal/tuần) | **Gemini** | Việc lặp — để dành quota Claude cho phán đoán |
| A3–A5, A10: segment, hypothesis, pipeline, review draft | **Claude Code** | Phán đoán + đọc knowledge base 9 file loop trong repo |
| A6–A7 spec + toàn bộ code (landing, event log, share card, CSV validator) | **Codex** | Đúng phân vai SDD sẵn có |
| A12 Critic | **Model KHÁC model đã draft** | Xem Finding 4 |

## Finding 4 — Critic cùng model với author là điểm mù có cấu trúc
**Mức độ: CAO**

A4–A7 do Claude draft, A12 cũng Claude chấm — cùng một model chia sẻ cùng thiên kiến, PASS sẽ dễ dãi dần. Stack 3 tool cho lợi thế thật ở đây:

**Luật cross-model: ai draft thì model khác critique.** Claude viết hypothesis → Gemini chạy checklist A12. Gemini tag signal → Claude spot-check 10 dòng ngẫu nhiên. Rẻ, và bắt được loại lỗi mà tự-review không bao giờ bắt được.

## Finding 5 — Tag drift không chữa được bằng "drift note"
**Mức độ: TRUNG BÌNH (âm thầm, tích luỹ)**

A2 chạy mỗi tuần một phiên mới → tag lệch dần dù có ghi chú tự soi.

**Sửa: gold set** — 20 signal đã gán tag chuẩn (founder duyệt 1 lần) nằm trong `taxonomy/tags.md`, nhét vào prompt A2 **mỗi lần chạy** làm few-shot. Đổi taxonomy thì đổi gold set cùng commit. Đầu tư 1 giờ một lần, hiệu quả hơn mọi cơ chế tự soi.

## Finding 6 — Hệ agent chưa có kill criteria cho chính nó
**Mức độ: TRUNG BÌNH (vi phạm nguyên tắc của chính Growth OS)**

Mọi pipeline phải viết kill criteria trước khi chạy — hệ 12 agent thì không.

**Kill criteria cho hệ agent:** *nếu sau 4 tuần, tổng thời gian vận hành agent >1.5h/tuần, HOẶC founder nhận ra mình approve draft mà không đọc (gate thành đóng dấu) → cắt xuống 2 phiên (T2 review + T4 build), phần còn lại làm tay.* Agent phải tự chứng minh rẻ hơn làm tay, y như pipeline phải chứng minh đáng sống.

## Finding 7 — Mâu thuẫn nội bộ: Gate ① đặt đúng giờ mà checklist A11 cấm
**Mức độ: THẤP (dễ sửa, nhưng thật)**

Checklist A11 ghi "không bao giờ approve lúc 23h mệt mỏi" — nhưng lịch đặt Gate ① (duyệt script) cuối phiên T4 kết thúc 22:45. Thiết kế tự tạo điều kiện nó cấm.

**Sửa:** Gate ① dời sang **sáng T5 trước giờ làm, 10 phút** — script duyệt sáng T5 vẫn kịp quay tối T5.

---

## Thứ tự hành động nếu tiếp thu

1. Đổi DB sang CSV trong repo + Codex viết validator (Finding 2)
2. Gộp 12 prompt thành 4 session prompt (Finding 1)
3. Thêm Gemini vào A1/A2 + luật cross-model cho Critic (Finding 3, 4)
4. Làm gold set 20 signal (Finding 5)
5. Viết kill criteria cho chính hệ agent + dời Gate ① sang sáng T5 (Finding 6, 7)

Roadmap MVP 2 tuần (§10.8 agent-flow.md) **vẫn đúng trình tự** — chỉ thay "sheet" bằng "CSV" và thêm nửa buổi làm gold set.

## Những gì thiết kế gốc làm ĐÚNG (giữ nguyên, không sửa)
- 5 luật xuyên suốt kế thừa Loop 5 + ranh giới automation "agent chạm bản nháp và số liệu; người thật, tiền thật, data thật là của founder".
- Chuỗi khoá lần vết signal → decision.
- A8 monetization bị khoá cứng đến khi 特商法 xanh.
- Nguyên tắc MVP "không viết prompt trước khi có dữ liệu thật để test".
- Sprint mẫu có case bị VETO và case bị chặn bởi luật max-2 — flow biết dừng.
