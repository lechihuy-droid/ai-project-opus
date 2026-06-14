# HANDOFF - OPUS ANIMUS
**Updated:** 2026-06-14
**Owner:** Codex

> Resume anchor for Codex. Task trước (`CONS-RESEARCH-TOOL` dashboard) đã xong — xem git history nếu cần.

## Task đang làm

`MEM-1` — build **Cross-Session Memory (`recall`)**: lệnh `run_recall.py` index trí nhớ bền (sessions / handoff / status / wiki INDEX) vào SQLite FTS5, tra cứu ranked snippet. **No-LLM, zero pip dep.** Phase 1(b) của lộ trình self-improving agent.

## Đọc trước khi code (BẮT BUỘC — đây là source of truth, handoff này chỉ là con trỏ)

1. `opus-consilium/docs/RD-cross-session-memory.md` — yêu cầu + 5 Open Questions (đã có default)
2. `opus-consilium/docs/SD-cross-session-memory.md` — kiến trúc, interface contracts, schema FTS5, error handling
3. `opus-consilium/docs/BD-cross-session-memory.md` — **build steps 0→6 + Test Plan đầy đủ** ← bám sát file này từng bước
4. Bối cảnh tổng: `docs/SYNTHESIS-self-improving-agent-plan.html` §6

## Precondition (SDD gate)

- [ ] RD đã approve (🟡→🟢). Hiện 🟡 In Review.
- **Open Questions:** dùng **default** trong RD §5 (Q1 chỉ index `INDEX.md`; Q2 gitignore `recall.db`; Q3 có index `opus-lucida/ai/` ở P1; Q4 split `##`; Q5 `run_recall.py` + `memory/`). Nếu một default nào thấy sai khi code → **STOP, hỏi user**, đừng tự đổi hướng.
- Không bắt đầu Step 1 trước khi RD 🟢.

## Exact next action

Thực thi tuần tự theo BD (mỗi step có smoke test — phải pass mới sang step kế):

1. **Step 0** — Spike verify FTS5 + tokenizer `remove_diacritics`. Nếu fail → dừng, báo user (cần Python build khác).
2. **Step 1** — `memory/__init__.py` + `memory/sources.py:iter_sources()`.
3. **Step 2** — `memory/indexer.py:parse_sections()` (split `##`).
4. **Step 3** — `memory/indexer.py:build_index()` + schema FTS5 (full rebuild, idempotent).
5. **Step 4** — `memory/search.py:search()` (bm25 + snippet + sanitize query).
6. **Step 5** — `run_recall.py` (argparse: `index` vs query; `--json/--limit/--kind`).
7. **Step 6** — `memory/test_recall.py` — chạy Test Plan: U-1..U-9, IT-1..IT-5, EC-1..EC-3.
8. Thêm `opus-consilium/memory/recall.db` vào `.gitignore`.
9. Doc-sync: tick BD steps ✅, cập nhật `TODO.md` [MEM-1] + `ai/status.md` khi done.

## Files sẽ touch (đều mới, additive — KHÔNG sửa pipeline hiện có)

- `opus-consilium/memory/__init__.py`
- `opus-consilium/memory/sources.py`
- `opus-consilium/memory/indexer.py`
- `opus-consilium/memory/search.py`
- `opus-consilium/memory/test_recall.py`
- `opus-consilium/memory/_fixtures/` (markdown test, gồm 1 file encoding hỏng)
- `opus-consilium/run_recall.py`
- `opus-consilium/.gitignore` (thêm `memory/recall.db`)
- `TODO.md`, `ai/status.md` (doc-sync khi done)

## Constraints / ranh giới (đừng vượt)

- **KHÔNG** `pip install` gì — chỉ stdlib `sqlite3` (NFR-005). Verify import trong env sạch.
- **KHÔNG** gọi LLM trong recall — pure FTS (NFR-006). Không đụng `utils/llm.py`.
- **KHÔNG** sửa `collect/synthesis/wiki/config.yaml` — feature thuần additive.
- **KHÔNG** ghi vào `raw/` hay `personal-wiki/` — recall chỉ đọc + ghi DB của riêng nó.
- Không hardcode path tuyệt đối — relative từ thư mục `run_recall.py` (xem BD §Quy ước).

## Risks / cần kiểm tra

- **FTS5 availability:** một số build SQLite thiếu FTS5 → Step 0 phải pass trước. Tokenizer `unicode61 remove_diacritics 2` cần SQLite đủ mới.
- **Tiếng Việt:** corpus có dấu — verify U-7 (search "tổng hợp" khớp "tong hop").
- **Query ký tự đặc biệt:** `" ( ) :` trong query làm FTS5 MATCH lỗi cú pháp → phải sanitize/bọc phrase (Step 4, U-8).
- **Idempotency:** re-index 2 lần phải cùng row count (U-4) — full rebuild DROP+insert đảm bảo việc này.
- **Edge thư mục thiếu:** `opus-lucida/ai/` có thể không tồn tại → glob rỗng, bỏ qua, không crash (EC-1).

## Validation commands

```powershell
# Step 0 — FTS5 + tokenizer
C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe -c "import sqlite3; sqlite3.connect(':memory:').execute('CREATE VIRTUAL TABLE t USING fts5(x, tokenize=\"unicode61 remove_diacritics 2\")'); print('FTS5 OK')"

# End-to-end (chạy trong opus-consilium/)
python run_recall.py index
python run_recall.py "Groq migration"          # expect: top hit ai/status.md
python run_recall.py "weekly synthesis"        # expect: exit 0, >=1 result
python run_recall.py "wiki" --json             # expect: JSON array hợp lệ
python run_recall.py "" ; echo "exit=$?"       # expect: usage, exit 2

# Test Plan
python -m pytest memory/test_recall.py -q       # expect: all pass
```

Expected (happy path):
```text
FTS5 OK
Indexed >=4 files, >20 sections -> memory/recall.db
1. [ai/status.md § Current objective] (2026-06-14)  …Migrate … [Groq] → Claude CLI…
```
