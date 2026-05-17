# Lucida Repo Folder Status Map
**Status:** Canonical v0.1  
**Date:** 2026-05-06  
**Role:** Clarify which top-level folders are canonical, reference-only, runtime-only, or archive-adjacent

---

## 1. Purpose

This file exists because `opus-lucida` has grown in layers:

```text
strategy
framework
production
automation
docs
runtime outputs
older references
```

Without a status map, the repo feels more scattered than it actually is.

Use this file to answer:

```text
Which folders should people actively use?
Which folders are references?
Which folders are runtime-only?
Which folders should not be treated as source-of-truth?
```

---

## 2. Top-Level Folder Status

```text
strategy/    = CANONICAL
framework/   = CANONICAL
production/  = CANONICAL
automation/  = CANONICAL
docs/        = REFERENCE + GOVERNANCE
lessons/     = SUPPORTING / SAMPLE
analytics/   = PLANNED / LIGHT
funnel/      = PLANNED / LIGHT
models/      = RUNTIME / SUPPORT
base_models/ = RUNTIME / SUPPORT
output/      = GENERATED / NON-CANONICAL
space/       = EXTERNAL RUNTIME / DEPLOYMENT SUPPORT
.venv-rvc/   = LOCAL RUNTIME ONLY
```

---

## 3. Folder Roles

### 3.1 `strategy/`

Status:

```text
CANONICAL
```

Owns:

```text
positioning
business plan
product ladder
pricing / offer logic
```

Use when:

```text
You are deciding what Lucida is for and who it serves.
```

### 3.2 `framework/`

Status:

```text
CANONICAL
```

Owns:

```text
lesson method
3-view grammar logic
slide method
```

Use when:

```text
You are deciding how Lucida should teach.
```

### 3.3 `production/`

Status:

```text
CANONICAL
```

Owns:

```text
active lesson lanes
slide-system rules
assets
QA criteria
archive
```

Use when:

```text
You are producing, reviewing, or tracing a lesson artifact.
```

### 3.4 `automation/`

Status:

```text
CANONICAL
```

Owns:

```text
workflow SOPs
runners
execution governance
video build scripts
audio pipeline rules
```

Use when:

```text
You are executing or maintaining the production pipeline.
```

### 3.5 `docs/`

Status:

```text
REFERENCE + GOVERNANCE
```

Owns:

```text
RD / SD / BD
historical planning
source-trace references
research notes
```

Important rule:

```text
docs/ is important,
but it is not the main operational lane for active lesson production.
```

### 3.6 `lessons/`

Status:

```text
SUPPORTING / SAMPLE
```

Owns:

```text
sample lessons
templates
lesson candidates
```

Use when:

```text
You need sample teaching material or seed structures.
```

### 3.7 `analytics/` and `funnel/`

Status:

```text
PLANNED / LIGHT
```

Meaning:

```text
These folders belong to the architecture,
but they are not yet the heaviest operational centers in the current Wake-first phase.
```

### 3.8 `models/`, `base_models/`, `output/`, `space/`, `.venv-rvc/`

Status:

```text
RUNTIME / SUPPORT / GENERATED
```

Rule:

```text
Do not treat these as project-governance source-of-truth folders.
```

---

## 4. File-Level Canonical Entry Points

Use these as the main repo entry files:

```text
README.md
10-project-architecture-map.md
11-current-operating-flow.md
12-repo-folder-status-map.md
```

Meaning:

```text
README.md
-> project overview

10-project-architecture-map.md
-> top-level project architect

11-current-operating-flow.md
-> current operating flow

12-repo-folder-status-map.md
-> where things belong and how to interpret folders
```

---

## 5. Current Cleanup Rule

When cleaning Lucida, prefer this order:

```text
1. delete or archive outdated process duplicates
2. promote one canonical file per concern
3. mark reference folders clearly
4. avoid deleting runtime/support folders unless confirmed unused
```

Safe cleanup target types:

```text
- superseded process docs
- duplicate review passes
- old lane-local plans that are no longer the active decision layer
```

Avoid blind cleanup of:

```text
- docs/reference/
- automation/workflows/
- runtime folders
```

unless a newer canonical replacement is already explicit.
