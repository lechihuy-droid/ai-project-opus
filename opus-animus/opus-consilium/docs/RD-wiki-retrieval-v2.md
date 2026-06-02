# RD — Wiki Retrieval v2: Hybrid Search + Contradiction Guard + Ebbinghaus Decay
**Date:** 2026-06-02
**Status:** 🔵 Draft
**Author:** Claude (Opus 4.7)

---

## 0. Problem Statement

**Vấn đề:** Cả 3 wiki operations cốt lõi (query, lint, reflect) đang có điểm yếu cụ thể, đo được — và cả 3 cùng bị bộc lộ bởi cùng 1 nguyên nhân: wiki đã lớn (474 dòng INDEX, 351 pages AI/).

**Hiện trạng:**
- `query.py` dùng 2 LLM call: LLM đọc INDEX text để chọn slug → miss rate tăng theo kích thước INDEX, câu hỏi mơ hồ càng dễ fail.
- `lint.py` chỉ detect contradiction qua tag `"contradiction"` — không phát hiện conflict semantic khi ingest belief mới vs `decisions.md` / `current-beliefs.md`.
- `reflect.py` pick pages cũ nhất theo mtime — không biết page đã review bao nhiêu lần, không có decay curve, review load không tối ưu.

**Mục tiêu:** Vá đúng 3 chỗ trên, giữ nguyên stack Python + Markdown + GitHub-as-truth. Không thêm runtime mới.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Huy — solo, power user |
| Device / môi trường | Windows 11, Task Scheduler chạy tự động + Telegram CLI |
| Tần suất dùng | Query: nhiều lần/ngày; Lint: weekly; Reflect: weekly |
| Technical level | Developer — đọc được Python, không cần UI thêm |

### 1.2 Typical Usage Flow

```
QUERY:
Bước 1: Huy hỏi câu hỏi qua Telegram bot hoặc run_wiki.py
Bước 2: System tìm pages liên quan (hybrid: BM25+vector+RRF)
Bước 3: System synthesize câu trả lời từ pages tìm được
Kết quả: Câu trả lời có [[citation]] + recall cao hơn câu hỏi mơ hồ

LINT (weekly, cron):
Bước 1: Task Scheduler chạy lint
Bước 2: Lint check orphan/broken/stale + contradiction guard
Kết quả: Telegram report — thêm "[CONFLICT]" section nếu detect semantic mâu thuẫn

REFLECT (weekly, cron):
Bước 1: Task Scheduler chạy reflect
Bước 2: Tính Ebbinghaus score cho tất cả pages → pick 3 sắp quên nhất
Kết quả: Telegram summary + reflection-YYYY-WW.md với danh sách review đúng pages
```

### 1.3 Example Interactions

**Ví dụ 1 — Query mơ hồ (hiện tại fail):**
```
Input:  "mô hình deploy AI trong enterprise"
Hiện tại: LLM chọn slug từ INDEX text → bỏ sót "fde-model", "competitor-business-model-radar"
V2:     BM25("deploy AI enterprise") + vector("enterprise deployment patterns") → RRF → top 4
Output: Tổng hợp từ [[fde-model]], [[fde-adoption-radar]], [[competitor-business-model-radar]]
```

**Ví dụ 2 — Contradiction guard khi ingest:**
```
Input:  Ingest bài "Why outcome-based pricing fails for SIers"
V2 lint: So sánh với decisions.md ("bet on outcome-based delivery") → flag
Output: [CONFLICT] AI/outcome-pricing-sier → xung đột với Personal/decisions.md:fde-bet
```

**Ví dụ 3 — Spaced repetition có decay:**
```
Reflect chọn pages:
Hiện tại: 3 files có mtime cũ nhất → có thể là pages đã review nhiều lần
V2:     Tính R(t) = e^(-t/S) (S = stability từ lịch sử review), pick pages R(t) < 0.5
Output: surface đúng 3 pages sắp quên, bỏ qua pages vừa review tuần trước
```

---

## 2. Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-RV2-001 | `retrieval.py` phải index toàn bộ `personal-wiki/` bằng BM25 (rank_bm25) | P0 | Index build khi import lần đầu |
| FR-RV2-002 | `retrieval.py` phải embed pages bằng `sentence-transformers/all-MiniLM-L6-v2` (local, CPU) | P0 | Persist vector index vào `wiki_ops/.cache/` |
| FR-RV2-003 | `retrieval.py` phải expose `hybrid_search(query, top_k=4) → list[str]` trả slug list | P0 | Dùng RRF k=60 |
| FR-RV2-004 | `query.py` phải thay LLM call 1 (INDEX→slugs) bằng `hybrid_search()` | P0 | LLM call 2 (synthesis) giữ nguyên |
| FR-RV2-005 | Index phải tự rebuild incremental khi có page mới (detect qua log.md mtime) | P1 | Không rebuild toàn bộ mỗi query |
| FR-RV2-006 | `lint.py` phải thêm `check_ingest_conflict(new_page_path)` so sánh với `decisions.md` và `current-beliefs.md` | P0 | Gọi sau mỗi ingest, không phải weekly lint |
| FR-RV2-007 | Conflict detection dùng embedding cosine similarity (threshold > 0.75) + LLM confirm nếu hit | P1 | LLM call chỉ khi cosine > 0.75 để tránh false positive |
| FR-RV2-008 | Conflict kết quả phải append vào Telegram report với format `[CONFLICT] {page} → {anchor}` | P0 | |
| FR-RV2-009 | `reflect.py` phải tính Ebbinghaus stability score cho mỗi page từ lịch sử review | P0 | Dùng `R(t) = e^(-t/S)`, S tăng mỗi lần applied/reviewed |
| FR-RV2-010 | `reflect.py` phải pick pages có `R(t) < 0.5` thay vì oldest mtime | P0 | |
| FR-RV2-011 | Review history phải persist vào `wiki_ops/.cache/review_history.json` | P1 | Key = page slug, value = [{reviewed_at, stability}] |
| FR-RV2-012 | Khi page được mark `applied::` → tăng stability S lên (S_new = S_old * 2.5) | P1 | Simulate SM-2 simplified |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | Query latency | < 5s tổng (không tính LLM synthesis) | P0 |
| NFR-002 | Index build lần đầu | < 60s cho 350 pages | P0 |
| NFR-003 | Incremental index update | < 3s cho 1 page mới | P1 |
| NFR-004 | Zero LLM cost cho retrieval step | BM25+vector = local, $0 | P0 |
| NFR-005 | Không break existing callers | `run_query()` signature giữ nguyên | P0 |
| NFR-006 | Embedding model size | < 100MB, CPU-only | P0 |
| NFR-007 | Conflict detection false positive | < 20% (validate thủ công 10 cases) | P1 |

---

## 4. Explicit Exclusions

- **Không** dùng external vector DB (Qdrant, Chroma, pgvector) — SQLite/file đủ ở scale 350-500 pages.
- **Không** cài Node.js hoặc iii-engine — giữ nguyên Python-only stack.
- **Không** replace LLM call 2 (synthesis) — chỉ thay call 1 (slug picking).
- **Không** build UI/viewer riêng — output qua Telegram + terminal print như hiện tại.
- **Không** auto-resolve contradiction — chỉ flag, user quyết.
- **Không** implement full SM-2 algorithm — simplified 1-parameter Ebbinghaus đủ dùng.
- **Không** thay đổi `raw/` pipeline hoặc `ingest.py` logic — chỉ thêm post-ingest hook cho conflict check.

---

## 5. Open Questions

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | Cache vector index ở `.cache/` trong git hay gitignore? | Gitignore — rebuild từ pages |
| Q2 | Conflict threshold cosine 0.75 có phù hợp không? | 0.75 — điều chỉnh sau khi test 10 cases |
| Q3 | Stability ban đầu S₀ = bao nhiêu ngày? | S₀ = 7 ngày (1 tuần) cho mọi pages cũ |
| Q4 | `check_ingest_conflict` chạy sync trong `run_ingest()` hay async? | Sync — latency thêm < 2s chấp nhận được |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| BM25 + MiniLM + RRF, không dùng LLM cho retrieval | LLM call 1 hiện tại tốn token + latency, và quality không scale khi INDEX lớn | Chỉ BM25: miss semantic; Chỉ vector: miss keyword exact |
| RRF k=60 (theo AgentMemory benchmark) | k=60 là sweet spot từ literature, đã validate ở 95.2% R@5 | k=100: nhỏ diff, không đáng tuning |
| Contradiction check sau ingest (không phải weekly lint) | Khi ingest là lúc có context nhất về nội dung mới; weekly lint xử lý nhiều files cùng lúc khó correlate | Weekly lint: miss window khi user đang đọc source |
| Ebbinghaus simplified (1 parameter S) thay vì SM-2 đầy đủ | SM-2 cần grade 0-5 per review — không có input đó; 1-param đủ để phân biệt sắp quên vs vừa review | SM-2: overkill, cần UI để grade |
| `wiki_ops/retrieval.py` là module mới tách riêng | Không touch query.py/reflect.py/lint.py trực tiếp — swap dependency, không rewrite | Patch trực tiếp: coupling cao, khó test |

---

## 3 Lợi Ích Nổi Bật

### 1. Query recall không bị chặn bởi INDEX size
INDEX hiện tại 474 dòng, AI/ có 351 pages. LLM đọc toàn bộ INDEX text để đoán slug → error rate tăng tuyến tính với số trang. BM25+vector+RRF hoạt động song song trên mọi pages, không cần LLM biết hết INDEX — **wiki càng lớn retrieval càng ổn định**, không ngược lại như hiện tại.

### 2. Decision brain được bảo vệ khỏi silent contradiction
`current-beliefs.md` và `decisions.md` là core assets của Consilium — belief lỗi thời không được retire gây ra quyết định sai (mua/bán, bet sai career). Lint hiện tại chỉ check tag `"contradiction"` — nghĩa là **chỉ phát hiện contradiction khi đã được gán tag thủ công**. Conflict guard tự động so sánh mỗi page mới vs anchor beliefs ngay khi ingest, trước khi nội dung đã "chìm" vào wiki.

### 3. Spaced repetition tốt hơn với cùng review effort
Reflect hiện pick 3 pages cũ nhất — có thể là pages đã review 5 lần tuần trước, hoặc pages đã applied và không cần xem lại. Ebbinghaus decay tính đúng "sắp quên nhất" → **cùng 30 phút review mỗi tuần, retention cao hơn** vì đúng timing. Không tăng review load, tăng chất lượng.

---

*opus-consilium — RD-wiki-retrieval-v2 v1.0 | 2026-06-02*
