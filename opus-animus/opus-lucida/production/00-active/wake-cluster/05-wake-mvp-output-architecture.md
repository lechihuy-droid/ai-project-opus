# Wake MVP Output Architecture
**Status:** Active MVP implementation
**Date:** 2026-05-01
**Project:** `opus-lucida`
**Topic:** `wake cluster`
**Rule source:** `../../../strategy/standards/01-lucida-lesson-architecture-standard.md`
**Research source:** `research/05-gemini-research-video-architecture.md`

---

## 1. Role

This file is not the Lucida global rule.

It is the Wake MVP output architecture:

```text
how the global standard is applied to the current wake-cluster video
```

Use the standard file for reusable rules.
Use this file for wake-specific implementation choices.

---

## 2. Wake Cluster Decision

Core lesson promise:

```text
Cung la wake,
nhung moi mau la mot hanh dong khac nhau cua nguoi noi.
```

Fast map:

```text
wake dewa nai     = dang dinh chinh / sua hieu nham
wake ni wa ikanai = bi rang buoc nen khong the lam
wake da           = rut ra ket luan hop ly
wake ga nai       = bac bo kha nang rat manh
```

Core mantra:

```text
Dung nhin chu wake truoc.
Hay hoi: nguoi noi dang lam gi?
```

---

## 3. Wake Video Flow

Locked MVP structure:

```text
17 slides
```

Decision:

```text
Keep 17 slides for MVP.
Do not add a new slide only for worked example.
Instead, upgrade Slide 14 into a worked-example retrieval slide.
Use Slide 15 as a diagnostic practice slide.
Use Slide 17 as worksheet + quiz diagnostic CTA.
```

```text
1. Opening situation
2. Hook quiz
3. Pain point + promise
4. Story
5. 3 cach nhin + big idea
6. wake dewa nai
7. wake ni wa ikanai
8. wake da
9. wake ga nai
10. Comparison map
11. wake dewa nai vs wake ga nai
12. wake ga nai vs wake ni wa ikanai
13. Dau hieu chon mau
14. Worked example retrieval: hook question
15. Diagnostic practice: wake ga nai vs wake dewa nai
16. Recap
17. CTA worksheet / diagnostic quiz
```

Why this order:

- Opening hook uses `wake dewa nai` and `wake ni wa ikanai`.
- These two patterns are taught first for early payoff.
- `wake da` then adds conclusion logic.
- `wake ga nai` completes the strong denial contrast.
- Comparisons come after the learner has all four labels.
- Practice comes after the clue map.
- Slide 14 reuses the opening quiz so the learner feels progress.
- Slide 15 tests transfer to a nearby confusion.
- CTA comes after recap for this MVP, but the wording must make the worksheet/quiz feel like diagnosis, not a generic PDF.

---

## 4. Timing Map

Target video length:

```text
10-13 minutes
```

Suggested allocation:

| Segment | Target |
|---|---:|
| Opening + hook quiz + promise | 1.5-2 min |
| Story + teaching frame | 1 min |
| Four grammar blocks | 4.5-5.5 min |
| Comparison + exam signal | 2 min |
| Practice + recap + CTA | 2-2.5 min |

Attention rhythm:

```text
Use a quiz, reveal, contrast, worked-example step, or recap every 60-120 seconds.
```

This is a heuristic, not a strict timestamp rule.

---

## 5. Slide Output Rule For Wake

Use layered density.

Do not force every slide to be ultra-sparse if the lesson needs examples.

Preferred reveal sequence:

```text
state 1: Japanese example / problem
state 2: clue highlight
state 3: target wake pattern
state 4: trap / contrast
state 5: answer or recap
```

Japanese should be the visual anchor.

Vietnamese should guide interpretation.

---

## 6. Wake Practice And Worked Example

The current MVP must include at least one solving moment.

Locked decision:

```text
Slide 14 = worked-example retrieval
Slide 15 = diagnostic practice
```

Slide 14 should use the same two-blank hook question, but it should be explained as a solving process, not only as an answer reveal.

Required reasoning path:

```text
read question
-> mark clue
-> identify speaker action
-> eliminate tempting wrong answer
-> choose answer
```

Practice questions should not only reveal the correct answer.
They should explain why the wrong option looked tempting.

Slide 14 answer logic:

```text
Blank 1:
ikitakunai __ arimasen
speaker action = correcting misunderstanding
answer = wake dewa
tempting wrong answer = wake ga
why wrong = too strong; not impossible, just correction

Blank 2:
kyou wa iku __ ikimasen
speaker action = constrained action
answer = wake ni wa
tempting wrong answer = wake da
why wrong = there is a reason, but the sentence is not only concluding; it says cannot go because constrained
```

Slide 15 answer logic:

```text
Nam-san ga minna o kirai na __
speaker action = strong denial of possibility
answer = wake ga nai
tempting wrong answer = wake dewa nai
why wrong = softer correction; does not carry "no way"
```

---

## 7. Wake Worksheet / Quiz Output

Worksheet and diagnostic quiz should continue the exact gap opened in the video:

```text
I understand the four meanings,
but I still need to practice choosing under JLPT-style pressure.
```

Minimum output:

```text
1-page logic map
Nghia - Hinh - Dung table
exam signal table
minimal pair drills
worked example
20-question diagnostic quiz
answer key with trap tags
```

Suggested quiz distribution:

```text
4 wake da
5 wake dewa nai
4 wake ga nai
5 wake ni wa ikanai
2 V-nai wake ni wa ikanai
```

Trap distribution target:

```text
5 Plausible
5 Prejudicial
4 Polyconceptual
3 Pragmatic
3 Peripheral / Form_error
```

---

## 8. Rule-anchored AI Feedback For Wake

Learner-facing feedback can use AI, but it should be anchored in reviewed tags.

Flow:

```text
selected answer
-> pre-tagged trap type
-> reviewed explanation
-> AI rewrites in coach-like voice
-> recommended review asset
```

Example:

```text
Selected wrong answer: wake da
Correct answer: wake ni wa ikanai
Trap tag: Plausible / clue_missed
Likely issue: learner saw a reason and jumped to conclusion logic,
but the sentence actually expresses constraint.
Review asset: Slide 07 + worksheet set 2
```

---

## 9. Wake CTA

CTA should be:

```text
worksheet / quiz as diagnosis and practice
```

Not:

```text
generic PDF summary
```

CTA angle:

```text
Neu ban hieu roi nhung vao de van phan van,
lam worksheet / quiz de biet minh hay sap bay nao:
dich nghia, nham clue, hay nham sac thai.
```

MVP CTA placement:

```text
After recap, on Slide 17.
```

MVP CTA wording must mention:

```text
worksheet
diagnostic quiz
trap type
review path
```

---

## 10. Output Checklist

Before this MVP is considered production-ready:

- Script uses speaker action for all four patterns.
- Slide deck supports layered reveal.
- At least one practice/reveal includes distractor explanation.
- Worksheet has trap metadata.
- Diagnostic quiz has pre-tagged wrong answers.
- CTA points to trap practice / diagnostic, not only summary.
- QA uses the updated slide criteria.
- Post-publish metrics include retention, replay, worksheet CTR, quiz CTR, and most common trap tags.
