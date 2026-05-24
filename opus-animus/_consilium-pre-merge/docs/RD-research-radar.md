# RD — Research Radar
**Date:** 2026-04-28
**Status:** 🟢 Approved (open questions resolved 2026-04-28)
**Author:** Lê Chí Huy + Claude
**Phụ thuộc:** Module C (wiki agent) ✅ + Content Collector ✅

---

## 0. Problem Statement

**Vấn đề:** Content Collector hiện chỉ fetch RSS sources (blog/news/papers RSS). Bỏ sót 2 nguồn high-signal cho AI builder:
1. **GitHub trending repos** — code thật, có thể fork/study/apply trực tiếp vào OPUS ANIMUS
2. **Top papers theo GitHub stars** (Papers With Code) — paper có code = paper actionable

**Hiện trạng:** Không có pipeline cho 2 nguồn này. User phải manually browse github.com/trending mỗi tuần — dễ skip, không persistent.

**Mục tiêu:** Mỗi sáng thứ 2 nhận Telegram report top repos + top papers tuần qua, kèm LLM analysis "có apply được vào OPUS ANIMUS không?", auto-ingest top 3 vào wiki để compound knowledge.

---

## 1. Usage

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Solo dev, AI engineer (intermediate) |
| Device | Telegram trên điện thoại + terminal khi cần |
| Tần suất | Weekly (Mon 06:30 ICT auto), manual khi muốn |
| Technical level | Đọc được paper abstract, hiểu repo README |

### 1.2 Typical Flow

```
Mon 06:30 → Task Scheduler trigger run_radar.py
        → fetch GitHub trending (Python+AI, last 7 days, ≥100 stars)
        → fetch Papers With Code (top by github_stars, last 7 days)
        → LLM (Groq) cho mỗi item: "Có apply OPUS ANIMUS không? Ở đâu?"
        → save raw/ + ingest top 3 vào wiki
        → Telegram report: "Research Radar W{N}"

User mở Telegram lúc 7:00:
        → đọc top 5 repos + top 5 papers + apply suggestions
        → click link nào quan tâm
        → /wiki ask để query thêm
```

### 1.3 Example Interactions

**Happy path — Telegram message Monday morning:**

```
🔬 Research Radar — W18 (2026-04-28)
Fetched: 23 repos · 14 papers  |  Wiki: +3 pages

⭐ TOP REPOS (apply OPUS ANIMUS)
1. exo-explore/exo (3.2k stars/week)
   Run AI clusters at home using everyday devices
   → Apply: distributed inference cho Module A khi cần local LLM
   github.com/exo-explore/exo

2. langchain-ai/langgraph (1.8k stars/week)
   Build stateful multi-actor LLM apps
   → Apply: replace CrewAI cho Module A nếu cần state machine
   github.com/langchain-ai/langgraph

📄 TOP PAPERS
1. "DeepSeek-V4 Technical Report" — 412 GitHub stars
   → Apply: million-token context có thể giảm số call LLM trong wiki ingest
   arxiv.org/abs/2604.xxxxx

🧠 Wiki: +3 pages — Tech/exo-distributed-ai · Tech/langgraph · AI/deepseek-v4
/wiki ask <query> để dive sâu
```

**Edge case — không có item nào apply:**

```
🔬 Research Radar — W18
Fetched: 18 repos · 8 papers  |  Wiki: +0 pages
LLM filter: 0 items high-relevance to OPUS ANIMUS this week.
Top by stars (FYI only):
1. ggerganov/llama.cpp ...
```

### 1.4 Manual Trigger

```bash
python run_radar.py              # full pipeline
python run_radar.py --dry-run    # fetch + filter, no save, no Telegram
python run_radar.py --no-ingest  # save raw + Telegram, skip wiki ingest
```

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-R01 | Fetch GitHub trending Python repos last 7 days, top 10 by stars-per-week | P0 |
| FR-R02 | Fetch Papers With Code top 10 papers last 7 days, ordered by github_stars | P0 |
| FR-R03 | LLM check (Groq) cho mỗi item: prompt "Có apply OPUS ANIMUS không? Ở đâu?" | P0 |
| FR-R04 | Save raw items vào `raw/articles/{date}-radar-{slug}.md` | P0 |
| FR-R05 | Auto-ingest top 3 high-relevance items vào wiki | P0 |
| FR-R06 | Gửi Telegram report 1 message duy nhất (markdown formatted) | P0 |
| FR-R07 | `--dry-run` flag: fetch + LLM filter, không save, không Telegram | P1 |
| FR-R08 | `--no-ingest` flag: save raw + Telegram, không wiki ingest | P1 |
| FR-R09 | Idempotent: chạy lại trong cùng tuần không duplicate raw files | P1 |
| FR-R10 | Source fail (network/parse error): skip source, không crash batch | P0 |
| FR-R11 | LLM call fail: fallback dùng heuristic score (stars/week) | P1 |

### Không trong scope

- **Không** semantic search trên repos (cần vector store)
- **Không** evaluate code chạy được không (chỉ analyze README/title/desc)
- **Không** track GitHub stars over time (cần DB)
- **Không** thay thế Content Collector — pipeline song song, cùng write vào `raw/`

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric |
|---|---|---|
| NFR-01 | Performance | < 5 phút end-to-end (LLM calls dominate) |
| NFR-02 | Cost | ≤ 25 Groq calls/run (10 repos + 10 papers + 3 ingest × ~2) |
| NFR-03 | Idempotent | Re-run trong 24h: 0 duplicate files |
| NFR-04 | Resilience | Source fail không crash; ≥ 1 source success → vẫn gửi report |

---

## 4. Source List

| Source | Type | Endpoint | Note |
|---|---|---|---|
| GitHub Trending | scrape | `https://github.com/trending/python?since=weekly` | Không có public API; scrape HTML |
| Papers With Code | API | `https://paperswithcode.com/api/v1/papers/?ordering=-github_stars` | Free API, cần check 302 issue |
| (later) Semantic Scholar | API | `https://api.semanticscholar.org/graph/v1/paper/search` | Cần API key (free tier) |

**MVP chỉ build 2 sources đầu.** Semantic Scholar sau (phải register API key).

---

## 5. Decisions (resolved 2026-04-28)

| # | Câu hỏi | Decision |
|---|---|---|
| Q1 | GitHub fetch | **Scrape HTML** với BeautifulSoup, fallback empty list nếu parse fail |
| Q2 | Source 2 (PWC fail) | **Thay PWC bằng arXiv API** — `http://export.arxiv.org/api/query` cho cs.AI + cs.LG last 7 days |
| Q3 | LLM filter strategy | **2-round filter:** R1 heuristic (stars min, keyword whitelist, exclude blacklist) → loại 50%. R2 LLM per-item score "apply OPUS HOẶC học skill". |
| Q4 | Auto-ingest behavior | **Auto-ingest top 5** via `run_ingest()`. Top 5 chọn theo combined score (apply + skill). Items có flag `apply_to_opus=true` → tag thêm `apply::opus` trong page YAML để dễ filter sau. |

---

## 6. Filter Pipeline (2-round)

```
Fetched items (~20-30 total: 10 GitHub + 10-20 arXiv)
        │
        ▼
ROUND 1 — Heuristic filter (no LLM, fast)
  - GitHub: stars/week ≥ MIN_STARS (default 50)
  - GitHub/arXiv: title match WHITELIST keywords (LLM, agent, RAG, RLHF, ...)
  - GitHub/arXiv: exclude BLACKLIST (game, frontend-only, ...)
  → keep items pass ANY criteria
  → output: ~10-15 items
        │
        ▼
ROUND 2 — LLM per-item scoring (Groq)
  Prompt per item: "Đây là context OPUS ANIMUS [...] + item [...].
                    Trả lời JSON:
                    - apply_to_opus: 0-10 (apply trực tiếp vào module nào?)
                    - skill_value: 0-10 (giúp expand L1-L3 không?)
                    - apply_suggestion: 1-2 câu nếu apply_to_opus ≥ 6
                    - skip_reason: nếu cả 2 < 5"
  → output: items + scores + suggestions
        │
        ▼
SELECT top 5 by max(apply_to_opus, skill_value)
  → 5 items final
  → flag apply_to_opus ≥ 6 → tag apply::opus
        │
        ▼
INGEST top 5 vào wiki via run_ingest()
        │
        ▼
TELEGRAM report (markdown)
```

---

## 6. Design Decisions

| Quyết định | Lý do | Alternative |
|---|---|---|
| Dùng Groq Llama-3.3-70b | Đã có trong Module A/C, tránh đa provider | OpenAI: tốn $, Claude API: chưa setup |
| Batch LLM (1 prompt cho 10 items) | NFR-02 cost, NFR-01 performance | 1 LLM call/item: 20 calls vs 2 — overkill |
| Scrape GitHub thay vì API search | GitHub Search API rate limit 30/h, scrape không cần auth | API: cần token, complex pagination |
| Reuse `run_ingest()` cho top 3 | Wiki layer đã handle SCHEMA, cross-ref, INDEX update | Write tay: duplicate logic, hỏng Karpathy pattern |
| Output 1 Telegram message | UX đơn giản, mobile-friendly | Multi-message: gãy thread, khó scan |

---

## 7. File Structure

```
personal-agent/
├── tools/
│   └── research_radar_tool.py    ← NEW: fetch + LLM filter
├── run_radar.py                  ← NEW: entry point
├── docs/
│   └── RD-research-radar.md      ← this file
└── raw/articles/
    └── 2026-04-28-radar-{slug}.md  ← saved items (existing folder)
```

**Estimate code:** ~200 lines total
- `tools/research_radar_tool.py`: ~140 lines (fetch_github_trending, fetch_paperswithcode, llm_filter_apply, format_report)
- `run_radar.py`: ~60 lines (CLI args, orchestrate, send Telegram)

---

*Research Radar — RD v0.1 — 2026-04-28*
