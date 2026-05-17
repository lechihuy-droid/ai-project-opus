# VISION — Hiện Thực Hóa Kim Chỉ Nam
*Phác thảo ý tưởng — 2026-04-28*

---

## I. Triết Lý Xây Dựng Bản Thân

> **"Compounding là vũ khí duy nhất của người không có lợi thế xuất phát."**

### 3 Nguyên Lý Nền Tảng

**1. System over willpower**
Ý chí cạn kiệt. System thì không.
Đừng cố gắng kỷ luật hơn — hãy thiết kế môi trường để hành động đúng là con đường ít kháng cự nhất.
OPUS ANIMUS là biểu hiện của nguyên lý này: thay vì cố đọc nhiều hơn, xây hệ thống đọc thay.

**2. Knowledge → Output → Feedback loop**
Tri thức không có giá trị nếu không tạo output.
Output không có giá trị nếu không có feedback.
Mỗi vòng lặp hoàn chỉnh = 1 đơn vị phát triển thực sự.

**3. Identity-first**
Hành động follow identity, không phải ngược lại.
Không phải "tôi đang cố tiết kiệm" — mà là "tôi là người quản lý tài chính có kỷ luật."
Mỗi hành động nhỏ là 1 phiếu bầu cho người bạn đang trở thành.

---

## II. OPUS ANIMUS HOME — Dashboard App

### Mục Đích
Một màn hình duy nhất hiển thị **toàn bộ trạng thái của hành trình phát triển bản thân**.
Không phải productivity tool — mà là **gương phản chiếu** bạn đang ở đâu.

### Wireframe — HOME Screen

```
┌─────────────────────────────────────────────────────────┐
│  OPUS ANIMUS                          2026-04-28  Mon   │
│  "Non multa, sed multum."                               │
├──────────────┬──────────────┬──────────────────────────┤
│  FINANCIAL   │  HEALTH      │  CAREER                  │
│              │              │                          │
│  Passive:    │  Sleep: 7h   │  AI skill: ████░ 7/10   │
│  ¥0 / ¥100k  │  Energy: 6/10│  Current role: [___]    │
│  ░░░░░░░░░░  │  Workout: ✓  │  Next milestone: [___]  │
│  0% to goal  │  3x/wk       │                          │
│              │              │                          │
│  Savings: 0% │  Stress: 4/10│                          │
├──────────────┴──────────────┴──────────────────────────┤
│  OPUS ANIMUS SYSTEM STATUS                              │
│                                                        │
│  Module A  ResearchCrew    ✅ Last run: today 06:00    │
│  Module B  Daily Brief     ✅ Last run: today 06:00    │
│  Module C  Wiki Agent      ✅ Polling every 5 min      │
│  Collector Content Batch   ✅ Last run: today 05:30    │
│  Markitdown Input tool     ✅ Watching raw/inbox/      │
│                                                        │
├────────────────────────────────────────────────────────┤
│  WIKI STATUS                                           │
│                                                        │
│  Total pages: 12  │  This week: +4  │  Tags: 38       │
│  AI: 8 pages      │  Stock: 2       │  Personal: 2    │
│                                                        │
│  Recent: llm-reasoning · rlhf-overview · boj-policy   │
│  Suggested review: attention-mechanism (30 days ago)  │
│                                                        │
├────────────────────────────────────────────────────────┤
│  TODAY                                                 │
│                                                        │
│  Reading list: 5 articles waiting                     │
│  Reflection: Week 17 — pending                        │
│  Goal check: Last reviewed 7 days ago ⚠️              │
│                                                        │
│  [ Open reading list ]  [ Write thought ]  [ Reflect ]│
└────────────────────────────────────────────────────────┘
```

### Tech Options (đơn giản nhất trước)

| Option | Stack | Effort | Tradeoff |
|---|---|---|---|
| **A — Terminal dashboard** | Python + rich library | 1 ngày | Đẹp, nhanh, không cần web server |
| **B — Local web app** | FastAPI + HTML/JS | 2-3 ngày | Click được, dễ extend |
| **C — Telegram bot UI** | Inline buttons | 1 ngày | Luôn có trên điện thoại |
| **D — Obsidian plugin** | JS plugin | 3-5 ngày | Gắn với wiki, nhưng phụ thuộc Obsidian |

**Recommendation:** Bắt đầu A (terminal), sau đó B khi cần sharing hoặc mobile.

### Data Sources (đã có sẵn)
- Wiki status → đọc `INDEX.md` + `log.md`
- Module status → check Task Scheduler last run time
- Reading list → `raw/articles/` files từ hôm nay
- Financial/health/career → user tự update `GOALS.md` (manual input)
- Reflection status → check `personal-wiki/Personal/reflection-*.md`

---

## III. Roadmap Hiện Thực Hóa

```
Hiện tại:     System chạy ngầm, không có giao diện
              User không biết system đang làm gì

Phase 7A:     GOALS.md + HOME terminal dashboard
              → nhìn thấy toàn bộ trạng thái trong 1 lệnh
              → python run_home.py

Phase 7B:     Reflection layer + financial tracking
              → mỗi tuần: tiêu hóa tri thức + cập nhật số tài chính

Phase 7C:     Local web app HOME
              → dashboard đẹp, click được, mobile-friendly

Phase 7D:     Philosophy documentation
              → viết lại triết lý thành bài chia sẻ cộng đồng
              → JOURNEY.md → blog post → community feedback
```

---

## IV. Câu Hỏi Cần Trả Lời Trước Khi Build

1. Dashboard chạy ở đâu — terminal khi cần, hay luôn mở như second screen?
2. Financial tracking: tự điền tay hàng tháng hay muốn sync từ đâu đó?
3. Health tracking: tự điền hay muốn integrate với app có sẵn (Apple Health, Garmin...)?
4. App HOME này — dùng một mình hay muốn share được với người khác (productize)?
   → **Đã trả lời 2026-04-28: Productize sau** — bây giờ build cho cá nhân, nhưng giữ option mở rộng multi-user về sau (không ép multi-user-readiness từ đầu, nhưng tránh hardcode personal info vào code/config).

*Câu hỏi 4 quyết định scope lớn — nếu chỉ dùng một mình: terminal đủ. Nếu muốn productize: cần web app từ đầu.*

---

*VISION v1.0 — 2026-04-28 | Phác thảo — chưa scope thành RD*
