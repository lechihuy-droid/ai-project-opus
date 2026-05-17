# Lucida Docs And Workflows Mapping
**Status:** Canonical v0.1  
**Date:** 2026-05-06  
**Scope:** `docs/` and `automation/workflows/`  
**Role:** Map architecture/governance docs to operational workflow files and classify each file by status  
**Owner layer:** project operating map  
**Parent:** `10-project-architecture-map.md`, `11-current-operating-flow.md`, `12-repo-folder-status-map.md`  
**Supersedes:** none  
**Superseded by:** none

---

## 1. Purpose

This file answers:

```text
docs/ va automation/workflows/ map voi nhau the nao?
File nao la canonical?
File nao chi la reference?
File nao la historical planning?
```

Use this file before cleanup or before creating new process docs.

---

## 2. Core Rule

```text
docs/
= architecture, governance, planning, historical reasoning, references

automation/workflows/
= execution layer, SOPs, runner packs, gates, and operational contracts
```

Short form:

```text
docs explain the system
workflows run the system
```

---

## 3. Canonical Relationship

```text
10-project-architecture-map.md
-> top-level project architect

11-current-operating-flow.md
-> current live operating chain

12-repo-folder-status-map.md
-> canonical / reference / runtime interpretation

13-docs-workflows-mapping.md
-> docs/workflows bridge and cleanup map
```

Architecture lineage:

```text
docs/reference/architecture-content-course-source.md
-> docs/SD-beta-architecture.md
-> 10-project-architecture-map.md
-> 11-current-operating-flow.md
-> automation/workflows/20-38
```

---

## 4. `docs/` File Classification

| File | Status | Role | Workflow counterpart |
|---|---|---|---|
| `docs/RD-beta-launch.md` | `REFERENCE` | beta launch requirements and scope | `37-automation-execution-contract.md`, `36-automation-flow-matrix.md` |
| `docs/SD-beta-architecture.md` | `REFERENCE` | beta architecture and source-trace thinking | `20-lesson-production-sop.md`, `35-automation-gated-execution-flow.md` |
| `docs/history/BD-phase-1-foundation.md` | `HISTORICAL` | phase-1 build planning | partially absorbed into `10-project-architecture-map.md` and `11-current-operating-flow.md` |
| `docs/history/PLAN-opus-lucida-foundation.md` | `HISTORICAL` | early foundation planning | no direct active owner; keep as planning history |
| `docs/BD-sample-product-bundle.md` | `REFERENCE` | sample product bundle thinking | `33-runner-assessment.md`, funnel/asset planning later |
| `docs/BD-sample-video-validation.md` | `REFERENCE` | sample video validation thinking | `production/03-qa/criteria/**`, `20-lesson-production-sop.md` |
| `docs/research-video-automation.md` | `REFERENCE` | research base for video pipeline decisions | `34-runner-production.md`, `38-audio-generation-sop.md` |
| `docs/history/REVIEW-mvp-output-audit-2026-04-29.md` | `HISTORICAL` | dated audit snapshot | no active owner; keep as review history |
| `docs/wireframe-chatgpt-handoff.html` | `REFERENCE` | visual handoff reference | no workflow owner; reference only |
| `docs/reference/architecture-content-course-source.md` | `REFERENCE_SOURCE` | original architecture source material | upstream source for `10-project-architecture-map.md` |
| `docs/reference/lucida-flow-streamline-mermaid.md` | `REFERENCE_SOURCE` | flow visualization reference | loosely related to `35-automation-gated-execution-flow.md` |
| `docs/reference/lucida-flow-streamline.html` | `REFERENCE_SOURCE` | visualized reference flow | loosely related to `35-automation-gated-execution-flow.md` |

---

## 5. `automation/workflows/` File Classification

| File | Status | Role | Docs counterpart |
|---|---|---|---|
| `20-lesson-production-sop.md` | `CANONICAL` | main lesson-production SOP | `10-project-architecture-map.md`, `docs/SD-beta-architecture.md` |
| `30-subagent-governance.md` | `CANONICAL` | subagent governance architecture | no direct docs equivalent; operational governance layer |
| `31-runner-example-lane.md` | `CANONICAL` | example lane runner | lesson/sample and example-intelligence reference docs |
| `32-runner-lesson-production.md` | `CANONICAL` | lesson-production runner | `20-lesson-production-sop.md` |
| `33-runner-assessment.md` | `CANONICAL` | worksheet / quiz / repurposing runner | product bundle and assessment planning docs |
| `34-runner-production.md` | `CANONICAL` | render / TTS / publish runner | `docs/research-video-automation.md` |
| `35-automation-gated-execution-flow.md` | `CANONICAL` | full automation execution graph | `10-project-architecture-map.md`, `docs/SD-beta-architecture.md` |
| `36-automation-flow-matrix.md` | `ACTIVE_SUPPORT` | matrix summary of automation flow | `35-automation-gated-execution-flow.md` |
| `37-automation-execution-contract.md` | `CANONICAL` | execution contract across lanes | `docs/RD-beta-launch.md` |
| `38-audio-generation-sop.md` | `CANONICAL` | audio / TTS / RVC / assembly SOP | `docs/research-video-automation.md` |
| `39-html-video-generation-sop.md` | `CANONICAL` | HTML runtime video generation strategy and upgrade SOP | `10-project-architecture-map.md`, `docs/research-video-automation.md` |
| `automation/workflows/99-archive/**` | `ARCHIVE` | superseded or exploratory automation docs | historical only |

---

## 6. One-To-Many Mapping

Some docs files map to multiple workflow files.

### 6.1 `docs/SD-beta-architecture.md`

Owns:

```text
beta architecture logic
source traceability
component boundaries
```

Operationalized by:

```text
20-lesson-production-sop.md
35-automation-gated-execution-flow.md
36-automation-flow-matrix.md
```

### 6.2 `docs/research-video-automation.md`

Owns:

```text
video automation research and tradeoff thinking
```

Operationalized by:

```text
34-runner-production.md
38-audio-generation-sop.md
automation/video/*.py
```

### 6.3 `docs/RD-beta-launch.md`

Owns:

```text
beta launch requirement direction
```

Operationalized by:

```text
37-automation-execution-contract.md
36-automation-flow-matrix.md
```

---

## 7. Cleanup Guidance

### 7.1 Keep active

Keep these as active/canonical:

```text
10-project-architecture-map.md
11-current-operating-flow.md
12-repo-folder-status-map.md
13-docs-workflows-mapping.md
automation/workflows/20-38.md
```

### 7.2 Keep but treat as reference

Keep these, but do not treat them as active SOP owners:

```text
docs/RD-beta-launch.md
docs/SD-beta-architecture.md
docs/research-video-automation.md
docs/BD-sample-product-bundle.md
docs/BD-sample-video-validation.md
docs/reference/**
```

### 7.3 Keep as historical

These are valid history, but should not compete with active flow files:

```text
docs/history/BD-phase-1-foundation.md
docs/history/PLAN-opus-lucida-foundation.md
docs/history/REVIEW-mvp-output-audit-2026-04-29.md
```

### 7.4 Archive only

```text
automation/workflows/99-archive/**
```

---

## 8. Creation Rule Going Forward

When a new process doc is proposed:

```text
1. Check whether it belongs in docs/ or automation/workflows/
2. Find the active owner file for that concern
3. Update the owner or explicitly supersede it
4. Add the new file to this mapping if it stays active
```

If not, do not create the new file.
