# Lucida Slide Production And Acceptance Process
**Status:** Active v0.3  
**Date:** 2026-05-14  
**Scope:** All Lucida JLPT N2 lesson decks  
**Role:** End-to-end process for turning a teaching skeleton into reviewable, template-fit slides

**Changelog:**
- v0.3 (2026-05-14): slide-agent renderer is primary runtime; OD visual pass feeds template HTML/CSS/slots, not React.
- v0.2 (2026-05-13): added §11.5 Optional OD Visual Mockup Pass for new-template prototyping.
- v0.1: initial canonical process.

---

## 1. Purpose

This file defines the complete process for making slides.

It exists to solve this recurring problem:

```text
The deck has the right topic flow,
but individual slides still feel weak, vague, or too script-like.
```

Root cause:

```text
Phase was mapped,
but template contract was not enforced strongly enough.
```

Therefore slide production must follow this chain:

```text
Teaching skeleton
-> phase map
-> template choice
-> learner-facing language pass
-> template acceptance check
-> render layout
-> production QA
-> review decision
```

Do not use this weaker chain:

```text
Skeleton
-> nice-looking slide titles
-> visual build
-> late-stage patching
```

---

## 2. Operating Principle

Slides are not script notes.

Slides are learner-facing thinking structures.

Each slide must pass 4 layers:

```text
Layer 1: Architecture fit
Layer 2: Template fit
Layer 3: Language fit
Layer 4: Production fit
```

If a slide fails any layer:

```text
Patch the slide before locking script/audio/video.
```

---

## 3. Process Overview

```text
Step 1. Lock teaching skeleton
Step 2. Build phase map
Step 3. Assign slide template
Step 4. Write learner-facing Vietnamese
Step 5. Fill required template fields
Step 6. Check learning-function integrity
Step 7. Adapt to production constraint
Step 8. Build render layout
Step 9. Run acceptance review
Step 10. Patch high-risk slides
Step 11. Lock downstream assets
```

---

## 4. Step 1 - Lock Teaching Skeleton

Source of truth:

```text
01-master-teaching-skeleton.md
```

Required outputs from skeleton:

```text
- learner pain
- lesson promise
- grammar truth
- speaker action for each pattern
- required comparisons
- clue map logic
- worked example
- diagnostic practice
- CTA direction
```

Pass condition:

```text
No slide idea should invent lesson scope outside the skeleton.
```

Fail condition:

```text
If a needed slide has no skeleton source,
update the skeleton first or remove the slide.
```

---

## 5. Step 2 - Build Phase Map

Map the lesson into these functions:

```text
1. Hook
2. Try First
3. Promise
4. Context
5. Method
6. Grammar Core
7. Contrast
8. Exam Transfer
9. Worked Example
10. Practice
11. Recap
12. CTA
```

Rules:

```text
- Every slide must have one primary phase.
- One slide may support later phases, but only one phase can be primary.
- Do not create decorative slides with no learning function.
```

Pass condition:

```text
The sequence creates a coherent learner journey.
```

---

## 6. Step 3 - Assign Slide Template

Each slide must use a named template from the template library.

Core templates:

```text
Hook Contrast
Quiz Before / After
Promise Board
Story Context
Method Board
Grammar Card
Minimal Pair
Comparison Matrix
Clue Map / Decision Rule
Worked Example Board
Diagnostic Practice
Recap Map
CTA Diagnostic
```

Decision rule:

```text
Choose template by teaching function, not by visual preference.
```

Example:

```text
Need to separate two confusable patterns
-> Minimal Pair

Need to summarize four patterns
-> Comparison Matrix or Recap Map
```

---

## 7. Step 4 - Fill Required Template Fields

## 7. Step 4 - Write Learner-Facing Vietnamese

Use this source:

```text
07-vietnamese-explanation-style-guide.md
```

Core rule:

```text
Do not write Vietnamese like metadata.
Write it like a real N2 teacher guiding how to think.
```

Required language outcomes:

```text
- natural spoken-teacher tone
- learner-thinking prompts
- context-bound meaning
- visible trap contrast
- no unnecessary internal production terms
- when the 3-view method appears on screen, use `Ý nghĩa - Dạng - Cách dùng`
- one shared Japanese-learning register across all learner-facing video text
```

Fail if:

```text
- a slide reads like a glossary entry
- the logic is correct but the wording sounds translated
- the explanation does not help the learner choose or distinguish
- on-video labels sound like framework names, metadata, or internal system terms
```

---

## 8. Step 5 - Fill Required Template Fields

This is the main anti-gap step.

Do not mark a slide as ready just because the title and phase are correct.

The slide must contain the required fields for its template.

### 8.1 Grammar Card

Required:

```text
- pattern
- Nguoi noi dang lam gi?
- Nghia cot loi
- Hinh / cau truc
- Dung / sac thai
- one natural example
- bay nguoi Viet hay mac
```

Fail if:

```text
- it is only a definition card
- it lacks speaker action
- it lacks trap warning
- it lacks a usable example
```

### 8.2 Minimal Pair

Required:

```text
- pattern A
- pattern B
- contrast axis
- example A
- example B
- trap warning
```

Fail if:

```text
- the contrast axis is implicit only
- it compares 3-4 patterns at once
- it explains only Vietnamese meaning
- it does not say why A is not B
```

### 8.3 Clue Map / Decision Rule

Required:

```text
- before clue
- after clue
- speaker action
- likely pattern
- common wrong-answer trap
- decision question
```

Fail if:

```text
- it becomes a keyword board
- it has no visible trap
- it does not help under exam pressure
```

### 8.4 Worked Example Board

Required:

```text
- question
- Step 1: doc cau / cho trong
- Step 2: tim dau hieu
- Step 3: goi ten logic
- Step 4: loai bay
- Step 5: chot dap an
- reusable decision rule
```

Fail if:

```text
- it only reveals the answer
- it skips trap elimination
- it does not generalize the solving process
```

### 8.5 Diagnostic Practice

Required:

```text
- question
- answer choices
- correct answer
- trap tag
- short diagnosis
- review target
```

Fail if:

```text
- it reveals too early
- it names the answer but not the learner error
```

### 8.6 CTA Diagnostic

Required:

```text
- learner problem
- asset promise
- asset contents
- why it is the next learning step
```

Fail if:

```text
- it sounds like generic sales copy
- it does not continue the lesson pain point
```

---

## 9. Step 6 - Check Learning-Function Integrity

Each slide must have one primary job.

Review question:

```text
If this slide disappeared, what exact learner function would be lost?
```

Good:

```text
Slide 11 exists to separate correction from strong denial.
```

Bad:

```text
Slide 11 exists because comparisons feel useful somewhere in the deck.
```

Fail if:

```text
- the slide mixes too many jobs
- the slide repeats a previous slide without adding a new learner function
```

---

## 10. Step 7 - Adapt To Production Constraint

Current MVP rule:

```text
1 logical slide = 1 PNG frame = 1 audio segment
```

Implications:

```text
- real animation cannot carry lesson meaning
- reveal logic must still work as static before/after
- quiz and worked-example boards must remain understandable in final-state export
```

Use this adaptation rule:

```text
Teaching structure first
-> then flatten to MVP-friendly visual state
```

Do not simplify away the logic.

---

## 11. Step 8 - Build Render Layout

Only after steps 1-6 pass:

```text
template fields
-> render layout
```

Important distinction:

```text
Template = teaching contract
Layout = visual renderer implementation
```

Examples:

```text
Minimal Pair may render as comparison layout
Grammar Card may render as grammar layout
Worked Example may render as quiz layout in MVP
```

Fail condition:

```text
If the chosen render layout hides or drops required template fields,
the slide is not ready even if it looks clean.
```

---

## 11.5 Step 8b - Optional OD Visual Mockup Pass

Use this step ONLY when introducing a new `template_id` to the library
or significantly changing the visual contract of an existing template.

Skip entirely when working on an active lane that uses existing templates.

### When to use

```text
- Proposing a new template (e.g. a new "Minimal Pair Carousel" variant)
- Reworking layout of an existing template before committing React code
- Designer needs visual iteration before locking the layout contract
```

### When NOT to use

```text
- Any production lane work that uses an already-accepted template
- Lesson-content authoring (skeleton, script, examples)
- Anything that would render to a final PNG frame for video
```

### How

```text
1. Use Open Design MCP to create an HTML mockup of the proposed template.
2. Mockup uses placeholder content respecting:
   - learner-facing Vietnamese rules (07, 09, 10)
   - 3-view labels `Y nghia - Dang - Cach dung` (never English)
   - production constraint: 1 logical slide = 1 PNG frame, no animation
3. Review the mockup visually with the human reviewer.
4. Once layout is locked, the implementation lives in
   `apps/slide-agent/templates/<template_id>/` as `template.html`,
   `slots.json`, and optional `template.css`.
   The renderer remains `apps/slide-agent/scripts/render.js`.
5. Update `02-slide-template-library.md` with the new template contract.
```

### Hard rules

```text
- OD mockup is throwaway. It never becomes the runtime artifact.
- OD MCP never authors lesson content. Only structural / visual prototyping.
- The runtime owner is the slide-agent substitution renderer. JSON does not carry HTML.
- If the mockup includes English internal labels (Hook, Reveal, Core Method),
  it fails before review - fix language before mocking.
```

### Pass condition

```text
The mockup demonstrates the template contract well enough that:
- the React component author knows what to build
- the slide-template-library entry can be written precisely
- no implicit visual decisions remain
```

---

## 12. Step 9 - Run Acceptance Review

Review each slide in this order:

```text
1. Phase
2. Skeleton link
3. Template
4. Language fit
5. Required fields
6. Learning function
7. Production fit
8. Assessment follow-up
```

Use these decision labels:

```text
PASS
PASS_WITH_NOTES
REVISE
BLOCK
```

### PASS

```text
Template contract is present and production-ready.
```

### PASS_WITH_NOTES

```text
Usable for MVP, but polish or density can still improve.
```

### REVISE

```text
Flow is valid, but the slide misses key template fields or decision logic.
Patch before audio/video lock.
```

### BLOCK

```text
The slide fails architecture-level meaning or contradicts the skeleton.
Return to structure, not styling.
```

---

## 13. Step 10 - Patch Order

Patch by risk, not by slide number.

Recommended patch order:

```text
1. Worked Example
2. Minimal Pair
3. Grammar Cards
4. Clue Map
5. Promise / CTA clarity
6. Recap polish
```

Reason:

```text
If the solving logic is weak,
the deck fails pedagogically even if the opening and recap look polished.
```

---

## 14. Step 11 - Lock Downstream Assets

Only lock script, frames, audio, and assembly after:

```text
- architecture passes
- template fit passes
- production fit passes
```

Downstream lock chain:

```text
slide review
-> script sync
-> frame export
-> audio generation
-> assembly
```

Do not lock audio first and patch slides later unless the patch is explicitly visual-only.

---

## 15. Review Output Format

Use this format when applying the process to a real deck:

```text
Decision: PASS / PASS_WITH_NOTES / REVISE / BLOCK

Architecture:

Language fit:

Template fit:

Production fit:

Assessment continuity:

Findings:
1.
2.
3.

Required patches:
1.
2.
3.
```

---

## 16. What This Process Prevents

This process is designed to prevent these common failures:

```text
1. Correct deck flow, weak individual slides
2. Comparison slides without explicit contrast axis
3. Grammar slides without trap warnings
4. Clue slides that become keyword memorization boards
5. Worked examples that only reveal answers
6. Vietnamese copy that sounds like internal metadata
7. Beautiful render layouts that drop teaching fields
```

---

## 17. Final Rule

The deck is ready only when both statements are true:

```text
The flow makes sense.
The slide templates actually survive contact with the rendered deck.
```
