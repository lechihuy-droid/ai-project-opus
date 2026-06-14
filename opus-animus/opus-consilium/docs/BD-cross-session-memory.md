# BD — Build Plan: Cross-Session Memory (`recall`)
**Date:** 2026-06-14
**Status:** 🔵 Planning
**Ref:** `RD-cross-session-memory.md`, `SD-cross-session-memory.md`
**Estimate:** ~3.5 giờ (Codex thực thi)
**Tuyến:** Coding + test → giao **Codex** (`codex exec`). Claude review.

---

## Prerequisites

- [ ] RD approved (Gate 1) — `RD-cross-session-memory.md` chuyển 🟢
- [ ] SD approved (Gate 2) — `SD-cross-session-memory.md` chuyển 🟢
- [x] Python 3.11 khả dụng (`C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`)
- [x] `sqlite3` build có FTS5 (verify ở Step 0)
- [x] cwd: `opus-consilium/`

**Quy ước:** zero `pip install` (NFR-005). Mọi path qua `utils/config.py` hoặc relative từ module — không hardcode tuyệt đối.

---

## Build Steps

### Step 0 — Spike: verify FTS5 + tokenizer
**Mục tiêu:** Confirm môi trường chạy được trước khi build (bắt sớm NFR-005).
**Việc làm:**
- [x] Chạy probe FTS5 cơ bản + tokenizer `remove_diacritics`.
**Smoke test:**
```bash
python -c "import sqlite3; c=sqlite3.connect(':memory:'); c.execute('CREATE VIRTUAL TABLE t USING fts5(x, tokenize=\"unicode61 remove_diacritics 2\")'); print('FTS5 OK')"
```
→ expected: `FTS5 OK` (không exception). Nếu lỗi → dừng, báo lại (cần Python build khác).
**Estimate:** 5 phút

---

### Step 1 — `memory/sources.py` (collector)
**Mục tiêu:** Liệt kê nguồn cần index.
**Files:**
- Tạo mới: `memory/__init__.py` (rỗng)
- Tạo mới: `memory/sources.py` — `iter_sources()` + hằng `SOURCE_GLOBS`
**Việc làm:**
- [x] Định nghĩa `SOURCE_GLOBS = [("../ai/sessions/*.md","session"), ("../ai/handoff-*.md","handoff"), ("../ai/status.md","status"), ("personal-wiki/INDEX.md","wiki-index")]` (P0); thêm `("../opus-lucida/ai/*.md","session")` (P1).
- [x] `iter_sources()` resolve glob tương đối từ thư mục `run_recall.py`, trả `[(Path, kind)]`; path không khớp → bỏ qua.
**Smoke test:** `python -c "from memory.sources import iter_sources; print(len(iter_sources()))"` → expected: ≥ 4.
**Estimate:** 20 phút

---

### Step 2 — `memory/indexer.py:parse_sections`
**Mục tiêu:** Tách markdown thành sections.
**Files:**
- Tạo mới: `memory/indexer.py` — `parse_sections(text)`
**Việc làm:**
- [x] Split trên dòng khớp `^## ` ; phần trước heading `##` đầu → `("", preamble)`.
- [x] Giữ heading text (bỏ `## `). Body = nội dung tới heading kế.
- [x] `text == ""` → `[]`.
**Smoke test:**
```bash
python -c "from memory.indexer import parse_sections; print([h for h,_ in parse_sections(open('../ai/status.md',encoding='utf-8').read())])"
```
→ expected: list chứa `'Active sub-systems'`, `'Current objective'`, `'Current state (2026-05-20)'`, …
**Estimate:** 30 phút

---

### Step 3 — `memory/indexer.py:build_index` + schema
**Mục tiêu:** Ghi FTS5 index.
**Files:**
- Sửa: `memory/indexer.py` — thêm `build_index(db_path, sources)` + `DB_PATH` default `memory/recall.db`
**Việc làm:**
- [x] `DROP TABLE IF EXISTS memory` → `CREATE VIRTUAL TABLE … USING fts5(...)` (schema theo SD §5).
- [x] Mỗi file: read utf-8 (lỗi → `skipped+=1` + warn stderr), `parse_sections`, INSERT mỗi section với `mtime` = ISO date từ `path.stat().st_mtime`.
- [x] Trả `{files, sections, skipped}`.
**Smoke test:** (qua Step 5 CLI) — tạm thời `python -c "from memory.indexer import build_index; from memory.sources import iter_sources; print(build_index('memory/recall.db', iter_sources()))"` → expected dict `{'files':≥4,'sections':>20,'skipped':0}` + file `memory/recall.db` tồn tại.
**Estimate:** 40 phút

---

### Step 4 — `memory/search.py`
**Mục tiêu:** Search + rank + snippet.
**Files:**
- Tạo mới: `memory/search.py` — `search(db_path, query, limit=8, kind=None)` + helper `_sanitize(query)`
**Việc làm:**
- [x] Query rỗng → `raise ValueError`.
- [x] `_sanitize`: nếu query chứa ký tự đặc biệt FTS5 (`" ( ) * :`), bọc thành phrase `"..."`.
- [x] `SELECT path, section, kind, mtime, snippet(memory,2,'[',']','…',12), bm25(memory) FROM memory WHERE memory MATCH ? [AND kind=?] ORDER BY bm25(memory) LIMIT ?`.
- [x] Catch `sqlite3.OperationalError` → retry với query đã bọc phrase; vẫn lỗi → raise message rõ.
- [x] Trả list dict theo SD §4.
**Smoke test:** `python -c "from memory.search import search; print(search('memory/recall.db','Groq migration')[0]['path'])"` → expected: `ai/status.md`.
**Estimate:** 40 phút

---

### Step 5 — `run_recall.py` (CLI)
**Mục tiêu:** Wiring entry point.
**Files:**
- Tạo mới: `run_recall.py`
**Việc làm:**
- [x] argparse: positional `query` (nargs?) ; subcommand-style: nếu arg đầu == `index` → build; ngược lại coi là query string.
- [x] Flags: `--json`, `--limit N` (default 8), `--kind`.
- [x] Query rỗng/thiếu → in usage, exit 2.
- [x] Format text: `N. [path § section] (mtime)\n   snippet`. `--json` → `json.dumps(results, ensure_ascii=False)`.
- [x] Không khớp → in "Không tìm thấy ký ức khớp…", exit 0.
**Smoke test:**
```bash
python run_recall.py index
python run_recall.py "weekly synthesis"
python run_recall.py "wiki" --json
python run_recall.py "" ; echo "exit=$?"   # expected exit=2
```
**Estimate:** 35 phút

---

### Step 6 — `memory/test_recall.py` (Test Plan, xem mục riêng bên dưới)
**Mục tiêu:** Unit + integration + edge pass.
**Smoke test:** `python -m pytest memory/test_recall.py -q` (hoặc plain assert runner nếu không có pytest) → expected: all pass.
**Estimate:** 50 phút

---

## Test Plan (chi tiết)

> Fixtures: tạo `memory/_fixtures/` với 2-3 markdown nhỏ (1 session, 1 status có dấu tiếng Việt, 1 file encoding hỏng) để test độc lập với corpus thật. Index fixture vào DB tạm (`tmp_path`), không đụng `recall.db` thật.

### Unit
| ID | Test | Expected |
|---|---|---|
| U-1 | `parse_sections` markdown có 2 `##` + preamble | 3 phần tử, heading đúng |
| U-2 | `parse_sections` text không có `##` | `[("", body)]` |
| U-3 | `parse_sections("")` | `[]` |
| U-4 | `build_index` chạy 2 lần liên tiếp | row count bằng nhau (NFR-004 idempotent) |
| U-5 | `search` trên fixture, query khớp 1 doc | top result đúng path |
| U-6 | `search` query gibberish | `[]` |
| U-7 | `search` "tổng hợp" khớp doc chứa "tong hop" | có kết quả (NFR-007 remove_diacritics) |
| U-8 | `search` query có `"` / `(` | không raise, trả list (sanitize) |
| U-9 | `build_index` với 1 file encoding hỏng | file đó skipped, file khác vẫn indexed; `skipped==1` |

### Integration
| ID | Test | Expected |
|---|---|---|
| IT-1 | `index` rồi `recall "weekly synthesis"` | exit 0, ≥1 kết quả từ status/session |
| IT-2 | `recall ""` | usage, exit 2 |
| IT-3 | `recall "wiki" --json` | stdout là JSON array hợp lệ (`json.loads` được) |
| IT-4 | `recall "..." --kind session` | mọi kết quả có `kind=="session"` |
| IT-5 | sửa 1 session file → `index` lại → search nội dung mới | tìm thấy nội dung vừa thêm |

### Edge / Error
| ID | Test | Expected |
|---|---|---|
| EC-1 | thư mục nguồn (vd `opus-lucida/ai`) không tồn tại | `index` vẫn chạy, index phần còn lại |
| EC-2 | query unicode Nhật `九州そら` | không crash, trả `[]` hoặc kết quả |
| EC-3 | `recall "x"` khi chưa có `recall.db` | message gợi ý chạy `index` trước, exit 1 |

---

## Rollback Plan

Feature thuần additive — rollback đơn giản:
- Xoá: `memory/` (cả package + `recall.db`) và `run_recall.py`.
- Gỡ dòng gitignore vừa thêm.
- **Không** có migration, **không** đụng pipeline/`utils/llm.py`/config.yaml → không cần rollback phức tạp.

---

## Checklist Trước Khi Done

- [x] Step 0–6 smoke test pass
- [x] Unit U-1..U-9 pass
- [x] Integration IT-1..IT-5 pass
- [x] Edge EC-1..EC-3 pass
- [x] FR-001, FR-002, FR-003 có implementation (P0)
- [x] NFR-004 (idempotent) verify bằng U-4; NFR-005 (zero dep) verify bằng import trong env sạch không pip install
- [x] `memory/recall.db` đã vào `.gitignore` (Q2)
- [x] Không hardcode path tuyệt đối
- [x] Doc-sync: cập nhật `status.md` (objective done) + `TODO.md` ([MEM-1] → Done) + tick BD steps
- [ ] Claude review diff trước khi merge

---

*opus-consilium — BD Cross-Session Memory v1 | 2026-06-14*
