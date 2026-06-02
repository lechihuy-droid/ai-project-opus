# BD — Build Plan: Wiki Retrieval v2
**Date:** 2026-06-02
**Status:** 🔵 Planning
**Ref:** `RD-wiki-retrieval-v2.md`, `SD-wiki-retrieval-v2.md`
**Estimate:** 5-6 hours total
**Executor:** Codex (`codex exec`)
**Owner branch:** `claude/opus-wiki-consilium-L2and`

---

## Codex Execution Brief

> Đọc kỹ section này trước khi code bất kỳ step nào.

### Scope
Implement đúng 12 FR trong `RD-wiki-retrieval-v2.md`. **Không** thêm feature ngoài scope (no UI, no API endpoint, no async, no FAISS). Khi gặp ambiguity → đọc lại SD trước; nếu vẫn ambiguous → STOP và hỏi user, không tự decide.

### Hard rules (từ CLAUDE.md)
1. Python 3.11 — không dùng feature 3.12+
2. **Không** modify `raw/` — immutable
3. Mọi LLM call dùng `utils/llm.py:claude_cli()` hoặc `claude_cli_json()` — **không** import groq, openai, anthropic SDK trực tiếp
4. Windows Task Scheduler là production scheduler — không thay đổi cách trigger
5. Markdown trong `personal-wiki/` là source of truth — **không** ghi binary vào đó
6. Cache files chỉ ghi vào `wiki_ops/.cache/` — gitignore
7. Test trên Windows path (sử dụng `Path()`, không hardcode `/`)

### Style
- Match style của `wiki_ops/lint.py` và `wiki_ops/reflect.py` — pure functions, docstring ngắn, no class trừ khi cần state
- Type hints bắt buộc cho mọi public function
- Errors ở external boundary (LLM, file IO) → log + skip; errors ở internal logic → raise

### Per-step protocol
1. Đọc step trong BD
2. Implement
3. Chạy smoke test command
4. Nếu pass → mark `✅` trong BD và git commit step đó với message `feat(consilium): <step name>`
5. Nếu fail → debug, không skip
6. Sau step cuối → chạy Step 10 integration test → push branch

---

## Prerequisites

- [x] RD approved (Gate 1) — `RD-wiki-retrieval-v2.md`
- [x] SD approved (Gate 2) — `SD-wiki-retrieval-v2.md`
- [ ] Python 3.11 venv của opus-consilium đã activate
- [ ] Internet access cho lần đầu download MiniLM model (~80MB)
- [ ] Working dir: `C:/Users/HUY/AI/opus-animus/opus-consilium/`

---

## Build Steps

### Step 0 — Setup deps + cache dir + gitignore
**Mục tiêu:** Pin deps mới, tạo cache dir, ignore khỏi git.

**Files:**
- Sửa: `opus-consilium/requirements.txt`
- Sửa: `opus-consilium/.gitignore` (tạo nếu chưa có)
- Tạo dir: `opus-consilium/wiki_ops/.cache/` (rỗng, `.gitkeep` không cần vì gitignore)

**Việc làm:**
- [ ] Append vào `requirements.txt`:
  ```
  rank_bm25>=0.2.2
  sentence-transformers>=2.5
  ```
- [ ] Append vào `.gitignore`:
  ```
  wiki_ops/.cache/
  ```
- [ ] `mkdir wiki_ops/.cache` (Codex tạo thư mục thực tế khi cần — không cần làm trước)
- [ ] `pip install rank_bm25 sentence-transformers`

**Smoke test:**
```
python -c "import rank_bm25, sentence_transformers; print('OK')"
```
Expected: `OK`

**Estimate:** 10 min (chưa tính download MiniLM lần đầu — sẽ trigger ở Step 2)

---

### Step 1 — `retrieval.py`: BM25 + page loading
**Mục tiêu:** Module mới, build BM25 index từ `personal-wiki/`, persist `.cache/bm25.pkl` + `page_index.json`. Chưa thêm vector layer.

**Files:**
- Tạo mới: `opus-consilium/wiki_ops/retrieval.py`

**Việc làm:**
- [ ] Function `_load_pages() -> list[dict]`:
  - Walk `personal_wiki_dir().rglob("*.md")`
  - Skip `SCHEMA.md`, `INDEX.md`, `log.md`, `reflection-*.md`
  - Return list of `{"slug": str, "path": Path, "mtime": float, "text": str}` (text = title + body, strip frontmatter)
- [ ] Function `_tokenize(text: str) -> list[str]`:
  - Lowercase, strip punctuation, split whitespace, keep tokens len >= 2
- [ ] Function `_cache_path(name: str) -> Path`:
  - Return `Path(__file__).parent / ".cache" / name`, `mkdir parents=True, exist_ok=True`
- [ ] Function `_should_rebuild_bm25(pages: list[dict]) -> bool`:
  - True nếu `bm25.pkl` không tồn tại
  - True nếu `len(pages) != cached page_index count` hoặc `max(p.mtime for p in pages) > bm25.pkl mtime`
- [ ] Function `_build_bm25(pages) -> BM25Okapi`:
  - Tokenize all → `BM25Okapi(tokenized_corpus)`
  - Pickle dump to `bm25.pkl`
  - Persist `page_index.json` với mapping `slug → {path, mtime}`
- [ ] Function `_load_bm25() -> tuple[BM25Okapi, list[dict]]`:
  - Load pickle + page_index.json, return bm25 + pages list aligned by order
- [ ] Function `_bm25_search(query: str, top_n: int = 20) -> list[tuple[str, float]]`:
  - Refresh nếu stale → tokenize query → `bm25.get_scores(tokens)` → top_n slugs với score

**Smoke test:**
```
python -c "from wiki_ops.retrieval import _bm25_search; r = _bm25_search('FDE japan', 5); print(r)"
```
Expected: List of 5 tuples, có `fde-japan-gap-analysis` hoặc `fde-model` ở top 3.

**Estimate:** 60 min

---

### Step 2 — `retrieval.py`: Vector layer (MiniLM)
**Mục tiêu:** Thêm embedding + cosine, persist `vectors.npz`.

**Files:**
- Sửa: `opus-consilium/wiki_ops/retrieval.py`

**Việc làm:**
- [ ] Module-level lazy: `_MODEL = None`, function `_get_model()` load `SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")` lần đầu (in lần đầu: `"[retrieval] Downloading MiniLM..."`)
- [ ] Function `_should_rebuild_vectors(pages) -> bool`:
  - True nếu `vectors.npz` không tồn tại HOẶC page count mismatch HOẶC max mtime > vectors.npz mtime
- [ ] Function `_build_vectors(pages) -> np.ndarray`:
  - `model.encode([p["text"][:2000] for p in pages], show_progress_bar=False)` → normalize L2
  - `np.savez_compressed("vectors.npz", vecs=arr)`
  - Print `"[retrieval] Built vectors for N pages"`
- [ ] Function `_load_vectors() -> np.ndarray`:
  - `np.load("vectors.npz")["vecs"]`
- [ ] Function `_vector_search(query: str, top_n: int = 20) -> list[tuple[str, float]]`:
  - Encode query, normalize, `vecs @ query_vec` → top_n slugs

**Smoke test:**
```
python -c "from wiki_ops.retrieval import _vector_search; r = _vector_search('how do agents deploy in enterprise', 5); print(r)"
```
Expected: First call prints downloading message (chỉ lần đầu), trả về 5 tuples; `fde-model` hoặc `fde-adoption-radar` xuất hiện trong top 5.

**Estimate:** 45 min (chưa tính download model lần đầu ~2 min)

---

### Step 3 — `retrieval.py`: RRF fusion + public `hybrid_search`
**Mục tiêu:** Public API per FR-RV2-003.

**Files:**
- Sửa: `opus-consilium/wiki_ops/retrieval.py`

**Việc làm:**
- [ ] Function `_rrf_fuse(bm25_hits, vec_hits, k: int = 60) -> list[str]`:
  - Input: 2 list of `(slug, score)` đã sorted desc
  - Build `rank_map[slug] = sum(1/(k + rank_i)) for each list nó xuất hiện`
  - Return slugs sorted by rank_map desc
- [ ] Function `hybrid_search(query: str, top_k: int = 4) -> list[str]`:
  - Input validation: empty query → return []
  - Pages empty → return []
  - Get bm25_hits (top 20) + vec_hits (top 20) → rrf_fuse → return top_k slugs
  - Match signature trong SD 4.1

**Smoke test:**
```
python -c "from wiki_ops.retrieval import hybrid_search; print(hybrid_search('mô hình triển khai AI enterprise', 4))"
python -c "from wiki_ops.retrieval import hybrid_search; print(hybrid_search('karpathy wiki pattern', 4))"
python -c "from wiki_ops.retrieval import hybrid_search; print(hybrid_search('', 4))"
```
Expected:
- Query 1: list 4 slugs, có ít nhất 1 trong {`fde-model`, `fde-adoption-radar`, `competitor-business-model-radar`}
- Query 2: `karpathy-llm-wiki-pattern` hoặc `karpathy-llm-wiki-idea-file` ở top 2
- Query 3: `[]`

**Estimate:** 30 min

---

### Step 4 — `query.py`: Swap LLM call 1 → `hybrid_search`
**Mục tiêu:** Patch theo SD section 3.4. Giữ signature `run_query(question, verbose)` không đổi.

**Files:**
- Sửa: `opus-consilium/wiki_ops/query.py`

**Việc làm:**
- [ ] Remove `prompt1`, `claude_cli_json(prompt1, ...)` block (~15 lines)
- [ ] Import `from wiki_ops.retrieval import hybrid_search`
- [ ] Replace với: `page_slugs = hybrid_search(question, top_k=4)`
- [ ] Giữ `if verbose: print(f"[query] Relevant pages: {page_slugs}")`
- [ ] Phần đọc pages + LLM call 2 (synthesis) — **không touch**
- [ ] Bỏ early-return `"empty"` check cũ dựa vào INDEX text — thay bằng `if not page_slugs: return {"status": "empty", ...}`

**Smoke test:**
```
python -c "from wiki_ops.query import run_query; r = run_query('FDE roadmap status'); print(r['status'], r['pages_read'])"
```
Expected: `status='ok'`, `pages_read` chứa `fde-roadmap` hoặc liên quan.

**Estimate:** 20 min

---

### Step 5 — `conflict_guard.py`: Anchor embed + cosine + LLM confirm
**Mục tiêu:** Module mới per SD 3.2.

**Files:**
- Tạo mới: `opus-consilium/wiki_ops/conflict_guard.py`

**Constants (locked from SD):**
- `ANCHOR_PATHS = ["Personal/current-beliefs.md", "Personal/decisions.md"]`
- `COSINE_THRESHOLD = 0.75`

**Việc làm:**
- [ ] Function `_split_anchor_into_claims(text: str) -> list[str]`:
  - Strip frontmatter
  - Split by `## ` heading; trong mỗi section, mỗi bullet `- ` là 1 claim
  - Trả về list claims (string), filter len > 30 chars
- [ ] Function `_load_anchor_embeds() -> dict`:
  - Cache `wiki_ops/.cache/anchor_embeds.json` schema:
    ```json
    {"Personal/decisions.md": {"mtime": float, "claims": [{"text": str, "vec": [float]}]}}
    ```
  - Rebuild per-anchor nếu anchor mtime > cached mtime
  - Skip anchor nếu file không tồn tại (log warning)
- [ ] Function `_embed_text(text: str) -> np.ndarray`:
  - Reuse `retrieval._get_model()` — không load model lần 2
- [ ] Function `_llm_confirm(new_page_text: str, anchor_claim: str) -> bool`:
  - Prompt strict yes/no:
    ```
    You compare two claims for direct semantic conflict.
    Claim A (existing belief): {anchor_claim}
    Claim B (new content excerpt): {new_text[:1500]}
    Do they contradict each other? Answer with one word only: YES or NO.
    ```
  - `claude_cli(prompt, timeout=60)` → return `True` nếu `"YES"` trong response uppercase đầu tiên
  - Try/except: trả `False` nếu LLM error (per SD §6 false-negative bias)
- [ ] Function `check_ingest_conflict(page_path: Path) -> list[dict]`:
  - Read new page text (strip frontmatter)
  - Embed new page (first 2000 chars)
  - For each anchor → for each claim → cosine
  - Nếu cosine > 0.75 → `_llm_confirm(...)` → nếu True append conflict dict per SD 4.2
  - Append all conflicts vào `.cache/conflicts.json` (list append, create if missing)
  - Return conflicts list

**Smoke test:**
```
python -c "from pathlib import Path; from wiki_ops.conflict_guard import check_ingest_conflict; r = check_ingest_conflict(Path('personal-wiki/AI/karpathy-llm-wiki-pattern.md')); print(len(r), 'conflicts')"
```
Expected: Chạy không crash, in `0 conflicts` (hoặc số dương — đều OK miễn không crash).

**Estimate:** 75 min

---

### Step 6 — `ingest.py`: Post-write hook
**Mục tiêu:** Gọi conflict_guard sau khi page được ghi thành công.

**Files:**
- Sửa: `opus-consilium/wiki_ops/ingest.py`

**Việc làm:**
- [ ] Trong `run_ingest()`, sau `_update_log(...)` và sau `_add_backlinks(...)`:
  ```python
  conflicts = []
  if not dry_run:
      try:
          from wiki_ops.conflict_guard import check_ingest_conflict
          conflicts = check_ingest_conflict(page_path)
          if conflicts and verbose:
              print(f"[ingest] {len(conflicts)} conflict(s) flagged")
      except Exception as e:
          print(f"[ingest] conflict_guard error (non-fatal): {e}")
  ```
- [ ] Thêm `"conflicts": conflicts` vào return dict
- [ ] **Không** thay đổi flow nào khác

**Smoke test:**
```
python -c "from wiki_ops.ingest import run_ingest; r = run_ingest('https://en.wikipedia.org/wiki/Forward_deployed_engineer', verbose=True); print('conflicts:', r.get('conflicts', []))"
```
Expected: Ingest hoàn tất, in `conflicts: [...]` (có thể rỗng).

**Estimate:** 15 min

---

### Step 7 — `decay.py`: Ebbinghaus stability
**Mục tiêu:** Module mới per SD 3.3.

**Files:**
- Tạo mới: `opus-consilium/wiki_ops/decay.py`

**Constants:**
- `S0_DAYS = 7`
- `MULTIPLIER = 2.5`
- `MAX_S = 365`

**Việc làm:**
- [ ] Function `_history_path() -> Path` → `.cache/review_history.json`
- [ ] Function `_load_history() -> dict`:
  - Return `{}` nếu file không tồn tại
  - Backup `.bak` + reinit nếu corrupt (per SD §6)
- [ ] Function `_save_history(h: dict)` — atomic write (tmp + rename)
- [ ] Function `_retention(stability: float, elapsed_days: float) -> float`:
  - Return `exp(-elapsed / stability)`
- [ ] Function `pick_review_set(n: int = 3) -> list[Path]`:
  - Load history + scan all pages (skip SCHEMA/INDEX/log/reflection-*)
  - For each page:
    - If slug ∉ history: init with `S=S0, last_reviewed=created_at từ frontmatter (fallback mtime)`
    - Compute `R(t)` từ now()
    - Skip nếu frontmatter có `applied::` non-empty
  - Filter `R < 0.5`, sort by R asc, return top n Path
- [ ] Function `mark_reviewed(slugs: list[str], at: datetime | None = None)`:
  - For each slug: `S = min(S * 2.5, 365)`, `last_reviewed = at or now()`, `review_count += 1`
  - Save
- [ ] Function `bump_on_apply(slug: str)` — same as mark_reviewed but mark `applied=True`

**Smoke test:**
```
python -c "from wiki_ops.decay import pick_review_set; r = pick_review_set(3); print([p.name for p in r])"
python -c "from wiki_ops.decay import pick_review_set, mark_reviewed; r = pick_review_set(3); mark_reviewed([p.stem for p in r]); print('marked')"
```
Expected: 3 page names, lần thứ 2 in `marked`.

**Estimate:** 60 min

---

### Step 8 — `reflect.py`: Swap pick logic
**Mục tiêu:** Replace `_get_old_pages_for_review` với `decay.pick_review_set`. Sau khi reflect → `mark_reviewed`.

**Files:**
- Sửa: `opus-consilium/wiki_ops/reflect.py`

**Việc làm:**
- [ ] Remove function `_get_old_pages_for_review(n)` (15 lines)
- [ ] Import `from wiki_ops.decay import pick_review_set, mark_reviewed`
- [ ] Trong `run_reflect()`:
  - Thay `old_pages = _get_old_pages_for_review(n=3)` → `old_pages = pick_review_set(n=3)`
  - Sau khi save reflection markdown thành công: `mark_reviewed([p.stem for p in old_pages])`
- [ ] **Không** thay đổi prompt LLM hoặc Telegram logic

**Smoke test:**
```
python -c "from wiki_ops.reflect import run_reflect; print(run_reflect(send_telegram=False)[:200])"
```
Expected: Reflection text in ra, chứa "3 pages cũ nên đọc lại" với danh sách non-empty.

**Estimate:** 20 min

---

### Step 9 — `lint.py`: Conflict report section
**Mục tiêu:** Đọc `.cache/conflicts.json` và include trong weekly report.

**Files:**
- Sửa: `opus-consilium/wiki_ops/lint.py`

**Việc làm:**
- [ ] Function mới `check_conflicts_log() -> list[str]`:
  - Read `wiki_ops/.cache/conflicts.json`
  - Return `[]` nếu missing/empty
  - Format mỗi entry: `"[CONFLICT]    {new_page} -> {anchor_page}: sim={similarity:.2f} | {anchor_claim[:80]}"`
  - Chỉ include conflicts có timestamp trong 7 ngày gần nhất (lưu ý: cần thêm `timestamp` field khi ghi ở Step 5 — quay lại update conflict_guard nếu thiếu)
- [ ] Trong `run_lint()`:
  - Sau `check_contradictions(pages)` → `issues += check_conflicts_log()`

**Note cho Codex:** Nếu Step 5 không lưu `timestamp` khi append conflicts.json — quay lại Step 5 thêm vào schema. Schema sửa thành:
```json
{"timestamp": "ISO-8601", "new_page": "...", "anchor_page": "...", ...}
```

**Smoke test:**
```
python -c "from wiki_ops.lint import run_lint; print(run_lint(send_telegram=False))"
```
Expected: Report bình thường, nếu có conflicts trong 7d gần nhất → có dòng `[CONFLICT]`.

**Estimate:** 25 min

---

### Step 10 — Integration test + recall benchmark
**Mục tiêu:** End-to-end validation cho 7 NFR.

**Files:**
- Tạo mới: `opus-consilium/wiki_ops/tests/test_retrieval_v2.py` (script test thủ công, không pytest framework — match style hiện tại)

**Test cases:**
- [ ] **Happy path query:** 5 câu hỏi mẫu (tiếng Việt và Anh):
  ```
  questions = [
    ("FDE roadmap", ["fde-roadmap"]),
    ("karpathy wiki pattern", ["karpathy-llm-wiki-pattern", "karpathy-llm-wiki-idea-file"]),
    ("mô hình triển khai AI enterprise", ["fde-model"]),
    ("AI evaluation bottleneck", ["ai-evals-bottleneck"]),
    ("competitor consulting models", ["competitor-business-model-radar"]),
  ]
  ```
  Run mỗi câu qua `hybrid_search(q, top_k=4)`, assert expected slug ∈ result. **Đo recall@4** in ra cuối.
- [ ] **Latency NFR-001:** Time mỗi `hybrid_search` call sau khi indices warm — assert < 5s.
- [ ] **Index rebuild idempotent (NFR-002, NFR-005):** Run `hybrid_search` 2 lần liên tiếp; lần 2 không rebuild (check cache mtime không đổi).
- [ ] **Edge: empty query** → return `[]`.
- [ ] **Edge: pages = 0** (mock — skip nếu wiki có pages; chỉ verify code path bằng cách temporarily rename dir và restore).
- [ ] **Conflict integration:** Tạo 1 test page tạm chứa text mâu thuẫn rõ với `current-beliefs.md` → `check_ingest_conflict` phải trả về ≥ 1 conflict. Xóa test page sau.
- [ ] **Decay integration:** `pick_review_set(3)` → `mark_reviewed` → `pick_review_set(3)` lần 2 trả về **khác** lần 1.

**Run:**
```
python -m wiki_ops.tests.test_retrieval_v2
```

**Acceptance criteria (gate trước khi push):**
- Recall@4 trên 5 questions ≥ 4/5 (80%)
- Mọi latency check pass NFR-001
- Conflict detection trả về kết quả cho test page
- Decay test pass (review set khác sau mark)

**Estimate:** 60 min

---

### Step 11 — Update USER-GUIDE và `docs/BACKLOG.md`
**Mục tiêu:** Document changes for next session/user.

**Files:**
- Sửa: `opus-consilium/docs/USER-GUIDE-module-c.md` — thêm section "Retrieval v2"
- Sửa: `opus-consilium/docs/BACKLOG.md` — mark wiki-retrieval-v2 done, list known issues nếu có

**Việc làm:**
- [ ] USER-GUIDE: section ngắn (< 20 lines) — gì thay đổi cho user (query nhanh hơn, conflict alert tự động, reflect smarter).
- [ ] BACKLOG: tick xong RD-wiki-retrieval-v2, add row "follow-up: tune cosine threshold sau 10 conflict cases".

**Smoke test:** N/A (doc only).

**Estimate:** 15 min

---

## Rollback Plan

Nếu Step X fail nghiêm trọng cần rollback toàn bộ:
- Branch độc lập (`claude/opus-wiki-consilium-L2and`) — `git reset --hard origin/main` không đụng main
- Xóa files mới: `wiki_ops/retrieval.py`, `wiki_ops/conflict_guard.py`, `wiki_ops/decay.py`, `wiki_ops/tests/test_retrieval_v2.py`
- Revert patches: `query.py`, `ingest.py`, `reflect.py`, `lint.py`, `requirements.txt`, `.gitignore`
- Xóa `wiki_ops/.cache/` (đã gitignore — chỉ local)
- Không có DB migration → không cần rollback phức tạp

Nếu chỉ 1 step lẻ fail:
- Step 1-3 fail → rollback retrieval module, query.py không cần đổi gì
- Step 5 fail → conflict_guard skip, ingest.py giữ original
- Step 7 fail → decay skip, reflect.py revert pick_old logic

---

## Checklist Trước Khi Done

- [ ] Tất cả 11 smoke tests pass
- [ ] Step 10 integration: recall@4 ≥ 80%, latency < 5s
- [ ] 12 FR trong RD đều có implementation tương ứng (verify per Phase 5)
- [ ] Không P0 NFR vi phạm
- [ ] Không hardcoded credentials (chỉ Path constants)
- [ ] BD doc updated (mọi step `✅`)
- [ ] `requirements.txt` đã pin 2 deps mới
- [ ] `.gitignore` đã có `wiki_ops/.cache/`
- [ ] Branch pushed: `claude/opus-wiki-consilium-L2and`

---

## FR Traceability Matrix

| FR | Step | File |
|---|---|---|
| FR-RV2-001 BM25 index | 1 | retrieval.py |
| FR-RV2-002 MiniLM vector | 2 | retrieval.py |
| FR-RV2-003 hybrid_search API | 3 | retrieval.py |
| FR-RV2-004 swap query call 1 | 4 | query.py |
| FR-RV2-005 incremental rebuild | 1, 2 | retrieval.py (`_should_rebuild_*`) |
| FR-RV2-006 conflict check on ingest | 5, 6 | conflict_guard.py + ingest.py |
| FR-RV2-007 cosine + LLM confirm | 5 | conflict_guard.py |
| FR-RV2-008 conflict in lint report | 9 | lint.py |
| FR-RV2-009 Ebbinghaus stability | 7 | decay.py |
| FR-RV2-010 pick R(t)<0.5 | 7, 8 | decay.py + reflect.py |
| FR-RV2-011 review history persist | 7 | decay.py |
| FR-RV2-012 stability bump on apply | 7 | decay.py |

---

*opus-consilium — BD-wiki-retrieval-v2 v1.0 | 2026-06-02*
