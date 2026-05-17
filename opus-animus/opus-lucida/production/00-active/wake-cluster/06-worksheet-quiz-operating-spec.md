# Worksheet And Diagnostic Quiz Operating Spec - Wake Cluster
**Status:** Active draft
**Date:** 2026-05-01
**Role:** Production spec for worksheet, diagnostic quiz, trap tags, and AI-assisted feedback
**Rule source:** `../../../strategy/standards/01-lucida-lesson-architecture-standard.md`
**Output source:** `05-wake-mvp-output-architecture.md`
**Frame map:** `08-production-frame-map.md`
**Exercise review:** `09-exercise-review.md`

---

## 1. Purpose

The worksheet and quiz are not summaries.

They are the front-end diagnostic layer for Lucida:

```text
learner attempts question
-> system identifies trap type
-> learner receives targeted explanation
-> learner gets the right review asset
```

The MVP can be built with static questions and pre-tagged answers.

AI may be used later to explain the tagged error in a more personal, coach-like voice, but AI should not infer the grammar error from scratch.

---

## 2. Front-end Feedback Model

Use a rule-anchored AI feedback model:

```text
answer choice
-> pre-authored trap tag
-> reviewed explanation template
-> optional AI personalization
-> recommended review video / worksheet section / short
```

Example:

```text
Learner chooses B.
B is tagged as Prejudicial / L1_interference.
The system already knows the likely issue:
learner translated `wake` too broadly as "ly do".
AI can explain that tagged issue warmly, add one safe example, and link the review section.
```

Do not:

```text
free-form learner answer
-> AI guesses grammar issue
-> unreviewed explanation
```

---

## 3. Required Worksheet Sections

### 1. One-page logic map

```text
wake dewa nai     = sua hieu nham
wake ni wa ikanai = rang buoc nen khong the lam
wake da           = ket luan hop ly
wake ga nai       = bac bo kha nang manh
```

### 2. Nghia - Hinh - Dung table

Each pattern needs:

```text
pattern
speaker action
core meaning
form
usage / tone
main example
```

### 3. Exam signal table

Each pattern needs:

```text
clue before
clue after
logic signal
common trap
```

### 4. Minimal pair drills

Required pairs:

```text
wake dewa nai vs wake ga nai
wake ga nai vs wake ni wa ikanai
wake da vs wake dewa nai
```

Optional extension:

```text
wake da vs hazu da
wake family vs kara/node
```

### 5. Worked example

At least one question should be solved step by step:

```text
read question
mark clue
identify speaker action
eliminate two wrong answers
compare final two
choose answer
summarize trap
```

### 6. Progressive practice

```text
Set 1: guided clues visible
Set 2: partial clues
Set 3: no clues, JLPT-style
```

### 7. Answer key

Every answer should explain:

```text
why correct answer works
why each wrong option is tempting
why each wrong option fails
what to review next
```

### 8. Frame-map alignment

Every worksheet / quiz item must point back to at least one video teaching frame:

```text
source_frame
review_slide
review_script_beat
```

Example:

```text
source_frame: Slide 14 / Frame 14.4
review_slide: Slide 14 Worked Example Retrieval
review_script_beat: blank 2 constraint logic
```

This prevents worksheet / quiz questions from becoming random grammar practice.

---

## 4. Trap Taxonomy

Use this lightweight 5Ps system.

| Tag | Meaning | Example Use |
|---|---|---|
| Plausible | Wrong answer is close to correct answer | `wake da` vs `hazu da` |
| Prejudicial | Vietnamese translation habit causes error | translating all `wake` as `ly do` |
| Polyconceptual | Multiple concepts overload working memory | double negative / several similar patterns |
| Pragmatic | Tone/register/context mismatch | using strong denial in a soft correction context |
| Peripheral | Clearly wrong option | wrong form or unrelated grammar |

Additional operational tags:

| Tag | Meaning |
|---|---|
| Form_error | wrong connection before pattern |
| Clue_missed | learner missed clue before/after blank |
| Speaker_action_missed | learner did not identify what speaker is doing |

Wake-specific diagnostic tags:

| Tag | Meaning |
|---|---|
| Correction_vs_denial | learner confused soft correction with strong denial |
| Constraint_missed | learner missed responsibility / obligation / cannot-do constraint |
| Conclusion_vs_constraint | learner confused reason -> conclusion with constrained action |
| Intensity_mismatch | learner chose a pattern with the wrong strength |
| L1_interference | Vietnamese translation habit caused over-broad meaning |

---

## 5. Question Metadata Schema

Each question should be stored with this metadata:

```yaml
id:
cluster:
target_pattern:
question_text:
choices:
  A:
    text:
    is_correct:
    trap_tag:
    feedback:
  B:
    text:
    is_correct:
    trap_tag:
    feedback:
  C:
    text:
    is_correct:
    trap_tag:
    feedback:
  D:
    text:
    is_correct:
    trap_tag:
    feedback:
speaker_action:
clue_before:
clue_after:
logic_signal:
worked_solution:
review_asset:
worksheet_section:
email_followup_angle:
japanese_naturalness_note:
vietnamese_public_line:
support_translation:
source_frame:
review_slide:
review_script_beat:
exercise_role:
wake_trap_tag:
```

For simple MVP forms, this can be flattened into a table.

Exercise role must be one of:

```text
guided_practice
minimal_pair_drill
diagnostic_quiz
form_drill
worked_example_followup
real_life_transfer
```

---

## 6. Quiz Composition For Wake MVP

Minimum:

```text
20 questions
```

Suggested distribution:

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

Each question should have 3-4 options.

For MVP, 3 options are acceptable if distractors are strong and explanations are clear.

Required diagnostic anchors:

```text
Q1 should mirror Slide 02 / Slide 14 hook logic.
At least one item should mirror Slide 15 intensity trap.
At least one item should test Slide 07 bonus Vないわけにはいかない.
At least one item should test Slide 08 conclusion vs Slide 07 constraint.
At least one item should test form attachment with な-adjective.
```

If production time is tight, generate 12-15 high-quality questions first, then expand to 20.

---

## 7. AI Feedback Guardrails

AI can:

- rewrite the reviewed feedback in a warmer coach voice;
- add one short safe analogy;
- recommend review assets based on the pre-tagged error;
- adjust explanation length to learner level.

AI cannot:

- change the correct answer;
- invent new grammar rules;
- introduce unreviewed examples as authoritative;
- diagnose a different trap type unless a teacher-reviewed tag exists;
- claim certainty about learner psychology beyond the selected answer.

Prompt pattern:

```text
You are Lucida's JLPT N2 coach.
Explain this pre-tagged mistake warmly and clearly.
Do not change the answer key.
Do not add unverified grammar claims.

Question:
{question}

Learner selected:
{choice}

Trap tag:
{trap_tag}

Reviewed explanation:
{feedback}

Recommended review:
{review_asset}
```

---

## 8. CTA Linkage

The video CTA should not say only:

```text
download worksheet
```

It should say:

```text
Use the worksheet / quiz to find which trap type you keep falling into.
```

CTA value:

```text
not more information
but diagnosis + targeted practice
```

---

## 9. QA Checklist

Before publishing worksheet / quiz:

- Are all correct answers teacher-reviewed?
- Does each wrong option have a trap tag?
- Does each question link to a source frame in `08-production-frame-map.md`?
- Does each question declare an `exercise_role`?
- Does each diagnostic item include a Wake-specific trap tag when relevant?
- Does each wrong option explain why it is tempting?
- Does feedback avoid blaming the learner?
- Does feedback link to an exact review asset?
- Does practice move from guided to exam-like?
- Does the worksheet reinforce the same labels used in the video?
- Does the quiz collect useful data for future lessons?
- Do Japanese examples sound natural in context?
- Does Vietnamese feedback sound like public-facing explanation, not literal gloss?
