# Wake HTML Video Upgrade Plan
**Status:** Active upgrade plan v0.2  
**Date:** 2026-05-06  
**Scope:** `wake-cluster`  
**Role:** Topic-level upgrade plan for replacing screenshot-frame assembly with HTML scene/state video runtime  
**Owner layer:** lane upgrade plan  
**Parent:** `../../../automation/workflows/39-html-video-generation-sop.md`  
**Supersedes:** screenshot-frame production assumptions in the active Wake lane  
**Superseded by:** none

---

## 1. Goal

Upgrade Wake from:

```text
03-slide-deck.md
-> HTML deck
-> screenshot PNGs
-> audio assembly
```

to the new active production contract:

```text
03-slide-deck.md
-> scene/state map
-> HTML runtime
-> timed render
-> audio sync
-> final video
```

This is no longer treated as a side migration track.
It is the active direction that should overwrite the old contract once each lane is verified.

---

## 2. Current State

Wake already has:

```text
- locked skeleton
- stable slide deck structure
- stable script
- scene/state timing map
- HTML deck generator
- HTML runtime artifact
- audio pipeline
```

---

## 3. File-Level Upgrade

### Keep as truth

```text
01-master-teaching-skeleton.md
02-script.md
03-slide-deck.md
```

### Reinterpret as active contract

```text
08-production-frame-map.md
-> scene/state timing map
```

### Upgrade in place

```text
wake-cluster-deck.html
-> runtime scene/state HTML
```

### Downgrade to support-only

```text
frames/slide-*.png
```

---

## 4. Upgrade Steps

```text
Step 1. Reframe 08-production-frame-map.md as scene/state timing map
Step 2. Add scene/state identifiers to the HTML runtime layer
Step 3. Decide timing model per scene
Step 4. Align script beats to states
Step 5. Build runtime playback path
Step 6. Test one worked-example scene
Step 7. Expand to full Wake deck
Step 8. Lock new production readiness rule
Step 9. Demote the old screenshot-first assumptions to legacy-only
```

Pilot priority:

```text
1. Slide 14 Worked Example
2. Slide 02 Hook Quiz
3. Slide 15 Diagnostic Practice
```

---

## 5. Success Condition

Wake upgrade succeeds when:

```text
- the worked example scene runs as timed HTML states
- hook quiz and diagnostic scenes also run as states
- audio sync respects state timing
- PNG export is optional, not the core video assumption
- old screenshot-first wording no longer survives in active owner files
```

---

## 6. Agile Sprint Cadence

Wake should upgrade in runnable HTML blocks, not as a full-deck rewrite.

```text
Sprint 1 -> Slides 01-05
Sprint 2 -> Slides 06-09
Sprint 3 -> Slides 10-14
Sprint 4 -> Slides 15-17
```

Rule:

```text
Each sprint must produce:
- locked slide block
- aligned scene/state map for that block
- runnable block HTML
- short PASS / REVISE / BLOCK review
```

Current verification:

```text
Sprint 1 output:
- wake-cluster-deck-01-05.html
- 16-wake-html-runtime-pilot-review-01-05.md
```

Sprint artifact naming convention:

```text
Sprint 1 -> wake-cluster-deck-01-05.html
Sprint 2 -> wake-cluster-deck-06-09.html
Sprint 3 -> wake-cluster-deck-10-14.html
Sprint 4 -> wake-cluster-deck-15-17.html
```

---

## 7. Replacement Rule

When the HTML runtime path is verified for a block or for the full lane:

```text
1. update the active owner file
2. demote the old contract to legacy support
3. do not keep both paths framed as co-equal active production flows
```
