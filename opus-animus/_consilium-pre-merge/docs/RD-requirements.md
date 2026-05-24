# RD — Requirements & Design
**Project:** Personal AI Agent (CrewAI + Groq)
**Phase:** Module A (Knowledge & Research) + Module B (Daily Productivity)
**Date:** 2026-04-26
**Status:** 🟢 Phase 2 Build — DONE & TESTED

---

## 1. End User Intent & Usage Confirmation

### 1.1 End User Profile

| Field | Confirmed |
|---|---|
| Người dùng | ✅ Chỉ mình tôi |
| Device chính | ✅ Windows PC + iPhone |
| Online 24/7? | ✅ Không bắt buộc — dùng Windows Task Scheduler |
| Interface | ✅ Telegram bot + Telegraph link |

### 1.2 Module A — Knowledge & Research

- ✅ **2 chủ đề tracking:** AI + Chứng khoán Nhật Bản
- ✅ **Config-driven sources** — add/remove không cần sửa code (`config.yaml`)
- ✅ **Output:** file `.md` lưu local `./wiki/` + upload Telegraph

**Input sources (trạng thái thực tế sau test):**

| Topic | Source | Type | Status |
|---|---|---|---|
| AI | TechCrunch AI | rss | ✅ Hoạt động |
| AI | OpenAI News | rss | ⚠️ Bài cũ > 48h, thường bị filter |
| AI | HuggingFace Blog | rss | ⚠️ Ít bài mới |
| AI | ArXiv cs.AI | rss | ❌ Blocked (trả về empty) |
| AI | ArXiv cs.LG | rss | ❌ Blocked |
| AI | VentureBeat AI | rss | ⚠️ Bài cũ > 48h |
| AI | Web Search | web_search | ✅ Hoạt động |
| JP_STOCK | Nikkei 225 (^N225) | yfinance | ✅ Hoạt động |
| JP_STOCK | TOPIX | yfinance | ❌ Yahoo Finance không hỗ trợ |
| JP_STOCK | Nikkei Asia | rss | ✅ Hoạt động |
| JP_STOCK | Japan Times Biz | rss | ✅ Hoạt động |
| JP_STOCK | Web Search | web_search | ✅ Hoạt động |

### 1.3 Module B — Daily Productivity

- ✅ **Nội dung brief:** AI news + JP Stock (đọc từ wiki output Module A)
- ✅ **Kênh nhận:** Telegram + link Telegraph
- ✅ **Giờ:** 8:00 JST = 6:00 ICT
- ✅ **Mode:** push-only, không cần 24/7
- ✅ **Trigger:** Windows Task Scheduler → `run_daily.py`
- ✅ **Architecture:** Direct Python pipeline (không dùng CrewAI — xem Implementation Notes)

---

## 2. Functional Requirements

### Module A — Knowledge & Research
- FR-A01: Fetch RSS (max 5 items/source, filter 48h) + yfinance + web search theo config
- FR-A02: ResearchCrew (2 agents: Researcher + Writer) tổng hợp và lưu wiki
- FR-A03: Writer lưu `wiki/YYYY-MM-DD-{topic}.md`
- FR-A04: Upload wiki lên Telegraph → trả về URL
- FR-A05: Retry tối đa 3 lần nếu gặp Groq rate limit (backoff 60s)

### Module B — Daily Productivity
- FR-B01: Chạy tự động 6:00 ICT qua Windows Task Scheduler
- FR-B02: Đọc wiki gần nhất của từng topic (file-based, không cần LLM)
- FR-B03: Nếu không có wiki nào → Telegram báo "chưa có data", kèm hướng dẫn chạy lại
- FR-B04: Gọi Groq LLM trực tiếp (1 API call) để viết brief < 400 words
- FR-B05: Upload brief lên Telegraph, gửi Telegram kèm link
- FR-B06: Error alert Telegram — max 1 alert/giờ, dedup cùng lỗi

---

## 3. Non-Functional Requirements

| NFR | Yêu cầu |
|---|---|
| Latency Module A | < 3 phút (ResearchCrew 2 agents + Groq rate limit) |
| Latency Module B | < 30 giây (1 LLM call trực tiếp) |
| Cost | Groq free tier: 14,400 req/day, 500k tokens/day — đủ dùng |
| Availability | Local Windows, không cần 24/7 |
| Privacy | Wiki lưu local. Telegraph public anonymous |
| Telegram message | Truncate 3800 chars |
| LLM prompt | Plain ASCII only — không emoji trong prompt (Groq Llama issue) |

---

## 4. Constraints & Assumptions

- **LLM:** Groq Llama-3.3-70b-versatile (free tier) — Claude/Anthropic vào BACKLOG
- **Architecture Module A:** CrewAI (Researcher + Writer agents)
- **Architecture Module B:** Standalone Python — direct Groq SDK call (không dùng CrewAI)
- **Architecture Module C:** Standalone Python — direct Groq SDK call for concept-first wiki ingest/query/reflect; no CrewAI tool-calling
- **Hermes:** Không tích hợp ở MVP — xem BACKLOG-01
- Telegram: push-only, không cần webhook
- Telegraph: direct requests API (không dùng `telegraph` library)
- OS: Windows 11, Task Scheduler làm cron
- `duckduckgo-search` deprecated → cần đổi sang `ddgs` (todo)

---

## 5. Risk Decisions Log

| Risk | Quyết định | Kết quả thực tế |
|---|---|---|
| R1 — venv | Chung 1 venv | ✅ Ổn |
| R2 — Hermes skill | Standalone → BACKLOG-01 | ✅ Đúng hướng |
| R3 — Module B fallback | Báo "chưa có data" | ✅ Implemented |
| R4 — RSS flood | max 5 items/source, filter 48h | ✅ (đổi từ 24h → 48h) |
| R5 — yfinance pre-market | Label "Previous Close" | ✅ |
| R6 — Error notify | Telegram, max 1/giờ + dedup | ✅ Implemented |
| R7 — Telegram limit | Truncate 3800 chars | ✅ |
| R8 — RSS URL hỏng | Skip + log | ✅ Auto-skip |
| Telegraph | Direct requests API | ✅ Ổn định hơn library |
| **NEW** — Groq emoji bug | Bỏ emoji khỏi LLM prompt | ✅ Fixed |
| **NEW** — Module B CrewAI tool call | Bypass CrewAI, dùng direct SDK | ✅ Fixed |
| **NEW** — TOPIX không có trên Yahoo Finance | Chỉ dùng ^N225 | ✅ Accepted |
| **NEW** — Module C LLM update risk | Add `--dry-run` + backup before update writes | ✅ Fixed |

---

## Checklist

- [x] Phase 1 — RD & Design
- [x] Phase 2 — Build
- [x] Phase 3 — Test (Module A ✅, Module B ✅)
- [ ] Setup Windows Task Scheduler
- [ ] Fix `duckduckgo-search` → `ddgs`
- [ ] Tune RSS sources (thêm source mới thay ArXiv)
