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

Revision 2026-06-21 — agent-loop & eval hardening (from an agent-eval review):

```text
+ Controller Loop                     multi-step plan→act→observe→iterate, step budget   §8.1   [F2]
+ Eval & Observability Framework      traces, metrics, golden set, regression gates       §8.2   [F1,F7]
+ Typed Action Registry               deterministic side-effect gating, not LLM self-label §6     [F3]
+ Conflict-resolution arbiter         Logos arbitrates contradictory subsystem outputs     §3.3   [F4]
+ Feedback signal split + rule budget engagement vs outcome; bounded, reconciled lessons   §5     [F5]
+ Proactive state registered as SoT   §7.2                                                        [F6]
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

#### Conflict arbiter [F4]

When subsystems contradict (e.g. Logos says "rest for recovery" but Rector says
"deadline, push"), a brief must not ship both. **Logos is the final arbiter** of
the day's recommendation, applying a fixed precedence:

```text
safety / health  >  hard deadline  >  goal priority  >  preference / convenience
```

```text
Rule:
- No brief may contain mutually contradictory suggestions.
- Logos resolves the conflict and states the trade-off it made.
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

**Signal quality [F5].** Distinguish two signals — accept ≠ useful:

```text
engagement signal  = accepted / snoozed / dismissed   (weak; user intent at the moment)
outcome signal     = did the suggested task actually get DONE
                     (strong; pulled from Rector / TODO completion, not from the click)
```

Ranking must weight the **outcome** signal above the engagement signal. A suggestion
the user accepts but never completes is a *worse* signal than one acted on silently.

```text
Correction loop
  - When the user corrects Primus, Rector logs a lesson (aligns with CLAUDE.md lessons.md).
  - Repeated corrections become re-ranking heuristics — NOT model fine-tuning.

Outcome loop
  - Track engagement + outcome per proactive item.
  - Logos tunes future ranking from the outcome signal.

Reflection loop
  - Weekly: Consilium + Wiki produce "what changed / what was learned / what to stop".
  - Output feeds DECISION-LOG.md and next week's WEEKLY-PLAN.md.
```

**Rule budget & reconciliation [F5].** Lessons must not grow unbounded or contradict:

```text
- Cap active lessons (e.g. ≤ 30); beyond that, merge or retire the weakest.
- Weekly reconcile pass: detect and resolve contradictory lessons.
- "Learning" here means heuristic re-ranking only — no fine-tuning, no opaque weights.
```

```text
Rule:
- Feedback is stored, not just spoken in chat.
- No strategic decision or learned lesson lives only in conversation history.
```

---

## 6. Approval, Safety & Action Registry (consolidated)

```text
1. Primus proposes; the user approves before any external action.
2. LLM output for actions is proposal JSON only — never a direct write.
3. Action classes: read (free) | draft (free) | write (needs approval) | dangerous (explicit confirm).
4. Calendar/file/external writes are opt-in and validated before execution.
5. Health/life advice stays lifestyle-level, not medical diagnosis.
6. Any system-created artifact is tagged with its source (e.g. source = opus-nexus).
7. No agent may create a new source of truth without registering it (§7).
```

### 6.1 Typed Action Registry [F3]

The safety gate must NOT depend on the LLM correctly self-labeling `action_type`.
An LLM can mislabel a dangerous action as a harmless write. Therefore the action
class is **determined by the tool, deterministically**, not by the model.

```text
- Every tool/capability is pre-registered with a fixed class:
    read | draft | write | dangerous
- The class comes from the registry, not from LLM output.
- The LLM may REQUEST an action; the registry decides its gate.
- Unregistered tool → treated as `dangerous` by default (deny-by-default).
```

Example registry entries:

```text
wiki.read              -> read
brief.draft            -> draft
calendar.events.insert -> write       (requires approval)
file.delete            -> dangerous   (requires explicit confirm)
telegram.send          -> write
shell.exec             -> dangerous
```

```text
Rule: the model proposes; the registry gates. Self-reported action_type is a hint, never the gate.
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
L9  Run Traces            ai/traces/ (one record per intent_packet; eval/debug)  ← new [F1]
```

L9 is append-only and is read by the eval framework (§8.2), not loaded during normal routing.

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
| Proactive items + state | `opus-nexus/proactive/` (owned by Rector) | status/chat [F6] |
| Run traces / eval logs | `ai/traces/` | status/handoff |
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
  route_confidence: 0.0 - 1.0          # calibrated; drives clarify-vs-act (§8.2, §10) [F7]
  plan: [ step ]                       # multi-step tasks; may chain subsystems [F2]
  step_index: 0                        # current step in the controller loop [F2]
```

---

## 8.1 Controller Loop [F2]

Routing is one hop; real assistant tasks are multi-step. A single intent may need
several steps that chain subsystems (e.g. *"plan my week"* = Consilium → Logos →
Rector → Nexus). Primus runs an explicit loop, not a single dispatch.

```text
while not done and step_index < max_steps:
    route(step)            # pick subsystem for this step
    execute(step)          # run it; produce result + trace record (§8.2)
    observe(result)        # check progress against the goal
    decide:
        - continue   -> next step (may be a different subsystem)
        - finish     -> assemble final output
        - ask        -> low confidence / missing input -> ask ONE question
        - abort      -> dangerous/blocked -> stop, report
```

```text
Loop guards:
- max_steps budget (default small, e.g. 6) — prevents runaway loops.
- progress check each iteration — no progress twice in a row -> ask or abort.
- every step writes a trace record (L9) for eval/replay.
- subsystem chaining: a step's output is typed input to the next step.
```

Single-hop questions (most chats) resolve in one iteration; the loop simply exits
after the first `finish`.

---

## 8.2 Eval & Observability Framework [F1, F7]

**The model must be able to measure itself.** Without traces and metrics, the
feedback loop (§5) learns blind and regressions are invisible. This is mandatory
infrastructure, not optional.

### Traces (L9)

```text
ai/traces/YYYY-MM-DD.jsonl   # append-only, one record per loop step
record: { id, ts, origin, user_input, intent_type, target_subsystem,
          route_confidence, sources_loaded, action_class, output_kind,
          step_index, user_verdict, outcome }
```

Traces make every loop **replayable and debuggable**.

### Metrics

```text
- routing_accuracy        correct target_subsystem vs golden / vs correction
- misroute_rate           share of turns the user re-routed
- task_completion_rate    multi-step tasks that reached `finish`
- proactive_precision     useful nudges / total nudges (outcome-weighted, §5)
- false_nudge_rate        dismissed-without-action / total
- approval_correctness    action_class matched real side-effect (§6.1)
- clarify_rate            share of turns that asked instead of acting
- brief_factuality        flagged hallucinations in briefs
```

### Golden set & regression gate

```text
evals/routing-goldens.jsonl   # ~50 labeled (input -> target_subsystem) cases
- Run on every change to routing rules / prompts.
- Block the change if routing_accuracy drops below baseline.
```

### Confidence calibration [F7]

```text
- Calibrate route_confidence against routing_accuracy on the golden set.
- Only then set the clarify threshold (§10) — an uncalibrated threshold over- or
  under-asks. Re-calibrate when the router prompt/model changes.
```

### Self-eval cadence

```text
Weekly: Consilium scores the past week's traces against the metrics above and
writes a short self-eval into DECISION-LOG.md. Trend, not vibe, drives tuning.
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
| 17 | Error / misroute fallback | §10 + §8.1 loop | ✅ Designed |
| 18 | **Multi-step / chained tasks** | Controller Loop §8.1 | ✅ Designed (not built) |
| 19 | **Self-measurement / evaluability** | Eval Framework §8.2 | ✅ Designed (not built) |
| 20 | **Deterministic action gating** | Action Registry §6.1 | ✅ Designed |

### 9.1 Verdict

The **design** is now broad enough to call an all-round assistant. v4 adds the three
missing pillars of a real assistant — **initiative (proactive), personalization, and
learning (feedback)** — and the 2026-06-21 eval-hardening revision closes the loop-level
gaps an agent-eval review raised: it is now a **multi-step loop (not just a router)**, it
is **measurable (traces + metrics + golden set)**, its **safety gate is deterministic**,
and contradictory subsystems are **arbitrated**.

The **honest reality**: almost everything is `Designed` or `Partial`, not `Built`. Logos,
Rector, the Proactive Layer, the Controller Loop, and the Eval Framework do not exist as
code yet. v4 is a complete *blueprint* — and now an *evaluable* one — not a working
assistant. Remaining flagged item: calendar wiring (§14 of the Nexus plan) is still only
planned.

---

## 10. Fallback & Failure Handling (gap closed by review)

```text
- route_confidence below the calibrated threshold (§8.2) → ask one clarifying question
  instead of guessing a write.
- Subsystem unavailable → degrade gracefully: answer from what is available, state the gap.
- Conflicting sources → prefer the registered source of truth (§7.2); flag the conflict.
- Contradictory subsystem outputs → Logos arbitrates by precedence (§3.3).
- No progress for two loop iterations (§8.1) → stop and ask or abort, never spin.
- Proactive trigger with no relevant content → stay silent, do not manufacture a nudge.
- Action whose registry class (§6.1) is dangerous → stop and require explicit confirmation.
```

---

## 11. Implementation Plan

### Phase 0 — Current action (this commit)

```text
Create only this file: opus-animus/docs/OPERATING-MODEL-OPUS-ANIMUS-v4.md
Mark v3.1 as superseded.
Do not update AGENTS.md / ai/status.md / TODO.md / subsystem files.
```

### Phase 1 — After approval (foundation: loop + eval BEFORE features [F1,F2])

```text
- Write ai/routing/intent-router.md (invocation convention §2).
- Stand up the eval foundation FIRST:
    - ai/traces/ trace logging (§8.2, L9).
    - evals/routing-goldens.jsonl (~50 labeled cases).
    - the metric definitions + regression gate.
- Define the Controller Loop contract (§8.1) and the Typed Action Registry (§6.1).
- Add short pointers in AGENTS.md and ai/status.md to this file.
- Wire user-profile/ (goals/preferences/constraints) as a loaded layer.
- Add TODO tasks for: Rector layer, Logos layer, Proactive Layer.
```

> Rationale (from the agent-eval review): building features before traces/metrics
> exist means building on sand — nothing can be measured or regression-checked.

### Phase 2 — Build proactive MVP

```text
- Instrument the loop with traces (§8.2) before shipping any suggestion.
- Pull-mode daily brief first: Rector reads TODO + Nexus health + calendar → Primus brief.
- Add Logos prioritization + conflict arbitration (§3.3) over the brief.
- Gate every external action through the Action Registry (§6.1).
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
- Every loop step leaves a trace; routing and proactive quality are reported as metrics, not vibes.
- Multi-step tasks reach `finish` within the step budget or stop cleanly (ask/abort).
- Action gating is deterministic: no external write depends on LLM self-labeling.
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
