# Slide QA Criteria - Generic
**Status:** Active
**Role:** Generic slide deck review gate before script polish / slide build / recording
**Target:** `production/00-active/<topic-slug>/03-slide-deck.md`
**Standard:** `strategy/standards/01-lucida-lesson-architecture-standard.md`

---

## 1. QA Goal

Slide QA checks whether the deck is a usable video teaching architecture and buildable slide design spec.

The deck should not be a transcript, worksheet, or final rendered Canva/PPT file. It should be the locked bridge between:

```text
skeleton -> slide structure -> design layer -> script -> visual build -> recording
```

For Lucida MVP production, the slide deck should usually be reviewed before final script polish. The script should then follow the locked slide beat map.

Every slide deck has two required layers:

```text
Slide Structure Layer = what the lesson teaches and in what order
Design Layer          = how that teaching beat appears visually on screen
```

Both layers must be traceable:

```text
Slide Structure Layer -> skeleton + output architecture
Design Layer          -> Lucida program design direction + slide structure
```

Review should happen in two gates:

```text
Gate A - Slide Structure QA
Gate B - Slide Design QA
```

Do not use design polish to compensate for weak slide structure.

---

## Source Basis

This criteria is based on:

- `01-lucida-lesson-architecture-standard.md` section 6, Eight-part Lesson Architecture;
- `01-lucida-lesson-architecture-standard.md` section 8, Worked Example Rule;
- `01-lucida-lesson-architecture-standard.md` section 10, Slide Standard;
- `01-lucida-lesson-architecture-standard.md` section 11, AI Production Workflow;
- `01-lucida-lesson-architecture-standard.md` section 12, Quality Gate;
- `automation/workflows/20-lesson-production-sop.md`, slide architecture and slide QA steps.
- Lucida program design direction, expected at `production/02-assets/design-briefs/lucida-slide-design-direction.md` once the design system is chosen.

Topic-specific slide QA files may extend this criteria.

---

## 2. Pass Definition

Deck passes when:

- slide count and order match the locked output architecture;
- every slide has a clear teaching role;
- every slide states what appears on screen;
- every slide has a build / reveal plan when information density is high;
- every slide has a design layer: layout, visual elements, hierarchy, emphasis, and motion/reveal notes;
- every slide has a script beat that tells the script what to explain;
- every slide links its structure back to skeleton / output architecture;
- every slide links its design choices back to Lucida's program design direction;
- on-screen text is an anchor, not narration;
- on-screen text is scannable per reveal state;
- grammar labels do not narrow or distort meaning;
- visuals support logic, clue, trap, contrast, or speaker action;
- worked example slides include reasoning, not only answer reveal;
- diagnostic/practice slides include learner retrieval before reveal;
- recap is screenshot-friendly;
- CTA points to the next learning asset and the reason to use it.

---

## 3. Required Slide Spec Fields

Each slide spec should include:

```text
Source link
Role
On-screen
Build / reveal
Script beat
Teaching check
```

Each slide spec should also include a design layer:

```text
Layout
Visual elements
Hierarchy / emphasis
Motion / reveal notes
Design-system link
```

Block slide build if multiple slides are missing required fields.

---

## 3.0 Skeleton-to-Slide Mapping Rule

When generating the slide structure layer, convert skeleton sections into slide functions using this mapping:

```text
Skeleton Hook Core         -> Opening / Hook Quiz
Skeleton Audience Promise  -> Topic intro / dual promise
Skeleton Story Core        -> Situation / context slide
Skeleton Big Idea          -> Framework / mantra slide
Skeleton Grammar Core      -> Grammar cards
Skeleton Comparison Core   -> Comparison boards
Skeleton Clue Map          -> Clue map / exam tool slide
Skeleton Practice Core     -> Worked example / diagnostic practice
Skeleton Worksheet Promise -> CTA / next action
```

Fail structure QA if a major skeleton section disappears without an explicit reason.

Fail structure QA if the deck adds a major slide function not supported by skeleton or output architecture.

### 3.1 Field Responsibilities

`Source link` should answer:

```text
Which skeleton section / architecture beat does this slide implement?
```

`Role` should answer:

```text
What job does this slide do in the lesson?
```

`On-screen` should answer:

```text
What exact learner-facing text appears?
```

`Build / reveal` should answer:

```text
In what order does information appear?
```

`Script beat` should answer:

```text
What must the narration explain while this slide is on screen?
```

`Teaching check` should answer:

```text
What accuracy / pedagogy risk must not be broken?
```

`Layout` should answer:

```text
What visual composition should the slide use?
```

`Visual elements` should answer:

```text
What cards, arrows, highlights, icons, diagrams, screenshots, or callouts are needed?
```

`Hierarchy / emphasis` should answer:

```text
What should the viewer notice first, second, and last?
```

`Motion / reveal notes` should answer:

```text
What should animate or appear step-by-step?
```

`Design-system link` should answer:

```text
How does this slide follow the Lucida program direction for color, type, spacing, and component style?
```

---

## 4. Gate A - Slide Structure QA

Slide Structure QA checks:

```text
Is the slide logic correct before design?
```

This gate reviews:

- source alignment;
- teaching accuracy;
- slide role clarity;
- on-screen text as teaching anchor;
- build / reveal logic;
- slide-first script readiness;
- worked example / diagnostic logic;
- exam / real-life transfer promise.

Design details are not judged in this gate except when they are required to understand the reveal sequence.

---

## 5. Gate B - Slide Design QA

Slide Design QA checks:

```text
Can this structure become a clear, buildable, Lucida-aligned slide?
```

This gate reviews:

- layout pattern;
- visual elements;
- hierarchy / emphasis;
- motion / reveal notes;
- reusable component choice;
- Lucida program design alignment;
- Japanese / Vietnamese readability.

Design QA must not change grammar meaning, slide order, or lesson promise. If design exposes a structure problem, return to Gate A.

---

## 6. Review Dimensions

### 6.1 Source Alignment

Check:

- Does the deck follow the locked skeleton / output architecture?
- Does each slide explicitly link to the skeleton section or architecture beat it implements?
- Does the deck preserve the exact grammar scope?
- Does the deck avoid adding a new concept that the skeleton did not authorize?
- Does each slide map to a necessary teaching beat?
- Is the deck usable as the source for script polish?

Fail if:

- slide order contradicts the locked architecture;
- slide structure cannot be traced back to skeleton / architecture;
- the deck adds a new grammar point;
- the deck removes a required beat;
- the deck depends on a script-only explanation that is not represented in any slide beat.

---

### 6.2 Teaching Accuracy

Check:

- Are grammar meanings accurate and not over-narrowed?
- Are forms correct?
- Are examples correct?
- Are common learner traps represented accurately?
- Does the deck distinguish meaning, form, usage, and exam clue where needed?

Fail if:

- a grammar label would teach the wrong idea;
- an example has a wrong form;
- a comparison blurs rather than clarifies the difference;
- a bonus form is given the same weight as the main target when it should be secondary.

---

### 6.3 Slide-First Script Readiness

Check:

- Can a script writer produce the narration slide-by-slide from this deck?
- Does each slide have a clear `Script beat`?
- Does the deck define which text appears on screen versus what the speaker explains?
- Does the deck prevent the script from adding/removing slides casually?
- Are worked example and diagnostic beats explicit enough for audio/TTS planning?

Fail if:

- script writers must guess the purpose of a slide;
- on-screen text and narration would likely diverge;
- the deck cannot support audio block parsing later;
- the deck is still structured as commentary about an existing script rather than a locked beat map.

---

### 6.4 Cognitive Load And Layered Density

Check:

- Does each reveal state have one main idea?
- Can the viewer scan the on-screen text in roughly 3-5 seconds per reveal state?
- Are rich slides split into layers?
- Are grammar slides limited to the most important visible anchors?
- Do comparison/practice slides avoid showing too much before the learner can think?

Fail if:

- a slide looks like a handout from the beginning;
- long narration is copied onto the slide;
- multiple independent ideas compete in one reveal state;
- Japanese, Vietnamese explanation, and metadata appear all at once without sequencing.

---

### 6.5 Visual / Build Readiness

Check:

- Does each slide suggest a buildable layout or reveal sequence?
- Does each slide include a design layer, not only text content?
- Does the design layer follow Lucida's program design direction?
- If the program design direction is not yet finalized, does the slide mark design assumptions clearly?
- Are contrast, clue, trap, and answer states visually separable?
- Are screenshot-friendly slides identified?
- Does the deck avoid making every slide the same layout?
- Are important Japanese examples set up as visual anchors?

Fail if:

- the deck only says what to teach, not how the information should appear;
- the deck gives text-only slides with no layout / hierarchy / visual elements;
- slide design choices are disconnected from the Lucida design system or brand direction;
- comparison slides do not support side-by-side reading;
- practice slides do not separate question, pause, clue, trap, and answer.

---

### 6.6 Program Design Alignment

Check:

- Does the slide deck use the same visual language expected for the full Lucida program?
- Does the deck define reusable slide components, not one-off layouts only?
- Are grammar cards, comparison boards, clue maps, quiz boards, recap boards, and CTA boards visually consistent?
- Does the deck avoid default/plain text layouts unless intentionally minimal?
- Does the deck preserve readability for Vietnamese and Japanese text?

Fail if:

- each slide looks like a separate design experiment;
- the visual direction conflicts with the Lucida program brand direction;
- Japanese text is visually secondary when it should be the anchor;
- slide density is solved only by deleting content instead of using hierarchy and reveal.

---

### 6.7 Exam Transfer And Trap Logic

Check:

- Does the deck help learners choose answers under JLPT-style pressure?
- Does it show where to look: before blank, after blank, speaker action, logic?
- Does a worked example include clue spotting and distractor elimination?
- Does diagnostic practice label why the tempting wrong answer is tempting?
- Does the CTA continue the same gap opened by practice?

Fail if:

- slides only define grammar without transfer to questions;
- answer reveal has no reasoning;
- traps are named but not operationalized;
- worksheet/quiz CTA is disconnected from the lesson problem.

---

## 7. Blockers

Block slide build if:

- deck changes grammar scope from the skeleton;
- deck contradicts locked output architecture;
- deck copies long narration onto slides;
- examples or forms are wrong;
- worked example reveals answer without reasoning;
- diagnostic practice reveals the answer before learner retrieval;
- deck cannot be used to write a slide-by-slide script;
- deck lacks a design layer and therefore cannot guide Canva / PPT build;
- deck design assumptions conflict with Lucida program design direction;
- CTA is generic and not linked to worksheet / quiz / review path.

---

## 8. Severity Levels

### Critical

Must fix before script polish or visual build.

- grammar label wrong;
- example form wrong;
- slide contradicts skeleton / output architecture;
- deck misses a required core beat;
- worked example is missing reasoning.

### Major

Should fix before recording.

- too much text on key slides;
- build/reveal sequence unclear;
- design layer missing or too vague;
- comparison does not clarify confusion;
- script beat is too vague;
- CTA unclear.

### Minor

Can fix during final design or wording polish.

- wording can be tighter;
- layout suggestion;
- highlight suggestion;
- slide title could be clearer;
- a reveal could be split more elegantly.

---

## 9. Output Format

Review result should use:

```text
Decision: Pass / Pass with minor revisions / Pass with revisions / Block

Gate reviewed: Slide Structure QA / Slide Design QA / Both

Source alignment:

Teaching accuracy:

Slide-first script readiness:

Cognitive load:

Visual / build readiness:

Program design alignment:

Worked example / diagnostic:

CTA fit:

Required patches:
1.
2.
3.
```

---

## 10. Decision Rule

Only move to final script polish / recording prep when:

```text
Slide QA verdict = Pass
or
Slide QA verdict = Pass with minor revisions
```

If verdict is `Pass with revisions`, patch deck first.

If verdict is `Block`, return to:

```text
skeleton / output architecture
```

before touching script, worksheet, or recording.
