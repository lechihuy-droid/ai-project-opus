# BD — Build Plan: Module C Personal Wiki Agent
**Date:** 2026-04-26
**Status:** 🔵 Planning
**Architecture ref:** `wiki/2026-04-26-module-c-architecture.md`

---

## Kiến Trúc 3 Tầng — Tổng Quan

```
┌─────────────────────────────────────────────────────┐
│  TẦNG 3 — Hermes Skill          [Phase 6 — Full]    │
│  NL parsing · Intent · Context · Cross-skill        │
├─────────────────────────────────────────────────────┤
│  TẦNG 2 — Wiki Operations       [Phase 1-5 — MVP]   │
│  ingest() · query() · lint()                        │
├─────────────────────────────────────────────────────┤
│  TẦNG 1 — Karpathy Storage      [Phase 0 — MVP]     │
│  raw/  ·  personal-wiki/  ·  SCHEMA.md              │
└─────────────────────────────────────────────────────┘
```

**MVP = Tầng 1 + 2** — đủ value, build ngay.
**Full = + Tầng 3** — add sau khi wiki có > 20 pages và CLI thấy bất tiện.

---

## Quyết Định Thiết Kế — Đối Chiếu Research

| Câu hỏi | Research nói gì | Quyết định |
|---|---|---|
| LLM engine? | Module B đã gặp Llama tool-calling bug với CrewAI | **Direct Groq SDK** — giống Module B |
| Folder structure? | Karpathy: `concepts/`, `entities/` | **Đơn giản hóa**: `AI/`, `Stock/`, `Personal/`, `Tech/` |
| Schema file tên? | Karpathy gọi là `CLAUDE.md` | **`SCHEMA.md`** — tránh nhầm Claude Code |
| Context limit? | Starmorph: degradation > 200-300K tokens | **INDEX.md + 2-3 pages vào prompt** — không pass toàn wiki |
| Cross-ref format? | Antigravity Codes: `[[wikilink]]` | **`[[wikilink]]`** — Obsidian-compatible |
| PDF/HTML convert? | lucasastorian dùng LibreOffice | **`markitdown`** — nhẹ hơn, đã plan Opt-2 |
| Lint frequency? | Karpathy: periodic maintenance | **Weekly, Chủ nhật 6:00 ICT** |
| Telegram mode? | Module B push-only | **Polling (Task Scheduler 5 phút)** — extend pattern cũ |
| Auto-ingest Module A? | Không có trong Karpathy gốc | **Thêm**: hook cuối `run_research.py` |
| NL interface khi nào? | Hermes = intelligence layer trên Karpathy | **Phase 6** — sau khi MVP stable ≥ 2 tuần |

---

## Roadmap Phases

```
── MVP TRACK (Tầng 1+2) ──────────────────────────────────────────────
Phase 0  Foundation       Folder structure · SCHEMA.md · markitdown
Phase 1  Ingest Core      run_wiki.py ingest (URL / file / .md)
Phase 2  Query            run_wiki.py query — trả lời từ wiki compiled
Phase 3  Telegram         /wiki commands — polling Task Scheduler
Phase 4  Lint             run_wiki.py lint — weekly Task Scheduler
Phase 5A Shared raw/      Module A lưu raw sources → raw/ → Module C ingest độc lập
Phase 5B Bidirectional    Module C wiki → context feed ngược vào Module A trước research

── FULL TRACK (Tầng 3) ───────────────────────────────────────────────
Phase 6  Hermes Skill     NL intent · context · cross-skill orchestration
```

**Trigger Phase 6:** wiki > 20 pages + ≥ 2 tuần stable + user thấy explicit `/wiki ask` bất tiện.

**Trigger Phase 5B:** Phase 5A ổn định + personal-wiki/ có đủ content để query có ý nghĩa (> 10 pages AI).

---

## Phase 0 — Foundation (Tầng 1)

**Mục tiêu:** Scaffold Karpathy 3-layer storage. Không có LLM call.

### 0.1 Folder Structure

```
personal-agent/
├── personal-wiki/          ← Tầng 1: compounding knowledge
│   ├── SCHEMA.md           ← LLM reads before every operation
│   ├── INDEX.md            ← compact tag map, always passed to LLM
│   ├── log.md              ← ingest history
│   ├── AI/
│   ├── Stock/
│   ├── Personal/
│   └── Tech/
├── raw/                    ← Tầng 1: immutable sources
│   ├── articles/
│   ├── papers/
│   └── notes/
├── wiki/                   ← Module A output (không thay đổi)
├── tools/
│   └── markitdown_tool.py  ← NEW
└── run_wiki.py             ← NEW: entry point Tầng 2
```

> `personal-wiki/` tách khỏi `wiki/` của Module A để tránh conflict.
> `raw/` là immutable layer theo đúng Karpathy — LLM chỉ đọc, không ghi.

### 0.2 `personal-wiki/SCHEMA.md`

LLM **đọc file này trước mỗi thao tác**. Nội dung:

```markdown
# Personal Wiki Schema

## Topics
- AI/       — LLM, agents, tools, papers, use cases
- Stock/    — Nikkei, market analysis, macro economics
- Personal/ — learning notes, decisions, reading list
- Tech/     — tools, frameworks, patterns, workflows

## File naming
- kebab-case lowercase: llm-agents.md, rag-vs-wiki.md
- Tên mô tả concept, không phải ngày tháng

## YAML frontmatter (bắt buộc)
---
title: "Tên trang"
topic: AI | Stock | Personal | Tech
tags: [tag1, tag2]
sources: [raw/articles/xxx.md]
related: ["[[other-page]]"]
confidence: high | medium | low
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## Page structure
1. Summary — 2-3 câu
2. Key points — bullet
3. Details
4. See also — [[cross-refs]]
5. Sources

## Cross-reference rules
- [[page-name]] syntax, không kèm thư mục
- Mỗi page mới: ít nhất 1 See also nếu có page liên quan
- Contradiction → tag: contradiction

## Lint rules
- Orphan: không page nào [[link]] đến → flag
- Contradiction: claim mâu thuẫn giữa 2 pages → flag
- Stale: > 30 ngày không update, topic còn active → flag
```

### 0.3 Mở rộng `utils/config.py`

```python
def personal_wiki_dir() -> Path:
    d = ROOT / "personal-wiki"
    d.mkdir(exist_ok=True)
    return d

def raw_dir(category: str = "") -> Path:
    d = ROOT / "raw" / category if category else ROOT / "raw"
    d.mkdir(parents=True, exist_ok=True)
    return d
```

### 0.4 `tools/markitdown_tool.py`

```python
from markitdown import MarkItDown
from pathlib import Path

_md = MarkItDown()

def convert_url(url: str) -> str:
    return _md.convert_url(url).text_content

def convert_file(path: str) -> str:
    return _md.convert(path).text_content
```

Install: `pip install markitdown`

---

## Phase 1 — Ingest Core (Tầng 2)

**Mục tiêu:** `python run_wiki.py ingest <url|file>` hoạt động end-to-end.
**Đây là trung tâm của toàn hệ thống — mọi phase sau build trên đây.**

### 1.1 `run_wiki.py`

```python
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "ingest":
        from wiki.ingest import run_ingest
        run_ingest(sys.argv[2])
    elif cmd == "query":
        from wiki.query import run_query
        run_query(" ".join(sys.argv[2:]))
    elif cmd == "lint":
        from wiki.lint import run_lint
        run_lint()
    elif cmd == "poll":
        from wiki.telegram_handler import poll_once
        poll_once()
```

### 1.2 `wiki/ingest.py` — 7 Bước Karpathy

```
Step 1  detect_type(input)     → URL / PDF / .md / plain text
Step 2  download + convert     → raw/{category}/YYYY-MM-DD-{slug}.md  (markitdown)
Step 3  read SCHEMA.md         → LLM context
Step 4  read INDEX.md          → tìm related pages đã có
Step 5  Groq LLM call          → tạo wiki page (frontmatter + content + cross-refs)
Step 6  update INDEX.md        → thêm 1 dòng entry mới
Step 7  append log.md          → timestamp + source + page path
```

**LLM Prompt:**

```python
system = "You are a personal knowledge librarian. Compile source into a wiki page. Plain text, no emojis."

user = f"""
SCHEMA:
{schema_content}

EXISTING INDEX:
{index_content}

SOURCE ({len(raw_content)} chars):
{raw_content[:4000]}

Task: Create a wiki page. Return JSON only:
{{
  "topic": "AI",
  "filename": "llm-agents.md",
  "content": "---\\ntitle: ...\\n---\\n## Summary\\n...",
  "backlink_pages": ["rag-patterns.md"]
}}
"""
```

> Context strategy: SCHEMA (~500 tokens) + INDEX (~800 tokens) + source (:4000) = ~5300 tokens — an toàn với Groq 8K context.

### 1.3 Input Type Handler

```python
def prepare_raw(src: str) -> tuple[str, str]:
    # returns (content, category)
    if src.startswith("http"):
        content = convert_url(src)
        category = "papers" if ("arxiv" in src or src.endswith(".pdf")) else "articles"
    elif src.endswith(".pdf"):
        content = convert_file(src)
        category = "papers"
    elif src.endswith(".md"):
        content = Path(src).read_text(encoding="utf-8")
        category = "articles"
    else:
        content = src
        category = "notes"
    return content, category
```

### 1.4 INDEX.md Format

Compact — 1 dòng/page, < 1000 tokens cho 50+ pages:

```markdown
# Personal Wiki Index
*Updated: 2026-04-26 10:30*

## AI
- [[karpathy-llm-wiki]] — Karpathy LLM Wiki pattern, 3-layer arch | tags: wiki, LLM, Karpathy
- [[llm-agents]] — LLM agent patterns, tool use, ReAct | tags: LLM, agents, CrewAI
- [[rag-vs-wiki]] — RAG vs LLM Wiki comparison | tags: RAG, wiki, knowledge-base

## Stock
- [[nikkei-overview]] — Nikkei 225 overview | tags: Nikkei, Japan
```

### 1.5 Test Cases

```bash
# URL → articles/
python run_wiki.py ingest "https://antigravity.codes/blog/karpathy-llm-wiki-idea-file"

# Module A .md → AI/
python run_wiki.py ingest "wiki/2026-04-26-AI.md"

# PDF → papers/
python run_wiki.py ingest "raw/papers/attention-is-all-you-need.pdf"
```

---

## Phase 2 — Query (Tầng 2)

**Mục tiêu:** Trả lời câu hỏi từ wiki đã compile. Không search raw/, chỉ đọc `personal-wiki/`.

### 2.1 `wiki/query.py` — 2-Call Pattern

```
Call 1 (nhẹ): INDEX.md + question → "pages nào liên quan?"  → [page-a, page-b, page-c]
Call 2 (đầy đủ): content 2-4 pages + question → synthesize answer + cite [[sources]]
```

2 calls thay vì 1 — tránh pass toàn wiki vào context (context limit risk từ Starmorph research).

### 2.2 Response Format

```
Query: "what do I know about RAG?"

RAG (Retrieval-Augmented Generation) retrieves relevant chunks from a vector
store before LLM generation. Best at enterprise scale (1M+ docs).

Key points from your wiki:
- Stateless: no cross-references between retrieved chunks [from [[rag-vs-wiki]]]
- For personal scale, LLM Wiki compiles once → queries are faster [from [[karpathy-llm-wiki]]]
- Main alternative: LLM Wiki pattern [from [[rag-vs-wiki]]]

Sources: [[rag-vs-wiki]], [[karpathy-llm-wiki]]
```

---

## Phase 3 — Telegram Integration (Tầng 2)

**Mục tiêu:** Trigger ingest/query từ điện thoại, không cần mở terminal.

### 3.1 Commands

```
/wiki <url>           → ingest URL
/wiki note <text>     → ingest plain text note
/wiki ask <question>  → query wiki
/wiki digest          → lint report + weekly summary
```

File attachment → bot nhận file → ingest PDF/doc.

### 3.2 Polling — Task Scheduler Option B

```python
# wiki/telegram_handler.py
def poll_once():
    """
    Gọi getUpdates với offset, xử lý pending /wiki commands, update offset.
    Task Scheduler chạy mỗi 5 phút — không cần process chạy liên tục.
    """
    updates = get_updates(offset)
    for update in updates:
        if update.text.startswith("/wiki"):
            handle_wiki_command(update)
        save_offset(updates[-1].id + 1)
```

Task Scheduler:
```
Task: wiki-poll
Trigger: Every 5 minutes
Action: python run_wiki.py poll
```

> Option A (long-polling liên tục) thực ra tốt hơn cho responsiveness, nhưng cần Windows Service hoặc process monitor. Option B phù hợp với kiến trúc hiện tại hơn.

---

## Phase 4 — Lint (Tầng 2)

**Mục tiêu:** Weekly consistency check, gửi report qua Telegram.

### 4.1 `wiki/lint.py` — 5 Checks (thuần Python, không cần LLM)

```python
checks = [
    check_orphan_pages,        # không page nào [[link]] đến
    check_broken_links,        # [[link]] trỏ đến file không tồn tại
    check_contradictions,      # pages có tag: contradiction chưa resolved
    check_stale_pages,         # updated > 30 ngày
    check_missing_frontmatter, # thiếu YAML frontmatter
]
```

> Lint không cần LLM — parse markdown + frontmatter bằng Python. Nhanh, không tốn token.

### 4.2 Lint Report

```
Wiki Lint Report — 2026-04-28 | 12 pages total

[ORPHAN]      Personal/goals-2026.md — no inbound links
[BROKEN]      AI/llm-agents.md → [[transformer-arch]] not found
[STALE]       Stock/nikkei-overview.md — 35 days since update
[OK]          No unresolved contradictions
[OK]          All frontmatter valid

Added this week: 4 pages (2 AI, 1 Stock, 1 Tech)
```

### 4.3 Task Scheduler

```
Task: wiki-lint-weekly
Trigger: Sunday 06:00 ICT
Action: python run_wiki.py lint
```

---

## Phase 5A — Shared raw/ Layer: Module A → Module C (Option B)

**Mục tiêu:** Module A lưu raw sources vào `raw/` **trước khi** ResearchCrew xử lý. Module C ingest từ `raw/` độc lập — compile kiến thức từ nguồn thô, không phải từ output đã được Module A filter.

**Tại sao tốt hơn hook trên wiki output:**
```
Option cũ (hook):  Module A LLM đã filter/format → Module C nhận pre-processed content
Option B (raw/):   Module A lưu raw → Module C LLM tự compile → 2 LLM nhìn cùng 1 nguồn
                   → Module C có thể extract insights mà Module A bỏ qua
```

### 5A.1 Flow Mới

```
RSS/yfinance/websearch
        │
        ▼
tools/ fetch raw content
        │
        ├──→ raw/articles/YYYY-MM-DD-{source}-{slug}.md   ← NEW: lưu trước khi LLM
        │
        ▼
ResearchCrew (Module A)          run_wiki.py ingest (Module C)
Researcher → Writer               wiki/ingest.py
wiki/YYYY-MM-DD-{topic}.md        personal-wiki/{topic}/{slug}.md
(ephemeral daily snapshot)        (compounding knowledge)
```

### 5A.2 Refactor Module A — Lưu Raw Sources

Thêm `save_raw=True` vào từng tool, lưu vào `raw/` trước khi trả về content:

**`tools/rss_tool.py`:**
```python
from utils.config import raw_dir
from datetime import date

def fetch_rss(url: str, max_items: int = 5, save_raw: bool = True) -> list[dict]:
    items = _parse_feed(url, max_items)
    if save_raw:
        for item in items:
            slug = slugify(item["title"])[:60]
            path = raw_dir("articles") / f"{date.today()}-{slug}.md"
            path.write_text(f"# {item['title']}\n\nSource: {item['url']}\n\n{item['content']}", encoding="utf-8")
    return items
```

**`tools/search_tool.py`:**
```python
def web_search(query: str, max_results: int = 5, save_raw: bool = True) -> list[dict]:
    results = _ddgs_search(query, max_results)
    if save_raw:
        slug = slugify(query)[:40]
        path = raw_dir("articles") / f"{date.today()}-search-{slug}.md"
        content = "\n\n".join(f"## {r['title']}\n{r['url']}\n{r['snippet']}" for r in results)
        path.write_text(content, encoding="utf-8")
    return results
```

**`tools/yfinance_tool.py`:**
```python
def fetch_price(symbols: list[str], save_raw: bool = True) -> list[dict]:
    data = _fetch(symbols)
    if save_raw:
        path = raw_dir("articles") / f"{date.today()}-yfinance-{'_'.join(symbols)}.md"
        path.write_text(_format_md(data), encoding="utf-8")
    return data
```

### 5A.3 Module C — Ingest Từ raw/ Sau Khi Module A Chạy

Thay vì hook trên wiki output, trigger ingest trên raw/ mới được tạo:

```python
# run_research.py — cuối main(), sau khi ResearchCrew done
from wiki.ingest import ingest_new_raw
ingest_new_raw(since=run_start_time)  # chỉ ingest raw files được tạo trong lần chạy này
print(f"[run_research] Module C ingest from raw/ done")
```

```python
# wiki/ingest.py
def ingest_new_raw(since: datetime):
    raw_files = sorted(raw_dir("articles").glob("*.md"))
    new_files = [f for f in raw_files if datetime.fromtimestamp(f.stat().st_mtime) >= since]
    for f in new_files:
        run_ingest(str(f))
```

### 5A.4 Kết Quả Dài Hạn

```
raw/articles/                          personal-wiki/AI/
2026-04-26-techcrunch-ai.md   ──→      llm-agents.md        (compiled từ nhiều raw)
2026-04-26-search-ai-news.md  ──→      gpt-4o-analysis.md   (cross-referenced)
2026-04-27-huggingface-xxx.md ──→      transformer-arch.md  (updated khi có thêm raw)
...90+ files sau 3 tháng...            ...growing wiki...
```

---

## Phase 5B — Bidirectional: Module C → Module A (Option C)

**Mục tiêu:** Trước khi ResearchCrew chạy, query `personal-wiki/` xem đã biết gì về topic → pass context vào Researcher agent → tránh re-research, tập trung vào điều mới.

**Trigger:** Phase 5A stable + `personal-wiki/AI/` có > 10 pages (đủ để query có ý nghĩa).

### 5B.1 Flow Bidirectional

```
run_research.py AI
        │
        ▼
[NEW] query personal-wiki/AI/
      "What do I already know about AI? What was last covered?"
        │
        ▼
existing_context = {
    "known_topics": ["llm-agents", "rag-patterns", "gpt-4o"],
    "last_updated": "2026-04-25",
    "knowledge_gaps": ["Claude 3.5 Sonnet", "Gemini 2.0 updates"]
}
        │
        ▼
ResearchCrew kickoff(topic, existing_context)
Researcher prompt: "Focus on NEW developments since 2026-04-25.
                   I already know: llm-agents, rag-patterns.
                   Prioritize: Claude 3.5 Sonnet, Gemini 2.0"
        │
        ▼
Module A wiki + raw/ (richer, less redundant)
        │
        ▼
Module C ingest (5A pipeline)
```

### 5B.2 Thay Đổi Module A — `run_research.py`

```python
def get_wiki_context(topic: str) -> dict:
    """Query personal-wiki/ trước khi research — lấy known topics + gaps."""
    from wiki.query import run_query
    result = run_query(
        f"What do I know about {topic}? List known subtopics and last update date.",
        max_pages=5
    )
    return {
        "known_summary": result["answer"],
        "last_updated": result.get("most_recent_page_date"),
    }

def main():
    topic = sys.argv[1]
    # NEW: query wiki trước
    wiki_context = get_wiki_context(topic) if personal_wiki_has_content(topic) else {}

    result = ResearchCrew(topic, wiki_context=wiki_context).kickoff()
    ...
```

### 5B.3 Thay Đổi Module A — Researcher Agent Task

```python
# crews/research/tasks.py
def research_task(agent, topic, sources, wiki_context=None):
    context_note = ""
    if wiki_context:
        context_note = f"""
Prior knowledge context (from personal wiki):
{wiki_context['known_summary']}

Focus on: new developments, updates since {wiki_context.get('last_updated', 'last run')}.
Avoid re-covering what is already known unless there are significant updates.
"""
    return Task(
        description=f"Research {topic} from all sources.{context_note}...",
        ...
    )
```

### 5B.4 Lợi Ích Theo Thời Gian

| Thời điểm | Không có 5B | Với 5B |
|---|---|---|
| Ngày 1 | Research toàn bộ AI landscape | Research toàn bộ AI landscape |
| Tuần 2 | Vẫn re-cover LLM agents basics | Skip basics → tập trung vào mới |
| Tháng 2 | 40% content trùng lặp | < 10% trùng lặp, deeper coverage |
| Tháng 6 | Wiki chứa redundant pages | Wiki chứa progressively deeper insights |

---

## Phase 6 — Hermes Skill Layer (Tầng 3)

**Trigger:** Wiki > 20 pages + Tầng 2 stable ≥ 2 tuần + CLI explicit commands thấy bất tiện.

**Mục tiêu:** Thêm intelligence layer — natural language thay CLI, context-aware, cross-skill orchestration.

### 6.1 Điều Hermes Thêm Vào (Karpathy Không Có)

| Capability | Karpathy Tầng 2 | + Hermes Tầng 3 |
|---|---|---|
| Input | `/wiki ingest <url>` explicit | "lưu cái này lại nhé" + URL đính kèm |
| Context | Stateless mỗi call | Nhớ "bài này" = page vừa ingest |
| Multi-step | 1 command = 1 operation | "lưu + tóm tắt + link với bài hôm qua" |
| Cross-module | Không | Kết hợp Module A news + Module C wiki |
| Learning | Không | Track patterns → suggest sources |

### 6.2 Intent Classifier

```python
# Hermes phân loại input → dispatch đến đúng operation
{
    "lưu cái này lại nhé" + URL  → ingest(url)
    "mày biết gì về transformer?" → query("transformer")
    "tóm tắt tuần này"            → lint() + digest()
    "cái này liên quan gì đến hôm qua?" → query(context.last_page)
}
```

### 6.3 Cross-Skill Orchestration — Ví Dụ

```
User: "bài này nói về gì, liên quan gì đến tin AI tuần này?"

Hermes step 1: wiki.query("topic of <url>")              [Module C]
Hermes step 2: read wiki/2026-04-26-AI.md                [Module A]
Hermes step 3: synthesize: "Bài X về RAG, liên quan đến [Y] từ AI news tuần này"
Hermes step 4: wiki.ingest(<url>) + cross-ref AI news    [Module C]
```

Đây là điều **không thể với CLI pure** — cần intelligence layer quyết định thứ tự và kết hợp.

### 6.4 `skills/wiki_skill.py` Contract

```python
class WikiSkill(HermesSkill):
    name = "personal_wiki"

    def run(self, intent: str, args: dict, context: ConversationContext) -> SkillResult:
        if intent == "ingest":
            result = run_ingest(args["source"])
            context.last_wiki_page = result["page_path"]
            return SkillResult(response=f"Saved to {result['page_path']}", metadata=result)

        elif intent == "query":
            result = run_query(args["question"], context=context)
            return SkillResult(response=result["answer"])

        elif intent == "lint":
            result = run_lint()
            return SkillResult(response=format_lint_report(result))

# Input/Output
Input:  { intent, args: {source?, question?}, context: ConversationContext }
Output: { status, response: str, metadata: {page_path?, pages_read?, issues?} }
```

---

## File Summary

### MVP (Phase 0–5) — Files Mới

| File | Phase | Mô tả |
|---|---|---|
| `run_wiki.py` | 0 | Entry point CLI |
| `wiki/__init__.py` | 0 | Package init |
| `wiki/ingest.py` | 1 | 7-step ingest pipeline |
| `wiki/query.py` | 2 | 2-call query pattern |
| `wiki/lint.py` | 4 | 5-check lint (thuần Python) |
| `wiki/telegram_handler.py` | 3 | poll_once() + command parser |
| `tools/markitdown_tool.py` | 0 | HTML/PDF → .md |
| `personal-wiki/SCHEMA.md` | 0 | LLM schema |
| `personal-wiki/INDEX.md` | 0 | Compact index, auto-updated |
| `personal-wiki/log.md` | 0 | Ingest history |

### MVP — Files Sửa

| File | Phase | Thay đổi |
|---|---|---|
| `utils/config.py` | 0 | `personal_wiki_dir()`, `raw_dir()` |
| `tools/rss_tool.py` | 5A | Thêm `save_raw=True` → lưu vào `raw/articles/` |
| `tools/search_tool.py` | 5A | Thêm `save_raw=True` → lưu vào `raw/articles/` |
| `tools/yfinance_tool.py` | 5A | Thêm `save_raw=True` → lưu vào `raw/articles/` |
| `run_research.py` | 5A/5B | Trigger `ingest_new_raw()` sau research; query wiki trước (5B) |
| `crews/research/tasks.py` | 5B | Thêm `wiki_context` param vào `research_task()` |
| `requirements.txt` | 0 | Thêm `markitdown` |

### Full (Phase 6) — Files Mới

| File | Mô tả |
|---|---|
| `skills/wiki_skill.py` | Hermes skill wrapper |
| `skills/intent_classifier.py` | NL → intent mapping |

### Không Thay Đổi (tái dùng nguyên)

- `utils/telegram.py` — `send_message()`, `send_error()`
- `tools/telegraph_tool.py` — có thể dùng cho query output
- `.env` — `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN` đã có

---

## Checklist Build

**MVP Track:**
- [ ] Phase 0 — Folders + SCHEMA.md + config.py + install markitdown
- [ ] Phase 1 — `wiki/ingest.py` + test URL / .md / PDF
- [ ] Phase 2 — `wiki/query.py` + test 5 queries
- [ ] Phase 3 — `wiki/telegram_handler.py` + Task Scheduler 5 phút
- [ ] Phase 4 — `wiki/lint.py` + Task Scheduler Sunday
- [ ] Phase 5A — `save_raw=True` trong tools + `ingest_new_raw()` + test Module A → raw/ → personal-wiki/
- [ ] Phase 5B — `get_wiki_context()` trong `run_research.py` + `wiki_context` trong research_task + test redirection

**Full Track (sau MVP stable):**
- [ ] Phase 6 — `skills/wiki_skill.py` + intent classifier + Hermes integration

---

## Risk Log

| Risk | Nguồn | Giảm thiểu |
|---|---|---|
| Groq context limit | Starmorph: > 200-300K tokens degradation | INDEX.md + 2-3 pages vào prompt, không pass toàn wiki |
| Llama tool-calling bug | Module B experience | Direct Groq SDK, không CrewAI |
| LLM cross-reference sai | — | Lint weekly detect broken links |
| markitdown fail PDF | — | try/except → fallback plain text extract |
| raw/ quá lớn | — | Cleanup: archive > 90 ngày |
| INDEX.md quá lớn | — | Monitor: > 2000 dòng → split theo topic |
| save_raw làm chậm Module A | rss/search/yfinance tools chạy nhiều source | save_raw async hoặc fire-and-forget — không block ResearchCrew |
| 5B query wiki trả về rỗng khi wiki còn ít | personal-wiki/ chưa có đủ content | Guard: skip 5B nếu `personal_wiki_has_content(topic)` = False |
| 5B context làm Researcher bỏ sót news mới | Researcher quá tin wiki cũ | Prompt rõ: "focus on NEW since {date}, do NOT skip sources just because topic is known" |
| Hermes tool-calling compat | Llama format bug history | Verify Hermes runtime tool format trước Phase 6 |

---
*Sources: Karpathy Gist · Antigravity Codes · Starmorph · lucasastorian/llmwiki*
*Architecture ref: `wiki/2026-04-26-module-c-architecture.md`*
*Codebase ref: `utils/config.py` · `utils/telegram.py` · `run_daily.py` pattern*
