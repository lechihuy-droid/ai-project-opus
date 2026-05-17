# SD — Consilium × Karpathy LLM Wiki
**Date:** 2026-04-30
**Status:** Active
**Ref:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

---

## 1. Nguyên tắc gốc (Karpathy)

> "Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."

Wiki là **persistent, compounding artifact** — không phải RAG index.
Mỗi source mới → LLM update 10-15 pages liên quan, duy trì cross-refs.
Mỗi query tốt → filed back vào wiki thành page mới.

Ba tầng bất biến:
- **raw/** — immutable sources, LLM chỉ đọc, không bao giờ sửa
- **personal-wiki/** — LLM owns, viết và duy trì toàn bộ
- **SCHEMA.md** — editorial constitution, LLM đọc trước mọi operation

Ba operations:
- **Ingest** — source mới → update 10-15 pages + index + log
- **Query** — câu hỏi → wiki answer (file back nếu có giá trị)
- **Lint** — health check: orphans, contradictions, gaps, missing cross-refs

---

## 2. Mapping vào Consilium

| Karpathy | Consilium | Trạng thái |
|---|---|---|
| Raw sources | `raw/articles/`, `raw/research/`, `raw/inbox/` | ✅ |
| The wiki | `personal-wiki/` | ✅ |
| The schema | `personal-wiki/SCHEMA.md` | ✅ |
| Ingest op | `run_wiki.py ingest` | ✅ |
| Query op | `run_wiki.py query` | ✅ |
| Lint op | `run_wiki.py lint` | ✅ |
| index.md | `personal-wiki/INDEX.md` | ✅ |
| log.md | `personal-wiki/log.md` | ✅ |
| Obsidian = IDE | Obsidian mở vault personal-wiki/ | ⬜ optional |
| Filed-back queries | Query answers → new wiki page | ⬜ chưa implement |

---

## 3. Data flow đúng (mục tiêu)

```
INPUTS (tất cả qua raw/ trước)
│
├── Content Collector (daily 05:30)
│     RSS sources → raw/articles/ → wiki ingest ✅
│
├── Module A — ResearchCrew
│     CrewAI deep research → raw/research/ → wiki ingest → Telegraph → Telegram
│     [hiện tại: chưa vào raw/research/, chưa ingest vào wiki ⚠️]
│
├── Research Radar (Monday 06:30)
│     GitHub trending + arXiv → raw/articles/ → wiki ingest → Telegram ⬜
│
└── markitdown-agent (watch raw/inbox/)
      File drop → raw/inbox/ → wiki ingest ✅
                        │
                        ▼
              personal-wiki/ — THE BRAIN
              (Module C owns, LLM maintains)
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Module A          Module B      Research Radar
   query wiki →      query wiki →  query wiki →
   Telegraph         Telegram      Telegram
   [chưa làm ⚠️]    [chưa làm ⚠️]  ⬜
```

---

## 4. Module roles

### Module C — The Brain (PRIMARY)
- Owns personal-wiki/ hoàn toàn
- Là source of truth duy nhất cho mọi knowledge
- Mọi pipeline khác feed vào đây, không ai ghi trực tiếp vào wiki ngoài Module C

### Module A — Researcher + Wiki Writer
- Job 1: Deep research với CrewAI (giữ nguyên, tốt hơn Content Collector)
- Job 2 (cần thêm): Save research output → raw/research/ → gọi wiki ingest
- Job 3: Query wiki context → viết Telegraph article (thay vì tự synthesize từ đầu)
- **Vấn đề hiện tại:** Research knowledge biến mất sau mỗi run, không compound

### Module B — Wiki Reader + Broadcaster
- Job: Query wiki → synthesize daily brief → Telegram
- **Vấn đề hiện tại:** Đọc `wiki/` folder ephemeral của Module A thay vì query personal-wiki/
- Fix: Dùng `wiki_ops/query.py` với prompt "tóm tắt AI và stock 24h qua"

### Content Collector — Auto Writer (CORRECT)
- Batch RSS → raw/ → wiki (pattern đúng, giữ nguyên)

---

## 5. Gaps cần fix (theo thứ tự)

### Gap 1: Module A không ingest vào wiki [HIGH]
**Vấn đề:** Research output chỉ vào `wiki/YYYY-MM-DD-{topic}.md` (ephemeral), không vào personal-wiki/.
**Fix:** Cuối `run_research.py`, save research text → `raw/research/YYYY-MM-DD-{topic}.md`, sau đó gọi `ingest(path)`.
**Effort:** ~30 lines trong run_research.py. Cần RD nhỏ.

### Gap 2: Module B không query wiki thật [MEDIUM]
**Vấn đề:** `run_daily.py` đọc files trong `wiki/` folder thay vì query personal-wiki/.
**Fix:** Thay logic đọc file bằng `query("tóm tắt news AI và JP stock 24h qua")` từ wiki_ops.
**Effort:** Refactor run_daily.py. Cần RD nhỏ.

### Gap 3: wiki/ folder cần deprecate [LOW — sau Gap 1+2 xong]
**Vấn đề:** `wiki/` là ephemeral output, gây confusion với personal-wiki/.
**Fix:** Sau Gap 1+2 xong, xóa `wiki/` folder và remove references.

### Gap 4: Query answers chưa filed back [LOW]
**Vấn đề:** Answers từ `wiki query` biến mất vào chat, không compound.
**Fix:** Option `run_wiki.py query --save "<question>"` → tạo page mới trong personal-wiki/Personal/queries/.

---

## 6. Quy tắc bất biến

1. **raw/ = immutable.** Không ai sửa file trong raw/.
2. **personal-wiki/ = LLM-only.** Chỉ wiki_ops/ingest.py ghi vào đây. Không tay, không bypass.
3. **Mọi knowledge có giá trị lâu dài phải vào wiki.** Ephemeral (wiki/ folder, Telegram) chỉ là delivery.
4. **Query answers quan trọng → file back vào wiki.** Không để mất vào chat history.
5. **SCHEMA.md là editorial constitution.** LLM đọc trước mọi ingest/lint operation.

---

*SD-karpathy-consilium v1.0 — 2026-04-30*
