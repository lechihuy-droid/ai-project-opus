# Hướng Dẫn Sử Dụng — Module C: Personal Wiki Agent
**Date:** 2026-04-27
**Status:** ✅ Tested

---

## Module C Là Gì?

Module C là agent tích lũy kiến thức cá nhân theo thời gian, dựa trên pattern **Karpathy LLM Wiki**.

Khác với Module A (research tin tức hàng ngày, ephemeral), Module C xây dựng **knowledge base dài hạn**:
- Mỗi bài viết, paper, note được compile thành wiki page có cấu trúc
- Các trang tự động cross-reference nhau
- Wiki tích lũy và ngày càng phong phú hơn theo tháng

---

## Cách Chạy Nhanh

```bash
cd c:/Users/HUY/AI/WIKI/personal-agent

# Kiểm tra hệ thống
python run_wiki.py test

# Lưu bài viết từ URL
python run_wiki.py ingest "https://example.com/article"

# Hỏi wiki
python run_wiki.py query "what do I know about RAG?"

# Kiểm tra chất lượng wiki
python run_wiki.py lint
```

---

## Milestone Checklist

| M | Test | Command | Kết quả mong đợi |
|---|---|---|---|
| **M1** | Foundation | `python run_wiki.py test` | Tất cả `OK`, markitdown hoạt động |
| **M2** | Ingest URL | `python run_wiki.py ingest "https://..."` | File tạo trong `personal-wiki/AI/`, INDEX.md update |
| **M3** | Query | `python run_wiki.py query "..."` | Trả lời từ wiki đã compile, có cite `[[source]]` |
| **M4** | Telegram | Gửi `/wiki https://...` từ điện thoại | Bot reply "Saved to AI/..." |
| **M5** | Auto Module A | `python run_research.py AI` | `raw/articles/` + `personal-wiki/AI/` tự cập nhật |

---

## 1. CLI — Dùng Hàng Ngày

### Lưu bài viết từ URL

```bash
python run_wiki.py ingest "https://blog.anthropic.com/claude-3-5"
python run_wiki.py ingest "https://arxiv.org/abs/2310.01445"
```

**Output:**
```
[ingest] Raw saved: 2026-04-27-claude-3-5.md
[ingest] Wiki page saved: AI/claude-3-5-sonnet.md
[ingest] Created: AI/claude-3-5-sonnet.md
```

### Lưu file PDF

```bash
python run_wiki.py ingest "C:/Users/HUY/Downloads/attention-is-all-you-need.pdf"
```

### Lưu note text ngắn

```bash
python run_wiki.py ingest "ReAct pattern: LLM alternates Reasoning and Acting steps. Better than CoT for tool-use tasks."
```

### Hỏi wiki

```bash
python run_wiki.py query "what is the difference between RAG and LLM Wiki?"
python run_wiki.py query "what do I know about Nikkei 225?"
python run_wiki.py query "summarize what I know about AI agents"
```

**Output mẫu:**
```
--- Answer ---
RAG retrieves chunks from a vector store at query time (stateless).
LLM Wiki compiles knowledge once into linked markdown pages (stateful, compounding).
[[rag-vs-wiki]], [[karpathy-llm-wiki-idea-file]]

Sources: [[rag-vs-wiki]], [[karpathy-llm-wiki-idea-file]]
```

### Lint — kiểm tra wiki hàng tuần

```bash
python run_wiki.py lint
```

**Output mẫu:**
```
Wiki Lint Report — 2026-04-27
Pages: 12 total | 5 AI | 4 Stock | 2 Personal | 1 Tech

[BROKEN]      AI/llm-agents.md -> [[transformer-arch]] not found
[STALE]       Stock/nikkei-overview.md — last updated 35 days ago
[OK]          No unresolved contradictions
[OK]          All pages have frontmatter

Added this week: 3 pages (2 AI, 1 Stock)
```

**Ý nghĩa các flag:**
| Flag | Ý nghĩa | Xử lý |
|---|---|---|
| `[ORPHAN]` | Page không có page nào link đến | Bình thường khi wiki còn ít — tự hết khi ingest thêm |
| `[BROKEN]` | `[[link]]` trỏ đến page không tồn tại | Ingest source còn thiếu, hoặc LLM đặt tên sai |
| `[STALE]` | Không update > 30 ngày | Ingest source mới về topic đó |
| `[CONTRADICTION]` | 2 pages có claim mâu thuẫn | Đọc và quyết định cái nào đúng, xóa tag |

---

## 2. Telegram — Dùng Từ Điện Thoại

Task Scheduler chạy `python run_wiki.py poll` mỗi 5 phút để nhận lệnh.

### Setup Task Scheduler (1 lần)

```
Task name:  wiki-poll
Program:    C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe
Arguments:  C:\Users\HUY\AI\WIKI\personal-agent\run_wiki.py poll
Trigger:    Every 5 minutes
```

### Lệnh Telegram

| Lệnh | Tác dụng |
|---|---|
| `/wiki https://...` | Ingest URL → bot reply "Saved to AI/..." |
| `/wiki note <text>` | Lưu note ngắn vào wiki |
| `/wiki ask <câu hỏi>` | Hỏi wiki, nhận câu trả lời có cite source |
| `/wiki digest` | Lint report + tóm tắt tuần |
| `/wiki help` | Xem danh sách lệnh |

**Ví dụ từ điện thoại:**
```
Bạn: /wiki https://www.nikkei.com/article/...
Bot: Saved to Stock/nikkei-225-analysis.md

Bạn: /wiki ask what happened to Nikkei this week?
Bot: Based on your wiki: Nikkei fell 2.3% this week due to...
     Sources: [[nikkei-225-analysis]], [[japan-market-overview]]
```

---

## 3. Tích Hợp Module A (Tự Động)

Mỗi lần chạy `python run_research.py AI` hoặc `JP_STOCK`, Module C tự động:

1. **5A** — Lưu raw sources vào `raw/articles/` (RSS, search, yfinance)
2. **5A** — Ingest raw files mới vào `personal-wiki/`
3. **5B** — Query wiki trước khi research để focus vào nội dung mới *(khi wiki > 10 pages)*

```bash
# Chạy Module A bình thường — Module C tự làm phần còn lại
python run_research.py AI
```

**Log sẽ thấy:**
```
[run_research] Querying personal-wiki for AI context...
[run_research] Wiki context: I have notes on LLM agents, RAG patterns...
... ResearchCrew chạy bình thường ...
[run_research] Ingesting new raw files into personal-wiki...
[ingest] Ingesting 5 new raw file(s)...
[ingest] Wiki page saved: AI/claude-3-7-sonnet.md
[ingest] Wiki page saved: AI/openai-gpt5-rumours.md
```

---

## 4. Cấu Trúc File

```
personal-agent/
├── personal-wiki/               ← knowledge base tích lũy
│   ├── SCHEMA.md                ← LLM đọc trước mỗi thao tác (đừng xóa)
│   ├── INDEX.md                 ← index tự cập nhật (đừng sửa tay)
│   ├── log.md                   ← lịch sử ingest
│   ├── AI/
│   │   ├── karpathy-llm-wiki-idea-file.md
│   │   └── gpt-5-release-rumours.md
│   ├── Stock/
│   ├── Personal/
│   └── Tech/
├── raw/                         ← nguồn thô (không sửa)
│   ├── articles/                ← HTML clips, search results, RSS
│   ├── papers/                  ← PDF papers
│   └── notes/                   ← Telegram notes
├── wiki_ops/
│   ├── ingest.py                ← ingest pipeline
│   ├── query.py                 ← query operation
│   ├── lint.py                  ← lint checks
│   └── telegram_handler.py     ← Telegram polling
├── skills/
│   ├── intent_classifier.py    ← NL → intent (Phase 6)
│   └── wiki_skill.py           ← Hermes skill wrapper (Phase 6)
└── run_wiki.py                  ← entry point
```

---

## 5. Task Scheduler — Setup Đầy Đủ

### Lint hàng tuần (Chủ nhật 6:00 ICT)

```
Task name:  wiki-lint-weekly
Program:    python.exe
Arguments:  C:\Users\HUY\AI\WIKI\personal-agent\run_wiki.py lint
Trigger:    Weekly, Sunday, 06:00
```

### Poll Telegram mỗi 5 phút

```
Task name:  wiki-poll
Program:    python.exe
Arguments:  C:\Users\HUY\AI\WIKI\personal-agent\run_wiki.py poll
Trigger:    Every 5 minutes (repeat task)
```

---

## 6. Phase 6 — Hermes Skill (Khi Sẵn Sàng)

Khi Hermes runtime được setup, đăng ký wiki skill:

```python
from skills.wiki_skill import WikiSkill

skill = WikiSkill()

# Standalone — dùng không cần Hermes
result = skill.run_from_text("save https://example.com/article")
result = skill.run_from_text("what do I know about RAG?")
print(result.response)

# Hermes registration
hermes.register_skill(skill.as_hermes_skill())
```

Khi Hermes hoạt động, user nói tự nhiên thay vì gõ lệnh:
- *"lưu bài này lại nhé"* + URL → ingest
- *"mày biết gì về transformer?"* → query
- *"tóm tắt tuần này"* → digest

---

## 7. Troubleshooting

| Vấn đề | Nguyên nhân | Xử lý |
|---|---|---|
| `[markitdown] Failed to convert URL` | URL cần auth hoặc JS render | Dùng archive link, hoặc copy-paste text vào `/wiki note` |
| `JSON parse error` trong ingest | Groq trả về JSON không hợp lệ | Retry thường tự fix; nếu lỗi liên tục kiểm tra `GROQ_API_KEY` |
| `[BROKEN]` quá nhiều sau lint | LLM tạo cross-ref đến page chưa tồn tại | Ingest thêm sources để tạo ra các pages đó |
| Query trả về `Wiki chua co noi dung` | `personal-wiki/` chưa có pages | Ingest ít nhất 3-5 sources trước khi query |
| Poll không nhận lệnh | Task Scheduler không chạy | Kiểm tra Task Scheduler history; test thủ công: `python run_wiki.py poll` |

---

## 8. Tips Sử Dụng Tốt

1. **Ingest trước, query sau** — wiki cần có ít nhất 5-10 pages để query có ý nghĩa
2. **Ingest đa dạng sources** — mix URL, PDF, notes để wiki phong phú hơn
3. **Chạy lint hàng tuần** — giữ wiki sạch, broken links ít dần theo thời gian
4. **Module A tự feed** — sau khi chạy `run_research.py` nhiều tuần, wiki AI sẽ tích lũy từ mỗi lần research
5. **Note ngắn cũng có giá trị** — `/wiki note Insight: X is better than Y because Z` → wiki compile thành concept page

---
*Module C — Personal Wiki Agent | Built: 2026-04-27*
*Pattern: Karpathy LLM Wiki + Hermes Skill Layer*
