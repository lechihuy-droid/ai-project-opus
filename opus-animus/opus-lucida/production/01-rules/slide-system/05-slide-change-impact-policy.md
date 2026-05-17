# Lucida Slide Change Impact Policy
**Status:** Active v1  
**Scope:** Slide, script, HTML frame, worksheet / quiz changes  
**Role:** Prevent local slide edits from drifting away from skeleton, script, and production goals

---

## 1. Core Rule

No slide change is "just visual" until impact is checked.

Every meaningful change must be classified by impact type:

```text
Truth change
Wording change
Template change
Example change
Quiz / trap change
Production change
```

---

## 2. Impact Matrix

| Change type | Examples | Must check |
|---|---|---|
| Truth change | grammar meaning, scope, answer logic | skeleton, script, slide, worksheet, quiz |
| Wording change | on-screen label, takeaway, CTA line | slide/script sync, learner-facing terminology |
| Template change | Grammar Card -> Comparison Pair | slide architecture, script role, HTML render |
| Example change | Japanese example, Vietnamese translation | example bank, naturalness QA, script, worksheet |
| Quiz / trap change | answer, distractor, trap tag | skeleton, worked example, worksheet/diagnostic |
| Production change | HTML layout, frame count, reveal implementation | frame export, audio segment count, assembly |

---

## 3. Required Trace Fields

Before a slide is locked, it must have:

```text
Slide number
Objective
Skeleton source
Template
On-screen claim
Script block
Assessment follow-up if any
Production frame
Impact notes
Decision
```

If a slide lacks traceability:

```text
Do not lock audio.
Do not treat HTML as source of truth.
Return to slide architecture spec.
```

---

## 4. Decision Labels

Use:

```text
LOCK
LOCK_WITH_NOTES
REVISE
BLOCK
```

Decision meaning:

```text
LOCK = safe for audio / video.
LOCK_WITH_NOTES = acceptable for MVP; polish later.
REVISE = fix before final frame export.
BLOCK = upstream source is unclear; return to skeleton or architecture.
```

---

## 5. MVP Exception

For the current Wake MVP, `wake-cluster-deck.html` may be patched directly only when:

```text
1. the change is reflected in the Wake traceability matrix;
2. the change does not alter grammar truth;
3. exported frames still match 17 script/audio segments;
4. any script-sync risk is explicitly noted.
```

After MVP, production deck generation should return to:

```text
03-slide-deck.md
-> deck_generator.py
-> wake-cluster-deck.html
-> frames
```

