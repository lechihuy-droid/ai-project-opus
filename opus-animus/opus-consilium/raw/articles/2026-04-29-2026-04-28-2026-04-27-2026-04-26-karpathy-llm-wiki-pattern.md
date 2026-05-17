# Karpathy LLM Wiki Pattern — 2026-04-26

## Nguồn tham khảo

| # | Tiêu đề | Link |
|---|---|---|
| 1 | Karpathy tweet gốc (phân tích bởi Antigravity Codes) | https://antigravity.codes/blog/karpathy-llm-wiki-idea-file |
| 2 | GitHub Gist chính thức — LLM Wiki architecture | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f |
| 3 | Antigravity Codes — Complete Guide to Karpathy's LLM Wiki | https://antigravity.codes/blog/karpathy-llm-wiki-idea-file |
| 4 | Starmorph — How to Build Karpathy's LLM Wiki | https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide |

---

## Core Concept

LLM duy trì wiki Markdown như một "bộ não thứ hai" — thay thế RAG cho quy mô cá nhân/team.

- LLM đọc tài liệu → tạo trang wiki → liên kết → cập nhật
- Kiến thức được "compile" một lần, không phải tái tính toán mỗi query
- Karpathy đã tạo ~100 bài viết, 400.000 từ mà không viết tay
- LLM hoạt động như "research librarian" — người dùng chỉ cung cấp tài liệu và câu hỏi

---

## 3-Layer Architecture

```
raw/        ← nguồn thô, bất biến (PDF, HTML, text)
wiki/       ← trang wiki do LLM tạo và duy trì (Markdown)
CLAUDE.md   ← schema hướng dẫn LLM (cách tổ chức, tag, format)
```

### raw/
- Input gốc không bị sửa đổi
- PDF, HTML, notes, highlights, URLs
- LLM đọc nhưng không ghi vào đây

### wiki/
- Mỗi topic là 1 file Markdown
- LLM tự tạo, cập nhật, liên kết cross-reference
- Mỗi trang có: summary, key concepts, links to related pages, sources

### CLAUDE.md (schema file)
- Hướng dẫn LLM về cách tổ chức wiki
- Định nghĩa: topic taxonomy, tag list, linking convention
- LLM đọc trước mỗi thao tác để biết context

---

## 3 Core Operations

### 1. ingest
```
Input: raw document (PDF/URL/text)
LLM: đọc raw → extract key info → tạo/cập nhật wiki page → thêm cross-reference
Output: wiki/{topic}/{slug}.md được tạo hoặc cập nhật
```

### 2. query
```
Input: câu hỏi từ user
LLM: đọc wiki pages liên quan → trả lời dựa trên wiki đã compile
Output: câu trả lời có dẫn nguồn wiki
```

### 3. lint
```
Input: toàn bộ wiki/
LLM: kiểm tra consistency, flag contradiction, cập nhật outdated info
Output: report + auto-fix các inconsistency nhỏ
```

---

## LLM Wiki vs RAG

| | RAG | LLM Wiki |
|---|---|---|
| Cơ chế | Retrieve → Generate mỗi query | Compile một lần → Query nhanh |
| Knowledge | Fragmented chunks | Coherent, linked pages |
| Update | Re-embed toàn bộ | LLM update page cụ thể |
| Cross-reference | Không tự động | LLM tạo tự động |
| Scale | Tốt cho corpus lớn | Tốt cho personal/team scale |
| Maintainability | Cần pipeline phức tạp | Chỉ cần LLM + markdown files |

---

## Community Repos Theo Pattern Karpathy

*(Nguồn: Starmorph — https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide)*

- https://github.com/lucasastorian/llmwiki
- https://github.com/Ar9av/obsidian-wiki
- https://github.com/NicholasSpisak/second-brain
- https://github.com/kfchou/wiki-skills
- https://github.com/ussumant/llm-wiki-compiler

---

## Ứng dụng cho Personal Wiki Agent (Module C)

Pattern này là foundation cho Module C:
- `raw/` = input từ Telegram, file drop, URL
- `wiki/` = `personal-wiki/{topic}/` 
- `CLAUDE.md` = schema file định nghĩa topics + tag taxonomy
- 3 operations: ingest (capture_note), query (ask), lint (weekly digest + consistency check)

Key insight: không dùng RAG — LLM compile kiến thức thành wiki một lần, query sau đó chỉ đọc wiki đã có.

---
*Nguồn: Andrej Karpathy via Antigravity Codes + Starmorph analysis — 2026-04-26*
