# Upgrade Plan — Đưa Opus Harness lên chuẩn SAFEHARNESS
**Date:** 2026-06-28 · **Author:** Claude (Opus 4.8) · **Status:** 🔵 Planning (chờ chọn item → chạy SDD)

> Kế hoạch nâng cấp chia **2 nhóm**: **A** = thêm ngay vào Hub/observability (không cần agent loop), **B** = lớp phòng thủ runtime (cần harness trở thành agent-execution runtime). Mỗi item ghi rõ tái dùng gì, phạm vi, và cần RD hay skip-RD. User chọn item → mở SDD (RD→SD→BD→giao Codex).

---

## 0. Bối cảnh & nguyên tắc chia A/B

Khung SAFEHARNESS/ETCLOVG mô tả harness **= runtime điều phối vòng lặp Reasoning–Action**, gate từng tool-call qua L1–L4. Harness hiện tại = **check-runner + observability HUD** (chạy suite check + đọc log), **không chạy vòng lặp agent**.

**Đường phân chia:**
- **Nhóm A** — làm được trên kiến trúc hiện tại (observe/governance thô trên log + suite + Track B Phase 1). Rủi ro thấp, giá trị ngay.
- **Nhóm B** — chỉ có nghĩa khi có **agent-execution runtime** (Track B): mọi tool-call của agent đi qua harness. Cần LLM loop (API key) hoặc bọc quanh `codex exec` job. Mầm L3/L4 đã có ở Track B Phase 1 (approve-gate + git-worktree confine + rollback) và ở `run_harness.py` boundary policy (chặn path ngoài root, gate shell-launcher, dò dangerous-command).

---

## 1. Mapping ETCLOVG + checklist → A/B + trạng thái

| Mục | Nhóm | Trạng thái hiện tại | Ghi chú |
|---|---|---|---|
| Observability (entropy, violation-rate) | **A** | ⚠️ có loop-detect + tool analytics | Gần nhất — nâng thành entropy monitor |
| Context / Provenance tagging | **A** | ⚠️ có `source` | Thêm nhãn user/tool/system + trust |
| Governance — 5 risk-tier | **A** | ⚠️ có dangerous/shell gating | Chuẩn hoá 5 tier + tag command |
| Tooling — HMAC integrity (registry) | **A (một phần)** | ❌ | Ký được **suite manifest** ngay; ký tool-desc cần registry runtime (B) |
| Lifecycle / Verification report | **A (một phần)** | ⚠️ có run report | Thêm constraint-violation metric |
| Execution (agent loop) | **B** | ❌ | = agent runtime |
| Tooling — tool registry + HMAC tool-desc | **B** | ❌ | Tool-Description Injection (T4) |
| L1 INFORM (NFKC/zero-width/semantic filter) | **B** | ❌ | Khử khuẩn input + tool-output |
| L2 VERIFY (Rule→Judge→Causal) | **B** | ❌ | Thẩm định ý định mỗi action |
| L3 CONSTRAIN (capability token TTL/max-call) | **B** | ⚠️ approve-gate (Track B P1) | Token hoá đặc quyền |
| L4 CORRECT (rollback gồm memory + degradation) | **B** | ⚠️ git rollback file | Thêm memory rollback + 5 cấp hạ cấp |
| Inter-layer feedback (L1→L2→L4→L3) | **B** | ❌ | Cần đủ L1–L4 |

**Checklist 7 mục:** entropy w20/θ0.3 → A1 · provenance → A2 · 5 risk-tier → A3 · HMAC (suite) → A4 / (tool-desc) → B · L1-filter tool content → B · capability token → B · rollback gồm memory → B (file đã có ở Track B P1).

---

## 2. NHÓM A — Nâng cấp Hub/Observability (làm trước, từng item)

> Tất cả thêm vào `harness/hub/`, tái dùng `behavior.py` / `runs.py` / boundary của `run_harness.py`. Không cần agent loop, không API key.

### A1 — Entropy Monitor (Observability)
- **Mục tiêu:** sliding window **w=20**, violation-rate **θ=0.3** trên chuỗi hành động mỗi session; badge "high-entropy / unstable" + trang Violations.
- **Tái dùng:** loop-detection + tool events trong `behavior.py`.
- **"Violation" định nghĩa (observe):** lặp tool ≥ threshold, gọi tool tier cao bất thường, error-burst. Cấu hình trong `config.py`.
- **SDD:** RD ngắn (định nghĩa violation + ngưỡng là quyết định cần chốt) → SD nhẹ → BD. ~1 service + 1 endpoint + 1 trang.

### A2 — Provenance Tagging (Context)
- **Mục tiêu:** mỗi context entry (replay/usage) gắn nhãn nguồn `user | tool | system | model` + mức **trust** (trusted/untrusted); hiện màu trong 3-pane + filter "untrusted only".
- **Tái dùng:** parser session (`replay.py`) — đã phân biệt được role/tool_result.
- **SDD:** skip-RD khả thi (thêm field + hiển thị, < ~quy mô nhỏ) HOẶC RD rất ngắn để chốt thang trust.

### A3 — 5-Tier Risk Registry (Governance, observe)
- **Mục tiêu:** phân loại mọi tool/command vào `read_only | write | execute | network | destructive`; hiện tier (màu) ở trang Tools + cạnh mỗi tool-call trong replay; mở rộng boundary `run_harness` để **tag tier** mỗi command (chưa enforce, chỉ gắn nhãn + cảnh báo).
- **Tái dùng:** dangerous-command/shell detection sẵn có trong `run_harness.py`.
- **SDD:** RD ngắn (bảng phân loại tool→tier là quyết định) → SD/BD nhẹ.

### A4 — Suite/Manifest Integrity (HMAC, phần làm được không cần runtime)
- **Mục tiêu:** ký **HMAC-SHA256** cho suite manifest (`suites/*.json`) + (tuỳ) rubric; HUD cảnh báo nếu manifest bị sửa ngoài quy trình (mầm chống supply-chain cho phần ta kiểm soát).
- **Lưu ý:** ký *tool-description* thật sự thuộc B (cần tool registry runtime). A4 chỉ ký artifact tĩnh ta đang có.
- **SDD:** skip-RD (tiện ích nhỏ) hoặc RD 1 trang (chốt nơi giữ key — `.env`, không commit).

### A5 — Verification/Violation Report (Lifecycle)
- **Mục tiêu:** thêm metric "constraint violations" vào run report + dashboard (đếm boundary-deny, dangerous-command, tier vi phạm theo thời gian).
- **Tái dùng:** trace.jsonl + boundary results.
- **SDD:** skip-RD (mở rộng report hiện có).

**Thứ tự đề xuất Nhóm A:** A1 → A3 → A2 → A5 → A4 (entropy & risk-tier cho giá trị quan sát lớn nhất trước).

---

## 3. NHÓM B — Agent-Execution Runtime (SAFEHARNESS lõi)

> Chỉ khả thi khi harness **chạy agent loop** (mọi tool-call đi qua harness). Đây là dự án "Opus Runtime" (đã có RD draft + Phase 1 git-worktree). Cần LLM loop (`anthropic` SDK, **API key**, tốn token) hoặc bọc quanh `codex exec`.

| Item | Lớp | Nội dung |
|---|---|---|
| **B0 Execution loop** | Execution/Lifecycle | Runtime chạy vòng lặp input→decide→execute→update; điểm chokepoint duy nhất |
| **B1 L1 INFORM** | L1 | NFKC normalize, bỏ zero-width/bidi, regex + semantic filter (LLM phụ) cho **input và tool-output** trước khi vào memory (chống indirect injection) |
| **B2 L2 VERIFY** | L2 | 3 tầng: Rule-based → Contextual Judge (LLM) → Causal Diagnostics; chạy **L3 trước L2** để tiết kiệm |
| **B3 L3 CONSTRAIN** | L3 | Tool registry + **HMAC-SHA256 tool-desc** (chống T4); **Capability Tokens** (TTL + max-invocation); enforce 5 risk-tier |
| **B4 L4 CORRECT** | L4 | Checkpoint + Rollback gồm **memory store** (không chỉ file); 5 cấp **adaptive degradation** (L0 full → L4 read_only) |
| **B5 Protected Memory** | Context/Memory | Content-hash + provenance mỗi entry; phát hiện ghi bất thường (T5) |
| **B6 Inter-layer feedback** | All | L1→L2 escalate · L2→L4 rollback · L4→L3 thắt quyền · L4→L2 phục hồi sau 5 bước an toàn |

**Phụ thuộc:** B0 trước; rồi L3(B3)+L1(B1) → L2(B2) → L4(B4) → feedback(B6). B5 song song.
**Quyết định kiến trúc B0** (đã nêu ở RD Opus Runtime): (A) bọc `codex exec` + git checkpoint (no API key, gate ở ranh giới pha) — yếu hơn nhưng làm ngay; (B) `anthropic` manual tool-loop (per-tool HITL thật, **cần API key + tốn token**). SAFEHARNESS đầy đủ (per-tool L1–L4) ⇒ **cần phương án B**.

---

## 4. Kế hoạch chạy SDD (cách vận hành)

- **Mỗi item = 1 vòng SDD** riêng (RD→SD→BD→Codex→review), để add dần, không big-bang.
- **Cần RD đầy đủ:** A1, A3, và toàn bộ Nhóm B (có quyết định/đánh đổi). **Skip-RD (làm thẳng BD nhỏ):** A2, A4, A5 nếu phạm vi < ~quy mô nhỏ rõ ràng.
- **Routing (CLAUDE.md):** RD/SD/BD + review = Opus main session; implement + test = Codex; search/verify rộng = Sonnet subagent.
- **Gate:** không code item nào trước khi RD/BD của nó được duyệt.

### Đề xuất trình tự tổng
1. **Nhóm A** (A1→A3→A2→A5→A4) — biến Hub thành "observability + governance thô" đúng tinh thần SAFEHARNESS, rủi ro thấp, không API key.
2. **Quyết định B0** (codex-wrap vs API-key loop) — mở RD Opus Runtime đầy đủ.
3. **Nhóm B** theo thứ tự phụ thuộc — lớp phòng thủ runtime thật.

---

## 5. Việc cần bạn quyết để bắt đầu
1. Bắt đầu từ **A1 (Entropy Monitor)** đúng không, hay chọn item khác trong Nhóm A?
2. Item đầu tiên: viết **RD đầy đủ** hay **skip-RD** (nếu đủ nhỏ)?

*(Sau khi chốt, Claude mở RD cho item đó và chạy SDD như các lần trước.)*

---
*Opus Harness — SAFEHARNESS Upgrade Plan v1 | 2026-06-28*
