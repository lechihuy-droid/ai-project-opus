# NORTH STAR — OPUS ANIMUS
*Kim chỉ nam cho toàn bộ project*
**Viết bởi:** Lê Chí Huy | **Date:** 2026-04-28

---

## I. Mục Đích Tối Thượng

> **Xây dựng một hệ thống tư duy sống — nơi tri thức không chỉ được lưu trữ mà được tiêu hóa, kết nối và chuyển hóa thành con người tốt hơn mỗi ngày.**

OPUS ANIMUS không phải là một RSS reader thông minh.
OPUS ANIMUS không phải là một công cụ lưu trữ.

OPUS ANIMUS là **ngoại hóa của bộ não** — một hệ thống nhớ, suy nghĩ, và phát triển song song với chủ nhân của nó.

---

## II. Triết Lý Nền Tảng

### 1. Tri thức chỉ có giá trị khi được tiêu hóa
Thu thập thông tin ≠ học. Đọc ≠ hiểu. Lưu trữ ≠ sở hữu.
Tri thức thật sự là khi nó **thay đổi cách bạn nhìn** hoặc **thay đổi cách bạn hành động**.

### 2. Transformation không xảy ra tuyến tính
Không có bước "học xong rồi transform". Transformation là sản phẩm phụ của việc **tiếp xúc đúng với đúng tri thức, đúng lúc, đủ nhiều lần**.

### 3. Compounding là vũ khí duy nhất
Mỗi wiki page, mỗi note, mỗi connection được tạo ra hôm nay → là đòn bẩy cho suy nghĩ của tháng sau.
Warren Buffett không giàu vì thông minh. Ông giàu vì **compound đủ lâu**.

### 4. Output là bằng chứng của transformation
Nếu tri thức không dẫn đến output — viết, quyết định, project, hành động — thì nó chỉ là illusion of learning.

---

## III. Định Nghĩa Thành Công

### 3 tháng
- **Knowledge:** Wiki có > 50 pages, cross-reference nhau chặt chẽ
- **Knowledge:** Có thể query wiki và nhận insight mà không cần search Google
- **Knowledge:** Mỗi tuần có ít nhất 1 reflection note về điều đã học
- **Career:** PMP đã pass (2026-05-29), unlock vị trí PM cao hơn
- **Finance:** Đã chốt framework đầu tư cá nhân (re-start track record)

### 1 năm
- **Knowledge:** Wiki trở thành "bộ não thứ hai" thực sự — câu hỏi nào cũng hỏi wiki trước
- **Knowledge:** Có thể nhìn lại INDEX.md và thấy rõ mình đã phát triển theo hướng nào
- **Output:** Tri thức tích lũy bắt đầu tạo ra output: bài viết, quyết định tốt hơn, dự án mới
- **L3 Product:** Đã chốt 1 trong 3 hướng (SaaS / Consulting / Investing) và có MVP
- **Finance:** Passive income tiến đến mục tiêu 10 man yên/tháng (% phụ thuộc hướng L3)

### 3 năm
- **Knowledge:** Hệ thống tự-feeding: mỗi output tạo ra input mới cho wiki
- **Knowledge:** Có thể chỉ ra cụ thể: "Tôi đưa ra quyết định X tốt hơn vì wiki đã giúp tôi hiểu Y"
- **Knowledge:** OPUS ANIMUS trở thành infrastructure của sự phát triển, không phải tool
- **Finance:** Tự do tài chính = passive income ≥ chi phí sống (không cần đi làm để tồn tại)
- **Career:** Optionality — có thể stay hoặc exit vì có passive income đủ

---

## IV. Vòng Lặp Lý Tưởng

Hiện tại OPUS ANIMUS chỉ có **nửa đầu** của vòng lặp:

```
                    ┌─────────────────────────────────┐
                    │         VÒNG LẶP ĐẦY ĐỦ         │
                    │                                 │
  External World    │   INPUT → PROCESS → STORE       │  ← OPUS ANIMUS có
  ─────────────     │                                 │
  RSS, papers,      │   REFLECT → CONNECT → INSIGHT   │  ← THIẾU
  news, files       │                                 │
                    │   APPLY → OUTPUT → FEEDBACK     │  ← THIẾU
                    │                                 │
                    └─────────────────────────────────┘
```

Một hệ thống chỉ có INPUT→STORE là **thư viện**.
Một hệ thống có đầy đủ vòng lặp là **bộ não sống**.

---

## V. Suy Ngược — Những Gì Còn Thiếu

### GAP-1: Không có Goals Layer
**Triệu chứng:** Hệ thống không biết CHÍ HUY đang cố trở thành ai.
Tất cả topics (AI, JP Stock, Tech) được đối xử ngang nhau.
Không có bộ lọc "cái này phục vụ mục tiêu phát triển bản thân nào?"

**Cần:** File `GOALS.md` định nghĩa:
- Tôi đang phát triển skills gì? (vd: AI engineering, đầu tư, systems thinking)
- Trong 12 tháng tới tôi muốn có thể làm được gì?
- Wiki nên bias về chủ đề nào?

---

### GAP-2: Không có Reflection Layer
**Triệu chứng:** Tri thức vào (ingest) nhưng không có cơ chế để user *tiêu hóa*.
Wiki ngày càng nhiều pages nhưng không có "weekly synthesis" — tuần này tôi học được gì, thay đổi gì trong tư duy?

**Cần:** `run_wiki.py reflect` — weekly prompt:
- "3 điều đáng chú ý nhất tuần này từ wiki là gì?"
- "Có insight nào mới không? Mâu thuẫn với điều gì đã biết?"
- Output: `personal-wiki/Personal/reflection-YYYY-WW.md`

---

### GAP-3: Không có Personal Knowledge Input
**Triệu chứng:** 95% input là external (RSS, papers, web).
Suy nghĩ cá nhân, quan sát, quyết định, bài học từ trải nghiệm thực tế của CHÍ HUY không có đường vào wiki.

**Cần:** Telegram `/wiki thought <text>` — capture personal insights ngay khi có.
Đây là loại tri thức giá trị nhất: *của mình, về mình, cho mình*.

---

### GAP-4: Không có Application Tracking
**Triệu chứng:** "Tôi đã đọc về RLHF" nhưng không có cách nào ghi lại "tôi đã apply nó ở đâu, kết quả thế nào."
Tri thức trôi nổi trong wiki, không neo vào hành động thực tế.

**Cần:** Tag `applied::` trong wiki page — khi một khái niệm được dùng thực tế, ghi lại.
Lint có thể flag: "Bạn đã học X 3 tháng trước — đã apply chưa?"

---

### GAP-5: Không có Spaced Repetition
**Triệu chứng:** Tri thức được ingest một lần, sau đó "ngủ" trong wiki.
Không có cơ chế nhắc nhở review lại những gì quan trọng.

**Cần:** Weekly digest không chỉ là "bài mới" mà còn "bài cũ đáng đọc lại."
`lint.py` có thể suggest: "Page X đã 30 ngày chưa access — review?"

---

### GAP-6: Không có Output → Feedback Loop
**Triệu chứng:** Tri thức vào nhưng không có nơi để output ra.
Không biết wiki có thực sự hữu ích không, hay chỉ là illusion of productivity.

**Cần:** Khi user tạo output từ wiki (viết bài, đưa ra quyết định), ghi lại connection đó.
Thậm chí đơn giản: Telegram `/wiki used <page> for <action>` — tạo feedback signal.

---

### GAP-7: Không có Personal Goals ↔ Wiki Alignment
**Triệu chứng:** Mỗi ngày system push thông tin về AI và JP Stock.
Nhưng thông tin đó có align với *mục tiêu phát triển cụ thể* không? Chưa ai kiểm tra.

**Cần:** Reading list (Content Collector) phải biết về GOALS.md để rank bài theo priority cá nhân, không chỉ theo tier nguồn.

---

## VI. Roadmap Bổ Sung (Từ North Star)

```
Hiện có:  INPUT → STORE → QUERY
Cần thêm:

Phase 6A  GOALS.md + personal input (/wiki thought)
          → hệ thống biết mình đang phát triển hướng nào

Phase 6B  Reflection layer (run_wiki.py reflect)
          → tuần nào cũng tiêu hóa, không chỉ tích lũy

Phase 6C  Application tracking (applied:: tag + lint flag)
          → đóng vòng lặp tri thức → hành động

Phase 6D  Spaced repetition trong weekly digest
          → tri thức được consolidate, không chỉ accumulate

Phase 6E  Output feedback (/wiki used)
          → biết system có thực sự giúp ích không
```

---

## VII. Câu Hỏi Kiểm Tra Định Kỳ

Mỗi tháng, đọc lại file này và trả lời:

1. Tháng này tôi đã *tiêu hóa* bao nhiêu tri thức, hay chỉ *lưu trữ*?
2. Có wiki page nào thực sự thay đổi cách tôi suy nghĩ không?
3. OPUS ANIMUS đang phục vụ mục tiêu phát triển của tôi, hay tôi đang phục vụ nó?
4. Nếu xóa toàn bộ wiki đi, tôi mất gì thực sự?

---

*"Non multa, sed multum."*
*Không phải nhiều thứ — mà là nhiều chiều sâu.*
— Pliny the Younger

---

*OPUS ANIMUS — North Star v1.0 | 2026-04-28*
