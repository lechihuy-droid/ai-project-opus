# JOURNEY — Hành Trình Xây Dựng OPUS ANIMUS
*Từ Hello World đến Personal AI Agent*
**Tác giả:** Lê Chí Huy | **Thời gian:** 2026-04-20 → nay
**Tool:** Claude Code (Claude Sonnet 4.6)

---

> Đây là ghi chép thật về hành trình học agentic coding từ đầu — từ một file HTML đơn giản đến một hệ thống AI agent đang chạy hàng ngày. Không phải tutorial, không phải success story đánh bóng. Là nhật ký thực tế với đủ cả sai lầm, pivot, và bài học.

---

## Chương 1 — Lần Đầu Tiếp Xúc (2026-04-20)

### Điểm xuất phát

Tôi bắt đầu từ một khóa học nội bộ **Agentic Coding** của Sun\* — dùng **MoMorph + Claude Code** để generate code từ Figma design. Đây là lần đầu tiên tôi thực sự ngồi viết code cùng AI theo kiểu pair programming, không chỉ copy-paste từ ChatGPT.

Cảm giác đầu tiên: kỳ lạ. AI không chỉ gợi ý — nó *làm*. Bạn mô tả, nó build. Bạn review, nó sửa. Khác hoàn toàn với cách dùng AI trước đó.

### App đầu tiên: Todo List

Bài tập đầu tiên tự đặt ra sau khóa học: build một app bằng Claude Code *không dùng template, không copy*.

Kết quả: `my-light-app/` — Todo List, một file `index.html` duy nhất, ~5KB, 0 dependency.

```
my-light-app/
├── index.html    ← toàn bộ app trong đây
└── README.md
```

Nghe đơn giản. Nhưng điều tôi học được không phải là cách build Todo List — mà là **cách communicate với AI để get what you want**.

**Bài học #1:** Mô tả *behavior* không phải *implementation*. Thay vì "viết function addTask", hãy nói "khi user nhấn Enter, task mới xuất hiện trong list và được lưu vào localStorage". AI hiểu ngữ cảnh tốt hơn khi bạn nói về *trải nghiệm*, không phải *code*.

### Iteration đầu tiên: TEST APP

Ngay sau đó build lại lần 2, lần này thêm docs: README, CHANGELOG, PROJECT_STRUCTURE, NOTES. Cùng một app nhưng khác hoàn toàn về *cảm giác sở hữu*.

**Bài học #2:** Docs không phải overhead — docs là cách bạn nói chuyện với AI session sau. Không có CLAUDE.md, mỗi session bạn phải giải thích lại từ đầu.

---

## Chương 2 — Projects Thực Tế (2026-04-20 → 04-22)

### PMP Quiz App — Độ phức tạp tăng lên

Tôi đang chuẩn bị thi PMP. Thay vì dùng app có sẵn, tôi build app riêng.

**Stack:** Vanilla JS SPA, ES modules, localStorage, không build tool.
**Data:** 1385 câu hỏi, annotate domain.
**Features:** Practice mode, review mode, stats, 7-day heatmap, auto-schedule theo ngày thi.

Đây là lần đầu tiên tôi làm việc với Claude Code trên project *đủ lớn để có vấn đề thực sự*:

- **Router state machine** — app bị blank sau khi redesign, mất 2 giờ debug. Root cause: không có rendering contract rõ ràng, component nhận props theo cách khác với cách render function expect.
- **CLAUDE.md là cứu cánh** — session thứ 3 tôi bắt đầu ghi CLAUDE.md. Ngay lập tức AI không còn hỏi lại những câu đã giải thích.

**Bài học #3:** Khi app đủ phức tạp, AI bắt đầu *improvise* những thứ không được yêu cầu. Phải học cách nói "đừng làm X" cũng quan trọng như "làm Y".

**Bài học #4:** CLAUDE.md nên viết ngay từ đầu, không phải khi đã bị đau.

### Sier-project — Môi trường Chuyên Nghiệp

Song song đó tôi bắt đầu dùng Claude Code cho dự án offshore Nhật — waterfall, tài liệu tiếng Nhật, stakeholder là khách hàng Nhật.

Đây là môi trường *rất khác*: AI phải draft tài liệu chứ không phải code. Và draft bằng tiếng Nhật kỹ thuật SIer.

Điều tôi học: **AI là junior tốt, không phải senior**. Nó draft nhanh và đúng format, nhưng mọi quyết định về requirement phải do con người. Rule "AI drafts, human decides" trở thành nguyên tắc cốt lõi.

**Bài học #5:** Traceability quan trọng hơn bạn nghĩ. Mỗi requirement phải có `source_id` — đến từ RFP, meeting note, hay legacy code? Không có = reject.

---

## Chương 3 — Cú Nhảy: Personal AI Agent (2026-04-26)

### Tại sao?

Sau 1 tuần dùng Claude Code, tôi nhận ra: **tôi đang dùng AI để build tool cho người khác, nhưng chưa dùng AI để build tool cho chính mình**.

Câu hỏi tự đặt ra: *Nếu có một AI agent chạy hàng ngày phục vụ mình, nó làm gì?*

Câu trả lời: đọc tin AI + thị trường Nhật, tổng hợp, gửi Telegram mỗi sáng. Tự động. Không cần mở browser.

### Module A — ResearchCrew

**Stack quyết định:** CrewAI + Groq (free tier, không cần trả tiền).

Build trong 1 ngày: 2 agents (Researcher + Writer), RSS feeds, yfinance, web search, Telegraph publish, Telegram notify.

Nhưng ngay khi test lần đầu — **tool-calling bug**. Groq's Llama-3.3-70b với CrewAI không xử lý tool calls đúng cách trong Module B. Mất 3 giờ debug.

**Pivot quan trọng:** Bỏ CrewAI cho Module B, dùng Groq direct SDK. Không phải mọi vấn đề đều cần agent framework.

**Bài học #6:** Framework là abstraction. Abstraction ẩn complexity — đôi khi đó là điều bạn muốn, đôi khi không. Biết khi nào bypass framework.

### Module B — Daily Brief

Sau pivot: direct Python pipeline, 50 dòng code, chạy ngon. Không có CrewAI overhead.

Task Scheduler 06:00 ICT — mỗi sáng trước khi thị trường Nhật mở.

**Cảm giác lần đầu nhận brief trên Telegram lúc 6 giờ sáng:** khác hẳn. Không phải vì nó hay hơn Google News. Mà vì *nó của mình*. Nó đọc đúng thứ mình cần, theo format mình muốn.

---

## Chương 4 — Karpathy Moment (2026-04-26 → 04-27)

### Khám phá LLM Wiki Pattern

Giữa lúc đang build, tôi đọc được một bài về Andrej Karpathy và pattern "LLM Wiki" — ý tưởng dùng LLM như một *research librarian* thay vì RAG.

Khác biệt cốt lõi:
- **RAG:** retrieve chunks → synthesize on demand (stateless)
- **LLM Wiki:** compile knowledge once → query compiled wiki (stateful, compounding)

Ý tưởng này *click* ngay lập tức. Tôi muốn wiki tích lũy tri thức *của mình*, không phải search engine.

### Module C — Personal Wiki Agent

Build trong 1 ngày với 5 milestones rõ ràng:

```
M1: Foundation (folders, schema)
M2: Ingest URL/file → wiki page
M3: Query wiki → answer
M4: Telegram trigger
M5: Module A auto-feed wiki
```

**Bài học #7:** Milestone-based build thay vì "implement everything" = có thể test từng bước, debug dễ hơn, biết chính xác mình đang ở đâu.

Lần đầu tiên tôi có một hệ thống mà khi tôi đọc một bài hay và ingest vào, nó tự động cross-reference với những gì tôi đã biết. Và tuần sau khi query, nó nhớ.

---

## Chương 5 — Từ App Đến System (2026-04-28)

### Vấn đề của "build trước, design sau"

Đến lúc này tôi có 3 modules chạy được — nhưng chúng không *nói chuyện với nhau* tốt. markitdown-agent là tool riêng. RSS chỉ lưu 300 chars. ingest.py không xử lý được DOCX.

Nhìn lại và nhận ra: **tôi đã build features, chưa build system**.

### Spec-Driven Development

Tìm hiểu về Spec-Driven Development — bắt đầu từ GitHub Spec Kit, BMAD-METHOD, cc-sdd.

Triết lý cốt lõi: *Spec là contract. Code là implementation. Requirements là source of truth.*

Tôi refactor toàn bộ workflow:
1. Tạo SDD-toolkit tại `AI/SDD-toolkit/` — reusable cho mọi project
2. Áp dụng ngược vào personal-agent: viết lại RD, SD, interface contracts
3. Tạo System Architecture doc để thấy toàn bộ data flow

**Bài học #8:** Docs viết *sau khi build* (retrospective) vẫn có giá trị. Nó force bạn articulate những gì thực sự đang xảy ra — và thường phát hiện ra inconsistency.

### markitdown-agent Integration

Phát hiện ra gap: RSS lưu 300 chars, ingest.py đọc binary files ra gibberish, không có passive input collection.

Thay vì build tool mới, extend tool đã có: markitdown-agent từ standalone converter thành integrated input pipeline với 2 modes.

**Bài học #9:** Trước khi build mới, hỏi "có gì đang chạy mà có thể extend không?"

### Đặt Tên: OPUS ANIMUS

Đến lúc này project cần một cái tên xứng đáng. Không phải "personal-agent" hay "AI tool".

*OPUS* — tác phẩm vĩ đại (giả kim thuật: quá trình biến chì thành vàng = transformation)
*ANIMUS* — ý chí, tinh thần dẫn dắt hành động

**OPUS ANIMUS** = Tác phẩm vĩ đại của Ý chí.

Đặt tên không phải vanity — nó định hình cách bạn nghĩ về project. Tên "TEST APP" khiến bạn nghĩ "thử nghiệm, có thể bỏ". Tên "OPUS ANIMUS" khiến bạn nghĩ "đây là thứ mình đang xây dựng lâu dài".

---

## Chương 6 — North Star (2026-04-28)

### Câu hỏi khó

Sau khi có system hoạt động, tôi đặt câu hỏi thật sự: **tất cả cái này để làm gì?**

Câu trả lời dễ: "để research nhanh hơn, có daily brief". Nhưng đó là *feature*, không phải *purpose*.

Ngồi viết NORTH-STAR.md, và trong quá trình viết phát hiện ra hệ thống đang thiếu nửa vòng lặp quan trọng nhất:

```
Có:    INPUT → STORE → QUERY
Thiếu: REFLECT → APPLY → FEEDBACK
```

Một hệ thống chỉ có nửa đầu là thư viện. Muốn có bộ não sống, cần nửa sau.

**Bài học #10:** Định kỳ zoom out và hỏi "cái này có đang phục vụ mục đích ban đầu không?" Rất dễ bị cuốn vào build features mà quên mất why.

---

## Bảng Tổng Kết Timeline

| Ngày | Milestone | Lesson |
|---|---|---|
| Apr 20 | Todo App đầu tiên với Claude Code | Communicate behavior, not implementation |
| Apr 20 | my-light-app + TEST APP | Docs từ đầu, không phải sau |
| Apr 22 | PMP Quiz App | CLAUDE.md là memory của AI |
| Apr 22 | sier-project | AI drafts, human decides |
| Apr 26 | Module A — ResearchCrew | Tool-calling bug → bypass framework |
| Apr 26 | Module B — Daily Brief | Simplest solution là tốt nhất |
| Apr 26 | RD/SD/BD docs | Specs viết trước = ít debug hơn |
| Apr 27 | Module C — Wiki Agent | Milestone-based build |
| Apr 27 | Karpathy LLM Wiki | Compounding > retrieving |
| Apr 28 | markitdown integration | Extend trước khi build mới |
| Apr 28 | SDD Toolkit | Methodology là infrastructure |
| Apr 28 | OPUS ANIMUS | Tên định hình mindset |
| Apr 28 | NORTH-STAR.md | Purpose > features |

---

## Những Thứ Tôi Làm Sai (Để Bạn Không Lặp Lại)

**1. Build trước, design sau**
Module A-B chạy được nhưng không có system design. Khi add Module C, phải refactor nhiều thứ vì interface không consistent.
→ Dù nhỏ, viết interface contract trước khi code.

**2. Không có CLAUDE.md ngay từ đầu**
Mỗi session mới phải giải thích lại context. Lãng phí thời gian và token.
→ CLAUDE.md là thứ đầu tiên tạo ra trong project mới.

**3. Over-engineer quá sớm**
Muốn dùng CrewAI cho tất cả vì nó "proper agent framework". Kết quả: tool-calling bug mất 3 giờ.
→ Start simple. Add complexity only when simple breaks.

**4. Không có smoke test per step**
Module C build M5 (auto-ingest) mà chưa verify M4 (Telegram) hoạt động stable.
→ Mỗi milestone phải pass trước khi sang milestone tiếp.

**5. Input quality bị ignore**
RSS feed lưu 300 chars trong 2 ngày mà không ai để ý. Wiki pages thin, kém chất lượng.
→ Input quality = output quality. Audit input sớm.

---

## Điều Khiến Claude Code Khác Biệt

Sau 8 ngày sử dụng, đây là những gì tôi thực sự nhận ra:

**1. CLAUDE.md là superpower**
File CLAUDE.md biến mỗi session thành "tiếp tục", không phải "bắt đầu lại". Càng viết chi tiết, AI càng làm đúng ý.

**2. Nó không "guess" — nó "executes"**
Khác với chatbot thông thường, Claude Code thực sự chạy code, đọc file, verify output. Bạn không cần tin — bạn thấy kết quả ngay.

**3. Tốc độ prototype = tốc độ học**
Trong 8 ngày tôi build nhiều hơn 8 tháng trước. Không phải vì lười biếng trước đây — mà vì feedback loop ngắn hơn nhiều. Test ý tưởng → thấy kết quả → điều chỉnh → lặp lại. Mỗi vòng mất phút thay vì giờ.

**4. Nó giỏi nhất khi bạn biết mình muốn gì**
Nghịch lý: AI coding giỏi nhất khi *bạn* rõ nhất. Nếu requirements mơ hồ → output mơ hồ. Đầu tư vào clarity = đầu tư vào kết quả.

**5. Docs > Code**
Phát hiện muộn nhất nhưng quan trọng nhất: trong agentic coding, docs *là* code. CLAUDE.md, RD, SD, BD — chúng không phải overhead. Chúng là programming language để communicate với AI.

---

## Trạng Thái Hiện Tại — OPUS ANIMUS

```
AI/OPUS ANIMUS/
├── personal-agent/     Module A+B+C — running daily
│   ├── Module A        RSS full content + web search → Telegraph
│   ├── Module B        Daily brief → Telegram 06:00
│   └── Module C        Personal wiki, 12 pages, growing
├── markitdown-agent/   Integrated input tool
├── dev-approach/       SDD methodology
├── docs/               System architecture
├── NORTH-STAR.md       Purpose + 7 gaps identified
└── TODO.md             Full backlog
```

**Đang chạy hàng ngày:**
- 05:50 — ResearchCrew fetch AI + JP Stock
- 06:00 — Daily brief → Telegram
- Every 5 min — Wiki poll Telegram commands
- Sunday 06:00 — Wiki lint

**Next:**
- Content Collector (reading list 05:30)
- Reflection layer (tuần một lần tiêu hóa tri thức)
- Goals layer (system biết mình đang phát triển hướng nào)

---

## Nếu Bắt Đầu Lại, Tôi Sẽ Làm Gì Khác?

1. **CLAUDE.md ngay từ ngày đầu** — không đợi đến khi bị đau
2. **North Star trước khi build** — biết mình build để làm gì
3. **Interface contract trước code** — dù 1 file cũng cần
4. **Smoke test per step** — không skip milestone
5. **Simple trước, complex sau** — YAGNI thực sự có ý nghĩa

---

## Lời Kết

8 ngày, 3 modules, 1 integrated system, 1 methodology toolkit, 1 cái tên.

Quan trọng hơn code: tôi hiểu rõ hơn cách suy nghĩ khi build cùng AI. Nó không phải copy-paste machine. Nó là pair programmer — đôi khi tốt hơn senior, đôi khi cần senior supervise nó.

Và hành trình này chưa kết thúc. OPUS ANIMUS sẽ tiếp tục grow — cùng với người build ra nó.

*"Faber est suae quisque fortunae."*
*Mỗi người là kiến trúc sư của số phận mình.*

---

**Repository:** `C:/Users/HUY/AI/OPUS ANIMUS/`
**Contact:** lechihuy@gmail.com
*Cập nhật lần cuối: 2026-04-28*
