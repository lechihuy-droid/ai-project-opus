# Operating Model — Opus Animus v3.1

**Date:** 2026-06-20  
**Status:** Draft / Planning  
**Scope:** Governance, routing, memory split, and operating model for `opus-animus/`  
**Do not implement directly from this file without updating the relevant RD/BD or task files.**

---

## 1. Purpose

This document updates the Opus Animus operating model after the naming and memory-boundary discussion.

The main problem to solve:

```text
AGENTS.md and ai/status.md must not become the whole memory of Opus Animus.
```

The correct design:

```text
AGENTS.md    = global law
ai/status.md = thin global router / current snapshot
TODO.md      = master task index
handoff-*    = per-tool continuation state
docs/        = operating design / architecture / policy
subsystems   = detailed local operational memory
WIKI         = long-term knowledge
Nexus        = user interface + health/life tracking
Consilium    = information brain
Logos        = strategic reasoning
Rector       = PM execution
```

This file is intentionally placed in `opus-animus/docs/` because it is an operating/design document, not runtime state.

---

## 2. Naming Model

Final naming convention:

```text
Opus Animus    = entire personal AI self-transformation workspace
Opus Nexus     = user ↔ Animus interface; chat surface, dashboard, health/life tracking
Opus Consilium = information brain; collect, filter, synthesize, route knowledge
Opus Logos     = strategic reasoning brain; Famulus-like strategy, priority, roadmap, stop list
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

Famulus should not be modeled as one agent.

```text
Famulus = Nexus + Consilium + Logos + Rector
```

---

## 3. Target Operating Model

### 3.1 High-Level Flow

All interaction enters through Nexus, but Nexus does not do all work.

```text
User
 ↓
Opus Nexus        # interface / command center / health-life dashboard
 ↓
Intent Router
 ↓
Consilium / Logos / Rector / Lucida / Wiki / Infra
 ↓
Reviewer if needed
 ↓
Nexus returns result to user
```

Routing examples:

| User asks | Route |
|---|---|
| “Hôm nay tôi nên tập trung gì?” | Nexus → Logos |
| “Break task này ra” | Nexus → Rector |
| “Tổng hợp tin AI/FDE” | Nexus → Consilium |
| “Tạo script JLPT” | Nexus → Lucida |
| “Lưu insight này vào knowledge” | Nexus → Wiki |
| “Sức khỏe tuần này thế nào?” | Nexus / health store |
| “Chạy scheduler/pipeline” | Nexus → Infra |

---

### 3.2 Repository Placement and Memory Boundary

This section answers: **where should this operating model and future memory-split work live in the current repo?**

#### 3.2.1 Do not put this full plan into `AGENTS.md`

`AGENTS.md` is the global law file. It should contain short, durable rules only.

Correct use of `AGENTS.md`:

```text
- SDD rules
- plan mode rules
- subagent strategy
- verification-before-done
- session start / handoff protocol
- short memory-boundary rule
```

Incorrect use of `AGENTS.md`:

```text
- long operating model
- full memory architecture
- project history
- subsystem task details
- health logs
- full routing matrix
```

Only add a short pointer later, for example:

```md
## Opus Animus — Routing & Memory Rule

- `ai/status.md` is a thin router, not a memory store.
- Do not deep-load before routing.
- Global operating model: `opus-animus/docs/OPERATING-MODEL-OPUS-ANIMUS-v3.1.md`.
- Memory architecture should be documented under `opus-animus/docs/`.
```

Do not update `AGENTS.md` yet. This document is only the plan.

---

#### 3.2.2 Do not put this full plan into `ai/status.md`

`ai/status.md` should remain a thin global router / current snapshot.

It should answer only:

```text
1. Where are we now?
2. Who is the current owner/tool?
3. Which subsystem is active?
4. Which file should be read next?
```

Allowed in `ai/status.md`:

```text
- updated date
- current owner
- active subsystem table
- current objective summary
- next pointer
- constraints pointer
- links to detailed files
```

Forbidden in `ai/status.md`:

```text
- full task history
- full operating model
- full research notes
- health raw logs
- decision narratives
- duplicated TODO content
- duplicated handoff next actions
```

Rule:

```text
status.md says where to look.
handoff.md says exactly what to do next.
TODO.md says what exists in the backlog.
docs/ explains why the system works that way.
```

Do not update `ai/status.md` yet. Later it should only receive a short pointer to this file.

---

#### 3.2.3 Put the full operating plan in `opus-animus/docs/`

The correct location for this file is:

```text
opus-animus/docs/OPERATING-MODEL-OPUS-ANIMUS-v3.1.md
```

Reason:

```text
- It changes operating model and component boundaries.
- It explains memory architecture.
- It is not runtime status.
- It is not a task list.
- It is not long-term knowledge content.
```

Future split docs may be created later, but not now:

```text
opus-animus/docs/MEMORY-ARCHITECTURE.md
opus-animus/docs/SOURCE-OF-TRUTH-MAP.md
opus-animus/docs/ROUTING-POLICY.md
opus-animus/docs/REVIEW-GATES.md
```

For now, create only this single file.

---

#### 3.2.4 Keep Consilium implementation details inside `opus-consilium/docs/`

Global principle:

```text
Nexus receives the user interaction.
Consilium handles information intake, review, classification, synthesis, and routing.
```

Implementation detail belongs to:

```text
opus-animus/opus-consilium/docs/SD-central-inbox-routing.md
opus-animus/opus-consilium/docs/BD-central-inbox-routing.md
```

Do not move implementation detail into the global operating model.

Boundary:

| Layer | File Location | Role |
|---|---|---|
| Global principle | `opus-animus/docs/OPERATING-MODEL-OPUS-ANIMUS-v3.1.md` | Defines Nexus/Consilium/Logos/Rector model |
| Routing implementation | `opus-consilium/docs/` | Defines inbox/review/routing build plan |
| Runtime state | `ai/status.md`, `ai/handoff-*` | Current owner and continuation state |
| Task index | `TODO.md` | Master task list and backlog |
| Long-term knowledge | WIKI / personal-wiki | Compounded knowledge |

---

#### 3.2.5 Update order for repo integration

Do not update everything at once. Use this order:

```text
Step 1: Add this plan file to opus-animus/docs/.
Step 2: Review/approve this plan.
Step 3: Create separate MEMORY-ARCHITECTURE.md only if needed.
Step 4: Add short pointers to AGENTS.md and ai/status.md.
Step 5: Add TODO tasks for implementation.
Step 6: Only then create subsystem status/routing files.
```

Current instruction for this commit:

```text
Only Step 1.
Do not update AGENTS.md.
Do not update TODO.md.
Do not update ai/status.md.
Do not update Consilium/Lucida/etc.
```

---

### 3.3 Responsibility Split

```text
Nexus:
- user interface
- chat entry point
- health/life tracking
- command center
- intent packet creation

Consilium:
- information collection
- inbox
- review/classification
- synthesis
- routing knowledge to Logos/Rector/Wiki/Lucida

Logos:
- strategic reasoning
- priority recommendation
- roadmap
- stop list
- initiative charter

Rector:
- PM execution
- task breakdown
- TODO/WEEKLY-PLAN management
- handoff/status updates
- owner assignment

Lucida:
- content production
- JLPT/video pipeline

Wiki:
- long-term knowledge memory

Infra:
- scheduler
- runtime
- automation reliability
```

---

## 4. Memory Layering Model

Use layered memory. Higher layers are smaller and loaded more often. Lower layers are larger and loaded only after routing.

```text
L0 — Global Law
AGENTS.md

L1 — Global Routing State
ai/status.md

L2 — Session Continuity
ai/handoff-codex.md
ai/handoff-claude.md
ai/handoff-chatgpt.md
ai/sessions/YYYY-MM-DD-[task].md

L3 — Task and Portfolio State
TODO.md
WEEKLY-PLAN.md
subsystem TODO files if needed

L4 — Decisions
DECISION-LOG.md
subsystem DECISION-LOG.md if needed

L5 — Subsystem Operational Memory
opus-consilium/ai/status.md
opus-lucida/ai/status.md
opus-nexus/ai/status.md
wiki/ai/status.md
infra/ai/status.md

L6 — Long-term Knowledge
WIKI
Consilium summaries
knowledge cards

L7 — Personal / Health / Life Metrics
opus-nexus/health/
opus-nexus/life/
```

Rule:

```text
Never deep-load before routing.
```

---

## 5. Source of Truth Rule

| Information Type | Source of Truth | Do Not Store In |
|---|---|---|
| Global rules | `AGENTS.md` | status/handoff |
| Global snapshot | `ai/status.md` | full history |
| Session next action | `ai/handoff-{owner}.md` | status |
| Master task index | `TODO.md` | status |
| Weekly focus | `WEEKLY-PLAN.md` | long status sections |
| Strategic decisions | `DECISION-LOG.md` | chat history only |
| Research/information | `opus-consilium/` | global status |
| Health/life logs | `opus-nexus/health/`, `opus-nexus/life/` | global status |
| Long-term knowledge | WIKI / personal-wiki | handoff |
| Runtime/scheduler | INFRA | TODO except task index |

Rule:

```text
No agent may create a new source of truth without registering it.
```

---

## 6. Intent Packet

Every incoming user message should be converted into an intent packet before loading deep context.

```yaml
intent_packet:
  user_input: "..."
  intent_type: strategy | information | execution | content | memory | health | infra | admin
  target_subsystem: NEXUS | CONSILIUM | LOGOS | RECTOR | LUCIDA | WIKI | INFRA
  action_type: read | draft | write | dangerous
  urgency: now | this_week | later
  context_depth: L0 | L1 | L2 | L3 | deep
  required_sources:
    - AGENTS.md
    - ai/status.md
    - selected subsystem status
  expected_output:
    - answer | strategy_brief | task_contract | research_summary | memory_update | health_summary
  approval_required: true | false
```

---

## 7. Context Loading Policy

### Level 0 — Always Load

```text
AGENTS.md relevant global rules
ai/status.md thin snapshot
```

### Level 1 — Route Selection

```text
this operating model if needed
source-of-truth map if available
WEEKLY-PLAN.md if priority-related
```

### Level 2 — Subsystem Packet

Load only the selected subsystem.

```text
opus-consilium/ai/status.md
or opus-lucida/ai/status.md
or opus-nexus/ai/status.md
or wiki/ai/status.md
or infra/ai/status.md
```

### Level 3 — Execution State

```text
relevant TODO.md section
relevant handoff file
relevant project docs
```

### Deep Load — Only When Needed

```text
raw files
full research logs
full script drafts
full dashboard source
full wiki entries
```

Rule:

```text
Never deep-load before routing.
```

---

## 8. Proposed Future Memory-Aware Structure

Do not refactor now. This is the target shape if approved.

```text
opus-animus/
├── AGENTS.md
├── TODO.md
├── WEEKLY-PLAN.md
├── DECISION-LOG.md
├── ai/
│   ├── status.md                    # thin global router
│   ├── handoff-codex.md
│   ├── handoff-claude.md
│   ├── handoff-chatgpt.md
│   ├── sessions/
│   └── routing/
│       ├── intent-router.md
│       ├── context-loading-policy.md
│       └── memory-map.md
├── docs/
│   ├── OPERATING-MODEL-OPUS-ANIMUS-v3.1.md
│   ├── MEMORY-ARCHITECTURE.md
│   ├── SOURCE-OF-TRUTH-MAP.md
│   ├── ROUTING-POLICY.md
│   └── REVIEW-GATES.md
├── opus-consilium/
│   └── ai/status.md
├── opus-lucida/
│   └── ai/status.md
├── opus-nexus/
│   ├── ai/status.md
│   ├── health/
│   └── life/
├── wiki/
│   └── ai/status.md
└── infra/
    └── ai/status.md
```

---

## 9. Implementation Plan

### Phase 0 — Current Action

```text
Create only this file:
opus-animus/docs/OPERATING-MODEL-OPUS-ANIMUS-v3.1.md
```

Do not update other files yet.

### Phase 1 — After Review

```text
- Decide whether to split this file into MEMORY-ARCHITECTURE.md / ROUTING-POLICY.md.
- Add short pointer to AGENTS.md.
- Add short pointer to ai/status.md.
- Add TODO tasks only after plan approval.
```

### Phase 2 — Runtime Integration

```text
- Thin down ai/status.md if needed.
- Add subsystem status files only for active subsystems.
- Add routing docs only after actual routing workflow is stable.
```

---

## 10. Success Criteria

This operating model is successful if:

```text
- ai/status.md stays under 100–150 lines.
- every session knows where to read next.
- Claude/Codex/ChatGPT can resume through the same protocol.
- no strategic decision is trapped only in chat history.
- no health/life raw log pollutes global status.
- Consilium remains the information brain, not the PM tracker.
- Rector owns execution tracking.
- Logos owns strategic reasoning.
- Nexus remains the interface and health/life connection layer.
```

---

## 11. Final Rule

```text
Nexus connects.
Consilium knows.
Logos thinks.
Rector plans.
Lucida creates.
Wiki remembers.
Infra runs.
Animus transforms.

status.md is a map, not memory.
```
