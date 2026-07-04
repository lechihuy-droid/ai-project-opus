# RD — Cross-Session Memory (`recall`)
**Date:** 2026-06-14
**Status:** 🟡 In Review
**Author:** Claude (tuyến Opus)
**Ref:** `docs/SYNTHESIS-self-improving-agent-plan.html` — Phase 1(b)

> Đây là RD gate cho slice đầu tiên của lộ trình self-improving agent (con đường C — dựng dần trên Claude Code). Chỉ scope phần **trí nhớ bền cross-session**. Phần "Skills hoá 3 pipeline" (Phase 1a) tách RD riêng, không gộp ở đây để giữ scope mỏng.

---

## 0. Problem Statement

**Vấn đề:** Mỗi session Claude/Codex bắt đầu *fresh* — không nhớ session trước làm gì, đã quyết gì, handoff để lại gì. Trí nhớ bền của workspace nằm rải rác trong markdown (`ai/sessions/`, `ai/handoff-*.md`, `ai/status.md`, `personal-wiki/INDEX.md`) nhưng **không có cách tra cứu nhanh** — phải nhớ thủ công hoặc mở đọc từng file.

**Hiện trạng:** Khi mở session mới hỏi "tuần trước mình làm gì về LLM migration?" → không có công cụ trả lời. `run_wiki.py query` chỉ tra `personal-wiki/` (kiến thức ngoài), không tra trí nhớ vận hành (session/handoff/status). Đây đúng là điểm yếu lớn nhất của Claude Code mà cả EVAL lẫn DECISION doc đều chỉ ra.

**Mục tiêu:** Một lệnh `recall "<câu>"` trả về ngay các đoạn ký ức liên quan (ranked, có snippet, có nguồn) — để mở session là recall được ngữ cảnh, không bắt đầu từ con số 0. Pure keyword search, **không LLM** → tức thì, miễn phí, không tốn credit.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | HUY (1 người) + chính agent (Claude/Codex) khi mở session |
| Device / môi trường | Windows, terminal trong opus-consilium/, Python 3.11 |
| Tần suất dùng | Đầu mỗi session + bất kỳ lúc nào cần tra "đã làm gì về X" |
| Technical level | Cao — quen CLI, quen `run_*.py` convention |

### 1.2 Typical Usage Flow

```
Bước 1: User mở session mới, không nhớ trạng thái việc cũ
Bước 2: Gõ `python run_recall.py "wiki ingest karpathy"`
Bước 3: System trả 5-8 đoạn ranked: [path § heading] (ngày) + snippet match
Kết quả: User/agent đọc snippet → biết ngay session/handoff/quyết định liên quan, mở đúng file nếu cần
```

### 1.3 Example Interactions

**Ví dụ 1 — Happy path:**
```
Input:  python run_recall.py "Groq migration"
Output: 
  1. [ai/status.md § Current objective] (2026-05-20)
     …Migrate toàn bộ LLM calls từ Groq → Claude CLI… Hoàn thành 2026-05-20…
  2. [ai/status.md § Current state] (2026-05-20)
     …Zero Groq dependency trong pipeline chính — tất cả filter/synthesis dùng Claude CLI…
  3. [opus-consilium/personal-wiki/INDEX.md § AI] (2026-05-31)
     …llm-agents-2025 · deepseek-v4…
```

**Ví dụ 2 — Re-index sau khi có session mới:**
```
Input:  python run_recall.py index
Output: Indexed 6 files, 41 sections → memory/recall.db (1.2s)
```

**Ví dụ 3 — Edge: không khớp:**
```
Input:  python run_recall.py "blockchain defi yield"
Output: Không tìm thấy ký ức khớp. Thử từ khoá khác hoặc chạy `index` nếu vừa thêm session.
```

---

## 2. Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-001 | `python run_recall.py index` — build/rebuild FTS5 index từ tất cả nguồn memory. Idempotent. | P0 | MVP = full rebuild (DROP + insert), corpus nhỏ |
| FR-002 | `python run_recall.py "<query>"` — search, trả top-N (default 8) ranked theo bm25; mỗi kết quả: path, heading, ngày (mtime), snippet highlight. | P0 | |
| FR-003 | Index theo **section** (split markdown trên heading `##`) để recall trỏ đúng đoạn. | P0 | Phần trước heading đầu → section preamble |
| FR-004 | `--json` — output JSON array cho agent/máy đọc. | P1 | Để Hook/subagent dùng sau (Phase 2) |
| FR-005 | Incremental index — skip file nếu `mtime` không đổi. | P1 | MVP full-rebuild đủ nhanh; tối ưu sau |
| FR-006 | `--kind session\|handoff\|status\|wiki-index` — filter theo loại nguồn. | P2 | |
| FR-007 | `--limit N` — đổi số kết quả trả về. | P2 | |

**Nguồn index (FR-001 quét):**

| Nguồn | Path (tương đối từ `opus-consilium/`) | kind | Priority |
|---|---|---|---|
| Session logs | `../ai/sessions/*.md` | session | P0 |
| Handoff | `../ai/handoff-*.md` | handoff | P0 |
| Status | `../ai/status.md` | status | P0 |
| Wiki catalog | `personal-wiki/INDEX.md` | wiki-index | P0 |
| Sub-project memory | `../opus-lucida/ai/*.md` | session/handoff | P1 |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | Performance — index | Build < 3s cho corpus hiện tại | P0 |
| NFR-002 | Performance — query | < 200ms (no LLM call) | P0 |
| NFR-003 | Reliability | File lỗi encoding → skip + warn, không crash cả index | P0 |
| NFR-004 | Idempotency | Re-index nhiều lần → kết quả giống, không dupe row | P0 |
| NFR-005 | Zero new dependency | Chỉ stdlib `sqlite3` (FTS5 built-in Python 3.11) — không `pip install` | P0 |
| NFR-006 | Zero cost | Không gọi LLM → không tốn credit / API / Codex | P0 |
| NFR-007 | Unicode tiếng Việt | `remove_diacritics` → "tổng hợp" và "tong hop" cùng match | P1 |

---

## 4. Explicit Exclusions

> Ghi rõ cái KHÔNG build — quan trọng ngang FR để chống scope creep (Karpathy principle).

- **Không** index toàn bộ *body* của wiki pages — đã có `run_wiki.py query` (LLM synthesis) lo việc tra kiến thức. Recall chỉ index `INDEX.md` để biết wiki *có gì*, không duplicate engine query. Recall lo phần CHƯA có index: session/handoff/status.
- **Không** dùng vector DB / embeddings — single-user, keyword recall đủ; vector = thêm deps + embedding cost, overkill (cả EVAL Hermes lẫn báo cáo multi-agent đều cảnh báo).
- **Không** gọi LLM trong recall — giữ tức thì + miễn phí. "Tổng hợp" là việc của `run_wiki.py query`, "tra cứu" là việc của `recall`.
- **Không** auto-inject ký ức vào session — đó là việc của `SessionStart` Hook (Phase 2), không phải bây giờ. Recall chỉ là công cụ tra tay/agent gọi.
- **Không** daemon/watch — index chạy on-demand (`index`) hoặc qua Task Scheduler sau. Không tiến trình nền.
- **Không** sửa pipeline hiện có (collect/synthesis/wiki) — feature thuần *additive*, không đụng `utils/llm.py`.

---

## 5. Open Questions

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | Index wiki page bodies hay chỉ `INDEX.md`? | Chỉ `INDEX.md` (tránh trùng `run_wiki.py query`, giữ index nhỏ) |
| Q2 | DB commit vào git hay gitignore? | **Gitignore** `opus-consilium/memory/recall.db` — rebuild được từ source bất kỳ lúc nào |
| Q3 | Có index `opus-lucida/ai/` không? | Có, ở P1 (cùng pattern, thêm path vào config) |
| Q4 | Split section theo heading level nào? | `##` (level 2); giữ `#` title làm context prefix cho heading |
| Q5 | Đặt code ở đâu? | `opus-consilium/run_recall.py` (entry, theo convention `run_*.py`) + logic trong `opus-consilium/memory/` |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| SQLite **FTS5** thay vì `grep` | Ranked relevance (bm25) + snippet + tốc độ; grep không rank, không snippet | grep: nhanh viết nhưng kết quả phẳng, không ưu tiên |
| FTS5 thay vì vector DB | Single-user, keyword đủ; zero dep | vector/mem0/Letta: thêm deps + embedding cost, overkill |
| **No LLM** trong recall | Giữ tức thì + miễn phí; tách bạch "tra cứu" vs "tổng hợp" | LLM rerank: cost + latency + chạm credit, không cần |
| Section-level rows | Recall trỏ đúng đoạn, snippet relevant hơn | File-level: snippet kém chính xác |
| Full rebuild (MVP) | Đơn giản, idempotent by construction, corpus nhỏ < 3s | Incremental: thêm phức tạp → để P1 (FR-005) |
| Entry `run_recall.py` | Theo convention `run_*.py` sẵn có (research/daily/wiki/collect/weekly) | Script rời ngoài convention → khó nhớ |

---

## 7. Tuyến thực thi

Theo routing CLAUDE.md: RD/SD/BD = **Opus** (doc này). Coding + test = giao **Codex** (`codex exec`) theo BD; Claude review kết quả, không tự code. Đây là feature > 20 dòng → bắt buộc qua gate RD→SD→BD trước khi code.

---

*opus-consilium — RD Cross-Session Memory v1 | 2026-06-14*
