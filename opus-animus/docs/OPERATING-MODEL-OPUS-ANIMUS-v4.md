# Operating Model — Opus Animus v4

**Date:** 2026-06-21  
**Status:** Draft / Planning  
**Supersedes:** [`OPERATING-MODEL-OPUS-ANIMUS-v3.1.md`](OPERATING-MODEL-OPUS-ANIMUS-v3.1.md)  
**Scope:** Governance, naming, routing, memory split, proactive behavior, and capability completeness for `opus-animus/`  
**Do not implement directly from this file without updating the relevant RD/BD or task files.**

---

## 0. What v4 Adds Over v3.1

v4 keeps the entire v3.1 model (naming, repo placement, memory layering, source-of-truth, intent packet, context-loading policy) and adds:

```text
+ Primus invocation convention        (how the user addresses the system)
+ Proactive Layer                     (active reminders / daily brief / nudges)
+ User Profile / Personalization      (goals, preferences, constraints as first-class input)
+ Feedback & Reflection loop          (the assistant learns from corrections and outcomes)
+ Consolidated Approval & Safety gates
+ Capability-Completeness Review       ("is this enough for an all-round assistant?")
```

The repo-integration discipline from v3.1 still holds: **this is a plan.** Only create/update docs under `opus-animus/docs/`. Do not touch `AGENTS.md`, `ai/status.md`, `TODO.md`, or subsystem files until this is approved.

---

## 1. Naming Model (unchanged from v3.1)

```text
Opus Animus    = entire personal AI self-transformation workspace
Opus Nexus     = user ↔ Animus interface; chat surface, dashboard, health/life tracking
Opus Consilium = information brain; collect, filter, synthesize, route knowledge
Opus Logos     = strategic reasoning brain; priority, roadmap, decision, stop list
Opus Rector    = PM execution brain; task breakdown, TODO, workflow, handoff, status
Opus Lucida    = content engine; JLPT/video/content production
WIKI           = long-term memory
INFRA          = scheduler/runtime/automation
```

Memory phrase:

```text
Animus transforms.
Nexus connects.
Consilium knows.
Logos thinks.
Rector plans.
Lucida creates.
Wiki remembers.
Infra runs.
```

### 1.1 Primus — the unified persona

`Primus` ("the first / foremost") is the **name of the unified assistant experience**, not a separate module.

```text
Primus = Nexus + Consilium + Logos + Rector
Primus is a coordination, not a component.
Primus must not be modeled as one agent.
```

The user talks to **Primus**; behind it, four subsystems coordinate. Lucida, Wiki, and Infra are capabilities Primus calls, not part of its conversational face.

---

## 2. Invocation Convention — How the User Addresses the System

This is the protocol the router must understand. It is the new contract introduced in v4.

### 2.1 Default — talk to Primus in natural language

The user should not need to know internals. Address `Primus`, state intent; the Intent Router (§6 in v3.1, restated in §8 here) classifies and routes.

```text
"Primus, hôm nay tôi nên tập trung gì?"      → Logos      (strategy / priority)
"Primus, break task này ra"                  → Rector     (task breakdown / TODO)
"Primus, tổng hợp tin AI/FDE tuần này"       → Consilium  (information)
"Primus, viết script JLPT bài này"           → Lucida     (content)
"Primus, lưu insight này vào knowledge"      → Wiki       (memory write)
"Primus, sức khỏe tuần này thế nào?"         → Nexus      (health/life)
"Primus, chạy pipeline collect"              → Infra      (runtime)
```

### 2.2 Explicit override — prefix the subsystem to force routing

When the user wants to skip intent-guessing or target one brain directly:

```text
"Logos: nên bỏ hướng X không?"
"Rector: cập nhật handoff"
"Consilium: nguồn nào nói về Y?"
"Wiki: tôi đã lưu gì về RLHF?"
"Lucida: regenerate slide 6"
"Infra: scheduler nào đang chạy?"
```

Rule:

```text
No prefix  → router infers target_subsystem from intent.
Prefix     → router obeys the prefix and skips inference.
```

### 2.3 Routing keyword hints (for the router, not the user)

```text
nên / ưu tiên / bỏ / hướng / quyết định   → Logos
break / task / tuần / handoff / status     → Rector
tin / tổng hợp / nguồn / nghiên cứu         → Consilium
lưu / ghi nhớ / knowledge / wiki            → Wiki
script / slide / video / content            → Lucida
sức khỏe / cân / ngủ / lịch                  → Nexus
chạy / schedule / pipeline / job            → Infra
```

The convention above must later be written into `ai/routing/intent-router.md` and pointed to from `AGENTS.md` (Phase 1). Not yet.

---

## 3. Proactive Layer — Active Reminders (NEW)

A capable assistant does not only answer; it **initiates**. This section specifies proactive behavior. It is the headline feature of v4.

### 3.1 Principle

```text
Primus may surface suggestions on its own.
Primus may never take action on its own.
Every proactive item is a suggestion the user can accept, snooze, or dismiss.
```

### 3.2 Trigger taxonomy

```text
TIME triggers
  - Morning brief (default ~07:00 JST)
  - Evening review (default ~21:00 JST)
  - Weekly review (Sunday)

EVENT triggers
  - Deadline approaching (task in TODO/WEEKLY-PLAN due soon)
  - Calendar event with prep need (meeting, eating-out, travel)
  - Health anomaly (e.g. low protein streak, no workout N days, poor sleep)
  - Stale knowledge (wiki page learned but never applied; goal with no progress)
  - New high-signal information from Consilium relevant to an active goal

THRESHOLD triggers
  - Metric crosses a user-defined line (weight, spend, study hours)
```

### 3.3 Who produces a proactive item

```text
Infra      → fires the trigger on schedule / on event
Rector     → pulls due/relevant tasks from TODO + WEEKLY-PLAN
Logos      → ranks by priority, goal-alignment, and the day's energy/calendar
Nexus      → adds health + calendar context, renders the brief
Consilium  → injects relevant new information
User Profile (§4) → biases all of the above toward goals/preferences/constraints
→ Primus assembles one coherent brief/nudge
```

### 3.4 Delivery modes

| Mode | Mechanism | MVP |
|---|---|---|
| **Pull** — user opens app / asks "hôm nay làm gì" | generated on demand | First |
| **Push** — Primus sends at scheduled time | Infra scheduler → Telegram/notification | After pull is stable |

### 3.5 Daily-brief shape

```text
Chào buổi sáng.

Bối cảnh hôm nay:
- Lịch bận 10:00–17:00, tối có hẹn ăn ngoài.
- Hôm qua protein thấp; ngủ tốt 7.5h.

Primus đề xuất:
1. [Ưu tiên] Hoàn tất review PR X        (Rector — due tuần này)
2. Trưa ăn nhẹ, nhiều đạm                 (Nexus/health)
3. Đi bộ 10' sau bữa tối                  (micro-action — ngày bận)

[Chấp nhận tất cả] [Chọn] [Để sau] [Bỏ qua]
```

### 3.6 Proactive item schema

```yaml
proactive_item:
  id: "2026-06-21-morning-01"
  trigger: time | event | threshold
  source_subsystem: RECTOR | LOGOS | NEXUS | CONSILIUM
  kind: task | health_nudge | calendar_prep | knowledge_nudge | info_alert
  title: "..."
  reason: "why this is surfaced now"
  priority: high | medium | low
  suggested_action: "what the user could do"
  requires_approval: true            # always true for any external write
  state: pending | accepted | snoozed | dismissed
```

### 3.7 Anti-annoyance rules (non-negotiable)

```text
- Quiet hours: no push outside a user-defined window.
- Rate limit: at most 1 morning brief + 1 evening review per day by default.
- Relevance gate: drop items that do not map to an active goal or due task.
- Snooze/dismiss is remembered; do not re-surface a dismissed item the same day.
- A proactive item never blocks; it is always skippable.
```

---

## 4. User Profile / Personalization (NEW first-class layer)

An all-round assistant must know **who it serves**. Without this, prioritization and reminders are generic. Promote the user model to a loaded-early layer.

```text
user-profile/
  goals.json          # what the user is trying to become / achieve (linked to GOALS.md / north-star)
  preferences.json    # language, timezone, workout windows, quiet hours, meal style
  constraints.json    # approval_required, no_auto_write, busy-day micro-actions
```

```text
Rule:
- Logos and the Proactive Layer must read the user profile before ranking.
- Wiki/Consilium bias content scoring by goals.json.
- Profile is a source of truth (§7); it is not duplicated into status.md.
```

This connects directly to existing repo assets: `GOALS.md`, `north-star.md`, and the `user-profile/` schema already sketched in `docs/PLAN-opus-nexus-transformation.md` §7.

---

## 5. Feedback & Reflection Loop (NEW)

A "toàn năng" assistant improves. This closes the north-star loop `APPLY → OUTPUT → FEEDBACK` that the system was missing.

```text
Correction loop
  - When the user corrects Primus, Rector logs a rule (aligns with CLAUDE.md lessons.md).
  - Repeated corrections become routing/priority adjustments.

Outcome loop
  - Accepted vs dismissed proactive items are tracked.
  - Logos uses acceptance signal to tune future suggestions.

Reflection loop
  - Weekly: Consilium + Wiki produce "what changed / what was learned / what to stop".
  - Output feeds DECISION-LOG.md and next week's WEEKLY-PLAN.md.
```

```text
Rule:
- Feedback is stored, not just spoken in chat.
- No strategic decision or learned lesson lives only in conversation history.
```

---

## 6. Approval & Safety Gates (consolidated)

```text
1. Primus proposes; the user approves before any external action.
2. LLM output for actions is proposal JSON only — never a direct write.
3. Action classes: read (free) | draft (free) | write (needs approval) | dangerous (explicit confirm).
4. Calendar/file/external writes are opt-in and validated before execution.
5. Health/life advice stays lifestyle-level, not medical diagnosis.
6. Any system-created artifact is tagged with its source (e.g. source = opus-nexus).
7. No agent may create a new source of truth without registering it (§7).
```

---

## 7. Memory, Routing & Source-of-Truth (carried from v3.1)

These are unchanged; restated as the spine of v4.

### 7.1 Memory layers (load top-down, never deep-load before routing)

```text
L0  Global Law            AGENTS.md
L1  Global Routing State  ai/status.md            (thin; map, not memory)
L2  Session Continuity    ai/handoff-*.md, ai/sessions/
L3  Task / Portfolio      TODO.md, WEEKLY-PLAN.md
L4  Decisions             DECISION-LOG.md
L5  Subsystem Memory      opus-*/ai/status.md
L6  Long-term Knowledge   WIKI / personal-wiki
L7  Personal / Health     opus-nexus/health/, opus-nexus/life/
L8  User Profile          user-profile/ (goals, preferences, constraints)   ← elevated in v4
```

### 7.2 Source-of-truth map

| Information Type | Source of Truth | Do Not Store In |
|---|---|---|
| Global rules | `AGENTS.md` | status/handoff |
| Global snapshot | `ai/status.md` | full history |
| Session next action | `ai/handoff-{owner}.md` | status |
| Master task index | `TODO.md` | status |
| Weekly focus | `WEEKLY-PLAN.md` | long status sections |
| Strategic decisions | `DECISION-LOG.md` | chat history only |
| Research/information | `opus-consilium/` | global status |
| Health/life logs | `opus-nexus/health/`, `life/` | global status |
| User goals/preferences | `user-profile/` | status/handoff |
| Long-term knowledge | WIKI / personal-wiki | handoff |
| Runtime/scheduler | INFRA | TODO (except task index) |

### 7.3 Status discipline

```text
status.md says where to look.
handoff.md says exactly what to do next.
TODO.md says what exists in the backlog.
DECISION-LOG.md says what was decided and why.
docs/ explains how/why the system works.
status.md is a map, not memory.
```

---

## 8. Intent Packet (carried, extended)

Every incoming message — user-sent or proactively triggered — becomes an intent packet before deep context loads.

```yaml
intent_packet:
  origin: user | proactive_trigger
  user_input: "..."
  intent_type: strategy | information | execution | content | memory | health | infra | admin
  target_subsystem: NEXUS | CONSILIUM | LOGOS | RECTOR | LUCIDA | WIKI | INFRA
  action_type: read | draft | write | dangerous
  urgency: now | this_week | later
  context_depth: L0 | L1 | L2 | L3 | deep
  required_sources: [ AGENTS.md, ai/status.md, selected subsystem status, user-profile ]
  expected_output: answer | strategy_brief | task_contract | research_summary | memory_update | health_summary | proactive_item
  approval_required: true | false
```

---

## 9. Capability-Completeness Review — "Is this enough for an all-round assistant?"

Honest assessment of whether the model covers what a true Jarvis-class personal assistant needs.

| # | Capability a "toàn năng" assistant needs | Covered by | Status |
|---|---|---|---|
| 1 | Conversational entry point | Nexus | ✅ Designed |
| 2 | Intent understanding + routing | Intent Packet §8 | ✅ Designed (not built) |
| 3 | Information gathering + synthesis | Consilium | 🟡 Partial (collector/daily exist) |
| 4 | Strategic thinking / prioritization | Logos | ⛔ Not built |
| 5 | Task breakdown + execution tracking | Rector / TODO | 🟡 TODO exists, no Rector layer |
| 6 | Content production | Lucida | 🟡 JLPT/video pipeline exists |
| 7 | Long-term memory | Wiki | 🟡 Wiki running |
| 8 | Automation / scheduling | Infra | 🟡 Task Scheduler jobs exist |
| 9 | Health / life awareness | Nexus health | 🟡 Data logging exists |
| 10 | **Proactive reminders / initiative** | Proactive Layer §3 | ⛔ New in v4, not built |
| 11 | **Personalization (goals/prefs/constraints)** | User Profile §4 | 🟡 Schema sketched, not wired |
| 12 | **Feedback / self-improvement** | Reflection Loop §5 | ⛔ New in v4, not built |
| 13 | Approval / safety gates | §6 | ✅ Designed |
| 14 | Calendar / time awareness | Nexus (PLAN doc) | 🟡 Planned in nexus transformation |
| 15 | Multi-tool continuity (Claude/Codex/ChatGPT) | Memory L2 handoff | ✅ Designed |
| 16 | Context-budget discipline | Context loading §7.1 | ✅ Designed |
| 17 | Error / misroute fallback | §10 (new) | ⛔ Gap — added below |

### 9.1 Verdict

The **design** is now broad enough to call an all-round assistant: with v4, the three missing pillars of a real assistant — **initiative (proactive), personalization, and learning (feedback)** — are present on paper. Two model-level gaps were found and are closed below (§10 fallback) or flagged (calendar wiring).

The **honest reality**: almost everything is `Designed` or `Partial`, not `Built`. Logos, Rector, the Proactive Layer, and the Feedback Loop do not exist as code yet. v4 is a complete *blueprint*, not a working assistant.

---

## 10. Fallback & Failure Handling (gap closed by review)

```text
- Router low confidence → ask one clarifying question instead of guessing a write.
- Subsystem unavailable → degrade gracefully: answer from what is available, state the gap.
- Conflicting sources → prefer the registered source of truth (§7.2); flag the conflict.
- Proactive trigger with no relevant content → stay silent, do not manufacture a nudge.
- Any action with action_type=dangerous → stop and require explicit confirmation.
```

---

## 11. Implementation Plan

### Phase 0 — Current action (this commit)

```text
Create only this file: opus-animus/docs/OPERATING-MODEL-OPUS-ANIMUS-v4.md
Mark v3.1 as superseded.
Do not update AGENTS.md / ai/status.md / TODO.md / subsystem files.
```

### Phase 1 — After approval

```text
- Write ai/routing/intent-router.md (invocation convention §2).
- Add short pointers in AGENTS.md and ai/status.md to this file.
- Wire user-profile/ (goals/preferences/constraints) as a loaded layer.
- Add TODO tasks for: Rector layer, Logos layer, Proactive Layer.
```

### Phase 2 — Build proactive MVP

```text
- Pull-mode daily brief first: Rector reads TODO + Nexus health + calendar → Primus brief.
- Add Logos prioritization over the brief.
- Then push-mode via Infra scheduler → Telegram.
- Add anti-annoyance rules (§3.7) before any push is enabled.
```

### Phase 3 — Feedback loop

```text
- Log accept/snooze/dismiss on proactive items.
- Weekly reflection → DECISION-LOG.md + WEEKLY-PLAN.md.
- Corrections → lessons / routing tuning.
```

Each phase requires its own RD/BD per the repo's SDD rule before code.

---

## 12. Success Criteria

```text
- ai/status.md stays a thin map (≤ ~150 lines).
- The user addresses Primus naturally; routing is correct ≥ most of the time.
- Primus produces a useful, goal-aligned daily brief.
- Proactive items are suggestions only; nothing is auto-executed.
- Reminders respect quiet hours and rate limits (not annoying).
- Personalization: suggestions reflect goals/preferences/constraints.
- Corrections and decisions are stored, never trapped in chat.
- Logos owns reasoning; Rector owns execution; Consilium owns information; Nexus owns interface + health.
```

---

## 13. Final Rule

```text
Nexus connects.
Consilium knows.
Logos thinks.
Rector plans.
Lucida creates.
Wiki remembers.
Infra runs.
Animus transforms.
Primus speaks for them all — and proposes, never imposes.

status.md is a map, not memory.
```
