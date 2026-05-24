# Module C — Personal Wiki Agent: Research & Build Plan
**Date:** 2026-04-26
**Status:** Research done — sẵn sàng build MVP

---

## Nguồn tham khảo

| # | Nguồn | Link |
|---|---|---|
| 1 | Karpathy GitHub Gist (kiến trúc gốc) | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f |
| 2 | Antigravity Codes — Complete Guide | https://antigravity.codes/blog/karpathy-llm-wiki-idea-file |
| 3 | Starmorph — How to Build | https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide |
| 4 | lucasastorian/llmwiki (community impl) | https://github.com/lucasastorian/llmwiki |
| 5 | Wiki nội bộ — Karpathy Pattern summary | wiki/2026-04-26-karpathy-llm-wiki-pattern.md |

---

## 1. Core Concept (từ Karpathy gốc)

LLM Wiki là **"persistent, compounding artifact"** — kiến thức được compile một lần, không tính lại mỗi query.

> "Wiki is not a search index. It's a curated, maintained knowledge graph — connections and contradictions are already flagged before you ask."
> — Karpathy

3 điểm khác biệt với RAG:
- **Stateful** thay vì stateless — mỗi ingest làm giàu thêm wiki hiện có
- **Pre-built cross-reference** — liên kết được tạo lúc ingest, không lúc query
- **Source-level traceability** — mỗi claim có link về page wiki, page wiki có link về raw source

---

## 2. Kiến trúc đầy đủ (Karpathy + Antigravity Codes)

```
project/
├── raw/
│   ├── articles/          ← HTML/text đã clip
│   ├── papers/            ← PDF khoa học
│   ├── repos/             ← README, code snippets
│   └── assets/            ← hình ảnh, file đính kèm
├── wiki/
│   ├── concepts/          ← trang khái niệm (vd: rag.md, llm-agents.md)
│   ├── entities/          ← trang về người/tổ chức/sản phẩm
│   ├── sources/           ← tóm tắt từng raw source
│   ├── comparisons/       ← so sánh (vd: rag-vs-wiki.md)
│   ├── INDEX.md           ← tag map + topic index
│   ├── log.md             ← lịch sử ingest
│   └── overview.md        ← tổng quan toàn wiki
└── SCHEMA.md              ← hướng dẫn LLM (taxonomy, format, conventions)
```

### SCHEMA.md — nội dung cần có

SCHEMA.md là file LLM **đọc trước mọi thao tác**. Cần define:

```markdown
# Wiki Schema

## Naming conventions
- File names: kebab-case (vd: llm-agents.md, rag-vs-wiki.md)
- Folder: concepts/ entities/ comparisons/ sources/

## YAML frontmatter (bắt buộc mỗi trang)
---
title: "Tên trang"
type: concept | entity | comparison | source
tags: [AI, LLM, RAG, ...]
sources: [raw/papers/xxx.pdf, ...]
related: [[page-slug]], [[another-page]]
confidence: high | medium | low
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## Cross-reference convention
- Dùng [[wikilink]] syntax
- Mỗi trang concepts/ phải có ít nhất 1 related link
- Contradiction → dùng tag: contradiction

## Page structure
1. Summary (2-3 câu)
2. Key concepts (bullet)
3. Details
4. See also (cross-refs)
5. Sources
```

---

## 3. Ba Operations Chi Tiết

### ingest
```
Input:  URL, file path, hoặc raw text
Steps:
  1. Download/read → lưu vào raw/{category}/
  2. Đọc SCHEMA.md
  3. Extract key concepts, entities, claims
  4. Check INDEX.md: trang liên quan nào đã có?
  5. Tạo/cập nhật wiki pages bị ảnh hưởng
  6. Add cross-references [[wikilink]] vào các trang liên quan
  7. Update INDEX.md + log.md
Output: wiki page(s) mới/cập nhật + INDEX.md updated
```

### query
```
Input:  câu hỏi từ user
Steps:
  1. Đọc INDEX.md → tìm trang liên quan
  2. Đọc 2-5 trang wiki liên quan nhất
  3. Synthesize câu trả lời, dẫn nguồn [[wiki page]]
Output: câu trả lời + link wiki pages
```

### lint (chạy định kỳ — weekly)
```
Input:  toàn bộ wiki/
Steps:
  1. Scan orphaned pages (không có link nào trỏ đến)
  2. Flag contradiction (cùng claim, khác nhau giữa các trang)
  3. Flag stale pages (> 30 ngày không update, topic còn active)
  4. Check broken wikilinks
  5. Suggest merges (2 trang quá giống nhau)
Output: lint_report.md + auto-fix broken links
```

---

## 4. RAG vs LLM Wiki — Khi nào dùng cái nào

| Factor | RAG | LLM Wiki |
|---|---|---|
| State | Stateless queries | Compounding knowledge |
| Infrastructure | Vector DB + pipelines | Plain markdown files |
| Cross-references | Query-time discovery | Pre-built và maintained |
| Traceability | Chunk-level citations | Source-level links |
| Scale phù hợp | Enterprise (1M+ docs) | Personal/team (~100-200 sources) |
| Quality degradation | Ổn ở scale lớn | Giảm > 200K-300K tokens wiki |
| Setup cost | Cao (embedding pipeline) | Thấp (chỉ cần LLM + files) |

**Kết luận:** LLM Wiki phù hợp hoàn toàn cho use case cá nhân của Module C.

---

## 5. Community Implementation — lucasastorian/llmwiki

Stack đầy đủ của implementation phổ biến nhất:

| Component | Tech | Ghi chú |
|---|---|---|
| Backend | FastAPI + asyncpg | Authentication, uploads, processing |
| Converter | LibreOffice | Office/PDF → text |
| MCP Server | MCP SDK + Supabase OAuth | Claude tools |
| Storage | S3-compatible | File management |
| Frontend | Next.js + Tailwind | Dashboard (không cần cho MVP cá nhân) |

**MCP tools trong llmwiki:** `guide`, `search`, `read`, `write`, `delete`

**Nhận xét cho Module C:** Stack này quá nặng cho personal use. MVP chỉ cần Python + local files + Groq.

---

## 6. Tool Stack Được Đề Xuất Cho Module C

| Tool | Mục đích | Lý do chọn |
|---|---|---|
| Groq Llama-3.3-70b | LLM core | Đang dùng, free tier |
| `markitdown` | PDF/HTML → .md | Đã plan ở Opt-2 |
| `feedparser` / `requests` | Fetch URL | Đang dùng |
| Local filesystem | raw/ + wiki/ | Đơn giản, không cần DB |
| Git | Version control | Track thay đổi wiki |
| Telegram Bot API | Input trigger | Đang dùng |

**Không cần:** Vector DB, embeddings, S3, web frontend.

---

## 7. Adaptation Cho Module C — Personal Use

### Mapping Karpathy → Module C

| Karpathy | Module C | Ghi chú |
|---|---|---|
| `raw/articles/` | `raw/articles/` | Bài viết từ URL |
| `raw/papers/` | `raw/papers/` | PDF khoa học |
| `CLAUDE.md` | `SCHEMA.md` | Không dùng tên CLAUDE.md (tránh nhầm) |
| CLI / Claude Code | `run_wiki.py` | Entry point Python |
| Obsidian browse | VSCode / direct read | Đơn giản hơn |
| Web Clipper | `markitdown` tool | Convert HTML/PDF → .md |

### Input Sources Cho Module C

| Source | Trigger | raw/ category |
|---|---|---|
| Telegram message (URL forward) | `/wiki <url>` | articles/ |
| Telegram message (text note) | `/wiki note <text>` | notes/ |
| File drop (PDF) | `/wiki` + attachment | papers/ |
| Module A wiki output | Tự động sau run_research | research/ |

### Topics Ban Đầu (SCHEMA.md taxonomy)

```
AI/           → LLM, agents, tools, papers
Stock/        → Nikkei, market analysis, macro
Personal/     → learning notes, decisions, goals
Tech/         → tools, frameworks, patterns
```

---

## 8. MVP Build Plan

### Phase 1 — Foundation (build trước)

**Target:** `run_wiki.py ingest <url|file>` hoạt động end-to-end

```
run_wiki.py ingest https://...
  → download + markitdown convert → raw/articles/
  → LLM đọc SCHEMA.md + raw file
  → tạo wiki/{topic}/{slug}.md
  → update INDEX.md + log.md
  → print: "Created wiki/AI/llm-agents.md"
```

Files cần tạo:
- `run_wiki.py` — CLI entry point (ingest / query / lint)
- `personal-wiki/SCHEMA.md` — schema ban đầu
- `personal-wiki/INDEX.md` — khởi tạo rỗng
- `crews/wiki/agents.py` — WikiAgent (Groq)
- `crews/wiki/tasks.py` — ingest_task, query_task, lint_task
- `tools/markitdown_tool.py` — HTML/PDF → .md

### Phase 2 — Telegram Integration

```
Telegram: /wiki https://...
  → run_wiki.py ingest
  → reply: "Saved to wiki/AI/llm-agents.md"

Telegram: /wiki ask what do I know about RAG?
  → run_wiki.py query
  → reply: tóm tắt + link wiki page
```

### Phase 3 — Lint + Auto-ingest từ Module A

```
Mỗi tuần (Task Scheduler, Chủ nhật):
  run_wiki.py lint → lint_report.md → send Telegram

Sau mỗi run_research.py:
  auto-call run_wiki.py ingest wiki/YYYY-MM-DD-AI.md
  → Module A output → compile vào personal-wiki/AI/
```

---

## 9. Risks & Decisions

| Risk | Quyết định |
|---|---|
| Groq context limit — wiki quá lớn | Chỉ pass INDEX.md + 2-3 trang liên quan vào prompt, không pass toàn wiki |
| LLM tạo cross-reference sai | Lint operation detect + flag contradiction weekly |
| Quality degradation > 200K tokens | Monitor wiki size, split topic thành subtopic khi cần |
| Llama tool-calling bug (đã gặp ở Module B) | Dùng direct Groq SDK (không CrewAI) giống Module B |
| raw/ tích lũy quá nhiều | Cleanup policy: giữ 90 ngày, archive cũ hơn |

---

## 10. Kết Luận — Sẵn Sàng Build

Pattern đã được validate bởi Karpathy + community. Adapter cho personal use đơn giản hơn nhiều so với full stack (lucasastorian/llmwiki).

**Minimal viable implementation:**
- Python + Groq SDK (đang có)
- `markitdown` (cần install)
- Local filesystem (không cần DB/S3)
- ~200 dòng code cho `run_wiki.py` + `crews/wiki/`

**Bước tiếp theo:** Tạo `SCHEMA.md` → viết `run_wiki.py ingest` → test với 1 URL.

---
*Research by: Personal Agent ResearchCrew — 2026-04-26*
*Sources: Karpathy Gist + Antigravity Codes + Starmorph + lucasastorian/llmwiki*
