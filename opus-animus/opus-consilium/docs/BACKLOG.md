# Backlog (Historical)
**Project:** Personal AI Agent (CrewAI + Groq)

> ⚠️ **Note 2026-04-28:** File này là roadmap lịch sử trước khi Module C + Content Collector + markitdown-agent ship.
> **Source of truth hiện tại:** `OPUS ANIMUS/TODO.md` (root) — review file đó trước khi pick up việc mới.
> File này giữ lại để reference Karpathy LLM Wiki research + architecture decisions.

---

## Roadmap (Status updated 2026-04-28)

| Phase | Tên | Trọng tâm | Trạng thái |
|---|---|---|---|
| MVP | Module A + B | ResearchCrew + Daily Brief | ✅ Done (2026-04-26) |
| MVP | Module C — Personal Wiki Agent | Karpathy LLM Wiki pattern, Groq direct | ✅ Done (2026-04-27 M1-M5) |
| Opt-1 | AI Research Input | Nguồn chất lượng cao cho AI topic | ✅ Replaced by Content Collector (8/12 sources active) |
| Opt-2 | Markitdown Pipeline | Download + convert full document → wiki | ✅ Done (markitdown-agent integrated mode) |
| Feature | Daily LLM Synthesis | Claude CLI → daily brief JSON | ✅ Done (2026-05-18) |
| Feature | Weekly LLM Synthesis | Claude CLI → weekly report JSON | ✅ Done (2026-05-18) |
| Feature | FDE Research Tab | Dashboard tab theo dõi FDE model adoption | ✅ Done (2026-05-18) |
| Opt-3 | Hermes Skill Layer (A+B) | Wrap Module A+B thành Hermes skills | 🗂️ Idea — sau khi pipeline stable ≥ 2 tuần |
| Idea | JP Stock Deep Dive | Thêm nguồn chứng khoán Nhật chất lượng | 🗂️ Idea (TODO root [IDEA-1]) |
| Idea | Multi-topic Expansion | Thêm topic mới (macro, crypto...) | 🗂️ Idea (TODO root [IDEA-2]) |
| Idea | Interactive Brief | Telegram inline buttons, webhook mode | 🗂️ Idea (TODO root [IDEA-3]) |
| Idea | Research Radar | GitHub trending + papers → LLM filter apply OPUS | 🔵 Promoted to Immediate (TODO root, 2026-04-28) |
| Idea | FDE Source Expansion | Thêm RSS sources cho FDE news (consulting firms blog, Palantir blog) | 🗂️ Idea |

---

## 🔵 Next MVP — Module C: Personal Wiki Agent

**Mục tiêu:** Agent tích lũy và tổ chức kiến thức cá nhân thành wiki dài hạn theo pattern của Andrej Karpathy.

**Reference:**
- Karpathy GitHub Gist (LLM Wiki architecture): https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Antigravity Codes — Complete Guide: https://antigravity.codes/blog/karpathy-llm-wiki-idea-file
- Starmorph — How to Build: https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide
- Wiki nội bộ: `wiki/2026-04-26-karpathy-llm-wiki-pattern.md`

---

### Karpathy LLM Wiki Pattern — Tóm tắt

**3-layer architecture:**
```
raw/            ← nguồn thô bất biến (PDF, HTML, Telegram message, URL)
personal-wiki/  ← trang wiki do LLM tạo và duy trì (Markdown)
SCHEMA.md       ← schema hướng dẫn LLM (taxonomy, tag, linking convention)
```

**3 core operations:**
```
ingest  → đọc raw document → tạo/cập nhật wiki page + cross-reference
query   → đọc wiki đã compile → trả lời câu hỏi user
lint    → kiểm tra consistency, flag contradiction, update outdated
```

**Key insight vs RAG:** Kiến thức được "compile" một lần thành wiki — không tái tính toán mỗi query. LLM hoạt động như "research librarian".

---

### Phân biệt Module A vs Module C

| | Module A (ResearchCrew) | Module C (Personal Wiki) |
|---|---|---|
| Loại nội dung | Tin tức, paper hàng ngày | Kiến thức cá nhân tích lũy |
| Thời gian | Ephemeral (48h filter) | Persistent (không xóa) |
| Trigger | Task Scheduler tự động | User-driven (Telegram, file drop) |
| Output | `wiki/YYYY-MM-DD-{topic}.md` | `personal-wiki/{topic}/{slug}.md` |
| Liên kết | Độc lập mỗi ngày | Cross-reference giữa các entry |
| LLM role | Researcher + Writer | Research Librarian (ingest/query/lint) |

---

### Architecture

```
Input                       Pipeline                      Output
─────────────────           ──────────────────────        ──────────────────────
Telegram message   ──→      ingest                ──→     personal-wiki/
File drop (PDF/URL)──→        Classifier Agent            {topic}/{YYYY-MM-DD}-{slug}.md
URL forward        ──→        Linker Agent                INDEX.md (tag map)
                              Writer Agent
                  ──→      query                  ──→     trả lời Telegram
                  ──→      lint (weekly)          ──→     consistency report
```

**Entry point:**
```bash
python run_wiki.py ingest "https://..." 
python run_wiki.py ingest /path/to/file.pdf
python run_wiki.py query "what do I know about RAG vs LLM Wiki?"
python run_wiki.py lint
```

**Telegram trigger:**
```
/wiki https://...          → ingest URL
/wiki ask <câu hỏi>        → query
/wiki digest               → lint + weekly summary
```

---

### Folder Structure

```
personal-agent/
├── personal-wiki/
│   ├── SCHEMA.md               ← hướng dẫn LLM tổ chức wiki (taxonomy, tags)
│   ├── INDEX.md                ← tag map + topic index (auto-updated)
│   ├── AI/
│   │   ├── llm-agents.md
│   │   ├── rag-vs-wiki.md
│   │   └── karpathy-llm-wiki.md
│   ├── Stock/
│   │   └── nikkei-analysis.md
│   └── Personal/
├── raw/                        ← nguồn thô bất biến (không sửa)
│   └── YYYY-MM-DD-{slug}.{ext}
├── run_wiki.py                 ← entry point (ingest / query / lint)
└── crews/wiki/
    ├── agents.py               ← Classifier, Linker, Writer agents
    ├── tasks.py
    └── crew.py
```

---

### Agent Contracts

| Agent | Role | Input | Output |
|---|---|---|---|
| Classifier | Phân loại topic + extract key points | raw content + SCHEMA.md | topic, tags, key_points[] |
| Linker | Tìm entry liên quan + thêm backlink | key_points[] + INDEX.md | related_pages[], backlinks |
| Writer | Format + lưu wiki page | classified + linked data | `personal-wiki/{topic}/{slug}.md` |
| Indexer | Cập nhật INDEX.md | new page path + tags | `INDEX.md` updated |

---

### MVP Scope (build trước)

**Trong scope:**
- [ ] `run_wiki.py ingest <url|file>` — pipeline ingest hoàn chỉnh
- [ ] Classifier + Writer agent (Groq, không cần Hermes trước)
- [ ] `personal-wiki/SCHEMA.md` — taxonomy ban đầu (AI, Stock, Personal)
- [ ] `personal-wiki/INDEX.md` — auto-update sau mỗi ingest
- [ ] Telegram trigger: `/wiki <url>` → ingest + reply với link page mới
- [ ] `run_wiki.py lint` — weekly consistency check

**Để sau (ngoài MVP scope):**
- [ ] Linker Agent (semantic search) — có thể add round 2
- [ ] `run_wiki.py query` — query interface
- [ ] Hermes skill wrapper
- [ ] Voice note input

---

## 🔵 Planned — Optimization Rounds (cho Module A+B)

### [OPT-1] AI Research Input Chuẩn

**Mục tiêu:** Thay thế/bổ sung nguồn AI hiện tại (ArXiv bị block, OpenAI ít bài mới).

**Nguồn cần thêm:**

| Source | Type | Nội dung |
|---|---|---|
| Semantic Scholar API | api | Paper AI/ML, citation count, abstract |
| Papers With Code | rss/api | Paper kèm code, benchmark SOTA |
| Hugging Face Papers | rss | Daily paper digest (cs.AI, cs.LG, cs.CL) |
| The Gradient | rss | Deep-dive AI research articles |
| Import AI (Jack Clark) | rss | Weekly newsletter — model releases, policy |
| Interconnects (Nathan Lambert) | rss | RLHF, alignment, model analysis |
| Simon Willison's Blog | rss | LLM use case thực tế, tool review |
| Anthropic Research Blog | rss | Claude model updates, safety papers |
| OpenAI Research | rss | Model releases, technical reports |

**Việc cần làm:**
- [ ] Verify RSS URL từng source (test feedparser)
- [ ] Thêm vào `config.yaml` dưới topic AI
- [ ] Tune filter: paper digest → 7 ngày thay 48h
- [ ] Test ResearchCrew output sau khi thêm sources

---

### [OPT-2] Markitdown Download Pipeline

**Mục tiêu:** Download full HTML/PDF → convert sang `.md` → ResearchCrew đọc full content thay vì snippet RSS.

**Phụ thuộc:** OPT-1 (biết source nào cần download).

```
RSS/API → URL list → download_tool → markitdown_tool → input/YYYY-MM-DD-{slug}.md
                                                              ↓
                                                      ResearchCrew đọc input/
```

**Việc cần làm:**
- [ ] `tools/download_tool.py` — download URL → temp file
- [ ] `tools/markitdown_tool.py` — convert HTML/PDF → .md
- [ ] Tạo `input/` + cleanup policy (giữ 7 ngày)
- [ ] Cập nhật Researcher agent task đọc từ `input/`
- [ ] Test với paper PDF từ Semantic Scholar

---

### [OPT-3] Hermes Skill Layer (Module A + B)

**Mô tả:** Wrap ResearchCrew + Daily pipeline thành Hermes skills.

**Điều kiện trigger:** OPT-1 + OPT-2 ổn định ≥ 1 tuần.

**Lưu ý:** Llama tool-calling format bug đã xảy ra — verify Hermes tool call format trước khi implement.

**Việc cần làm:**
- [ ] Đọc Hermes skill API docs, verify tool-calling compatibility
- [ ] Wrap `run_research.py` → Hermes skill `research_crew`
- [ ] Wrap `run_daily.py` → Hermes skill `daily_briefing`
- [ ] Test trigger qua Telegram command

---

## 🗂️ Ideas — chưa scope

### JP Stock Deep Dive
- Bloomberg Japan, Nikkei Asia full article, Kabutan
- TOPIX workaround, USD/JPY, JPY/VND tỉ giá

### Multi-topic Expansion
- Thêm topic: Macro Economics, Vietnam Market, Crypto
- Config-driven hoàn toàn

### Interactive Brief
- Telegram inline buttons: "Deep dive AI", "More stock detail"
- Webhook mode thay vì push-only

---

## ✅ Done

### [2026-05-18] Daily + Weekly AI Synthesis Pipeline
- `daily_synthesis()` trong `tools/collect_tool.py` — Claude CLI via subprocess stdin
- `run_collect.py` tự động gọi synthesis sau save, output `logs/intel_reviews/YYYY-MM-DD.json`
- `run_weekly.py` (NEW) — tổng hợp 7 ngày → Claude → `logs/weekly/YYYY-Www.json`
- Task Scheduler: `opus-weekly-research` (Chủ nhật 06:00 JST)
- Dashboard startup: bat file trong Windows Startup folder (auto-start khi login)
- `config.yaml`: `auto_ingest: false` (wiki ingest đi qua `run_wiki.py audit-research`)

### [2026-05-18] Dashboard Intel → Weekly tab
- `/api/intel/weekly` endpoint trong `api/intel.py`
- `WeeklyReportView` component trong `dashboard/index.html`
- Week picker, signal trend bars, actor moves, action plan

### [2026-05-18] FDE Research Tab
- `/api/intel/fde` — concepts, actors, articles (60-day window)
- `/api/intel/fde/news` — daily news tagged by 8 actor groups
- `FDEView` + `FDENewsTab` components trong `dashboard/index.html`
- 5 sub-tabs: Daily News / Key Concepts / Adoption Map / FDE Articles / Research Queue
- Actor groups: Palantir, OpenAI, Anthropic, Microsoft, Google, Consulting+AI, SIer Japan, FDE Model

### [MVP] Module A + B — Personal AI Agent
- ResearchCrew (Researcher + Writer, Groq Llama-3.3-70b)
- Daily brief pipeline (direct Python, bypass CrewAI)
- Telegraph publish + Telegram send
- Config-driven sources, anti-spam error alerts
- Tested: 2026-04-26
