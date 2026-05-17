# Script QA Criteria
**Status:** Active
**Role:** Review gate before audio generation and slide build
**Target:** `production/00-active/<topic-slug>/02-script.md`
**Standard:** `strategy/standards/01-lucida-lesson-architecture-standard.md`

---

## 1. QA Goal

Script QA checks whether narration is accurate, teachable, natural to speak, and aligned with the skeleton.

The script should be ready for audio draft only after this gate passes.

---

## Source Basis

This criteria is based on:

- `01-lucida-lesson-architecture-standard.md` section 6, Eight-part Lesson Architecture;
- `01-lucida-lesson-architecture-standard.md` section 7, Teaching Block Rule;
- `01-lucida-lesson-architecture-standard.md` section 8, Worked Example Rule;
- `01-lucida-lesson-architecture-standard.md` section 10, Slide Standard;
- `01-lucida-lesson-architecture-standard.md` section 12, Quality Gate;
- `automation/workflows/20-lesson-production-sop.md`, Step 5 Script Review / Selection;
- active parser assumptions in `automation/video/parse_script.py`.

For a topic-specific MVP, also check the local output architecture file:

```text
production/00-active/<topic-slug>/05-<topic-slug>-mvp-output-architecture.md
```

---

## 2. Pass Definition

Script passes when:

- it follows the active skeleton and does not change scope;
- it starts with learner pain / situation / contrast, not a long greeting;
- it explains each grammar point through speaker action;
- it uses learner-facing terms such as `Nghia - Hinh - Dung` and `Dau hieu chon mau`;
- it does not expose internal theory as jargon;
- Japanese examples support the explanation;
- scene examples and form examples are not accidentally merged into one role;
- form and nuance are accurate;
- Japanese example wording is natural for the claimed context, register, and speaker relationship;
- Vietnamese narration sounds spoken and teacher-like, not translated or overly written;
- public narration does not accidentally read literal support lines as if they were natural speech;
- minimal pairs are explained through contrast;
- worked example includes clue, reasoning, wrong-answer elimination, and answer reveal;
- diagnostic practice asks the learner to choose before reveal;
- CTA naturally leads to worksheet / diagnostic quiz;
- speaker notes and pause/emphasis are useful for recording.

---

## 3. Audio Readiness Checks

Before generating audio:

- expected slide count exists for the MVP, e.g. Wake has 17 `# Slide XX` blocks;
- slide headings are sequential and parser-readable;
- each slide has `On-screen`, `Script`, `Speaker note`, and `Pause/Emphasis`;
- no QA review / changelog remains after the final slide;
- each slide has a clear `Script:` section;
- pronunciation-risk Japanese is visible and intentional;
- long sentences are not too dense for TTS or human narration;
- Japanese lines do not sound stitched together just to show grammar;
- Vietnamese lines can be read aloud naturally in one breath group at a time;
- literal support wording is kept for explanation only and not mixed into public-facing narration by accident;
- if the lesson has an approved example bank, downstream wording stays aligned with the approved scene line unless the script is explicitly using a smaller form-focused micro-example;
- pauses are marked where the learner should think;
- CTA wording is not salesy.

---

## 4. Blockers

Block audio/video if:

- script contradicts skeleton;
- grammar explanation is wrong or too narrow;
- Japanese example is grammatically possible but pragmatically odd, over-explicit, or unnatural for the scene;
- Vietnamese line sounds like translated grammar support rather than something a teacher or learner would really say;
- opening starts too slowly;
- worked example only reveals answer without reasoning;
- practice reveals answer before retrieval;
- CTA promises an asset that does not exist or is not planned;
- script contains production notes that could be read aloud accidentally.
- parser cannot read every slide block cleanly.

---

## 4.5. Naturalness Gate

Treat naturalness as a hard QA dimension, not a nice-to-have.

Also treat **example role clarity** as a hard QA dimension.

Do not let one example silently do two incompatible jobs:

```text
scene spine
form-only micro-example
comparison example
trend support
```

If a form-focused micro-example is used, label it clearly in the script logic and do not pretend it is the same as the main approved scene line.

### Japanese naturalness checks

- does the line fit the speaker relationship, social setting, and level of directness?
- does it sound like a real utterance, not a grammar pattern stitched onto a scene?
- is the register consistent inside the same line?
- if the line is public-facing, would an advanced learner hear it as something people actually say?

Warning patterns:

```text
too textbook
too explanatory inside dialogue
correct grammar but wrong social tone
unnatural combination of casual and formal phrasing
line exists only to showcase the pattern
```

### Vietnamese naturalness checks

- does the line sound like spoken Vietnamese rather than translationese?
- would a teacher naturally say it out loud in a lesson?
- would a learner naturally say it in the scene being described?
- is the line shorter, cleaner, and more conversational than the literal support version?

Warning patterns:

```text
too stiff
too literal
grammar-explanation wording used as public narration
unnatural repetition of the Japanese logic in Vietnamese
```

### Public line vs support line rule

If the script uses both:

```text
literal support line
natural spoken line
```

the spoken line must win by default.

Use the literal support line only when:

- unpacking form;
- contrasting two structures;
- clarifying why a distractor is wrong.

---

## 5. Output Format

Review result should use:

```text
Decision: Pass / Pass with minor revisions / Pass with revisions / Block

Content accuracy:

Teaching flow:

Audio readiness:

CTA / diagnostic fit:

Required patches:
1.
2.
3.
```
