# SA — System Architecture: Personal Agent
**Date:** 2026-04-28
**Status:** ⛔ Superseded → [`SA-opus-animus-v2.md`](SA-opus-animus-v2.md) (2026-06-21, v4-aligned)

> ⚠️ **Lịch sử.** Doc này mô tả kiến trúc "personal-agent"/Groq trước khi đổi naming opus-* và trước Operating Model v4. Giữ lại để tham chiếu lịch sử pipeline Consilium (Module A/B/C). Kiến trúc hiện hành: **`SA-opus-animus-v2.md`**.

---
**Date:** 2026-04-28
**Status (gốc):** 🟢 Current

---

## 1. Tổng Quan Hệ Thống

Hệ thống gồm 2 thành phần với vai trò rõ ràng:

| Component | Vai trò | Loại |
|---|---|---|
| **personal-agent** | Core agent — research, brief, wiki | Main application |
| **markitdown-agent** | Input tool — convert bất kỳ file → `.md` | Supporting tool |

```
markitdown-agent (tool)
        │  converts any file → .md
        ▼
personal-agent (core)
  ├── Module A: ResearchCrew   → daily research + Telegraph (CrewAI + Groq)
  ├── Module B: Daily Brief    → Telegram morning summary (Groq direct)
  └── Module C: Wiki Agent     → compounding knowledge base (Groq direct)
```

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INPUTS                              │
│  RSS feeds   Web search   Telegram   Downloads   Manual files   │
└──────┬───────────┬────────────┬──────────┬───────────┬─────────┘
       │           │            │          │           │
       ▼           ▼            ▼          ▼           ▼
  rss_tool    search_tool   Bot API    raw/inbox/  raw/inbox/
  (full HTML) (snippets)   (cmds+files) (drag&drop) (CLI drop)
       │           │            │          └──────────┘
       │           │            │                │
       │           │            │         markitdown-agent
       │           │            │         (watch + convert)
       │           │            │                │
       └───────────┴────────────┴────────────────┘
                                │
                       raw/ (immutable sources)
                       ├── articles/   ← text/web content
                       ├── papers/     ← PDF, academic
                       ├── notes/      ← voice, image, short note
                       └── inbox/      ← drop zone (transient)
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             Module A                 Module C
          ResearchCrew              Wiki Agent
          (synthesis)               (ingest pipeline)
                    │                       │
                    ▼                       ▼
             wiki/ (ephemeral)     personal-wiki/ (persistent)
             YYYY-MM-DD-{topic}.md  AI/ Stock/ Tech/ Personal/
                    │                       │
                    ▼                       ▼
             Telegraph publish       INDEX.md + log.md
                    │                       │
                    └───────────┬───────────┘
                                ▼
                         Module B
                       Daily Brief
                       (synthesize wiki output)
                                │
                                ▼
                           Telegram
                         (morning push)
```

---

## 3. Data Flow Chi Tiết

### 3.1 Flow A — RSS Research (Module A)

```
1. Task Scheduler 06:00 → run_research.py AI
2. ResearchCrew.Researcher:
   a. RSSTool.fetch(url) → title + full HTML via markitdown → raw/articles/
   b. WebSearchTool.search(query) → snippets → raw/articles/
   c. YFinanceTool (JP_STOCK only)
3. ResearchCrew.Writer → wiki/YYYY-MM-DD-{topic}.md
4. Telegraph publish → URL
5. Hook 5A: ingest_new_raw() → personal-wiki/ auto-update
6. Hook 5B (if >10 pages): wiki_context query → focus research on new content
```

### 3.2 Flow B — File Drop via markitdown-agent

```
1. User/Bot drops file vào raw/inbox/
2. markitdown-agent detects (watchdog)
3. Convert → route theo extension:
   - .pdf, .docx, .pptx → raw/papers/
   - .html, .xlsx, .csv, .txt → raw/articles/
   - .png, .jpg, .mp3, .m4a → raw/notes/
4. Original file moved to raw/inbox/processed/
5. `run_wiki.py ingest --dry-run <file>` can preview create/update decisions before writing.
6. Real ingest/update writes a timestamped backup under `personal-agent/backups/personal-wiki/` before replacing an existing page.
7. Content Collector auto-ingest is disabled by default while concept-first updates are under review (`collect.auto_ingest: false`).
```

### 3.3 Flow C — Telegram Manual

```
1. User gửi /wiki <url>  → telegram_handler.py → run_ingest(url)
2. User gửi /wiki ask X  → run_query(X) → reply
3. User gửi file cho bot → bot saves to raw/inbox/ → Flow B
```

### 3.4 Flow D — Daily Brief (Module B)

```
1. Task Scheduler 06:00 (sau Module A) → run_daily.py
2. Đọc wiki/ output của Module A (today's files)
3. Groq synthesize → formatted brief
4. Telegram push → user nhận summary sáng
```

---

## 4. Component Boundaries

### personal-agent — Core

```
crews/
  research/   ← Module A: ResearchCrew (Researcher + Writer agents)
  daily/      ← Module B: DailyCrew

tools/        ← shared tools cho CrewAI agents
  rss_tool.py         fetch RSS + save raw/articles/
  search_tool.py      DuckDuckGo search + save raw/articles/
  yfinance_tool.py    stock data + save raw/articles/
  telegraph_tool.py   publish to Telegraph
  wiki_tool.py        save wiki/ files
  markitdown_tool.py  convert URL/file → markdown text

wiki_ops/     ← Module C: Wiki operations (Groq direct, no CrewAI)
  ingest.py           raw/ → personal-wiki/ (LLM compile)
  query.py            personal-wiki/ → answer (LLM)
  lint.py             consistency checks (no LLM)
  telegram_handler.py poll Telegram commands

skills/       ← Phase 6 (future): Hermes skill wrapper
utils/        ← config loader, telegram sender

raw/          ← immutable input (never edited after write)
personal-wiki/← compounding knowledge (only grows)
backups/      ← timestamped wiki page backups before LLM update writes
wiki/         ← ephemeral daily output (can archive/delete)
```

### markitdown-agent — Tool

```
agent.py    ← watch raw/inbox/ → convert → route to raw/articles|papers|notes/
config.yaml ← watched folder, output routing rules, supported extensions
input/      ← standalone mode (when used outside personal-agent)
output/     ← standalone mode output
```

**Standalone mode:** `python agent.py` → watch `input/`, output `output/` (original behavior)
**Integrated mode:** configure `watched_dir = personal-agent/raw/inbox/`, routing enabled

---

## 5. Storage Design

```
raw/                     ← Write-once. Source of truth cho ingest.
  articles/              ← text content (HTML, RSS, search results)
  papers/                ← academic/technical PDFs
  notes/                 ← short notes, voice transcripts, images OCR
  inbox/                 ← transient drop zone (processed → moved)
  inbox/processed/       ← inbox files sau khi converted (archive)

personal-wiki/           ← Append-mostly. LLM-compiled knowledge.
  SCHEMA.md              ← taxonomy guide (đừng xóa)
  INDEX.md               ← auto-updated tag map
  log.md                 ← ingest history
  AI/ Stock/ Tech/ Personal/

wiki/                    ← Ephemeral. Daily research output.
  YYYY-MM-DD-{topic}.md  ← overwrite/archive after 7 days
```

---

## 6. Scheduling

| Task | Schedule | Entry Point |
|---|---|---|
| Module A — AI research | Daily 05:50 | `run_research.py AI` |
| Module A — JP_STOCK | Daily 05:50 | `run_research.py JP_STOCK` |
| Module B — Daily Brief | Daily 06:00 | `run_daily.py` |
| Module C — Wiki Poll | Every 5 min | `run_wiki.py poll` |
| Module C — Lint | Sunday 06:00 | `run_wiki.py lint` |
| markitdown-agent | Always-on (manual) | `markitdown-agent/agent.py` |

---

## 7. Integration Points

| From | To | Mechanism |
|---|---|---|
| markitdown-agent | raw/articles/ papers/ notes/ | File write (watchdog detect) |
| Module A hook | Module C ingest | `ingest_new_raw(since)` call |
| Module A wiki/ | Module B | File read (today's date) |
| Telegram bot | raw/inbox/ | Bot saves attachment |
| raw/inbox/ | markitdown-agent | watchdog event |

---

## 8. Technology Decisions

| Decision | Choice | Reason |
|---|---|---|
| LLM engine | Groq direct SDK | Free tier, fast, avoid CrewAI tool-call bug |
| CrewAI usage | Module A only | Useful for research/writer orchestration; skipped for deterministic JSON/wiki operations |
| File watching | watchdog | Cross-platform, stable, no polling overhead |
| Scheduling | Windows Task Scheduler | No extra daemon, native Windows |
| Storage | Flat .md files | Diff-friendly, LLM-readable, no infra |
| Conversion | markitdown[all] | Single lib, all formats, maintained by Microsoft |

---

*Personal Agent System — SA v1.0 | 2026-04-28*
