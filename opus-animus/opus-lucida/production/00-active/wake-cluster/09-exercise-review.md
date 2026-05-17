# Wake Exercise Review
**Status:** Review complete - spec is usable with revisions  
**Date:** 2026-05-02  
**Reviewed source:** `06-worksheet-quiz-operating-spec.md`  
**Frame map:** `08-production-frame-map.md`

---

## 1. Verdict

The current worksheet / quiz spec is directionally strong and usable for MVP generation.

Decision:

```text
PASS WITH REVISIONS BEFORE GENERATION
```

Main reason:

```text
The spec defines the diagnostic model well,
but it does not yet force exercise questions to map back to exact video frames / slide states.
```

That means a generator could produce generally good questions, but still miss the exact teaching beats the video just created.

---

## 2. What Is Already Good

The spec correctly says worksheet / quiz are not summaries.

Strong parts:

```text
- rule-anchored feedback model
- pre-tagged trap answers
- 5Ps trap taxonomy
- metadata schema
- 20-question target
- progressive practice structure
- answer key must explain why wrong choices feel tempting
```

This is enough to start assessment generation after one tightening pass.

---

## 3. Required Revisions

### Finding 1 - Add frame-map alignment as a hard rule

Current risk:

```text
Questions may test the right grammar but not reinforce the exact video teaching moments.
```

Patch needed:

```text
Every worksheet / quiz item should reference at least one source frame:
source_frame:
review_slide:
review_script_beat:
```

Example:

```yaml
source_frame: Slide 14 / Frame 14.4
review_slide: Slide 14 Worked Example Retrieval
review_script_beat: blank 2 constraint logic
```

### Finding 2 - Separate exercise roles

Current risk:

```text
Worksheet questions, diagnostic questions, and shorts-friendly retrieval moments may blur together.
```

Patch needed:

```text
Each question must declare role:
- guided_practice
- minimal_pair_drill
- diagnostic_quiz
- form_drill
- worked_example_followup
- real_life_transfer
```

### Finding 3 - Add exact trap tags used by video

Current risk:

```text
5Ps tags are useful but too broad for Wake-specific feedback.
```

Add these Wake-specific tags:

```text
Correction_vs_denial
Constraint_missed
Conclusion_vs_constraint
Intensity_mismatch
Speaker_action_missed
Clue_missed
Form_error
L1_interference
```

Keep 5Ps as high-level taxonomy, but use Wake tags for actual feedback.

### Finding 4 - Force diagnostic quiz to cover video retrieval moments

Current risk:

```text
Quiz may become 20 random grammar questions.
```

Required diagnostic anchors:

```text
Q1 must mirror Slide 02 / Slide 14 hook logic.
At least one item must mirror Slide 15 intensity trap.
At least one item must test Slide 07 bonus Vないわけにはいかない.
At least one item must test Slide 08 conclusion vs Slide 07 constraint.
At least one item must test form attachment with な-adjective.
```

### Finding 5 - Add naturalness gate for example sentences

Current risk:

```text
Assessment examples may regress into textbook Japanese / translationese Vietnamese.
```

Required rule:

```text
Every generated item must include:
- Japanese naturalness note
- Vietnamese public-facing translation
- support translation if needed
```

This follows the example bank process.

---

## 4. Recommended Exercise Architecture

Use this structure for Wake MVP.

### Worksheet

```text
Section A - One-page logic map
Purpose: screenshot / quick review
Source frames: 10.1-10.3, 16.1-16.3

Section B - Nghia - Hinh - Dung table
Purpose: stable grammar reference
Source frames: 06.1, 07.1, 08.1, 09.1

Section C - Clue map practice
Purpose: train before/after/speaker-action reading
Source frames: 13.1-13.4

Section D - Minimal pair drills
Purpose: distinguish close patterns
Source frames: 11.1-11.3, 12.1-12.3

Section E - Worked example follow-up
Purpose: repeat Slide 14 logic with a new sentence
Source frames: 14.1-14.6

Section F - Progressive JLPT-style practice
Purpose: move from guided clues to no clues
Source frames: all high-value frames

Section G - Answer key with trap tags
Purpose: diagnosis, not just correctness
```

### Diagnostic Quiz

Use 12-15 questions for MVP if 20 slows production.

Recommended split:

```text
2 hook / worked-example transfer
3 correction vs denial
3 constraint logic
2 conclusion logic
2 Vないわけにはいかない
2 form / attachment
2 mixed review
```

20 questions is still ideal, but 12-15 is enough for the first public MVP.

---

## 5. Updated Metadata Schema

Add these fields to the existing schema:

```yaml
source_frame:
review_slide:
review_script_beat:
exercise_role:
wake_trap_tag:
japanese_naturalness_note:
vietnamese_public_line:
support_translation:
```

Full MVP item should include:

```yaml
id:
cluster:
source_frame:
exercise_role:
target_pattern:
question_text:
choices:
speaker_action:
clue_before:
clue_after:
logic_signal:
trap_tag:
wake_trap_tag:
worked_solution:
review_asset:
worksheet_section:
email_followup_angle:
```

---

## 6. Generation Rule For Assessment Runner

When running `33-runner-assessment`, use:

```text
Read:
- 01-master-teaching-skeleton.md
- 02-script.md
- 03-slide-deck.md
- 06-worksheet-quiz-operating-spec.md
- 08-production-frame-map.md
- 09-exercise-review.md

Do:
- generate worksheet and quiz from the frame map
- reuse approved examples
- create near-transfer items, not random new topics
- tag every wrong option

Do not:
- invent unrelated grammar comparisons
- overuse the seen / SNS example
- make every question about exam night
- use literal Vietnamese as public explanation
```

---

## 7. Patch Recommendation

Patch `06-worksheet-quiz-operating-spec.md` with:

```text
1. frame-map alignment rule
2. exercise_role field
3. Wake-specific trap tags
4. required diagnostic anchors
5. naturalness gate
```

After that, run:

```text
33-runner-assessment
```

Current recommendation:

```text
Do not generate worksheet / quiz until the spec includes frame-map alignment.
```
