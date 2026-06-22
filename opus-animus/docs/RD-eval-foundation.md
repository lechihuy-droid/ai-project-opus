# RD — Eval Foundation (Traces + Routing Goldens + Typed Action Registry)
**Date:** 2026-06-21
**Status:** 🔵 Draft
**Author:** Lê Chí Huy + Claude
**Phase:** v4 Phase 1 (foundation — build BEFORE any proactive feature)
**Nguồn plan:** [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md) §6.1, §7.1 (L9), §8.2, §11 Phase 1
**Phụ thuộc:** Không có (đây là nền móng). Là dependency của [`RD-proactive-mvp.md`](RD-proactive-mvp.md).

---

## 0. Problem Statement

**Vấn đề:** v4 mô tả một assistant đa bước (controller loop §8.1) với proactive layer (§3) và feedback loop (§5). Nhưng hiện tại **không có cách nào đo lường chính nó**: không có trace cho mỗi quyết định routing, không có golden set để regression-check, và safety gate (§6) đang phụ thuộc vào việc LLM **tự khai báo** `action_type` — một LLM có thể gán nhầm một hành động `dangerous` thành `write` vô hại.

**Hiện trạng:** Routing/synthesis chạy bằng Claude CLI (xem `opus-consilium/CLAUDE.md`) nhưng không lưu lại quyết định nào. Mỗi lần chỉnh prompt/rule routing là chỉnh "mù" — không biết nó cải thiện hay phá vỡ thứ đang chạy. Chưa có khái niệm action class deterministic.

**Mục tiêu:** Dựng 3 hạ tầng đo-lường/an-toàn tối thiểu để mọi tính năng sau đó có thể build trên nền vững (agent-eval review của v4: "building features before traces/metrics exist means building on sand"):
1. **Traces (L9)** — append-only, 1 record / loop step, replayable.
2. **Routing golden set + eval runner** — ~50 case gán nhãn + metrics + regression gate.
3. **Typed Action Registry (§6.1)** — action class lấy từ registry deterministic, KHÔNG từ LLM self-label; unregistered → `dangerous` (deny-by-default).

---

## 1. Usage — Dùng Thế Nào

> Viết TRƯỚC FR. Có 3 "người dùng": (a) controller loop ghi trace khi chạy, (b) developer/Claude chạy eval runner khi đổi routing, (c) approval gate hỏi registry trước mỗi action.

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng chính | Solo dev (Huy) + Claude khi sửa routing/prompt |
| "Người dùng" máy | Controller loop (ghi trace), approval gate (query registry) |
| Device / môi trường | Windows, Python 3.11, Claude CLI; chạy tay hoặc Task Scheduler |
| Tần suất | Trace: mỗi turn. Eval runner: mỗi lần đổi routing rule/prompt + weekly self-eval (§8.2) |
| Technical level | Đọc được JSONL, chạy được script CLI |

### 1.2 Typical Usage Flow

```
A) Ghi trace (tự động, mỗi loop step)
   intent_packet được tạo → controller loop chạy 1 step
        → append 1 record vào ai/traces/YYYY-MM-DD.jsonl
        → (sau khi user phản hồi) cập nhật user_verdict + outcome cho record đó

B) Eval routing (chạy tay khi đổi rule, hoặc CI gate)
   dev sửa intent-router rule/prompt
        → python evals/run_eval.py --suite routing
        → đọc evals/routing-goldens.jsonl (~50 case)
        → với mỗi case: chạy router → so target_subsystem dự đoán vs nhãn
        → in routing_accuracy + bảng misroute + so với baseline
        → exit code ≠ 0 nếu accuracy < baseline  → CHẶN thay đổi

C) Gate một action (tự động, trước mỗi side-effect)
   LLM đề xuất {tool: "calendar.events.insert", ...}
        → registry.classify("calendar.events.insert") → "write"
        → gate: write ⇒ requires_approval=true → dừng, hỏi user
        → tool chưa đăng ký ⇒ trả "dangerous" → chặn, báo deny-by-default
```

### 1.3 Example Interactions

**Ví dụ 1 — Trace record (happy path, single-hop):**
```jsonl
{"id":"2026-06-21-0731-01","ts":"2026-06-21T07:31:04+09:00","origin":"user",
 "user_input":"Primus, tổng hợp tin AI tuần này","intent_type":"information",
 "target_subsystem":"CONSILIUM","route_confidence":0.92,
 "sources_loaded":["AGENTS.md","ai/status.md","opus-consilium/ai/status.md"],
 "action_class":"read","output_kind":"research_summary","step_index":0,
 "user_verdict":null,"outcome":null}
```
Sau khi user phản hồi, record được patch: `"user_verdict":"accepted","outcome":"used"`.

**Ví dụ 2 — Eval runner output:**
```
$ python evals/run_eval.py --suite routing
Routing eval — 50 cases
  routing_accuracy : 0.94  (47/50)   baseline 0.90  → PASS
  misroute_rate    : 0.06  (3/50)
  Misroutes:
    "Primus, tuần này nên drop hướng nào?"   gold=LOGOS   got=RECTOR
    "lưu cái này lại giúp tôi"                gold=WIKI    got=NEXUS
    "chạy lại collect"                        gold=INFRA   got=CONSILIUM
  RESULT: PASS (accuracy 0.94 ≥ baseline 0.90)
```

**Ví dụ 3 — Action Registry (edge case, deny-by-default):**
```
Input  : LLM proposes {"tool":"shell.exec","args":"rm -rf raw/"}
Lookup : registry.classify("shell.exec") → "dangerous"
Gate   : dangerous ⇒ require explicit confirm → BLOCK, log to trace (action_class="dangerous")

Input  : LLM proposes {"tool":"telegram.broadcast", ...}   # chưa đăng ký
Lookup : registry.classify("telegram.broadcast") → not found
Gate   : unregistered ⇒ treated as "dangerous" (deny-by-default) → BLOCK
```

---

## 2. Functional Requirements

### Traces (L9)
| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-T01 | Cung cấp hàm `log_trace(record)` ghi **append-only** 1 dòng JSON vào `ai/traces/YYYY-MM-DD.jsonl` (file theo ngày, JST) | P0 | Không bao giờ rewrite/xoá dòng cũ |
| FR-T02 | Trace record chứa đủ field §8.2: `id, ts, origin, user_input, intent_type, target_subsystem, route_confidence, sources_loaded, action_class, output_kind, step_index` | P0 | Schema cố định, validate khi ghi |
| FR-T03 | Cho phép **patch** `user_verdict` + `outcome` của một record theo `id` sau khi có phản hồi user | P0 | Patch = append delta hoặc rewrite-by-id; xem Q3 |
| FR-T04 | Mỗi loop step (§8.1) ghi đúng 1 record; multi-step task ⇒ nhiều record cùng `id` prefix, khác `step_index` | P0 | Replayable theo thứ tự step_index |
| FR-T05 | `id` ổn định, sortable, unique trong ngày (vd `YYYY-MM-DD-HHMM-NN`) | P0 | Dùng để patch (FR-T03) và join metrics |
| FR-T06 | Trace KHÔNG được load trong routing thường (L9 chỉ đọc bởi eval) | P0 | Bảo vệ context budget §7.1 |

### Routing Golden Set + Eval Runner
| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-E01 | `evals/routing-goldens.jsonl` chứa ~50 case `{input, target_subsystem}` (có thể kèm `note`, `lang`) | P0 | Phủ đủ 7 subsystem + prefix-override (§2.2) + tiếng Việt/Anh |
| FR-E02 | `run_eval.py --suite routing` chạy router trên từng case, tính `routing_accuracy` = đúng/total | P0 | So `target_subsystem` dự đoán vs nhãn |
| FR-E03 | In bảng misroute (input, gold, got) cho mọi case sai | P0 | Để debug nhanh |
| FR-E04 | **Regression gate:** exit code ≠ 0 nếu `routing_accuracy < baseline` | P0 | Baseline lưu ở config; xem Q4 |
| FR-E05 | Định nghĩa (machine-readable) các metric §8.2: `routing_accuracy, misroute_rate, task_completion_rate, proactive_precision, false_nudge_rate, approval_correctness, clarify_rate, brief_factuality` | P1 | MVP **tính** routing_accuracy + misroute_rate từ golden; phần còn lại tính từ trace khi đủ dữ liệu |
| FR-E06 | `run_eval.py --suite routing --from-traces ai/traces/*.jsonl` tính misroute_rate thực tế từ `user_verdict` (re-route) | P1 | Đo trên dữ liệu thật, không chỉ golden |
| FR-E07 | Confidence calibration: report bảng `route_confidence` bucket vs accuracy thực tế (§8.2 [F7]) | P1 | Tiền đề cho clarify threshold §10; chưa set threshold ở RD này |

### Typed Action Registry (§6.1)
| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-R01 | Registry là **dữ liệu khai báo** (vd `evals/../action-registry.yaml`) map `tool_id → class` với class ∈ `read\|draft\|write\|dangerous` | P0 | Single source of truth cho action class |
| FR-R02 | `classify(tool_id) → class` lấy class **từ registry**, KHÔNG từ output LLM | P0 | LLM chỉ *request*; registry *quyết định* |
| FR-R03 | Tool chưa đăng ký ⇒ trả `dangerous` (deny-by-default) | P0 | Không có "unknown = an toàn" |
| FR-R04 | Map class → gate: `read`=free, `draft`=free, `write`=requires_approval, `dangerous`=requires_explicit_confirm | P0 | Khớp §6 mục 3 |
| FR-R05 | Seed registry tối thiểu các tool đã có/sắp dùng: `wiki.read, brief.draft, calendar.events.insert, file.delete, telegram.send, shell.exec` (+ các tool collect/wiki hiện hữu) | P0 | Ví dụ §6.1 |
| FR-R06 | `approval_correctness` đo được: so `action_class` trong trace vs side-effect thực (§8.2) | P1 | Cần khi có write thật; MVP chỉ ghi action_class vào trace |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-01 | Trace ghi không chặn luồng chính | `log_trace` < 50ms/record (local append) | P0 |
| NFR-02 | Append-only, không hỏng file khi ghi đồng thời/crash giữa chừng | 1 record = 1 dòng JSON hợp lệ; crash không để dòng nửa chừng | P0 |
| NFR-03 | Eval runner reproducible | Chạy 2 lần cùng input ⇒ cùng accuracy (router deterministic hoặc seed cố định) | P1 |
| NFR-04 | Registry lookup rẻ | `classify()` O(1), không gọi LLM | P0 |
| NFR-05 | Trace không chứa secret | Không log token/API key/đường dẫn nhạy cảm | P0 |
| NFR-06 | Cost | Eval routing 50 case dùng Claude CLI: chấp nhận, chạy tay/CI; không chạy mỗi turn | P1 |

---

## 4. Explicit Exclusions

- **Không** build intent-router engine ở RD này — chỉ build *eval cho* router. Router (`ai/routing/intent-router.md`) là doc/feature riêng (Phase 1, RD/SD khác).
- **Không** build controller loop (§8.1) — RD này chỉ định nghĩa **trace record** mà loop sẽ ghi.
- **Không** build dashboard/visualization cho metrics — JSONL + CLI table là đủ cho MVP.
- **Không** làm push/Telegram, proactive item — thuộc [`RD-proactive-mvp.md`](RD-proactive-mvp.md).
- **Không** fine-tuning / opaque weights — "learning" = heuristic re-ranking only (§5). Ngoài scope.
- **Không** set clarify threshold (§10) ở đây — chỉ *report* calibration (FR-E07); set threshold sau khi có dữ liệu.
- **Không** wire `user-profile/` — layer L8 riêng, Phase 1 task khác.

---

## 5. Open Questions

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | Vị trí file: đặt `ai/traces/` + `evals/` ở **root opus-animus** hay trong `opus-consilium/`? | **Root `opus-animus/`** — vì L9/eval là animus-level, dùng chung mọi subsystem (khớp §7.1) |
| Q2 | Router để eval gọi vào đâu? Tái dùng `skills/intent_classifier.py` (Consilium) hay viết router mới theo §2? | Tái dùng/adapter quanh classifier hiện có cho MVP; router mới là việc Phase 1 song song |
| Q3 | Patch verdict (FR-T03): rewrite-by-id (gọn, cần đọc-sửa file) hay append delta record `{id, patch:{...}}` (thuần append, eval merge khi đọc)? | **Append delta** — giữ append-only thuần (NFR-02), eval merge theo id |
| Q4 | Baseline cho regression gate (FR-E04) lấy từ đâu? | Lần chạy đầu trên golden set = baseline; lưu vào `evals/baseline.json`, cập nhật tay khi cải thiện |
| Q5 | Bộ 50 golden case: tôi tự sinh từ ví dụ §2.1/§2.3 rồi user review, hay user cấp case thật? | Claude draft ~50 từ §2 + lịch sử dùng thật, **user review nhãn** trước khi chốt baseline |
| Q6 | `tool_id` đặt tên theo convention nào (vd `domain.action`)? | `domain.action` như §6.1 (`calendar.events.insert`, `wiki.read`) |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| Eval foundation build TRƯỚC proactive feature | Agent-eval review v4: không đo được = build trên cát; regression vô hình | Build feature trước: nhanh thấy kết quả nhưng không regression-check được → loại |
| Action class từ **registry**, không từ LLM | LLM gán nhầm dangerous→write là lỗ hổng an toàn (§6.1 [F3]) | LLM self-label: đơn giản nhưng không đáng tin cho safety gate → loại |
| Unregistered tool ⇒ `dangerous` (deny-by-default) | An toàn mặc định; tool mới phải khai báo có chủ đích | Default `read`: rủi ro side-effect ngầm → loại |
| JSONL append-only cho traces | Đơn giản, replayable, crash-safe theo dòng, không cần DB | SQLite: mạnh hơn nhưng overkill cho MVP single-user → để sau |
| Append-delta cho verdict patch (Q3 default) | Giữ append-only thuần, tránh corrupt khi rewrite | Rewrite-by-id: gọn file nhưng phá tính append-only → tránh |
| MVP chỉ *tính* routing_accuracy + misroute_rate | Đủ để gate routing change; metric khác cần dữ liệu thật chưa có | Tính hết 8 metric ngay: nhiều metric chưa có nguồn dữ liệu → định nghĩa trước, tính sau |

---

## 7. Definition of Done (RD scope = chỉ tài liệu, chưa code)

RD này được coi là xong khi:
- [ ] User approve scope 3 cấu phần (traces / golden+runner / registry) và 3 P0 exclusion chính.
- [ ] 6 Open Questions có default được confirm hoặc chỉnh.
- [ ] Chốt vị trí file (Q1) để SD/BD tiếp theo có path cụ thể.

→ Sau approve: chuyển sang **SD** (interface contract cho `log_trace`, `run_eval`, `classify`) rồi **BD** (step ≤ 2h, mỗi step có smoke test) theo `dev-approach/sdd-process.md`. **Chưa code trước khi RD+SD+BD được approve.**

---

*Eval Foundation — RD v1 | 2026-06-21 | opus-animus v4 Phase 1*
