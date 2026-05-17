# Wake Cluster Active
**Status:** Active
**Role:** One-folder source for the MVP teaching lane

---

## Purpose

This folder holds the backbone artifacts for the public sample video and its runtime build:

```text
01-master-teaching-skeleton.md
-> 02-script.md
-> 03-slide-deck.md
```

Use this folder when you need the canonical version of the lesson.

Lane resume file:

```text
HANDOFF.md
```

---

## Artifact Roles

### `01-master-teaching-skeleton.md`

Teaching truth.

Defines:

- pain point
- hook
- story
- grammar logic
- comparison logic
- dau hieu chon mau
- practice core
- downstream contracts

### `02-script.md`

Narration truth.

Defines:

- spoken flow
- slide-by-slide narration
- pacing
- CTA language
- recording-level explanation

### `03-slide-deck.md`

Presentation truth.

Defines:

- on-screen text
- visual intent
- script source
- teaching check
- slide QA basis

---

## Dependency Rule

```text
Skeleton
-> Slide architecture
-> Script
-> Frame map
-> Rendered deck / frames
```

More precisely:

```text
01-master-teaching-skeleton.md
-> 03-slide-deck.md
-> 02-script.md
-> 08-production-frame-map.md
-> wake-cluster-deck.html
-> timed video render
```

If the skeleton changes, review both slide deck and script.

If the slide deck changes, review script sync and frame map.

If the script changes, review slide sync and frame map.

---

## Current Topic

```text
わけだ
わけではない
わけがない
わけにはいかない
```

Public sample / Video 1.
