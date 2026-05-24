# SD — Interface Contract
**Project:** Personal AI Agent (CrewAI + Groq)
**Date:** 2026-04-26
**Status:** 🟢 Phase 2 Build — DONE & TESTED

---

## 1. Module A — ResearchCrew Contract

### Entry Point

```python
# run_research.py
python run_research.py AI
python run_research.py JP_STOCK
python run_research.py all
```

**Output:**
```python
{
    "wiki_path": "wiki/YYYY-MM-DD-{topic}.md",
    "telegraph_url": "https://telegra.ph/..."
}
```

### Agent Contracts

| Agent | Role | Input | Output |
|---|---|---|---|
| Researcher | Fetch & parse raw content | sources_config, topic | raw articles (passed via CrewAI context) |
| Writer | Synthesize & save markdown | Researcher output | wiki `.md` file + Telegraph URL |

> **Note:** Analyst agent từ thiết kế ban đầu đã bỏ — Writer tự tổng hợp và viết.

**Writer output — wiki file format:**
```markdown
# {Topic} — YYYY-MM-DD

## Highlights
- ...

## {Source Category}
### [Title](url)
Summary...

---
*Generated: YYYY-MM-DD HH:MM ICT*
```

**Retry policy:**
- Tối đa 3 lần nếu Groq rate limit
- Backoff: 60s sau lần 1, 120s sau lần 2

---

## 2. Module B — Direct Pipeline Contract

### Entry Point

```python
# run_daily.py — triggered by Windows Task Scheduler 06:00 ICT
python run_daily.py
```

### Pipeline Steps

```
read_wiki(topic) × 2
    ↓ wiki_contents: dict[str, str]
write_brief(wiki_contents)           # 1 Groq API call
    ↓ brief_text: str (< 400 words)
publish(title, brief_text)           # Telegraph API
    ↓ telegraph_url: str
send_message(tg_msg)                 # Telegram Bot API
```

### `read_wiki(topic: str) -> str | None`

```python
# Đọc file wiki gần nhất theo tên: wiki/*-{topic}.md (sort reverse)
# Returns: file content hoặc None nếu không tìm thấy
```

### `write_brief(wiki_contents: dict[str, str]) -> str`

```python
# Input: {"AI": "<wiki content>", "JP_STOCK": "<wiki content>"}
# Truncates each topic to 2000 chars trước khi đưa vào prompt
# Model: llama-3.3-70b-versatile, max_tokens=600
# Returns: plain text brief
```

**Prompt format:**
```
System: You are a concise morning briefer. Write in plain text, no emojis. Be specific and factual.

User: Write a morning brief for DD/MM/YYYY (8:00 JST) based on this research.
Under 400 words. Format:

Brief DD/MM/YYYY | 8:00 JST

[AI]
- key point 1
- key point 2
- key point 3

[JP STOCK - Previous Close]
- N225: price and change
- key market news

Research:
=== AI ===
<content[:2000]>

=== JP_STOCK ===
<content[:2000]>
```

---

## 3. Telegraph Tool Contract

```python
# tools/telegraph_tool.py

def get_token() -> str:
    # Đọc .telegraph_token nếu có, nếu không → POST /createAccount → lưu token
    # Returns: access_token string

def publish(title: str, html_content: str) -> str:
    # POST api.telegra.ph/createPage
    # content: [{"tag": "p", "children": [html_content]}]
    # Returns: "https://telegra.ph/{path}" hoặc error message nếu fail
```

**Khi nào dùng:**
- `run_research.py` (Module A): Writer publish wiki sau khi lưu local
- `run_daily.py` (Module B): publish full brief, gửi link qua Telegram

---

## 4. Telegram Utility Contract

```python
# utils/telegram.py

def send_message(text: str) -> None:
    # Truncate tại 3800 chars
    # POST api.telegram.org/bot{TOKEN}/sendMessage
    # parse_mode="HTML"

def send_error(module: str, error: str) -> None:
    # Anti-spam: đọc .last_error.json
    # Chỉ gửi nếu: chưa alert trong 60 phút VÀ error type khác lần trước
    # Cập nhật .last_error.json sau khi gửi
```

**Telegram message — có data (normal):**
```
Brief sang — DD/MM/YYYY | 8:00 JST
[note thieu topic neu missing]

Xem day du: https://telegra.ph/...
```

**Telegram message — không có data (FR-B03):**
```html
⚠️ <b>Brief sáng DD/MM/YYYY</b>

Chưa có data hôm nay.
Chạy: <code>python run_research.py all</code>
```

**Telegram message — error alert (FR-B06):**
```
[run_daily] Error: <error message>
```
> Anti-spam: max 1 alert/giờ. Không gửi lại nếu cùng error_type với lần trước.

---

## 5. Tool Contracts

### `rss_tool`
```python
def fetch_rss(url: str, max_items: int = 5) -> list[dict]:
    # Filter: chỉ lấy bài trong 48h gần nhất
    # Bài không có published_date → include luôn (không filter)
    # Returns: [{title, url, content, published}]
    # Nếu URL lỗi → log + return []
```

### `yfinance_tool`
```python
def fetch_price(symbols: list[str]) -> list[dict]:
    # Symbols hoạt động: ["^N225"]
    # TOPIX (^TOPIX, 998405.T) không hỗ trợ → skip
    # Returns: [{symbol, price, change_pct, label}]
    # label = "Previous Close" (pre-market)
```

### `wiki_tool`
```python
def write_wiki(topic: str, date: str, content: str) -> str:
    # Lưu: wiki/YYYY-MM-DD-{topic}.md
    # Returns: output_path

def read_latest(topic: str) -> str | None:
    # Glob wiki/*-{topic}.md, sort reverse, đọc file đầu tiên
    # Returns: content string hoặc None
```

### `search_tool`
```python
def web_search(query: str, max_results: int = 5) -> list[dict]:
    # Dùng duckduckgo-search (TODO: migrate sang ddgs package)
    # Returns: [{title, url, snippet}]
```

---

## 6. Module C — Concept-First Ingest Contract

### Entry Point

```python
# run_wiki.py
python run_wiki.py ingest <url|file_path|plain_text>
```

### `run_ingest(source: str, verbose: bool = True, dry_run: bool = False) -> dict`

Concept-first ingest compiles a source into `personal-wiki/` using the Karpathy LLM Wiki pattern.

```python
{
    "status": "ok" | "error",
    "action": "create" | "update",
    "page_path": "AI/example-concept.md",
    "topic": "AI",
    "filename": "example-concept.md",
    "dry_run": False,
    "backup_path": "backups/personal-wiki/AI/example.20260429-120000.md" | None,
}
```

### Pipeline Steps

```text
detect source type
    ↓ content + raw category
save raw source copy
    ↓ raw/articles|papers|notes/YYYY-MM-DD-slug.md
read SCHEMA.md + INDEX.md
    ↓ editorial rules + existing concept map
read candidate existing page snippets
    ↓ context for merge/update decision
LLM chooses action: create | update
    ↓ full markdown page content
write page
    ↓ personal-wiki/{topic}/{filename}
update INDEX.md without duplicate wikilinks
update log.md with full source + action
add backlinks when requested
```

If `dry_run=True`, the operation still performs source detection and LLM planning, but does not write raw files, wiki pages, `INDEX.md`, `log.md`, or backlinks.

### LLM JSON Contract

```json
{
  "action": "create",
  "topic": "AI",
  "filename": "kebab-case-concept.md",
  "title": "Human Readable Title",
  "tags": ["tag1", "tag2"],
  "content": "---\ntitle: \"...\"\n...\n---\n\n# ...",
  "backlink_pages": ["existing-page.md"]
}
```

For `action: "update"`, `filename` must be an existing filename listed in `INDEX.md`. The returned `content` must be the full updated page, not a patch.

### Design Rules

- Prefer `update` over `create` when the source overlaps an existing concept.
- Create only when the source introduces a distinct concept.
- Do not edit files in `raw/` after saving them.
- Before a real `update` write, save a timestamped backup outside the Obsidian vault under `backups/personal-wiki/`.
- `INDEX.md` must remain deduped by wikilink.
- `log.md` should keep enough source text/path to trace where the update came from.
