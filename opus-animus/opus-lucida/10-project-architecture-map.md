# Opus Lucida Flow Architecture
**Status:** Canonical top-level architect v3  
**Date:** 2026-05-02  
**Scope:** Project-wide operating map for curriculum, lesson production, assets, funnel, analytics, and maintenance  
**Detailed workflow:** `automation/workflows/20-lesson-production-sop.md`

---

## 1. Purpose

This file is the top-level architect file for Opus Lucida.

It answers:

```text
What are the main systems?
What is the end-to-end production flow?
Which file governs each process?
Which outputs are source-of-truth vs reference?
How do we maintain and update the system over time?
```

Use this file to review the whole Lucida architecture.

Use `11-current-operating-flow.md` for the current operational chain.

Use `12-repo-folder-status-map.md` for folder-level canonical vs reference interpretation.

Use `automation/workflows/20-lesson-production-sop.md` for the step-by-step lesson production workflow.

Use `automation/workflows/30-subagent-governance.md` for reusable subagent governance across all lanes.

Use runner packs in `automation/workflows/31-34-*.md` for repeatable subagent execution by lane.

---

## 2. Architecture Principle

Lucida is:

```text
file-first
sample-first
AI-assisted
human-reviewed
analytics-improved
```

Do not generate production assets directly from a topic name.

Correct direction:

```text
strategy
-> teaching truth
-> production architecture
-> slide/script/worksheet assets
-> publish
-> analytics
-> controlled rule updates
```

---

## 3. System Map

```text
Strategy System
   |
   v
Curriculum System
   |
   v
Lesson System
   |
   v
Production System
   |
   v
Funnel / Distribution System
   |
   v
Analytics / Maintenance System
```

Automation supports all systems, but it is not source-of-truth.

Reference resources support production, but they are not mandatory process steps.

---

## 4. Core Lesson Production Flow

```text
01. Topic Lock
        |
        v
02. Teaching Skeleton
        |
        v
03. Skeleton Review
        |
        v
04. Output Architecture
        |
        v
05. Slide Structure Layer
        |
        v
06. Slide Structure QA
        |
        v
07. Slide Design Layer
        |
        v
08. Slide Design QA
        |
        v
09. Script
        |
        v
10. Script QA
        |
        v
11. Slide / Script Sync QA
        |
        v
12. Worksheet / Diagnostic Quiz / Shorts
        |
        v
13. HTML Scene / State Runtime
        |
        v
14. Audio Sync / Video Render
        |
        v
15. Publish
        |
        v
16. Analytics / Maintenance
```

Short form:

```text
Skeleton
-> Output Architecture
-> Slide Structure
-> Slide Design
-> Script
-> Scene / State Runtime
-> Sync / Render
-> Assets
-> Publish
-> Analytics
```

---

## 5. Ownership By Artifact

### Strategy Owns Positioning

Files:

```text
strategy/positioning/
strategy/business-plan/
strategy/offers/
strategy/pricing/
```

Owns:

```text
target learner
product ladder
offer promise
business goals
brand voice
```

### Curriculum Owns What To Teach

Target files:

```text
curriculum/n2-schedule.md
curriculum/grammar-clusters/*.md
```

Owns:

```text
lesson order
grammar cluster grouping
exam value
difficulty progression
coverage plan
```

### Skeleton Owns Teaching Truth

Example:

```text
production/00-active/wake-cluster/01-master-teaching-skeleton.md
```

Owns:

```text
grammar scope
learner pain
video promise
3-view method / Ý nghĩa - Dạng - Cách dùng
examples
traps
comparisons
worked example logic
worksheet / quiz promise
```

### Output Architecture Owns Beat Truth

Example:

```text
production/00-active/wake-cluster/05-wake-mvp-output-architecture.md
```

Owns:

```text
slide count
slide order
lesson beat roles
timing map
worked example location
diagnostic practice location
CTA location
MVP-specific tradeoffs
```

### Slide Structure Owns Visual Teaching Logic

Example:

```text
production/00-active/wake-cluster/03-slide-deck.md
```

Owns:

```text
source link
slide role
on-screen text
reveal states / production frames
script beat
teaching check
```

### Slide Design Owns Visual Execution

Reference:

```text
production/02-assets/design-briefs/lucida-slide-design-direction.md
```

Owns:

```text
layout
visual elements
hierarchy / emphasis
motion / reveal notes
component choice
design-system link
```

### Script Owns Spoken Teaching

Example:

```text
production/00-active/wake-cluster/02-script.md
```

Owns:

```text
teacher narration
spoken examples
transitions
pause / emphasis
audio readiness
CTA delivery
```

### Worksheet / Quiz Own Diagnostic Practice

Example:

```text
production/00-active/wake-cluster/06-worksheet-quiz-operating-spec.md
```

Owns:

```text
practice sequence
trap tags
answer explanations
diagnostic feedback
recommended review assets
```

---

## 6. Reference Resources

Reference resources are optional support layers.

They should be consulted when useful, but they are not mandatory steps in the critical path.

### Example Intelligence Bank

Path:

```text
production/02-assets/example-intelligence/
```

Use when:

```text
examples feel stiff
Vietnamese translations sound unnatural
the lesson needs more relatable situations
shorts need current / SNS-friendly angles
```

Rule:

```text
Example bank = reference layer
Skeleton = teaching truth
Output architecture = beat truth
```

The bank must not override grammar scope or add unsupported lesson beats.

### Design Direction

Path:

```text
production/02-assets/design-briefs/lucida-slide-design-direction.md
```

Use when:

```text
creating slide design layer
reviewing visual consistency
building Canva / PPT / video frames
```

The design direction may evolve into a full design system later.

### Subagent System Architecture

Path:

```text
automation/workflows/30-subagent-governance.md
```

Use when:

```text
splitting work across multiple bounded agents
defining role families
assigning write scope
reviewing whether a new subagent type is actually needed
```

Rule:

```text
Main agent owns orchestration and final truth.
Subagents own bounded execution or review.
```

### Runner Packs

Paths:

```text
automation/workflows/31-runner-example-lane.md
automation/workflows/32-runner-lesson-production.md
automation/workflows/33-runner-assessment.md
automation/workflows/34-runner-production.md
```

Use when:

```text
the same lane will be run more than once
bounded subagents need stable contracts
output shape drift would slow merge or QA
```

Rule:

```text
subagent architecture = governance layer
runner packs = execution layer
```

---

## 7. QA Gate Map

Main criteria:

```text
production/03-qa/criteria/00-three-output-review-gates.md
production/03-qa/criteria/01-skeleton-qa-criteria.md
production/03-qa/criteria/02-script-qa-criteria.md
production/03-qa/criteria/03-slide-qa-criteria.md
production/03-qa/criteria/04-slide-script-sync-criteria.md
```

Topic-specific extension example:

```text
production/03-qa/criteria/wake-slide-qa-criteria.md
```

Gate sequence:

```text
Gate 1 - Skeleton
Gate 2 - Output Architecture
Gate 3 - Slide Structure
Gate 4 - Slide Design
Gate 5 - Script
Gate 6 - Slide / Script Sync
Gate 7 - Worksheet / Quiz
Gate 8 - Video / Publish
Gate 9 - Analytics / Maintenance
```

Only Gate 1-6 currently have dedicated criteria files.

Gate 7-9 are now partially operationalized through runner packs, but still need dedicated criteria files when those lanes become active blockers:

```text
worksheet QA criteria
diagnostic quiz QA criteria
video / publish QA criteria
```

---

## 8. Maintenance Model

### Weekly Review

Review:

```text
active topic folder
current workflow state
open QA findings
next production blocker
```

Update:

```text
production/00-active/<topic>/
automation/workflows/20-lesson-production-sop.md if process changed
10-project-architecture-map.md only if project-wide architecture changed
```

### After Each Video Sample

Create or update:

```text
analytics/decisions/<topic>-decision-log.md
```

Record:

```text
what worked
what confused viewers
retention moments
worksheet / quiz CTR
comments and learner questions
production pain points
what rule should change, if any
```

### Rule Update Policy

Do not update global rules because of one-off preference.

Update global rules only when:

```text
the issue is repeatable
the fix improves future lessons
the owner accepts it as a standard
```

Where to update:

```text
single lesson issue        -> active topic files
teaching method issue      -> strategy/standards/
workflow issue             -> automation/workflows/
slide/design issue         -> production/03-qa/criteria/ or design-briefs/
example quality issue      -> production/02-assets/example-intelligence/
business/funnel issue      -> strategy/ or funnel/
analytics issue            -> analytics/
```

---

## 9. Folder Map

```text
opus-lucida/
├── 10-project-architecture-map.md
├── strategy/
├── curriculum/
├── automation/
│   └── workflows/
├── production/
│   ├── 00-active/
│   ├── 02-assets/
│   │   ├── design-briefs/
│   │   └── example-intelligence/
│   └── 03-qa/
├── funnel/
├── analytics/
└── docs/
```

Some target folders may not exist yet. Create them when the process reaches that layer.

---

## 10. Current Wake MVP State

Active topic:

```text
production/00-active/wake-cluster/
```

Current state:

```text
Skeleton: active
Output architecture: active
Slide structure layer: active
Slide design layer: pending
Script: active and synced to current approved examples
Worksheet / quiz: pending
Recording / video: pending
Runner packs: 21/22/23/24 active
```

Immediate next actions:

```text
1. Add Wake slide design layer.
2. Generate worksheet and diagnostic quiz from 06-worksheet-quiz-operating-spec.md.
3. Generate recording brief / publish handoff when learner-facing assets exist.
4. Continue video production.
5. Capture post-video decision log and feed lessons back into rules.
```

---

## 11. Current Architecture Gaps

Still needed:

```text
curriculum/n2-schedule.md
curriculum/grammar-clusters/
worksheet QA criteria
diagnostic quiz QA criteria
video / publish QA criteria
analytics decision log template
publish checklist
```

These should be added only when they unblock the next real production step.

---

## 12. Keep / Avoid Rule

Keep this file:

```text
short
project-wide
map-like
stable across multiple lessons
```

Avoid turning this file into:

```text
a duplicate of the detailed workflow
a dump of one topic's working notes
a long changelog
```

If a detail is lesson-specific, move it to:

```text
production/00-active/<topic>/
```

If a detail is step-by-step operational, move it to:

```text
automation/workflows/
```
