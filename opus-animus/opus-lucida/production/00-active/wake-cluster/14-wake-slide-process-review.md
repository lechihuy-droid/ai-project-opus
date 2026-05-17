# Wake Slide Review Using The Full Slide Process
**Status:** Active review v0.1  
**Date:** 2026-05-06  
**Purpose:** Apply the Lucida slide production and acceptance process to the Wake deck and produce a process-level review

---

## 1. Review Scope

Reviewed sources:

```text
01-master-teaching-skeleton.md
03-slide-deck.md
08-production-frame-map.md
11-slide-phase-template-map.md
13-wake-slide-traceability-matrix.md
production/01-rules/slide-system/01-slide-architecture-framework.md
production/01-rules/slide-system/02-slide-template-library.md
production/01-rules/slide-system/04-slide-framework-qa-checklist.md
production/01-rules/slide-system/06-slide-template-acceptance-process.md
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
```

This review checks:

```text
- architecture fit
- language fit
- template fit
- production fit
- assessment continuity
```

It does not replace final visual pixel QA.

---

## 2. Executive Decision

```text
Decision: REVISE
```

Reason:

```text
Wake already has a strong learner journey and a valid 17-slide architecture.
The main remaining issue is not flow.
The main issue is template-contract completeness on several high-value slides.
```

Summary:

```text
Architecture: PASS_WITH_NOTES
Language fit: PASS_WITH_NOTES
Template fit: REVISE
Production fit: PASS_WITH_NOTES
Assessment continuity: PASS_WITH_NOTES
```

---

## 3. Architecture Review

### 3.1 What passes

Wake passes architecture-level review because it already has:

```text
Hook
-> Try First
-> Promise
-> Context
-> Method
-> 4 Grammar slides
-> Contrast
-> Clue Map
-> Worked Example
-> Practice
-> Recap
-> CTA
```

This matches the Lucida long-form lesson model and gives the learner a coherent journey.

Strong architecture choices:

```text
- Hook uses real confusion inside the cluster.
- Early payoff teaches the two hook-linked patterns first.
- Worked example returns to the original hook.
- Diagnostic practice tests transfer on a nearby confusion.
- CTA continues the same pain point instead of pivoting randomly.
```

### 3.2 Architecture notes

Architecture is strong, but one structural note remains:

```text
The skeleton requires 3 comparison relationships.
The deck gives one global map plus 2 explicit pair slides.
The third required pair exists only partially through the worked example logic, not as a dedicated comparison moment.
```

Impact:

```text
Not a full architecture failure,
but it leaves one comparison requirement less visible than the others.
```

---

## 4. Language Fit Review

Decision:

```text
PASS_WITH_NOTES
```

Why:

```text
Wake now sounds closer to a real N2 teaching voice than before.
The Vietnamese explanation is less glossary-like,
more guided,
and more tied to the learner's decision process.
```

What improved:

```text
- abstract labels were rewritten into spoken teaching phrasing
- contrast slides now sound more like "gỡ nhầm" than metadata
- clue and worked-example language now points the learner toward a thinking process
- CTA language now feels more like the next learning step
```

Remaining note:

```text
Language quality is stronger,
but final frame review should still check density.
Natural Vietnamese can become crowded if too many short teaching lines stack in one board.
```

---

## 5. Template Fit Review

This is the main review layer where Wake still has gaps.

### 4.1 Slides 06-09 - Grammar Card

Target template:

```text
Grammar Card
```

Required contract:

```text
pattern
speaker action
meaning
form
usage / nuance
natural example
Vietnamese learner trap
```

Current decision:

```text
REVISE
```

Why:

```text
The slides clearly identify pattern, meaning, and form.
But the full required contract is not equally strong across all four slides.
Usage / nuance and trap visibility still depend too much on script notes instead of the on-screen teaching layer.
```

Per-slide note:

```text
Slide 06: closest to the template; still needs the trap to remain visible, not only spoken.
Slide 07: constraint logic is right, but practical signals and trap separation should be stronger on-screen.
Slide 08: logical conclusion is correct, but it still needs a more concrete example anchor and explicit non-constraint warning.
Slide 09: strong denial is clear, but the form warning and intensity trap should remain prominent.
```

### 4.2 Slides 11-12 - Minimal Pair

Target template:

```text
Minimal Pair
```

Required contract:

```text
pattern A
pattern B
contrast axis
example A
example B
trap warning
```

Current decision:

```text
PASS_WITH_NOTES
```

Why:

```text
Both slides already compare the correct pairs and point to the right confusion.
However, the deck should make the contrast axis even more explicit and durable.
These slides must survive as stand-alone teaching anchors, not only as script-supported comparisons.
```

Review by pair:

```text
Slide 11:
correction / denial of assumption
vs
strong denial of possibility

Slide 12:
possibility judgment
vs
constrained action
```

Main patch need:

```text
Keep the contrast axis visually central.
Do not let the slide read like two side-by-side definitions only.
```

### 4.3 Slide 13 - Clue Map / Decision Rule

Target template:

```text
Clue Map / Decision Rule
```

Required contract:

```text
before clue
after clue
speaker action
likely pattern
wrong-answer trap
decision question
```

Current decision:

```text
REVISE
```

Why:

```text
The current slide is pointed in the right direction,
but it still risks becoming a keyword board.
The clue layer must teach decision behavior, not only clue labeling.
```

Main gap:

```text
Likely pattern is visible.
Wrong-answer trap is not yet strong enough as a first-class slide element.
```

Required correction:

```text
Show before clue + after clue + speaker action as the main engine,
then make at least one tempting wrong answer visible per logic row.
```

### 4.4 Slide 14 - Worked Example Board

Target template:

```text
Worked Example Board
```

Required contract:

```text
question
read
find clue
name logic
eliminate trap
choose answer
reusable rule
```

Current decision:

```text
REVISE
```

Why:

```text
Wake already has the right worked-example instinct:
return to the hook and explain the traps.
But the step order should be even more explicit so the learner can copy the process later.
```

Current risk:

```text
If the board is too answer-oriented,
it becomes answer review rather than a thinking model.
```

Required correction:

```text
Keep the slide visibly procedural:
blank 1 -> clue -> logic -> trap
blank 2 -> clue -> logic -> trap
final answer -> reusable rule
```

### 4.5 Slide 15 - Diagnostic Practice

Target template:

```text
Diagnostic Practice
```

Current decision:

```text
PASS_WITH_NOTES
```

Why:

```text
The slide already behaves like transfer practice and names the trap family.
The main need is to keep the learner diagnosis compact and immediately review-oriented.
```

### 4.6 Slide 17 - CTA Diagnostic

Target template:

```text
CTA Diagnostic
```

Current decision:

```text
PASS
```

Why:

```text
The CTA continues the exact learner pain:
understand the lesson, but still hesitate in real questions.
It leads naturally to worksheet + quiz as the next learning step.
```

---

## 6. Production Fit Review

Current MVP constraint:

```text
1 logical slide = 1 PNG frame = 1 audio segment
```

Decision:

```text
PASS_WITH_NOTES
```

Why:

```text
Wake already understands the MVP reality and uses static before/after thinking.
This is a production strength.
```

Remaining risk:

```text
Some template logic still lives in reveal notes more than in final-state boards.
If the final static board drops too much of the template contract,
the slide becomes script-dependent again.
```

Priority production warning:

```text
Do not treat clean final-state export as proof of teaching readiness.
The final state must still preserve the slide's teaching function.
```

---

## 7. Assessment Continuity Review

Decision:

```text
PASS_WITH_NOTES
```

Wake is strong here because it already links:

```text
grammar
-> comparison
-> clue map
-> worked example
-> diagnostic practice
-> worksheet / quiz CTA
```

This is good Lucida behavior.

Remaining note:

```text
The clue map and worked example should expose trap logic even more clearly,
because they are the bridge into worksheet and diagnostic follow-up.
```

---

## 8. Findings

1. Wake has already solved the hardest architecture problem: the 17-slide flow is coherent and learner-centered.

2. The main remaining weakness is template completeness, especially on `Grammar Card`, `Clue Map`, and `Worked Example`.

3. `Minimal Pair` is on the right track, but must keep the contrast axis visually explicit so the slide works even without full script support.

4. The renderer/layout layer is serviceable for MVP, but it should not be mistaken for a full template-enforcement layer.

5. Wake is close to a strong locked system, but it should not be considered fully locked until the high-value template gaps are patched.

---

## 9. Required Patches

1. Standardize Slides 06-09 against the full `Grammar Card` contract:
   pattern, speaker action, meaning, form, usage, example, trap.

2. Strengthen Slide 13 so it becomes a true `Clue Map / Decision Rule` board rather than a near-keyword summary.

3. Strengthen Slide 14 so it reads as a visible solving process, not merely an answer review.

4. Keep Slides 11-12 centered on one explicit contrast axis each.

5. Decide whether the third required comparison from the skeleton needs a more explicit dedicated teaching moment.

---

## 10. Suggested Wake Decision After Patching

If the required patches above are completed, Wake can likely move to:

```text
PASS_WITH_NOTES
```

Reason:

```text
The architecture is already good enough.
The remaining work is mainly template enforcement and MVP-safe teaching clarity.
```

Wake should move to full:

```text
PASS
```

only when:

```text
- grammar cards are structurally consistent
- clue map shows decision + trap
- worked example shows process, not just result
- final static boards preserve the intended teaching logic
```
