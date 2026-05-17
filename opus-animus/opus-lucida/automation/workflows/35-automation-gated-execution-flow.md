# Automation Gated Execution Flow
**Status:** Active v2  
**Role:** Standardized automation flow for running Lucida lesson production with bounded agents, explicit tooling, and mandatory review gates

---

## 1. Purpose

This file translates Lucida's process and runner packs into one automation-ready execution graph.

It answers:

```text
Which steps can run automatically?
Which tools or runners should execute them?
Which files should each step create or update?
Where must the system stop for review?
What does the main agent decide at each gate?
```

Use this file when designing or running an automated lesson pipeline.

---

## 2. Core Principle

Lucida automation should not be:

```text
topic
-> one giant generation run
-> publish
```

Lucida automation should be:

```text
prepare inputs
-> run bounded lane
-> write explicit artifact
-> stop at gate
-> review / merge / decide
-> continue
```

Short form:

```text
automation by lane
not automation by blind end-to-end generation
```

---

## 3. Execution Modes

Use four execution modes:

```text
AUTO_RUN
= can run without human pause if upstream truth is locked

PARALLEL_AUTO
= can run in parallel because write scope does not overlap

GATE_STOP
= must stop and wait for main-agent review

AUTO_RUN
= needs human or main-agent decision before continuing
```

---

## 4. Tooling Legend

Use these labels consistently inside this file:

```text
MAIN_AGENT
= orchestration, merge, patch, and gate clearing

RUNNER_PACK
= one of the lane execution packs in automation/workflows/31-34-*.md

SUBAGENT
= bounded worker invoked through a runner pack

LOCAL_EDIT
= direct file patch by the main agent

QA_CRITERIA
= review rule file used at a gate
```

When a step lists:

```text
Tooling
Writes
```

read it as:

```text
Tooling = who or what should execute the step
Writes = which artifact(s) that step is expected to create or modify
```

---

## 5. Main Flow

```text
Phase 0  - Input readiness
Phase 1  - Example lane
Phase 2  - Lesson production lane
Phase 3  - Assessment lane
Phase 4  - Production lane
Phase 5  - Maintenance lane
```

---

## 6. Phase 0 - Input Readiness

### Step 0.1 Topic Lock

Mode:

```text
MANUAL_ESCALATION
```

Tooling:

```text
MAIN_AGENT
```

Writes:

```text
topic decision recorded in:
- production/00-active/<topic-slug>/README.md
or
- active context / handoff note
```

Why:

```text
This is strategic, not just operational.
```

Main agent must confirm:

- topic scope;
- learner pain;
- public hook angle;
- lesson is worth producing as a sample.

### Step 0.2 Source-of-Truth Lock

Mode:

```text
GATE_STOP
```

Tooling:

```text
MAIN_AGENT
```

Writes:

```text
path lock only
no major content generation yet
```

Main agent must confirm:

- active topic folder exists;
- skeleton path exists or is about to be created;
- architecture file exists or is planned;
- approved example bank path is known if needed.

Do not spawn downstream lanes before source paths are explicit.

---

## 7. Phase 1 - Example Lane

Runner pack:

```text
automation/workflows/31-runner-example-lane.md
```

Default artifact family:

```text
production/02-assets/example-intelligence/<topic>/
- <topic>-example-candidates.md
- <topic>-approved-examples.md
```

### Step 1.1 Situation Research

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 31
-> SUBAGENT role family: research
```

Writes:

```text
read_only by default
optional scene notes merged later into:
- ...example-candidates.md
```

### Step 1.2 Japanese Naturalness

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 31
-> SUBAGENT role family: localization
```

Writes:

```text
...example-candidates.md
```

### Step 1.3 Vietnamese Naturalness

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 31
-> SUBAGENT role family: localization
```

Writes:

```text
...example-candidates.md
```

### Step 1.4 Pedagogy Fit

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 31
-> SUBAGENT role family: pedagogy
```

Writes:

```text
read_only review output
or notes merged by MAIN_AGENT into:
- ...example-candidates.md
```

### Step 1.5 Curation

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 31
-> SUBAGENT role family: curation
-> MAIN_AGENT clears gate
```

Writes:

```text
...approved-examples.md
```

Main agent reviews:

- one primary spine only;
- one practical expansion only;
- at most one trend-aware support example;
- example roles are explicit;
- approved set is safe to feed into skeleton / slide / script.

Decision:

```text
PASS
-> promote approved examples downstream

REVISE
-> rerun one or more example subagents

BLOCK
-> fix topic or lesson truth first
```

---

## 8. Phase 2 - Lesson Production Lane

Runner pack:

```text
automation/workflows/32-runner-lesson-production.md
```

Default artifact family:

```text
production/00-active/<topic-slug>/
- 01-master-teaching-skeleton.md
- 03-slide-deck.md
- 02-script.md
```

### Step 2.1 Skeleton QA

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: qa
-> QA_CRITERIA:
   production/03-qa/criteria/01-skeleton-qa-criteria.md
-> MAIN_AGENT clears gate
```

Writes:

```text
read_only review
patch target if needed:
- 01-master-teaching-skeleton.md
```

Why:

```text
Skeleton is teaching truth.
Do not auto-continue on a weak skeleton.
```

### Step 2.2 Slide Structure

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: pedagogy
or MAIN_AGENT via LOCAL_EDIT
```

Writes:

```text
03-slide-deck.md
Structure Layer only
```

### Step 2.3 Slide Structure QA

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: qa
-> QA_CRITERIA:
   production/03-qa/criteria/03-slide-qa-criteria.md
   production/03-qa/criteria/<topic>-slide-qa-criteria.md
-> MAIN_AGENT clears gate
```

Writes:

```text
read_only review
patch target if needed:
- 03-slide-deck.md Structure Layer
```

Main agent checks:

- skeleton-to-slide mapping is intact;
- slide roles are clear;
- structure is worth designing.

### Step 2.4 Slide Design

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: design
or MAIN_AGENT via LOCAL_EDIT
```

Writes:

```text
03-slide-deck.md
Design Layer only
```

### Step 2.5 Slide Design QA

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: qa
-> QA_CRITERIA:
   production/03-qa/criteria/03-slide-qa-criteria.md
   production/02-assets/design-briefs/lucida-slide-design-direction.md
-> MAIN_AGENT clears gate
```

Writes:

```text
read_only review
patch target if needed:
- 03-slide-deck.md Design Layer
```

Why:

```text
Design must not silently alter meaning.
```

### Step 2.6 Script Polish

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: localization
or MAIN_AGENT via LOCAL_EDIT
```

Writes:

```text
02-script.md
```

### Step 2.7 Script QA

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: qa
-> QA_CRITERIA:
   production/03-qa/criteria/02-script-qa-criteria.md
-> MAIN_AGENT clears gate
```

Writes:

```text
read_only review
patch target if needed:
- 02-script.md
```

Main agent checks:

- grammar and nuance;
- Japanese and Vietnamese naturalness;
- example role clarity;
- audio readiness.

### Step 2.8 Slide / Script Sync QA

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 32
-> SUBAGENT role family: qa
-> QA_CRITERIA:
   production/03-qa/criteria/04-slide-script-sync-criteria.md
-> MAIN_AGENT clears gate
```

Writes:

```text
read_only review
patch targets if needed:
- 03-slide-deck.md
- 02-script.md
```

This is the final gate before learner-facing assets and recording.

If failed:

```text
return only to the narrowest broken lane:
slide structure
slide design
script
```

Do not restart the whole pipeline by default.

---

## 9. Phase 3 - Assessment Lane

Runner pack:

```text
automation/workflows/33-runner-assessment.md
```

Default artifact family:

```text
production/worksheets/<topic-slug>.md
production/00-active/<topic-slug>/<topic-slug>-diagnostic-quiz.md
production/shorts/<topic-slug>.md
```

### Step 3.1 Worksheet Builder

Mode:

```text
PARALLEL_AUTO
```

Tooling:

```text
RUNNER_PACK 33
-> SUBAGENT role family: pedagogy
```

Writes:

```text
production/worksheets/<topic-slug>.md
```

### Step 3.2 Diagnostic Quiz Builder

Mode:

```text
PARALLEL_AUTO
```

Tooling:

```text
RUNNER_PACK 33
-> SUBAGENT role family: pedagogy
```

Writes:

```text
production/00-active/<topic-slug>/<topic-slug>-diagnostic-quiz.md
```

Parallel condition:

```text
Both read the same locked lesson truth.
They do not write the same file.
```

### Step 3.3 Answer / Trap QA

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 33
-> SUBAGENT role family: qa
-> MAIN_AGENT clears gate
```

Writes:

```text
read_only review
patch targets if needed:
- worksheet file
- diagnostic quiz file
```

Main agent checks:

- practice matches the lesson;
- distractors are tempting for named reasons;
- explanations teach why wrong answers feel right.

### Step 3.4 Shorts / Repurposing

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 33
-> SUBAGENT role family: curation
```

Writes:

```text
production/shorts/<topic-slug>.md
```

### Step 3.5 Assessment Merge Gate

Mode:

```text
GATE_STOP
```

Tooling:

```text
MAIN_AGENT
with outputs from RUNNER_PACK 33
```

Writes:

```text
merged assessment set is considered locked:
- worksheet
- diagnostic quiz
- shorts pack
```

Main agent checks:

- worksheet, quiz, and shorts share the same promise;
- CTA assets do not drift;
- repurposing does not invent a new lesson.

---

## 10. Phase 4 - Production Lane

Runner pack:

```text
automation/workflows/34-runner-production.md
```

Default artifact family:

```text
production/00-active/<topic-slug>/02-script.md
production/00-active/<topic-slug>/wake-cluster-deck.html
production/00-active/<topic-slug>/08-production-frame-map.md
production/recording/<topic-slug>-recording-brief.md
publish handoff file(s) chosen by MAIN_AGENT
production/00-active/<topic-slug>/post-video-decision-log.md
```

### Step 4.0 Slide Build + Frame Export

Current implementation:

```text
AUTO_RUN
03-slide-deck.md
-> deck_generator.py (Jinja2)
-> wake-cluster-deck.html
-> runtime scene/state render
```

Reveal milestones from `08-production-frame-map.md` remain valid. In this pipeline, reveal states become renderable HTML runtime states and timing hooks. Any leftover one-frame-per-audio assumptions are upgrade debt, not the active production contract.

Note:

```text
This current implementation supersedes the legacy Canva/manual wording below.
The legacy wording should be removed when the production docs are cleaned.
```

Mode:

```text
MANUAL_ESCALATION
```

Tooling:

```text
MANUAL — human builds slides in Canva from locked 03-slide-deck.md Design Layer
```

Writes:

```text
production/00-active/<topic-slug>/wake-cluster-deck.html
production/00-active/<topic-slug>/08-production-frame-map.md
...
production/00-active/<topic-slug>/video/raw-<topic>.mp4
```

Naming rule:

```text
slide-01.png ... slide-NN.png
zero-padded, matching script slide numbers exactly
```

Parallel rule:

```text
Step 4.0 (Slide Build) and Step 4.1 (TTS Pass) may run in parallel.
Both read from locked upstream artifacts and write to different folders.
```

Gate to proceed:

```text
Gate G (Slide / Script Sync QA) must pass before starting 4.0.
Design Layer in 03-slide-deck.md must be locked.
```

Why this step exists:

```text
Audio pipeline (Step 4.5) requires the locked HTML runtime and scene/state timing map.
Legacy screenshot export may still be used for inspection, but it no longer defines the production path.
Human review still clears render quality before publish.
```

### Step 4.1 TTS / Pause Pass

Mode:

```text
AUTO_RUN
```

Tooling:

```text
RUNNER_PACK 34
-> SUBAGENT role family: localization
```

Writes:

```text
02-script.md
markers only
```

Restriction:

```text
TTS pass may adjust markers only.
It must not rewrite content.
```

### Step 4.2 Recording Brief Builder

Mode:

```text
PARALLEL_AUTO
```

Tooling:

```text
RUNNER_PACK 34
-> SUBAGENT role family: curation
```

Writes:

```text
production/recording/<topic-slug>-recording-brief.md
```

### Step 4.3 Publish Handoff Builder

Mode:

```text
PARALLEL_AUTO
```

Tooling:

```text
RUNNER_PACK 34
-> SUBAGENT role family: curation
```

Writes:

```text
publish handoff file(s) chosen by MAIN_AGENT
for example:
- production/publish/<topic-slug>-publish-handoff.md
- production/shorts/<topic-slug>.md when repurposing snippets are updated
```

Parallel condition:

```text
Script is already stable.
```

### Step 4.4 Production Readiness Gate

Mode:

```text
GATE_STOP
```

Tooling:

```text
MAIN_AGENT
using outputs from RUNNER_PACK 34
```

Writes:

```text
path/state lock for production handoff
no major lesson rewrite here
```

Main agent checks:

- TTS markers are usable;
- recording brief matches slide/script truth;
- publish handoff does not overpromise;
- linked assets actually exist.

### Step 4.5 Video Build / Publish

Mode:

```text
MANUAL_ESCALATION
```

Tooling:

```text
RUNNER_PACK 34 §9 — Audio Generation Runner
-> automation/workflows/38-audio-generation-sop.md (full SOP)

Sub-steps:
  4.5.1  TTS generation    tts_agent.py     → audio/slide-*.mp3
  4.5.2  RVC conversion    rvc_agent.py     → audio-rvc/rvc-slide-*.wav
  4.5.3  Assembly          assembly_agent.py → video/raw-<topic>.mp4

Locked HTML runtime and scene/state timing map must exist before running.
```

Writes:

```text
production/00-active/<topic>/audio/
production/00-active/<topic>/audio-rvc/    (if RVC active)
production/00-active/<topic>/video/raw-<topic>.mp4
production/00-active/<topic>/07-automation-status.md
```

Why:

```text
Audio pipeline is scripted and repeatable.
Human review required after assembly — pacing and voice quality
cannot be validated by code alone.
```

---

## 11. Phase 5 - Maintenance Lane

### Step 5.1 Post-Video Decision Log

Runner:

```text
34-runner-production.md
```

Mode:

```text
GATE_STOP
```

Tooling:

```text
RUNNER_PACK 34
-> SUBAGENT role family: qa
-> MAIN_AGENT clears gate
```

Writes:

```text
production/00-active/<topic-slug>/post-video-decision-log.md
```

Main agent checks:

- local lesson issues are separated from global process issues;
- rule updates are justified by repeatable evidence;
- one-off preferences are not promoted to standards.

---

## 12. Gate Summary

Mandatory gates:

```text
Gate A  - Source-of-truth lock
Gate B  - Example curation
Gate C  - Skeleton QA
Gate D  - Slide Structure QA
Gate E  - Slide Design QA
Gate F  - Script QA
Gate G  - Slide / Script Sync QA
Gate H  - Answer / Trap QA
Gate I  - Assessment merge
Gate J  - Production readiness
Gate K  - Post-video decision log
```

Only the main agent may clear a gate.

---

## 13. Tool-to-Artifact Summary

```text
31-runner-example-lane.md
-> example-candidates.md
-> approved-examples.md

32-runner-lesson-production.md
-> 01-master-teaching-skeleton.md
-> 03-slide-deck.md
-> 02-script.md

33-runner-assessment.md
-> production/worksheets/<topic-slug>.md
-> <topic-slug>-diagnostic-quiz.md
-> production/shorts/<topic-slug>.md

34-runner-production.md
-> 02-script.md (TTS markers only)
-> production/recording/<topic-slug>-recording-brief.md
-> publish handoff file(s)
-> post-video-decision-log.md
```

---

## 14. Standard Retry Rule

When a gate fails:

```text
1. identify the narrowest broken artifact
2. rerun only the relevant lane
3. keep upstream locked files stable unless the gate proves they are wrong
```

Examples:

```text
bad slide hierarchy
-> rerun Slide Design

bad script naturalness
-> rerun Script Polish

bad distractors
-> rerun Diagnostic Quiz Builder

wrong lesson promise
-> return to skeleton or architecture
```

---

## 15. Keep / Avoid Rule

Keep this flow:

```text
gate-driven
lane-based
reviewable
restartable by section
tool-to-artifact explicit
```

Avoid:

```text
one-shot end-to-end generation
parallel writers on one file
auto-publishing after generation
global rule updates without evidence
tooling that writes artifacts with no named owner
```
