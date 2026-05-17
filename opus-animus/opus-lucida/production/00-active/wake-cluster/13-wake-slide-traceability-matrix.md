# Wake Slide Traceability Matrix
**Status:** Active MVP lock draft  
**Date:** 2026-05-06  
**Purpose:** Track every Wake slide from objective to skeleton, template, script, assessment, and production frame.

---

## 1. Source Rules

```text
production/01-rules/slide-system/01-slide-architecture-framework.md
production/01-rules/slide-system/02-slide-template-library.md
production/01-rules/slide-system/03-slide-design-production-rules.md
production/01-rules/slide-system/04-slide-framework-qa-checklist.md
production/01-rules/slide-system/05-slide-change-impact-policy.md
```

---

## 2. MVP Constraint

```text
1 logical slide = 1 PNG frame = 1 audio segment
```

Production frames:

```text
production/00-active/wake-cluster/frames/slide-01.png ... slide-17.png
```

---

## 3. Trace Matrix

| Slide | Objective | Skeleton source | Template | Script block | Assessment follow-up | Frame | Decision |
|---|---|---|---|---|---|---|---|
| 01 | Create pain: same `わけ`, different speaker logic | §3 Hook Core | Hook Contrast | Slide 01 | none | slide-01.png | LOCK |
| 02 | Let learner try before explanation, then quick payoff | §3 Hook Quiz | Quiz Before / After | Slide 02 | diagnostic Q1 seed | slide-02.png | LOCK_WITH_NOTES |
| 03 | Promise exam speed + real-life use | §2 Audience and Promise | Promise Board | Slide 03 | worksheet front promise | slide-03.png | LOCK_WITH_NOTES |
| 04 | Ground lesson in real situation | §4 Story Core | Story Context | Slide 04 | real-life practice item | slide-04.png | LOCK_WITH_NOTES |
| 05 | Introduce reusable thinking method | §5-6 Big Idea / Terminology | Method Board | Slide 05 | worksheet method table | slide-05.png | LOCK_WITH_NOTES |
| 06 | Teach `わけではない` as correction / denial of assumption | §7 GP1 | Grammar Card | Slide 06 | correction vs denial drill | slide-06.png | LOCK_WITH_NOTES |
| 07 | Teach `わけにはいかない` as constraint | §7 GP2 | Grammar Card | Slide 07 | constraint drill | slide-07.png | LOCK_WITH_NOTES |
| 08 | Teach `わけだ` as logical conclusion | §7 GP3 | Grammar Card | Slide 08 | conclusion arrow drill | slide-08.png | LOCK_WITH_NOTES |
| 09 | Teach `わけがない` as strong denial of possibility | §7 GP4 | Grammar Card | Slide 09 | intensity drill | slide-09.png | LOCK_WITH_NOTES |
| 10 | Convert 4 patterns into 4 speaker actions | §5 Big Idea | Comparison Matrix | Slide 10 | one-page logic map | slide-10.png | LOCK |
| 11 | Separate soft correction vs strong denial | §8 Minimal Pair | Minimal Pair | Slide 11 | minimal pair drill | slide-11.png | LOCK_WITH_NOTES |
| 12 | Separate possibility judgment vs constrained action | §8 Minimal Pair | Minimal Pair | Slide 12 | minimal pair drill | slide-12.png | LOCK_WITH_NOTES |
| 13 | Convert logic into answer-choice behavior | §9 JLPT Clue Map | Clue Map / Decision Rule | Slide 13 | guided clue table | slide-13.png | LOCK_WITH_NOTES |
| 14 | Model solving process on hook question | §10 Worked Example | Worked Example Board | Slide 14 | worked example review | slide-14.png | LOCK_WITH_NOTES |
| 15 | Let learner diagnose trap type | §11 Practice | Diagnostic Practice | Slide 15 | trap-tag quiz item | slide-15.png | LOCK_WITH_NOTES |
| 16 | Lock memory map | §12 Summary | Recap Map | Slide 16 | worksheet summary | slide-16.png | LOCK |
| 17 | Lead to worksheet and diagnostic quiz | §2 Worksheet Promise | CTA Diagnostic | Slide 17 | lead magnet / quiz | slide-17.png | LOCK_WITH_NOTES |

---

## 4. Current MVP Fix Scope

Patched for current MVP frame review:

```text
Slide 03: stronger Promise Board
Slides 06-09: standardized Grammar Card layout
Slide 13: concrete Clue Map / Decision Rule
Slide 14: clearer Worked Example steps
```

No grammar truth change was made.

Current decision:

```text
LOCK_WITH_NOTES for MVP visual review.
Human review still needed before audio lock.
```
