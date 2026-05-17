# Automation Execution Contract
**Status:** Active v1  
**Role:** Canonical execution contract for running Lucida automation lanes with consistent inputs, outputs, decisions, and status updates

---

## 1. Purpose

This file turns the automation flow into a repeatable execution contract.

Use it when:

```text
- running a lane by hand with subagents
- standardizing how automation status is recorded
- deciding whether a lane should PASS / REVISE / BLOCK
- preparing future dashboard or orchestrator logic
```

This file is the contract layer for:

```text
35-automation-gated-execution-flow.md
36-automation-flow-matrix.md
31-34 runner packs
```

---

## 2. Core Rule

Every automation lane run must declare:

```text
lane_name
step_id
mode
inputs
write_targets
gate_target
status_update_target
decision_output
retry_lane_if_failed
```

If any of these are missing, the lane is not ready to run.

---

## 3. Canonical Execution Fields

Use these fields for every lane run:

```text
topic_slug
phase
step_id
lane_name
runner_pack
tooling
input_files
write_targets
read_only_outputs
gate_name
decision_status
retry_lane
owner
last_run_at
notes
```

Field meaning:

```text
decision_status:
- NOT_STARTED
- READY
- RUNNING
- PASS
- REVISE
- BLOCK

owner:
- MAIN_AGENT
- RUNNER_PACK_<number>
- SUBAGENT_<role>
- MANUAL
```

---

## 4. Lane Contract Template

Use this template whenever a lane is run:

```text
Lane:
Step:
Mode:
Runner pack:
Tooling:

Inputs:
- ...

Writes:
- ...

Gate:
- ...

Success means:
- ...

If revise:
- rerun ...

If block:
- return to ...

Status update target:
- production/00-active/<topic-slug>/07-automation-status.md
```

---

## 5. Decision Semantics

Use decisions consistently:

```text
PASS
= downstream lane may proceed

REVISE
= same upstream truth is still valid, but one artifact needs another pass

BLOCK
= upstream truth is not stable enough; do not continue downstream
```

Interpretation rule:

```text
PASS = advance
REVISE = patch locally, rerun narrow lane
BLOCK = move upstream, do not pretend downstream can fix it
```

---

## 6. Status Update Rule

Every gate-clearing action should update the topic status file:

```text
production/00-active/<topic-slug>/07-automation-status.md
```

At minimum update:

```text
current_phase
current_step
current_gate
decision_status
latest_output
retry_lane_if_blocked
last_updated
```

Do not leave lane state only in chat history.

---

## 7. Lane Contracts

### 7.1 Example Lane

```text
Lane:
Example Lane

Step IDs:
1.1 -> 1.5

Runner pack:
31-runner-example-lane.md

Inputs:
- example system rules
- persona map
- grammar affordance matrix
- example QA criteria
- topic example files when they exist

Writes:
- ...example-candidates.md
- ...approved-examples.md

Gate:
Gate B - Example curation

Success means:
- one primary spine
- one practical expansion
- at most one trend support
- roles are explicit

If revise:
- rerun Situation Research / JP Naturalness / VN Naturalness / Pedagogy Fit / Curation

If block:
- return to Topic Lock or teaching skeleton truth
```

### 7.2 Lesson Production Lane

```text
Lane:
Lesson Production

Step IDs:
2.1 -> 2.8

Runner pack:
32-runner-lesson-production.md

Inputs:
- skeleton
- architecture
- slide deck
- script
- design direction
- QA criteria files

Writes:
- 01-master-teaching-skeleton.md
- 03-slide-deck.md
- 02-script.md

Gates:
- Gate C Skeleton QA
- Gate D Slide Structure QA
- Gate E Slide Design QA
- Gate F Script QA
- Gate G Slide / Script Sync QA

Success means:
- structure truth is stable
- design does not alter meaning
- script is natural and aligned
- slide/script sync passes

If revise:
- rerun narrowest lane: Slide Structure / Slide Design / Script Polish

If block:
- return to skeleton or architecture
```

### 7.3 Assessment Lane

```text
Lane:
Assessment

Step IDs:
3.1 -> 3.5

Runner pack:
33-runner-assessment.md

Inputs:
- skeleton
- architecture
- slide deck
- script
- assessment spec

Writes:
- worksheet
- diagnostic quiz
- shorts pack

Gates:
- Gate H Answer / Trap QA
- Gate I Assessment merge

Success means:
- assets match lesson promise
- distractors and explanations are pedagogically useful
- CTA wording stays aligned

If revise:
- rerun Worksheet Builder / Diagnostic Quiz Builder / Shorts Builder

If block:
- return to lesson lane if the lesson truth itself is drifting
```

### 7.4 Production Lane

```text
Lane:
Production

Step IDs:
4.1 -> 4.5

Runner pack:
34-runner-production.md

Inputs:
- script
- slide deck
- worksheet
- quiz
- shorts

Writes:
- script TTS markers
- recording brief
- publish handoff
- post-video decision log

Gates:
- Gate J Production readiness
- Gate K Post-video decision log

Success means:
- markers are usable
- recording brief is aligned
- publish handoff does not overpromise

If revise:
- rerun TTS / Pause Pass, Recording Brief, or Publish Handoff

If block:
- return to slide/script sync or assessment if linked assets are not stable
```

---

## 8. Wake Default Status Mapping

For the current pilot:

```text
topic_slug = wake-cluster
status_update_target = production/00-active/wake-cluster/07-automation-status.md
```

Use this path unless the active topic changes.

---

## 9. Keep / Avoid Rule

Keep this contract:

```text
explicit
stateful
resume-friendly
lane-based
dashboard-ready
```

Avoid:

```text
running lanes with no status update
clearing gates without recording a decision
letting runner packs invent new status words
storing operational state only in chat
```
