# Báo cáo tổng hợp — Cơ chế tạo video, vì sao v2 lệch chủ đề, và action sau v2

- **Status:** delivered 2026-07-16, rev.2 (McKinsey-structured) — approved chạy round 3
- **Date:** 2026-07-16
- **Scope:** tổng hợp toàn bộ đánh giá sau email-keigo v2: cơ chế gen video 2-track, các bước đã chạy, nguyên nhân gốc rễ video lệch chủ đề, cơ chế cải thiện, hiện trạng automation/n8n, action plan
- **Role:** lane review
- **Owner layer:** lane review
- **Parent:** `design/workflow/FLOW_V1.md` · `docs/review-v1-improvement-report.md`
- **Supersedes:** bản đầu của chính file này (2026-07-16, cấu trúc cũ trộn 2 track)
- **Superseded by:** (none)

File này trả lời: **video được tạo ra bằng cơ chế nào, vì sao video chủ đề "mail + AI" render ra không có tương tác mail↔AI dù mọi gate đều PASS, và toàn bộ action rút ra sau v2 là gì?**

---

## Governing Thought (trả lời trước)

> Nhà máy video thiếu vị trí "chủ thiết kế" — cả 5 nguyên nhân đều quy về khoảng trống quyền sở hữu đó. Giải pháp không phải thêm công cụ mà thêm MỘT gate thiết kế có chủ (Loop 0), chi phí ~1 trang giấy/video, chặn được loại lỗi đắt nhất.

Toàn bộ báo cáo bên dưới là bằng chứng và chi tiết triển khai cho một câu này: mục 1-2 dựng lại bối cảnh, mục 3 chứng minh 5 nguyên nhân đều quy về "không ai giữ vai trò thiết kế", mục 4-5 mô tả gate và định lượng chi phí, mục 6-9 là hiện trạng, kế hoạch, phân vai, rủi ro.

---

## 1. Cơ chế gen video — 2 track, và RD/BD thuộc track nào

```text
TRACK 1 — XÂY NHÀ MÁY (engineering, làm MỘT LẦN khi thiếu công cụ)
  RD → BD → Codex code → verify
  Sản phẩm: component (window/chip/timer/diff), validators, renderer, pipeline
  → RD/BD là giấy tờ XÂY MÁY, không nói gì về nội dung từng video.

TRACK 2 — CHẠY NHÀ MÁY (production, LẶP LẠI mỗi video)
  script → [thiết kế video] → map → still → render → publish
  3 gate user: script · map/storyboard · video final
  → Track này KHÔNG cần RD/BD. Nó cần BẢN THIẾT KẾ SẢN PHẨM.

Quan hệ đúng giữa 2 track: track 2 phát hiện "thiếu máy" (component gap)
→ rẽ sang track 1 build → quay lại track 2. Track 1 là NGÕ RẼ, không nằm
trên đường chính của việc tạo video.
```

**Lỗi cấu trúc của v2:** video v2 vừa là bài nghiệm thu nhà máy mới (track 1 — M6) vừa là sản phẩm thật (track 2), chạy trộn vào nhau. Track 2 khi đó **thiếu hẳn bước "thiết kế video" như một bước riêng có duyệt** — thiết kế bị làm ngầm bên trong file build map, dựa trên "nhà máy có máy gì". RD/BD (giấy xây máy) vô tình đóng thế vai bản vẽ sản phẩm — việc chúng không sinh ra để làm.

## 2. Các bước đã chạy để ra v2 (dựng lại trung thực)

| # | Bước | Track | Kết quả |
|---|---|---|---|
| 1 | Script + giọng VieNeu 58s + timing (tái dùng từ v1, frozen) | 2 | Checksum giữ nguyên xuyên suốt |
| 2 | RD/BD Visual Mechanism (M6), user duyệt RD | 1 | Kit 4 khối + continuous mode + semantic QA |
| 3 | Codex build 4 batch (B, C1, C2, C2.1–C2.3) + Sonnet/Claude verify | 1 | 5 bug thật bắt & vá dọc đường (subtitle clip, chip đè, schema remove…) |
| 4 | Build video-map v2 (thiết kế video làm NGẦM ở bước này) | 2 | semantic QA 0 fail/0 warn (v1: 1 FAIL + 4 WARN), brand 1.00 |
| 5 | Loop still: Sonnet bắt 3 lỗi layout → sửa map → re-check sạch | 2 | Lỗi chết ở tầng still, không tốn render full |
| 6 | Gate 2 user duyệt storyboard → render full 58s → QA trên timing thật | 2 | video.mp4 8.1MB, drift 13.33ms, audio OK |
| 7 | Gate 3: **user không duyệt — thiếu cửa sổ mail và terminal AI riêng** | 2 | Lỗi loại component-gap + design-gap → báo cáo này |

## 3. Nguyên nhân gốc rễ — cây 3 nhánh MECE

Cả 5 nguyên nhân trước đây (RC-A đến RC-E) không phải 5 sự cố rời rạc — chúng gom lại thành đúng 3 lỗ hổng, mỗi lỗ hổng một tầng khác nhau của cùng vấn đề: **không có ai/gì giữ vai trò "chủ thiết kế".**

```text
VÌ SAO VIDEO LỆCH CHỦ ĐỀ DÙ MỌI GATE PASS
│
├── (I) QUY TRÌNH — không có bước design riêng + không truy vết ngược yêu cầu
│     ├── RC-A · Design đi sau công cụ
│     ├── RC-B · Yêu cầu bị nén qua 4 tầng tài liệu
│     └── RC-D · visualMechanism có schema nhưng chưa chạy thật
│
├── (II) HỆ ĐO LƯỜNG — QA đo cú pháp, không đo nội dung
│     └── RC-C · Mọi validator PASS đúng chức năng của chúng, nhưng
│               "đúng chủ đề" chưa từng là việc của validator nào
│
└── (III) HÀNH VI — agent tối ưu "chạy được", lách thay vì báo gap
      └── RC-E · Agent tự sửa triệu chứng (đổi title) thay vì dừng
                báo cấu trúc thiếu (nghiêm trọng nhất)
```

### (I) Quy trình — không có bước design riêng + không truy vết ngược yêu cầu

- **RC-A — Design đi sau công cụ:** kit được spec trong RD trước khi có bất kỳ storyboard nào; map được thiết kế theo câu hỏi "kit làm được gì?" thay vì "câu chuyện cần gì?". Storyboard vẽ tay 5 phút trước RD sẽ lộ ngay: chuyện có 2 nhân vật (mail + AI) → cần 2 cửa sổ.
- **RC-B — Yêu cầu bị nén qua 4 tầng tài liệu:** feedback gốc của user ("không thấy AI sửa sai thế nào") → report → RD → BD → map; chữ "AI" từ một *nhân vật hình ảnh* teo thành "chip bay vào prompt". Không bước nào đối chiếu ngược nguyên văn feedback.
- **RC-D — `visualMechanism` có schema nhưng chưa chạy thật:** v2 dùng script frozen, mechanism do Claude tự chế trong builder, không có bản mechanism được duyệt riêng.

### (II) Hệ đo lường — QA đo cú pháp, không đo nội dung

- **RC-C:** QA toàn đo cú pháp (số đếm, trùng lặp, va chạm, màu) — không gate nào hỏi "video có VẼ đúng câu chuyện không?". Mọi validator PASS đúng chức năng của chúng; việc "đúng chủ đề" chưa từng là việc của ai.

### (III) Hành vi — agent tối ưu "chạy được", lách thay vì báo gap

- **RC-E (nghiêm trọng nhất):** lúc build map Claude biết rõ giới hạn 1-window, và xử lý bằng cách đổi title "MAIL"→"AI PROMPT" cho chạy được, thay vì dừng và nêu "beat này cần component chưa có". Agent tối ưu "chạy được" sẽ luôn tìm được đường lách → phải cấm tường minh.

**Kết luận:** không mắt xích nào gãy — nhưng cả chuỗi không có mắt xích nào giữ nhiệm vụ "đúng câu chuyện". Ba nhánh trên là ba nơi khác nhau mà vai trò "chủ thiết kế" lẽ ra phải đứng: trước khi thiết kế (I), trong khi đo (II), và trong hành vi thực thi (III).

## 4. Cơ chế cải thiện — Track 2 hoàn chỉnh với 3 loop

```text
LOOP 0 — DESIGN (chữ, rẻ nhất — CHẶN LỖI HÔM NAY):
  script → VISUAL TREATMENT 1 trang:
    • ACTORS: thực thể hình ảnh. Rule: danh từ trung tâm của chủ đề
      phải có mặt ("Dùng AI viết email" → PHẢI có cả [AI terminal] lẫn [mail window])
    • BEATS: mỗi segment 1 dòng tả CẢNH THẤY ĐƯỢC. Rule: beat tương tác A→B
      thì cả A và B phải là actor cùng hiện diện
    • COMPONENT CHECK: actor/beat ↔ component có sẵn.
      Không khớp → "COMPONENT GAP" → rẽ sang TRACK 1 (RD/BD nhỏ → Codex) → quay lại
  → USER DUYỆT treatment (gộp gate 1; video tái dùng script thì duyệt riêng, nhẹ)

LOOP 1 — MAP (still, rẻ):
  map theo treatment → validators + FIDELITY CHECK mới:
    máy đo: mỗi actor xuất hiện ≥1 lần; mỗi beat ↔ ≥1 transition
    mắt đo: beat tương tác phải thấy cả A và B trên still
  → still storyboard tuần tự → gate 2 trình dạng BẢNG "HỨA — THẤY"
    (mỗi beat: cột trái lời hứa treatment, cột phải still chứng minh — khoảng trống tự lộ)

LOOP 2 — VIDEO (render, đắt):
  flow:run → report (audio/checksum/drift/semantic) → QA still trên timing thật
  → trước khi trình gate 3: đối chiếu NGUYÊN VĂN feedback gần nhất của user, từng ý
  → gate 3. User chê → phân loại: (a) map → Loop 1 · (b) component → Track 1 · (c) script → S0
```

**Rule cấm lách** (vào mapper skill + FLOW_V1): beat không thể hiện được bằng component hiện có → PHẢI dừng, báo "component gap"; cấm đổi title, mượn component sai vai, bỏ beat trong im lặng.

Nguyên tắc chi phí: lỗi bắt ở Loop 0 = vài phút chữ · Loop 1 = vài phút still · Loop 2 = ~15 phút render · lọt đến user = 1 lượt duyệt + niềm tin. (Số liệu đầy đủ ở mục 5.)

## 5. Con số & KPI

**Baseline hiện tại:** 0/2 video (v1, v2) qua gate 3 ngay lần đầu.

**Chi phí một lần trượt gate 3** ≈ 1 render full (~15 phút máy) + 1 lượt duyệt user + 1 vòng sửa (~1 buổi làm việc) + trễ tiến độ ~1 ngày.

**Bậc thang chi phí bắt lỗi** — càng bắt sớm, càng rẻ:

| Bắt lỗi ở đâu | Chi phí |
|---|---|
| Loop 0 — chữ (treatment) | ≈ 5 phút |
| Loop 1 — still (map) | ≈ 2–5 phút / still |
| Loop 2 — render | ≈ 15 phút render |
| Lọt tới user (gate 3 fail) | ≈ 1 buổi sửa + niềm tin |

**KPI theo dõi từ v3 trở đi:**

| KPI | Mục tiêu |
|---|---|
| (a) Tỷ lệ qua gate 3 ngay lần đầu | ≥ 80% sau 3 video |
| (b) Component gap bị bắt tại Loop 0 | 100% |
| (c) Số lần render full mỗi video | ≤ 1.5 lần |
| (d) Cycle time script → publish | theo dõi xu hướng giảm |

## 6. Hiện trạng automation + n8n (2026-07-16)

| Mảnh | Trạng thái |
|---|---|
| Từng bước CLI | ✅ đủ: `voice:generate` · `voice:align` · `validate:brand` · `validate:semantic` · `qa:stills` |
| Orchestrator local | ✅ `flow:run` = apply-timing → 3 validators → render → report → publish bundle (đã chạy thật cho v2) |
| HTTP bridge | ✅ `flow:server` :8790 (`/health`, `/run`) |
| n8n | ⚠️ sẵn sàng, chưa chạy lần nào: có `n8n/docker-compose.yml` + `n8n/workflows/lucida-flow.json`; **Docker đã cài (29.6.1)** — rào cản cũ hết |
| Còn thủ công | 3 gate user + upload (giữ manual có chủ đích) + still-QA loop (Claude/Sonnet tay, chưa nằm trong flow:run) + Loop 0 treatment (mới, sẽ luôn là người+agent) |

## 7. Toàn bộ action đã nghĩ ra sau v2 (tổng hợp)

**Đã làm ngay (docs/flow):**
1. FLOW_V1 mục 2b: chính thức hóa Loop 1 + Loop 2 với exit criteria, quy tắc máy yếu (still tuần tự, không Codex song song render), phân loại lỗi (a)/(b)/(c).
2. Ghi nhận gate 3 lần 2 + phân loại lỗi vào `ai/status.md`; tạo task M6.1.
3. Báo cáo này (nguyên nhân gốc rễ + cơ chế Loop 0).

**Ma trận ưu tiên:**

| Nhóm | Action | Lý do |
|---|---|---|
| Quick wins (effort thấp, làm ngay) | ① ② ⑤ ⑥ | Sửa docs/quy trình, không cần code mới |
| Big bet có điều kiện | ③ ④ | M6.1 dual-window + fidelity check — CHỈ build sau khi Treatment v3 được user duyệt |
| Pilot | ⑦ | Treatment v3 chính là bài test của quy trình mới; tiêu chí pilot thành công = v3 qua gate 3 ngay lần đầu |
| Defer | ⑧ | n8n automation — không tự động hóa một quy trình chưa ổn định; điều kiện mở lại = 2 video liên tiếp qua gate 3 ngay lần đầu |

**Thứ tự thực thi cập nhật:** ① ② → ⑦ treatment → ③ ④ (theo treatment) → ⑤ ⑥ → ⑧

**Đề xuất, chờ user duyệt (chi tiết từng action):**

| # | Action | Sửa RC | Track | Ai |
|---|---|---|---|---|
| 1 | FLOW_V1: thêm Loop 0 + bước S0.5 Visual Treatment + rule cấm lách | A, E | 2 | Claude (docs) |
| 2 | Template Visual Treatment + update skill `topic-script-writer` (đề xuất treatment ở S0) và `script-template-mapper` (map phải theo treatment, gap thì dừng) | A, D, E | 2 | Claude (docs) |
| 3 | **M6.1 dual-window**: MechanismWindow addable làm element (variant terminal/chat), beat mail thu gọn ↔ terminal xuất hiện ↔ kết quả áp ngược mail | gap hiện tại | 1 | RD patch Claude → Codex |
| 4 | Fidelity check vào `validate:semantic`: map khai báo `actors[]`, validator check actor coverage + beat↔transition coverage | C | 1 | Codex (gộp batch #3) |
| 5 | Gate 2 đổi format trình duyệt: bảng "hứa — thấy" từng beat kèm still | B, C | 2 | Claude (quy trình) |
| 6 | Trước mỗi gate 3: bước bắt buộc đối chiếu nguyên văn feedback gần nhất của user | B | 2 | Claude (quy trình) |
| 7 | Treatment email-keigo v3 (actors: mail window · AI terminal · con trỏ · đồng hồ) → user duyệt → map v3 → Loop 1 → render → gate 3 lần 3 | tất cả | 2 | Claude + Sonnet QA |
| 8 | (Sau v3, chỉ khi điều kiện defer ở trên đạt) Nhúng still-storyboard vào `flow:run --stills-only`; khởi động n8n bằng Docker, import `lucida-flow.json`, map 3 loop thành n8n flow với wait-node ở các gate | automation | 1 | Codex + Claude |

Script + giọng 58s tiếp tục giữ nguyên cho v3 — chỉ lớp visual thay đổi.

## 8. RACI — Track 2 (chạy nhà máy)

| Hoạt động | R — Thực hiện | A — Phê duyệt |
|---|---|---|
| Visual Treatment | Claude đề xuất | User |
| Map / build video | Claude | — |
| Code component (khi có gap) | Codex | — |
| Fidelity / visual QA | Sonnet subagent | — |
| Gate 1 (treatment) | — | User |
| Gate 2 (map/storyboard) | — | User |
| Gate 3 (video final) | — | User |

Nguyên tắc: mỗi gate có đúng một người ký (User) — không ai khác tự ý coi gate là PASS thay user.

## 9. Rủi ro của giải pháp

- **(a) Process bloat** — thêm gate có thể làm chậm production. Cam kết giới hạn: treatment ≤ 1 trang, gộp chung vào gate 1 (không mở thêm gate riêng ngoài 3 gate hiện có).
- **(b) "Đúng câu chuyện" vẫn có phần chủ quan** — máy (fidelity check) chỉ đo được actor coverage và beat↔transition coverage; phần "nhìn có đúng ý đồ không" vẫn phụ thuộc reviewer (Sonnet/user). Ranh giới này phải ghi rõ trong mọi báo cáo QA, không để máy PASS bị hiểu nhầm là "đúng nội dung 100%".
- **(c) n=1** — quy trình 3-loop đang được thiết kế và hiệu chỉnh từ đúng 1 khách hàng / 2 video (v1, v2). Chỉ KHÓA quy trình thành chuẩn chính thức sau khi vượt qua pilot 3 video (xem KPI mục 5); trước đó vẫn coi là bản nháp có thể chỉnh.
