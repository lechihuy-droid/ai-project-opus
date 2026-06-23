# SA — System Architecture: Opus Animus (v2, v4-aligned)
**Date:** 2026-06-21
**Status:** 🟢 Current
**Supersedes:** [`SA-system-architecture.md`](SA-system-architecture.md) (v1, 2026-04-28 — "personal-agent"/Groq era, pre-naming)
**Governance ref:** [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md)

> SA = bức tranh kiến trúc tổng. Governance/luật ở Operating Model v4; chi tiết interface ở các `SD-*`. Doc này là bản đồ, không phải spec implementation.

---

## 1. Tổng Quan — Primus + 7 Subsystem

Người dùng nói chuyện với **Primus** (persona hợp nhất, là *coordination* chứ không phải 1 agent). Sau lưng Primus là 4 brain phối hợp + 3 capability:

```
Primus = Nexus + Consilium + Logos + Rector        (conversational face)
Capabilities Primus gọi: Lucida · Wiki · Infra
```

| Subsystem | Vai trò (1 câu) | Trạng thái build |
|---|---|---|
| **Nexus** | Interface: chat, dashboard, health/life | 🟡 Dashboard/health chạy (Consilium-hosted) |
| **Consilium** | Information brain: collect/filter/synthesize/route | ✅ Running (collector, daily/weekly, wiki, FDE) |
| **Logos** | Strategy brain: priority, decision, rank, arbiter | 🟡 Scaffold (SD draft) |
| **Rector** | Execution brain: task, TODO, proactive lifecycle | 🟡 Scaffold (SD draft) |
| **Lucida** | Content engine: JLPT/video/content | 🟡 Partial (pipeline tồn tại) |
| **Wiki** | Long-term memory (personal-wiki) | ✅ Running (Module C) |
| **Infra** | Scheduler/runtime/automation | 🟡 Task Scheduler jobs |

Memory phrase: *Nexus connects · Consilium knows · Logos thinks · Rector plans · Lucida creates · Wiki remembers · Infra runs · Primus speaks for them all — proposes, never imposes.*

---

## 2. Architecture Diagram

```
                          ┌────────────────────────────┐
        User  ───────────▶│           PRIMUS           │  (coordination, not an agent)
   "Primus, ...?"         │   Intent Packet → Controller Loop (§8.1)
                          └──────┬──────────────────────┘
                 ┌───────────────┼───────────────┬───────────────┐
                 ▼               ▼               ▼               ▼
            ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
            │  NEXUS  │    │CONSILIUM │    │  LOGOS  │    │ RECTOR  │
            │interface│    │information│    │strategy │    │execution│
            │+health  │    │+wiki/intel│    │rank/arb │    │task/proc│
            └────┬────┘    └────┬─────┘    └────┬────┘    └────┬────┘
                 │ render        │ knowledge      │ rank/decide   │ tasks/state
                 │               ▼                │               │
                 │        personal-wiki/ (Wiki)   │               │
                 │                                ▼               ▼
                 │                         DECISION-LOG.md   opus-rector/proactive/
                 └──────────────── capabilities ─────────────────┘
                        Lucida (content) · Infra (scheduler)
                                         │
                 every loop step ───────▶ ai/traces/ (L9) ──▶ evals/ (eval framework)
                 every action ──────────▶ ai/action-registry.yaml (deterministic gate)
```

---

## 3. Invocation & Routing (v4 §2, §8)

```
No prefix  → router suy ra target_subsystem từ intent (keyword hints §2.3)
Prefix     → "Logos:" / "Rector:" / "Consilium:" ... ép route, bỏ qua suy luận
```

Mỗi message (user hoặc proactive_trigger) → **intent_packet** (origin, intent_type, target_subsystem, action_type, route_confidence, plan[], step_index) **trước khi** deep-load context. Controller loop (§8.1) chạy plan→act→observe→iterate với max_steps; single-hop kết thúc sau 1 vòng.

---

## 4. Data Flow — Worked Example: Daily Brief (pull-mode)

```
1. "Primus, hôm nay làm gì?" → intent_packet(origin=user, expected=proactive_item set)
2. RECTOR    pull_due_tasks(date, profile)     ← TODO.md, WEEKLY-PLAN.md
3. NEXUS     today_context(date)               ← opus-nexus/health/, calendar
4. CONSILIUM relevant_info(active_goals)       ← daily intel / wiki (relevance-gated)
5. user-profile/ bias ranking
6. LOGOS     rank() + arbitrate()              → resolved + trade-off (§3.3 precedence)
7. PRIMUS    assemble brief (§3.5), mỗi item requires_approval
8. action-registry gắn class; write/dangerous ⇒ approval
9. RECTOR    save_proactive_set() → opus-rector/proactive/{date}.json (single writer)
10. trace mỗi step → ai/traces/{date}.jsonl
11. user accept/snooze/dismiss → state + engagement/outcome signal (§5)
```

Chi tiết: [`SD-proactive-brief.md`](SD-proactive-brief.md). Subsystem: [`SD-opus-logos.md`](SD-opus-logos.md), [`SD-opus-rector.md`](SD-opus-rector.md).

---

## 5. Component Boundaries — Owns / Reads

| Subsystem | OWNS (ghi) | READS |
|---|---|---|
| Nexus | `opus-nexus/health/`, `life/`, dashboard | proactive (qua Rector API), wiki |
| Consilium | `opus-consilium/` (raw, intel logs, personal-wiki via Module C) | RSS/web, goals |
| Logos | `DECISION-LOG.md`, `opus-logos/ranking-rules.md` | user-profile, outcome signal (Rector), Nexus context |
| Rector | `opus-rector/proactive/`, `opus-rector/lessons.md` | TODO.md, WEEKLY-PLAN.md, user-profile |
| Wiki | `personal-wiki/` (chỉ Module C ghi) | raw/ |
| Infra | scheduler jobs | triggers |

**Luật single-writer:** mỗi store có đúng 1 writer. Wiki: chỉ Module C. Proactive: chỉ Rector (xem `DECISION-LOG.md` DL-2026-06-21-01 — deviation có chủ đích khỏi v4 §7.2). Cross-subsystem đọc qua **API**, không chạm file của nhau.

---

## 6. Memory Layers (v4 §7.1 — load top-down, không deep-load trước routing)

```
L0 Global Law          AGENTS.md
L1 Routing State       ai/status.md (thin map)
L2 Session Continuity  ai/handoff-*.md, ai/sessions/
L3 Task/Portfolio      TODO.md, WEEKLY-PLAN.md
L4 Decisions           DECISION-LOG.md
L5 Subsystem Memory    opus-*/ai/status.md
L6 Long-term Knowledge personal-wiki/
L7 Personal/Health     opus-nexus/health/, life/
L8 User Profile        user-profile/ (goals/preferences/constraints)
L9 Run Traces          ai/traces/ (append-only; chỉ eval đọc)
```

---

## 7. Source-of-Truth Map (v4 §7.2 + deviation)

| Thông tin | Source of truth |
|---|---|
| Global rules | `AGENTS.md` |
| Global snapshot | `ai/status.md` |
| Master task index | `TODO.md` |
| Weekly focus | `WEEKLY-PLAN.md` |
| Strategic decisions | `DECISION-LOG.md` |
| Proactive items + state | `opus-rector/proactive/` ⚠️ *deviation khỏi v4 (`opus-nexus/proactive/`) — xem DL-2026-06-21-01* |
| Research/information | `opus-consilium/` |
| Health/life | `opus-nexus/health/`, `life/` |
| User goals/prefs | `user-profile/` |
| Run traces / eval | `ai/traces/`, `evals/` |
| Long-term knowledge | `personal-wiki/` |

---

## 8. Eval, Safety & Action Gating (v4 §6.1, §8.2)

```
Traces (L9)        ai/traces/YYYY-MM-DD.jsonl   — 1 record/loop step, replayable
Golden set         evals/routing-goldens.jsonl  — ~50 case, regression gate
Metrics            routing_accuracy, misroute_rate, proactive_precision, ... (§8.2)
Action Registry    ai/action-registry.yaml      — class từ registry, KHÔNG từ LLM
                   read=free · draft=free · write=approval · dangerous=confirm
                   unregistered ⇒ dangerous (deny-by-default)
```

Nguyên tắc: model **đề xuất**; registry **gate**; mọi external write cần approval; suggestion-only cho proactive. Chi tiết: [`SD-eval-foundation.md`](SD-eval-foundation.md).

---

## 9. Storage Layout (mục tiêu v4)

```
opus-animus/
├── AGENTS.md  ai/status.md  TODO.md  WEEKLY-PLAN.md  DECISION-LOG.md
├── ai/
│   ├── traces/                 ← L9 run traces (append-only)
│   ├── action-registry.yaml    ← deterministic action class
│   └── routing/intent-router.md (Phase 1)
├── evals/                      ← routing-goldens.jsonl + baseline.json
├── user-profile/               ← goals / preferences / constraints (L8)
├── opus-nexus/                 ← interface + health/life (+ render proactive via Rector API)
├── opus-consilium/             ← information brain (running) + personal-wiki/ (Wiki)
├── opus-logos/                 ← strategy brain (scaffold)
│   └── proactive? NO — owned by Rector
├── opus-rector/                ← execution brain (scaffold)
│   └── proactive/              ← proactive item-set + state (single writer)
└── opus-lucida/                ← content engine
```

---

## 10. Build Status (honest)

| Layer | Status |
|---|---|
| Consilium (collect/intel/wiki/FDE) | ✅ Running |
| Wiki (Module C) | ✅ Running |
| Infra (Task Scheduler) | 🟡 Jobs exist |
| Lucida | 🟡 Partial |
| Nexus (dashboard/health) | 🟡 Partial |
| **Eval foundation** (traces/golden/registry) | ✅ Built (eval gate PASS) |
| **Logos / Rector** | ✅ Built MVP |
| **Proactive brief** (pull-mode) | ✅ Built MVP (`run_brief.py`, live OK) |
| Controller loop | ✅ Built (`primus/brief.py`, 6-step trace) |
| **User-profile** (goals/prefs/constraints) | ✅ Wired (`user-profile/`, goal-aware ranking + relevance) |
| **Nexus ← health/workout** | ✅ Wired (`primus/vita.py` ← `health-data/` + `workout-data/`) |
| **Consilium intel → brief** | ✅ Wired (`primus/consilium.py`, goal relevance gate; degrades until intel logs exist) |
| **Push-mode** (Infra → Telegram) | ✅ Built MVP one-way (`run_push_brief.py`; needs `.env` creds + scheduler) |
| intent-router (full), Telegram 2-way | ⛔ Not built (router *eval* exists; brief uses fixed plan; push is one-way) |
| Total tests | 78 pytest pass |

---

## 11. Technology Decisions (kế thừa + v4)

| Decision | Choice | Reason |
|---|---|---|
| LLM engine | Claude CLI (`claude.cmd -p`) | Session auth, zero API key, đã migrate khỏi Groq (2026-05-20) |
| Storage | Flat files (.md/.json/.jsonl) | Diff-friendly, LLM-readable, no infra |
| Traces | JSONL append-only | Replayable, crash-safe theo dòng |
| Action gating | Registry YAML deterministic | Safety không phụ thuộc LLM self-label |
| Scheduling | Windows Task Scheduler | Native, no daemon |
| Single-writer per store | enforced | Wiki (Module C), Proactive (Rector) |

---

*Opus Animus — SA v2.0 | 2026-06-21 | aligned to Operating Model v4*
