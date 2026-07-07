# DEMO v2 — Một tuần chạy thật với tính năng "Quiz chẩn đoán đọc hiểu N2"
2026-07-07 · Minh hoạ end-to-end cho `agent-flow-v2.md` · **Toàn bộ dữ liệu dưới đây là MÔ PHỎNG** (số liệu giả định thực tế) — dùng làm mẫu format, không phải số thật.

**Tính năng demo:** quiz 10 câu CHỈ đọc hiểu, kết quả trả về "bạn sai KIỂU nào" (4 kiểu sai) — từ insight người thi N2 nhiều lần kẹt ở dokkai. Đi hết vòng: ảnh trong inbox → cluster → build → duyệt sáng T5 → quay/đăng → collect → review T2 quyết định.

---

## NGÀY 0 (cả tuần trước) — Founder thả ảnh vào inbox, mỗi lần 30 giây

```
growth-ops/inbox/
├─ 2026-07-01_tiktok-cmt-1.png      # screenshot 4 comment dưới video P-01-a
├─ 2026-07-02_ig-poll.png           # kết quả poll story "phần nào sợ nhất?"
├─ 2026-07-03_fb-group.png          # post group Người Việt ở Tokyo (đã crop bỏ tên người đăng)
├─ 2026-07-05_tiktok-cmt-2.png
└─ private/
   └─ 2026-07-04_dm-hoc-vien.png    # DM có tên thật → CHỈ Claude đọc, cấm Gemini
```

---

## PHIÊN 1 — `session-t3-cluster` (Thứ 3, 21:00–22:00)

Founder mở Claude Cowork, gõ: *"chạy session-t3-cluster"*. Claude đọc `sessions/session-t3-cluster.md` và tự chạy:

### Bước 1 — Claude đọc ngữ cảnh bắt buộc (không cần founder)
```
Read: docs/growth-loops/growth-plan-final.md (mục decision rules)
Read: growth-ops/taxonomy/tags.md (taxonomy + GOLD SET 20 ví dụ)
Read: growth-ops/db/weekly_review/2026-W27.md (tuần trước)
```

### Bước 2 — PII check trước khi gọi Gemini
> **Claude:** Inbox có 5 file, trong đó `private/` có 1 ảnh DM. 4 ảnh còn lại: 3 screenshot comment/poll công khai, 1 ảnh group đã crop tên. Xác nhận 4 ảnh ngoài `private/` không còn định danh? *(founder: ok)*

### Bước 3 — Gọi Gemini quét inbox (shell, founder chỉ nhìn)
```bash
gemini -p "Đọc 4 ảnh sau. Với MỖI comment/poll trong ảnh, trả về 1 dòng CSV:
raw_text (NGUYÊN VĂN kể cả sai chính tả),source,signal_type,created_at.
KHÔNG diễn giải, không sửa chính tả, không thêm cột." \
  inbox/2026-07-01_tiktok-cmt-1.png inbox/2026-07-02_ig-poll.png \
  inbox/2026-07-03_fb-group.png inbox/2026-07-05_tiktok-cmt-2.png
```
Gemini trả 9 dòng. Ảnh trong `private/` Claude tự đọc (1 dòng). Claude gán `signal_id`, `pii_check`, ghép thành 10 dòng.

### Bước 4 — Gemini tag hàng loạt (kèm gold set trong prompt)
```bash
gemini -p "$(cat taxonomy/tags.md)  ← chứa 20 ví dụ gold set
Tag 10 dòng sau theo đúng 3 trục + strength + sqs. Không chắc → UNKNOWN." < /tmp/batch.csv
```

Kết quả (trích 5/10 dòng đã vào `db/signals.csv`):

```csv
signal_id,raw_text,source,signal_type,domain_tag,emotion_tag,intent_tag,strength,sqs,pii_check
SIG-W28-001,"thi lần 3 rồi mà đọc hiểu vẫn 39/60, nghe với từ vựng thì ổn",tiktok,comment,N2_HOC,BUC_XUC,HOI_CACH_LAM,2,3,owned
SIG-W28-002,"dokkai đọc xong quên luôn câu hỏi hỏi gì :))",tiktok,comment,N2_HOC,TU_TRAO,CHIA_SE,1,3,owned
SIG-W28-004,"poll 63 người: đọc hiểu 41 · nghe 12 · từ vựng 10",instagram,poll,N2_HOC,LO_AU,SO_SANH,2,4,owned
SIG-W28-007,"có ai luyện đọc mà lên điểm thật không chỉ mình với, mình sắp hết hạn coe",facebook,group_post,N2_HOC,LO_AU,NHO_LAM_HO,3,2,cleaned
SIG-W28-009,"em làm bài đọc toàn hết giờ ở 2 bài cuối",app,dm,N2_HOC,HOANG_MANG,HOI_CACH_LAM,2,5,owned
```

### Bước 5 — Claude spot-check 10 dòng (ở đây là cả 10) → sửa 1 lỗi
> **Claude:** Gemini tag SIG-W28-007 strength 2 — sai, intent NHO_LAM_HO auto strength 3 theo luật loop1. Đã sửa. 9/10 đúng (90% — trên ngưỡng kill 80%).

### Bước 6 — Cluster → insight draft → GATE duyệt insight
> **Claude:** Giao điểm `N2_HOC × (LO_AU|BUC_XUC) × HOI_CACH_LAM` có 6 signal, 4 loại nguồn (comment, poll, group, DM), tổng SQS = 19 ≥ 8 → đạt chuẩn insight:
>
> **INS-W28-01:** *"Người thi N2 nhiều lần kẹt riêng ở ĐỌC HIỂU, biết chính xác điểm mình (39/60), và mô tả được triệu chứng cụ thể (quên câu hỏi, hết giờ 2 bài cuối) — họ không cần 'học thêm', họ cần biết SAI Ở ĐÂU."* — evidence: 6 signal id · confidence 4/5.
>
> Segment: map vào S1 N2-Plateau, nhiệt độ NÓNG lên. Không cần segment mới.
> **Duyệt insight này vào backlog?** *(founder: approve — "triệu chứng 'hết giờ 2 bài cuối' hay, giữ nguyên văn này cho content")*

### Bước 7 — Commit
```bash
git add growth-ops/db/ && git commit -m "W28 T3: +10 signals, INS-W28-01 approved (S1 dokkai)"
```
**Hết phiên: 52 phút. Founder tương tác 2 lần.**

---

## PHIÊN 2 — `session-t4-build` (Thứ 4, 21:00–22:30)

Founder: *"chạy session-t4-build"*.

### Bước 1 — Claude draft Hypothesis (vai A4)
```csv
hypothesis_id: HYP-W28-01
segment_id: S1 · raw_insight: INS-W28-01
hypothesis: "Nếu có quiz 10 câu CHỈ đọc hiểu trả về 'bạn sai KIỂU nào' (4 kiểu:
  hết giờ / quên câu hỏi / đoán sai ý tác giả / từ nối), thì complete ≥25% (n≥100)
  và signup-để-lưu ≥8% trong 2 tuần — vì S1 muốn CHẨN ĐOÁN, không muốn thêm bài học."
metric: complete ≥25% n≥100 · kill_criteria: complete <15% sau n=150 → KILL
legal_trust_flag: review → 10 câu 100% tự viết, cấm chữ "đề thật"
```

### Bước 2 — Pipeline check (vai A5)
> **Claude:** Đang 2 pipeline LIVE? Kiểm `pipelines.csv`: P-N2 (LIVE), P-EVENT (LIVE-frozen tuần này không event). P-N2-DOKKAI là **nhánh con của P-N2** (cùng segment, cùng archetype A1) → không chiếm slot mới, chạy như experiment của P-N2. Score 4.1 (×1.2 mùa: điểm JLPT công bố đầu T8). **Duyệt hypothesis + gắn vào P-N2?** *(founder: approve)*

### Bước 3 — Claude viết 2 script (vai A6, hook nguyên văn từ signals)
**Script A (pid=P-N2-DOKKAI-a):**

| Giây | Thoại | Overlay |
|---|---|---|
| 0–3 | "Thi N2 lần 3, đọc hiểu vẫn 39/60?" *(← SIG-W28-001)* | 39/60 đỏ chữ to |
| 3–12 | "Không phải bạn dốt. Là bạn đang sai cùng MỘT KIỂU lặp đi lặp lại — có 4 kiểu sai dokkai" | 4 kiểu hiện lần lượt |
| 12–30 | Giải thích kiểu 2 "đọc xong quên câu hỏi" *(← SIG-W28-002)* + 1 mẹo thật | demo 1 câu |
| 30–45 | "3 kiểu còn lại, mỗi kiểu chữa khác nhau" | — |
| 45–55 | CTA: "Test 10 câu xem bạn sai kiểu nào — 3 phút, không cần đăng ký. Link bio." | link + pid |

**Script B (pid=…-b):** hook từ SIG-W28-009 *"toàn hết giờ ở 2 bài cuối"* — góc time-management.

### Bước 4 — Landing spec (vai A7) → brief cho Codex
> Landing = quiz bắt đầu NGAY (không trang giới thiệu) · kết quả = radar 4 kiểu sai CỦA BẠN · nút "Lưu kết quả để so lần sau" (login chỉ để save — bậc 3 thang cam kết) · câu APPI tại form: "Email chỉ để lưu kết quả của bạn, không gửi quảng cáo" · events log: `quiz_start, quiz_complete, result_view, save_click, signup_done` — tất cả kèm `pid` từ localStorage.

```bash
codex exec "FRESH START, don't ask. Đọc brief growth-ops/tools/briefs/dokkai-quiz.md,
implement quiz page theo spec, chạy validate_csv.py sau khi thêm event schema. Report lại."
```
→ Codex trả: quiz page + event logging xong, validator PASS. (10 câu hỏi do founder + Claude viết riêng — **không giao Codex nội dung**, chỉ giao khung.)

### Bước 5 — Critic chéo bằng Gemini (luật cross-model)
```bash
gemini -p "$(cat sessions/critic-checklist.md)
Chấm PASS/FAIL 6 mục cho: [2 script + landing spec + hypothesis]"
```
> **Gemini:** FAIL mục 3 — Script B CTA thiếu thời lượng ("làm thử quiz" không nói mất bao lâu, không phá friction).
> **Claude:** Sửa CTA script B thành "10 câu, 3 phút, kết quả hiện luôn không cần email" → Gemini re-check: PASS cả 6.

### Bước 6 — Kết phiên
> **Claude:** 2 script + landing đã sẵn, critic PASS, **để ở `db/weekly_review/W28-gate1-pending.md` chờ bạn duyệt SÁNG MAI** (luật Gate ① sáng T5). Commit xong. Ngủ ngon.

**Hết phiên: 78 phút. Founder tương tác 2 lần (duyệt hypothesis + trả lời 1 câu về mẹo dokkai).**

---

## GATE ① — Sáng thứ 5, 7:40, 10 phút, đầu óc tỉnh

Founder mở file pending trên điện thoại (sheet view) hoặc mở phiên nhanh:
> Check 4 câu A11: luật xuyên suốt? — không chữ "đề thật", câu hỏi tự viết ✓. Số dẫn chứng thật? — mở signals.csv thấy SIG-W28-001 ✓. Chi phí nếu sai? — chỉ tốn 1 slot content ✓. Trong 14h? ✓.
> **Verdict: APPROVE cả 2 script, sửa 1 chữ script A ("dốt" → "chậm").**

**Tối T5:** quay 2 video theo script (2h, như plan-tuan). **T6 20:00:** đăng script A. **CN 20:00:** đăng script B.

---

## PHIÊN 3 — `session-collect` (T6 21:05, T7, CN — mỗi lần ~10')

Founder dán comment mới sau khi đăng:
> *"comment mới: 'ủa đúng kiểu 2 luôn, đọc xong quên sạch' · 'quiz này free hả' · 'lần trước 42/60 giờ muốn thử' + 1 DM hỏi có bản cho N3 không"*

Claude (vai A1) chuẩn hoá → 4 rows mới → nhận xét 1 dòng: *"'có bản cho N3 không' = NHO_LAM_HO strength 3, đánh dấu cho cluster tuần sau — KHÔNG hành động gì tuần này (luật: quyết định chỉ ở T2)."* → commit.

---

## PHIÊN 4 — `session-t2-review` (Thứ 2 tuần sau, 21:00–22:15)

### Bước 1 — Claude kéo số (vai A9 — chỉ số, không diễn giải)
```
[SỐ] W29 · experiment EXP-W28-01 (quiz dokkai, chạy T6→CN, 9 ngày còn lại)
  quiz_start:        143   (nguồn: pid P-N2-DOKKAI-a: 98 · -b: 45)
  quiz_complete:     41/143  — ngưỡng ≥25% n≥100: ĐANG TRÊN (28.7%, n đủ)
  save_click:        14/41
  signup_done:       9/41   — ngưỡng ≥8%: ĐANG TRÊN (22%... tính trên complete)
                              ⚠ định nghĩa metric là signup/complete hay /start? → cần chốt
  kill check:        complete <15% sau n=150? KHÔNG chạm (n=143)
  JP-IP CTR video A: 4.1% · video B: 1.9%
```

### Bước 2 — Gemini critic chéo bảng review draft → PASS (có đủ n/n, không suy diễn)

### Bước 3 — Claude draft quyết định (vai A10)
> **Đề xuất: GIỮ THÊM 1 TUẦN, chưa SCALE** — rule "KPI ≥ ngưỡng 2 tuần liên tiếp" mới đạt tuần 1. Iterate 1 biến cho video B (hook yếu, CTR 1.9% vs 4.1%): thử hook poll "41/63 người sợ nhất đọc hiểu" thay hook thời gian. Việc tuần này: chốt định nghĩa signup metric (đề xuất: trên complete, vì thang cam kết đo từ người ĐÃ nhận giá trị). Nợ: chưa có gì pháp lý treo.

### Bước 4 — GATE ③ founder quyết
> **Founder:** Đồng ý giữ 1 tuần + iterate hook B. Metric chốt trên complete. Ghi thêm [HỌC]: "comment hỏi N3 = tín hiệu mở rộng, để backlog."
> **Claude:** Ghi weekly_review/2026-W29.md, cập nhật experiments.csv (`decision: iterate · decided_by: founder · note: "tuần 1/2, hook B đổi 1 biến"`), commit.

---

## Tổng kết demo — trace khép kín & chi phí thật

**Trace:** `SIG-W28-001…009 → INS-W28-01 → S1 → HYP-W28-01 → P-N2(-DOKKAI) → EXP-W28-01 → decision "iterate, tuần 1/2"` — mỗi mũi tên là 1 commit git, truy ngược từ quyết định về đúng 6 cái comment gốc trong 2 phút.

**Chi phí founder cho hệ AI trong tuần demo:** T3 ~20' + T4 ~25' + Gate① 10' + collect 3×5' + T2 ~35' ≈ **1h45... ⚠ VƯỢT ngưỡng kill 1.5h/tuần** — nhưng đây là tuần có build mới (có phiên T4 full + Gate①). Tuần không build mới ước ~55'. → Đúng thiết kế: đo 4 tuần rồi mới phán theo kill criteria §6, không phán theo 1 tuần.

**3 khoảnh khắc hệ chứng minh giá trị trong demo:** (1) Gemini tag sai strength SIG-W28-007 → Claude spot-check bắt được — cross-check hoạt động; (2) Gemini critic bắt CTA script B thiếu thời lượng — lỗi Claude tự viết tự soát sẽ trượt; (3) A9 phát hiện metric "signup ≥8%" chưa định nghĩa rõ mẫu số — lỗ hổng của chính hypothesis, lộ ra khi có số thật.
