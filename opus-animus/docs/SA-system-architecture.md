# SA — Opus System Architecture (consolidated)
**Date:** 2026-06-24
**Status:** 🟢 Current — **doc SA duy nhất** (gộp từ: SA v1 personal-agent 2026-04-28, SA v2 opus-animus 2026-06-21, SA ecosystem 2026-06-24)
**Governance:** [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md) · chi tiết interface: các `SD-*.md`

> SA = bản đồ "có gì / ở đâu / nối thế nào" cho **toàn hệ sinh thái Opus** (repo `ai-project-opus` + sibling `opus-vita`). Không phải spec implementation. Mỗi workspace con có CLAUDE.md/RD/SD riêng (xem §9 pointer).

---

# PHẦN I — Toàn cảnh hệ sinh thái

## 1. Bốn tầng

| Tầng | Là gì | Thành phần |
|---|---|---|
| **A. Agent core (Primus)** | Bộ não AI điều phối (v4) | `animus_core/`+`primus/` · `opus-consilium/` · `opus-logos/` · `opus-rector/` |
| **B. Vertical / workspace sản phẩm** | Năng lực theo lĩnh vực | **`opus-actio/`** (tài chính) · `opus-lucida/` (content) · `apps/` (học) |
| **C. Nexus — interface & life** | Mặt tiếp xúc + sức khỏe/đời sống | `health-app/` · `health-data/` · `workout-data/` · `nexus-commands/` · sibling `opus-vita/` |
| **D. Shared + data planes** | Dùng chung + nguồn dữ liệu | `opus-fabrica/` · `SDD-toolkit/` · `html-kit/` · `user-profile/` · `ai/traces/` · `finance-data/` |

## 2. Bản đồ

```
                                   ┌─────────────────────────────┐
        người dùng  ──────────────▶│   PRIMUS (opus-animus core) │  điều phối, đề xuất — không tự thực thi
                                   │  animus_core + primus       │
                                   └───┬───────┬───────┬─────────┘
                  ┌────────────────────┘       │       └────────────────────┐
                  ▼                            ▼                            ▼
        ┌──────────────┐            ┌──────────────────┐          ┌──────────────────┐
        │  CONSILIUM   │            │  LOGOS · RECTOR  │          │   NEXUS (life)   │
        │ information  │            │ strategy · exec  │          │ health-app +     │
        │ wiki/intel   │            │ rank/arbiter/task│          │ health/workout + │
        └──────────────┘            └──────────────────┘          │ nexus-commands   │
                  │  Primus định tuyến tới vertical khi cần        └──────────────────┘
       ┌──────────┴───────────┬───────────────────────┐
       ▼                      ▼                       ▼
 ┌──────────┐          ┌──────────────┐        ┌──────────────┐
 │  ACTIO   │          │   LUCIDA     │        │    apps/     │
 │ tài chính │          │  content     │        │ jlpt · pmp   │
 │ US+JP đầu tư│        │ JLPT/video   │        │ (học)        │
 └──────────┘          └──────────────┘        └──────────────┘

 Shared: opus-fabrica (markitdown + agent dùng chung) · SDD-toolkit · html-kit
 Data planes: user-profile/ · ai/traces/ · health-data+workout-data · finance-data/personal-finance · opus-rector/proactive
```

---

# PHẦN II — Agent core (Primus)

## 3. Primus + 7 subsystem (v4)

Người dùng nói với **Primus** (persona hợp nhất — *coordination*, không phải 1 agent). Sau lưng: 4 brain + 3 capability.

```
Primus = Nexus + Consilium + Logos + Rector     (mặt hội thoại)
Capabilities Primus gọi: Lucida · Wiki · Infra
```

| Subsystem | Vai trò | Folder |
|---|---|---|
| **Nexus** | Interface: chat, dashboard, health/life | health-app + health/workout-data + nexus-commands |
| **Consilium** | Information: collect/filter/synthesize/route | `opus-consilium/` |
| **Logos** | Strategy: priority, decision, rank, arbiter | `opus-logos/` |
| **Rector** | Execution: task, TODO, proactive lifecycle | `opus-rector/` |
| **Lucida** | Content engine: JLPT/video | `opus-lucida/` |
| **Wiki** | Long-term memory | `opus-consilium/personal-wiki/` (Module C) |
| **Infra** | Scheduler/runtime/automation | Task Scheduler + `run_push_brief.py` |

*Nexus connects · Consilium knows · Logos thinks · Rector plans · Lucida creates · Wiki remembers · Infra runs · Primus speaks for them all — proposes, never imposes.*

## 4. Diagram core

```
        User ──▶ PRIMUS (animus_core + primus): Intent Packet → Controller Loop (§8.1)
                  ├──▶ NEXUS    interface + health
                  ├──▶ CONSILIUM information + wiki/intel
                  ├──▶ LOGOS    rank/arbiter ──▶ DECISION-LOG.md
                  └──▶ RECTOR   task/proactive ──▶ opus-rector/proactive/
        every loop step ──▶ ai/traces/ (L9) ──▶ evals/ (eval framework)
        every action    ──▶ ai/action-registry.yaml (deterministic gate)
```

## 5. Invocation & routing (v4 §2, §8)

```
No prefix  → router suy ra target_subsystem từ intent (keyword hints §2.3)
Prefix     → "Logos:" / "Rector:" / "Consilium:" … ép route
```
Mỗi message (user/proactive_trigger) → **intent_packet** (origin, intent_type, target_subsystem, action_type, route_confidence, plan[], step_index) trước khi deep-load. Controller loop chạy plan→act→observe→iterate, max_steps; single-hop kết thúc sau 1 vòng.

## 6. Data flow — Daily Brief (pull + push)

```
1. trigger (pull "hôm nay làm gì" | push 07:00 JST) → intent_packet(expected=proactive_item set)
2. RECTOR    pull_due_tasks(date, profile)        ← TODO.md, WEEKLY-PLAN.md
3. NEXUS     today_context(date)                  ← health-data/ + workout-data/ (primus/vita.py)
4. CONSILIUM relevant_info(active_goals)          ← intel logs (primus/consilium.py, relevance-gated)
5. ACTIO     finance_signals(active_goals)         ← opus-actio/data/_local/signals/{date}.json (read-only, finance-goal-gated)
6. user-profile/ bias ranking
7. LOGOS     rank() + arbitrate()                 → resolved + trade-off (precedence)
8. PRIMUS    assemble brief (§3.5), top-N, mỗi item requires_approval
9. action-registry gắn class; write/dangerous ⇒ approval
10. RECTOR    save_proactive_set() → opus-rector/proactive/{date}.json (single writer)
11. trace mỗi step → ai/traces/{date}.jsonl ; push → Telegram (run_push_brief.py)
```
Chi tiết: [`SD-proactive-brief.md`](SD-proactive-brief.md), [`SD-opus-logos.md`](SD-opus-logos.md), [`SD-opus-rector.md`](SD-opus-rector.md), [`RD-push-mode.md`](RD-push-mode.md).

## 7. Boundaries (owns / reads) + single-writer

| Subsystem | OWNS (ghi) | READS |
|---|---|---|
| Nexus | health-app + health/workout-data, dashboard | proactive (qua Rector API) |
| Consilium | `opus-consilium/` (raw, intel, personal-wiki qua Module C) | RSS/web, goals |
| Logos | `DECISION-LOG.md`, `opus-logos/ranking-rules.md` | user-profile, outcome (Rector), Nexus ctx |
| Rector | `opus-rector/proactive/`, `opus-rector/lessons.md` | TODO.md, WEEKLY-PLAN.md, user-profile |
| Actio | `opus-actio/data/_local/` (finance.db + signals export) | finance raw (local-only) |
| Wiki | `personal-wiki/` (chỉ Module C ghi) | raw/ |

**Single-writer:** mỗi store đúng 1 writer. Wiki = Module C; Proactive = Rector (DL-2026-06-21-01: deviation có chủ đích khỏi v4 §7.2). Cross-subsystem đọc qua **API**, không chạm file của nhau.

## 8. Memory layers + Source-of-Truth + Eval/Safety

**Memory (L0→L9, load top-down):**
```
L0 AGENTS.md · L1 ai/status.md · L2 ai/handoff-*,sessions · L3 TODO.md,WEEKLY-PLAN.md
L4 DECISION-LOG.md · L5 opus-*/ai/status.md · L6 personal-wiki/ · L7 health/workout-data
L8 user-profile/ (goals/prefs/constraints) · L9 ai/traces/ (append-only, chỉ eval đọc)
```

**Source-of-Truth:**
| Thông tin | SoT |
|---|---|
| Global rules / snapshot | `AGENTS.md` / `ai/status.md` |
| Task index / weekly | `TODO.md` / `WEEKLY-PLAN.md` |
| Strategic decisions | `DECISION-LOG.md` |
| Proactive items + state | `opus-rector/proactive/` ⚠️ deviation (DL-2026-06-21-01) |
| Research / health / goals | `opus-consilium/` · `health-data/`+`workout-data/` · `user-profile/` |
| Traces / eval / knowledge | `ai/traces/`,`evals/` · `personal-wiki/` |

**Eval & safety (v4 §6.1, §8.2):**
```
Traces (L9)     ai/traces/{date}.jsonl   — 1 record/loop step, replayable
Golden set      evals/routing-goldens.jsonl (51) + baseline.json — regression gate
Action Registry ai/action-registry.yaml — class từ registry, KHÔNG từ LLM
                read=free · draft=free · write=approval · dangerous=confirm · unregistered⇒dangerous
```
Model **đề xuất**; registry **gate**; mọi external write cần approval; proactive suggestion-only. Chi tiết: [`SD-eval-foundation.md`](SD-eval-foundation.md).

---

# PHẦN III — Verticals & workspaces

## 4.1 Opus Actio — tài chính / đầu tư ⭐
`opus-animus/opus-actio/` — *"actio: cổ phần / cổ phiếu"*. Đầu tư cá nhân **chứng khoán Mỹ + Nhật** + wealth/tax.

```
opus-actio/
├── plugins/   ← Anthropic financial-services (vendored)
│   ├── equity-research/    earnings·thesis·screen·model-update·morning-note·sector·catalysts
│   ├── financial-analysis/ DCF·comps·3-statement·audit-xls
│   └── wealth-management/  client-report·rebalance·TLH·financial-plan·proposal
├── skills/    ← custom JP: edinet-fetcher · jp-tax-account (NISA/特定口座/iDeCo) · jp-fiscal-calendar
├── data/      ← portfolio.schema.md + portfolio.example.json (+ finance.db gitignored)
└── docs/, ai/status.md
```
**Surface:** slash skills `actio-*`: morning · portfolio · stock · tax · networth · spending · goals · ips · retire · review · house.
**Data:** finance thật (Layer A) → `finance.db` (SQLite, gitignored); `finance-data/`+`personal-finance/` ở root.
**Disclaimer:** draft analyst work, **không** phải investment advice.
**Với Primus:** vertical Primus có thể route tới (intent tài chính); là nguồn brief mảng tiền (tương lai — **chưa wire** vào daily brief).

## 4.2 Opus Lucida — content / monetization
`opus-animus/opus-lucida/` — sản xuất nội dung (JLPT/video), workspace thương mại hóa. 🟡 Partial. Docs riêng: `opus-lucida/10-project-architecture-map.md`, `11-current-operating-flow.md`, `docs/SD-beta-architecture.md`.

## 4.3 apps/ — học độc lập
`jlpt-n2-slides` (slide N2) · `pmp-quiz` (retired sau khi thi 2026-06).

---

# PHẦN IV — Nexus (interface & life)

`Nexus` của v4 hiện rải ở repo root (chưa gom thành `opus-nexus/`):

| Thành phần | Vai trò |
|---|---|
| `health-app/` | Dashboard sức khỏe (UI) — app "vita" |
| `health-data/{date}.json` | Log sức khỏe (sleep/kcal/protein/steps/weight) — **đã wire brief** qua `primus/vita.py` |
| `workout-data/{date}.json` | Log tập (sessions/type/duration/streak) — đã wire brief |
| `nexus-commands/` | NL → Google Calendar/Tasks: commit JSON → GitHub Actions |
| sibling `opus-vita/` | Bản app health tách riêng (frontend/deploy) |

---

# PHẦN V — Shared layers + data

| Thành phần | Vai trò |
|---|---|
| `opus-fabrica/` | Agent/tool/skill **dùng chung** nhiều workspace (vd `markitdown-agent`). Không chứa SoT business |
| `SDD-toolkit/` | Phương pháp SDD (RD/SD/BD templates, checklist, scaffold) |
| `html-kit/` | Bộ HTML/CSS/JS self-contained cho output |
| `user-profile/` | goals/preferences/constraints (L8) — bias ranking + relevance |
| `ai/traces/` | Run traces (L9) — eval/observability |
| `metagpt-ai-company/` | Thử nghiệm multi-agent (insighthub MVP) — tách biệt, ngoài luồng Primus |

---

# PHẦN VI — Build status & quyết định

## Build status (toàn ecosystem)

| Khối | Trạng thái |
|---|---|
| Primus core (eval / Logos / Rector / brief pull+push / controller loop) | ✅ Built MVP (84 tests, eval gate PASS) |
| User-profile (goal-aware ranking + relevance) | ✅ Wired |
| Nexus health/workout → brief | ✅ Wired (`vita.py`); calendar qua nexus-commands |
| Consilium intel → brief | ✅ Wired + verified vs real review shape (`consilium.py`); logs gitignored → chạy từ main checkout hoặc set `OPUS_CONSILIUM_LOGS` |
| Push-mode (Infra → Telegram) | ✅ Built MVP one-way; unattended dùng heuristic ranker (`--use-llm` để bật LLM) |
| Consilium (collector/wiki/intel/FDE) | ✅ Running |
| **Actio** (đầu tư US+JP, wealth, JP tax) | ✅ Vận hành qua skills + ✅ wired vào daily brief (read-only signals export, finance-goal-gated) |
| Lucida (content) | 🟡 Partial |
| apps (jlpt-n2-slides) | 🟡 Partial · pmp-quiz retired |
| intent-router (full), Telegram 2-way | ⛔ Not built (router *eval* có; brief dùng fixed plan; push one-way) |

## Technology decisions

| Decision | Choice | Reason |
|---|---|---|
| LLM engine | Claude CLI (`claude.cmd -p`) | Session auth, zero API key, đã bỏ Groq (2026-05-20) |
| Storage | Flat files (.md/.json/.jsonl) + SQLite (finance.db) | Diff-friendly, LLM-readable, no infra |
| Traces | JSONL append-only | Replayable, crash-safe theo dòng |
| Action gating | Registry YAML deterministic | Safety không phụ thuộc LLM self-label |
| Scheduling | Windows Task Scheduler | Native, no daemon |
| Single-writer per store | enforced | Wiki (Module C), Proactive (Rector) |

---

## 9. Pointer tới doc từng project

- Agent core: [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md), SD: `SD-eval-foundation/opus-logos/opus-rector/proactive-brief.md`, RD: `RD-eval-foundation/proactive-mvp/push-mode.md`, BD: `BD-proactive-foundation.md`
- Actio: `opus-actio/CLAUDE.md`, `USAGE.md`, `data/portfolio.schema.md`
- Lucida: `opus-lucida/docs/SD-beta-architecture.md`, `10-project-architecture-map.md`
- Consilium: `opus-consilium/CLAUDE.md`, `docs/SD-system-design.md`
- Nexus: `health-app/roadmap.md`, `nexus-commands/README.md`

---

*Opus System Architecture — consolidated v3.0 | 2026-06-24 | thay thế SA v1 + v2 + ecosystem*
