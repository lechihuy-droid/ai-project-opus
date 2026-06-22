# BD — Build Plan: Eval Foundation → Logos/Rector → Proactive Daily Brief
**Date:** 2026-06-21
**Status:** 🟢 Done (2026-06-22) — S0–S16 complete; 54 pytest pass; eval gate PASS; live `run_brief.py` OK

> **Build log (2026-06-22):** Tất cả 17 step xong trong 1 mạch. Code do Codex (`codex exec`), Claude review + verify mỗi milestone. Commits: M1 `26dedbb`, M2 `8732b2a`, M3 `fb77642`, M4+M5+M6 (xem git log). Hotfix Claude: UTF-8 stdout cho `run_brief.py` (Windows cp1252). Known MVP gaps (follow-up): brief chưa cap top-N + rank dùng heuristic fallback (chưa bật LLM thật) + chưa wire user-profile.
**Ref:** [`RD-eval-foundation.md`](RD-eval-foundation.md), [`RD-proactive-mvp.md`](RD-proactive-mvp.md), [`SD-eval-foundation.md`](SD-eval-foundation.md), [`SD-opus-rector.md`](SD-opus-rector.md), [`SD-opus-logos.md`](SD-opus-logos.md), [`SD-proactive-brief.md`](SD-proactive-brief.md)
**Estimate:** ~22h (17 steps, mỗi step ≤2h)
**Chạy 1 mạch:** foundation → subsystem → brief hoạt động (pull-mode). Không dừng giữa milestone trừ khi smoke test fail.

---

## Routing — Ai làm step nào (CLAUDE.md §Model & Agent Routing)

| Owner | Loại step | Cơ chế |
|---|---|---|
| **Codex** | Implement code + test | `codex exec "<brief trong step>"` chạy từ repo root; Claude **review diff** sau, KHÔNG tự code |
| **Claude** | Spec, golden data, review, wire-up docs, handoff | Main session (Opus) |

> Quy ước: mỗi Codex step có sẵn **Codex brief** + **smoke test**. Sau mỗi step: chạy smoke test → pass thì Claude mark ✅ → step kế. Fail → Claude chẩn đoán, không để Codex tự ý đổi scope.

---

## Prerequisites (Gates)

- [ ] **Gate 1:** RD-eval-foundation + RD-proactive-mvp approved
- [ ] **Gate 2:** 4 SD approved (eval-foundation, opus-rector, opus-logos, proactive-brief)
- [ ] Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- [ ] Claude CLI (`claude.cmd -p`) hoạt động (session auth) — reuse pattern `opus-consilium/utils/llm.py`
- [ ] `codex` CLI sẵn sàng (`codex exec`)
- [ ] Chạy trên branch `claude/opus-animus-operating-model-ioy54l`

---

## Target Layout (Codex tạo dần)

```
opus-animus/
├── animus_core/        ← foundation: trace.py · registry.py · eval_runner.py · router.py · llm.py
├── ai/
│   ├── traces/                 (runtime)
│   └── action-registry.yaml
├── evals/              ← routing-goldens.jsonl · baseline.json · run_eval.py
├── opus-rector/rector/ ← tasks.py · proactive.py · outcome.py · lessons.py
├── opus-logos/logos/   ← rank.py · arbiter.py · decide.py · tune.py
├── primus/             ← brief.py (orchestrator) · providers.py (nexus/consilium adapters)
└── run_brief.py        ← CLI entry (pull-mode)
```

---

## Build Steps

### Step 0 — Verify assumptions (Claude) · 30m
**Mục tiêu:** chốt unknown trước khi Codex code.
- [ ] `TODO.md` parse được due/flag thế nào? (format hiện tại → field map cho `pull_due_tasks`)
- [ ] `opus-nexus/health/` có tồn tại data không? (nếu chưa → `today_context` degrade)
- [ ] Claude CLI reuse: import `opus-consilium/utils/llm.py` hay copy `animus_core/llm.py` tối giản? → **default: copy thin wrapper** (tránh cross-package import)
- [ ] `WEEKLY-PLAN.md` chưa tồn tại → tạo stub rỗng để Rector đọc không lỗi
**Smoke test:** `ls opus-animus/TODO.md opus-nexus/health/ 2>&1` + đọc 20 dòng TODO → xác nhận field.
**Output:** ghi quyết định vào đầu BD nếu khác default.

---

## Milestone 1 — Eval Foundation (Phase 1, build TRƯỚC)

### Step 1 — TraceLogger (Codex) · 90m
**Files:** tạo `animus_core/trace.py`, `animus_core/__init__.py`
**Codex brief:**
> Implement `log_trace(record: dict) -> None` và `patch_trace(id: str, patch: dict) -> None` theo `SD-eval-foundation.md §4`. Append-only JSON 1 dòng/record vào `opus-animus/ai/traces/{JST-date}.jsonl`. Validate đủ field + enum (raise ValueError nếu thiếu/sai). `patch_trace` append dòng delta `{"id":id,"patch":patch}`. Viết pytest: ghi 2 record + 1 patch → đọc lại merge-by-id đúng; record thiếu field → ValueError.
**Smoke test:** `python -m pytest opus-animus/animus_core/ -k trace -q` → pass; `ls opus-animus/ai/traces/` có file ngày.

### Step 2 — ActionRegistry (Codex) · 60m
**Files:** tạo `ai/action-registry.yaml`, `animus_core/registry.py`
**Codex brief:**
> Seed `ai/action-registry.yaml` với class cho: `wiki.read=read, brief.draft=draft, calendar.events.insert=write, file.delete=dangerous, telegram.send=write, shell.exec=dangerous` + các tool collect/wiki hiện có. Implement `classify(tool_id)->class` (đọc registry, cache in-memory) + `gate_for(class)->{free|requires_approval|requires_confirm}`. Unregistered → `dangerous` (deny-by-default), KHÔNG raise. pytest: known→đúng class; unknown→dangerous; gate mapping đúng.
**Smoke test:** `python -m pytest opus-animus/animus_core/ -k registry -q` → pass.

### Step 3 — Routing goldens (Claude) · 60m
**Files:** tạo `evals/routing-goldens.jsonl`
**Việc làm:**
- [ ] Draft ~50 case `{input, target_subsystem, note?, lang}` từ v4 §2.1/§2.3 + prefix-override §2.2, phủ đủ 7 subsystem, mix VI/EN.
- [ ] **User review nhãn** trước khi chốt (Gate).
**Smoke test:** `python -c "import json;[json.loads(l) for l in open('opus-animus/evals/routing-goldens.jsonl',encoding='utf-8')]"` → no error; ≥45 dòng.

### Step 4 — EvalRunner (Codex) · 90m
**Files:** tạo `animus_core/eval_runner.py`, `evals/run_eval.py`
**Codex brief:**
> Implement `run_eval(suite, goldens, traces=None, baseline=...)->report` theo `SD-eval-foundation.md §4`. Tính `routing_accuracy`, `misroute_rate`, bảng misroutes, confidence buckets. So `evals/baseline.json` → exit code 1 nếu accuracy < baseline. `--from-traces` tính misroute thật từ `user_verdict`. CLI `evals/run_eval.py --suite routing`. (Router adapter đến ở Step 5 — tạm mock router trả nhãn để test runner logic.) pytest: mock 10 case 8 đúng → accuracy 0.8; dưới baseline → exit 1.
**Smoke test:** `python -m pytest opus-animus/animus_core/ -k eval -q` → pass.

### Step 5 — Router adapter + baseline (Codex) · 90m
**Files:** tạo `animus_core/router.py`; cập nhật `evals/run_eval.py` dùng router thật; tạo `evals/baseline.json`
**Codex brief:**
> Adapt `opus-consilium/skills/intent_classifier.py` thành `route(user_input)->{target_subsystem, route_confidence}` map sang 7 subsystem v4 (NEXUS/CONSILIUM/LOGOS/RECTOR/LUCIDA/WIKI/INFRA) + tôn trọng prefix-override §2.2. Wire `run_eval` gọi router này. Chạy lần đầu trên goldens → ghi `baseline.json {routing_accuracy}`.
**Smoke test:** `python opus-animus/evals/run_eval.py --suite routing` → in accuracy + bảng + `RESULT: PASS`; `baseline.json` tồn tại.
> ✅ **Gate Milestone 1:** eval chạy được, có baseline. Mọi thay đổi routing/prompt sau này phải qua gate này.

---

## Milestone 2 — Opus Rector (execution brain)

### Step 6 — tasks.py: pull_due_tasks (Codex) · 90m
**Files:** tạo `opus-rector/rector/tasks.py` (+ `__init__.py`)
**Codex brief:**
> `pull_due_tasks(date, profile)->list[task]` theo `SD-opus-rector.md §4`. Đọc `TODO.md`+`WEEKLY-PLAN.md` (read-only), filter due≤window | flag this_week | relevant goal(profile). Thiếu file → trả `[]` + warn (degrade). task dict: id,title,source,due,flag,goal_ref. pytest với TODO.md mẫu.
**Smoke test:** `python -c "from opus_rector.rector.tasks import pull_due_tasks; print(pull_due_tasks('2026-06-21', {}))"` → list (có thể rỗng), không lỗi.

### Step 7 — proactive.py: lifecycle + single-writer store (Codex) · 90m
**Files:** tạo `opus-rector/rector/proactive.py`
**Codex brief:**
> Theo `SD-opus-rector.md §4` + **DL-2026-06-21-01**: `save_proactive_set(date,items)`, `get_proactive_set(date)` (read API cho Nexus), `update_proactive_state(item_id,state)`, `exclude_dismissed(date)`. Store `opus-rector/proactive/{date}.json` — **Rector là single writer**. Validate item schema §3.6 (requires_approval=True). pytest: save→get roundtrip; dismiss→exclude_dismissed loại item đó; corrupt json→backup + set mới.
**Smoke test:** `python -m pytest opus-rector/ -k proactive -q` → pass.

### Step 8 — outcome.py + lessons.py (Codex) · 75m
**Files:** tạo `opus-rector/rector/outcome.py`, `opus-rector/rector/lessons.py`
**Codex brief:**
> `record_engagement(item_id, signal)` (weak) + `record_outcome(item_id)->done|not_done` (từ TODO completion diff, KHÔNG từ click) — tách biệt (§5 [F5]). `log_lesson(correction)` append `opus-rector/lessons.md`, cap ≤30 (merge/retire yếu nhất). pytest: engagement≠outcome lưu riêng; lessons thứ 31 trigger retire.
**Smoke test:** `python -m pytest opus-rector/ -k "outcome or lessons" -q` → pass.

---

## Milestone 3 — Opus Logos (strategy brain)

### Step 9 — rank.py (Codex) · 90m
**Files:** tạo `opus-logos/logos/rank.py` (+ `__init__.py`)
**Codex brief:**
> `rank(items, profile, context)->ranked_items` theo `SD-opus-logos.md §4`. 1 call Claude CLI (reuse `animus_core/llm.py`) với prompt ràng buộc goal-alignment + energy/calendar + precedence; parse JSON; fallback heuristic deterministic nếu parse lỗi (retry 1x). Mỗi item thêm score/priority/rank_reason. pytest với mock LLM.
**Smoke test:** `python -m pytest opus-logos/ -k rank -q` → pass.

### Step 10 — arbiter.py: conflict + precedence (Codex) · 90m
**Files:** tạo `opus-logos/logos/arbiter.py`
**Codex brief:**
> `arbitrate(ranked_items)->(resolved, tradeoff_notes)` theo `SD-opus-logos.md §4`. PRECEDENCE cố định `["safety/health","hard_deadline","goal_priority","preference"]`. Phát hiện cặp mâu thuẫn → giữ item thắng + drop/hạ item thua + tradeoff_note. **Brief không được chứa 2 item mâu thuẫn.** pytest: pair "push deadline"⨯"rest recovery" → giữ health + 1 tradeoff.
**Smoke test:** `python -m pytest opus-logos/ -k arbiter -q` → pass.

### Step 11 — decide.py + tune.py (Codex) · 75m
**Files:** tạo `opus-logos/logos/decide.py`, `opus-logos/logos/tune.py`
**Codex brief:**
> `decide(question, context)->decision` append `DECISION-LOG.md` (id,date,question,decision,rationale,alternatives); I/O lỗi→raise. `tune(outcome_signals)->rules` cập nhật `opus-logos/ranking-rules.md` (≤30, weight outcome>engagement, no fine-tuning). pytest: decide ghi entry; tune cap rules.
**Smoke test:** `python -m pytest opus-logos/ -k "decide or tune" -q` → pass; `DECISION-LOG.md` có entry test (rồi xóa).

---

## Milestone 4 — Context providers (Nexus/Consilium adapters)

### Step 12 — providers.py (Codex) · 90m
**Files:** tạo `primus/providers.py` (+ `__init__.py`)
**Codex brief:**
> `nexus_context(date)->{health_summary, calendar_today}` đọc `opus-nexus/health/` + WEEKLY-PLAN; thiếu calendar→`None` (RD Q4, KHÔNG bịa). `consilium_info(active_goals)->list[info_item]` đọc daily intel logs của Consilium, **relevance gate**: chỉ item khớp goal; rỗng được phép (§3.7). pytest: thiếu data→degrade; info rỗng→[].
**Smoke test:** `python -c "from primus.providers import nexus_context; print(nexus_context('2026-06-21'))"` → dict, không lỗi.

---

## Milestone 5 — Primus orchestrator + surface

### Step 13 — brief.py: controller loop wiring (Codex) · 120m
**Files:** tạo `primus/brief.py`
**Codex brief:**
> `generate_brief(intent_packet)->(brief, items)` theo `SD-proactive-brief.md §2,§4`. Controller loop §8.1 (max_steps=6, no-progress 2 lần→stop): chain `Rector.pull_due_tasks → providers.nexus_context → providers.consilium_info → Logos.rank → Logos.arbitrate → assemble`. Mỗi step `log_trace`. Mỗi suggested action gắn class qua `registry.classify`; write/dangerous⇒requires_approval (KHÔNG tự chạy). Lưu qua `Rector.save_proactive_set`. pytest mock subsystem: trả brief+items; trace ghi mỗi step; action write→requires_approval.
**Smoke test:** `python -m pytest primus/ -k brief -q` → pass; `ai/traces/` có record.

### Step 14 — run_brief.py CLI + render + anti-annoyance (Codex) · 90m
**Files:** tạo `opus-animus/run_brief.py`
**Codex brief:**
> CLI pull-mode: `python run_brief.py` → gọi `generate_brief` → render §3.5 (greeting + "Bối cảnh hôm nay" + "Primus đề xuất" đánh số + action bar tiếng Việt). Rate limit ≤1 morning/ngày (check proactive store); pull lần 2 cùng ngày không item mới → in "Không có gì mới cần ưu tiên thêm hôm nay." (NFR-04/05). 
**Smoke test:** `python opus-animus/run_brief.py` → brief in ra; chạy lần 2 → không nhân bản, ra câu "không có gì mới".

---

## Milestone 6 — Integration + wire-up

### Step 15 — End-to-end integration test (Claude điều phối + Codex fix) · 90m
**Test cases:**
- [ ] Happy: `run_brief.py` → brief có ≥1 đề xuất xếp ưu tiên + action bar
- [ ] Conflict: seed task deadline + health ngủ kém → brief chỉ 1 đề xuất + trade-off (không mâu thuẫn)
- [ ] Empty: không task/info relevant → "không có gì mới", không bịa nudge
- [ ] 2nd pull cùng ngày → không duplicate (idempotent)
- [ ] Approval gate: item có action write → `requires_approval=true`, không tự chạy
- [ ] Eval gate: `evals/run_eval.py --suite routing` → PASS (không regress baseline)
- [ ] Traces: mỗi step có record trong `ai/traces/`
**Estimate:** 90m

### Step 16 — Wire-up docs + handoff (Claude) · 45m
- [ ] Thêm pointer ngắn trong `AGENTS.md` + `ai/status.md` trỏ tới v4 + subsystem mới (v4 Phase 1)
- [ ] Cập nhật status: `opus-logos/ai/status.md` + `opus-rector/ai/status.md` → 🟢; `SA-opus-animus-v2.md §10` build-status
- [ ] Đánh dấu các step ✅ trong BD này
- [ ] `/handoff`
**Smoke test:** đọc lại status → khớp thực tế; không doc nào còn 🟡 sai.

---

## Rollback Plan

Branch isolated (`claude/opus-animus-operating-model-ioy54l`), thuần additive:
- Fail giữa chừng → `git restore`/xóa file step đó; không có DB/migration.
- Runtime artifacts (`ai/traces/*.jsonl`, `opus-rector/proactive/*.json`) là dữ liệu sinh ra — xóa an toàn.
- Mỗi milestone là 1 commit → revert theo milestone nếu cần.

---

## Checklist Trước Khi Done

- [ ] Tất cả smoke tests pass (Step 1–14) + integration (Step 15)
- [ ] Mọi P0 FR: RD-eval-foundation (T/E/R) + RD-proactive (FR-01..19) có implementation
- [ ] P0 NFR không vi phạm: suggestion-only (0 auto-write), append-only traces, deny-by-default, idempotent, rate-limit
- [ ] Action class luôn từ registry, không từ LLM
- [ ] Single-writer: chỉ Rector ghi `opus-rector/proactive/`
- [ ] Không hardcoded credentials (.env nếu cần)
- [ ] Eval baseline không regress
- [ ] BD steps marked ✅; SA build-status updated

---

## Thứ tự chạy 1 mạch (tóm tắt)

```
S0 verify → [M1] S1 trace → S2 registry → S3 goldens(Claude) → S4 runner → S5 router+baseline ✅gate
        → [M2] S6 tasks → S7 proactive → S8 outcome/lessons
        → [M3] S9 rank → S10 arbiter → S11 decide/tune
        → [M4] S12 providers
        → [M5] S13 orchestrator → S14 CLI
        → [M6] S15 integration → S16 wire-up/handoff
```

---

*Proactive Foundation — BD v1 | 2026-06-21 | opus-animus v4 Phase 1+2*
