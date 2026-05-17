# Skeleton QA Criteria
**Status:** Active
**Role:** Review gate before script generation or script polishing
**Target:** `production/00-active/<topic-slug>/01-master-teaching-skeleton.md`
**Standard:** `strategy/standards/01-lucida-lesson-architecture-standard.md`

---

## 1. QA Goal

Skeleton QA checks whether the lesson has enough teaching truth to generate script, slide, worksheet, quiz, and shorts.

It should prevent downstream assets from inheriting unclear grammar logic.

---

## Source Basis

This criteria is based on:

- `01-lucida-lesson-architecture-standard.md` section 4, Grammar Cluster Schema;
- `01-lucida-lesson-architecture-standard.md` section 5, Three Internal Layers;
- `01-lucida-lesson-architecture-standard.md` section 7, Teaching Block Rule;
- `01-lucida-lesson-architecture-standard.md` section 8, Worked Example Rule;
- `01-lucida-lesson-architecture-standard.md` section 11, Worksheet And Diagnostic Standard;
- `01-lucida-lesson-architecture-standard.md` section 12, Quality Gate.

For a topic-specific MVP, also check the local output architecture file:

```text
production/00-active/<topic-slug>/05-<topic-slug>-mvp-output-architecture.md
```

---

## 2. Pass Definition

Skeleton passes when:

- topic scope is locked;
- audience and learner pain are clear;
- video promise is concrete;
- each grammar point has `Nghia - Hinh - Dung`;
- each grammar point has speaker action;
- form rules are accurate;
- usage / nuance is accurate;
- Vietnamese learner trap is named;
- minimal pair / contrast is explicit;
- JLPT clue map exists;
- at least one worked example plan exists;
- worksheet / diagnostic quiz plan exists;
- CTA angle is defined.

---

## 3. Blockers

Block downstream production if:

- grammar scope is still changing;
- one or more pattern meanings are uncertain;
- examples are not teacher-reviewable;
- no minimal pair is included;
- no worked example is planned;
- no diagnostic/worksheet path exists;
- the skeleton cannot explain why wrong answers are tempting.

---

## 4. Output Format

Review result should use:

```text
Decision: Pass / Pass with minor revisions / Pass with revisions / Block

Top findings:
1.
2.
3.

Required patches:
1.
2.
3.

Production note:
Can this skeleton generate script, slide, worksheet, and quiz safely?
```
