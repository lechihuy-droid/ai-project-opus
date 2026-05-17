# Wake HTML Runtime Pilot Review 01-05
**Status:** Active review v0.1  
**Date:** 2026-05-06  
**Scope:** Verify the new HTML runtime process on Slides 01-05 before scaling to the full Wake deck  
**Role:** Lane review / Agile pilot verification  
**Owner layer:** lane review  
**Parent:** `automation/workflows/39-html-video-generation-sop.md`, `production/01-rules/slide-system/06-slide-template-acceptance-process.md`, `production/00-active/wake-cluster/15-html-video-upgrade-plan.md`  
**Supersedes:** none  
**Superseded by:** none

---

## 1. Purpose

Run a small Agile verification sprint on the first five Wake slides so the team can validate the new chain:

```text
Skeleton
-> Template contract
-> Scene/state timing map
-> HTML runtime deck
-> Audio sync
-> Timed render
```

This pilot is not trying to finish the whole lesson. Its job is to prove that the new production logic is coherent on a representative opening sequence:

```text
Hook
-> Quiz
-> Promise
-> Story
-> Method board
```

---

## 2. Sprint Goal

Definition of done for this pilot:

1. Slides 01-05 are still pedagogically coherent.
2. Each slide has a valid template identity.
3. Each slide can be represented as explicit scene/state beats.
4. The timing map does not drift from the deck reveal logic.
5. Vietnamese learner-facing explanation remains natural enough for N2 teaching context.

---

## 3. Inputs Reviewed

```text
01-master-teaching-skeleton.md
03-slide-deck.md
08-production-frame-map.md
14-wake-slide-process-review.md
15-html-video-upgrade-plan.md
39-html-video-generation-sop.md
06-slide-template-acceptance-process.md
07-vietnamese-explanation-style-guide.md
```

---

## 4. Slide-by-Slide Verdict

### Slide 01 - Opening Situation

```text
Phase: Hook
Template: Hook Contrast
Verdict: PASS
```

Why it passes:
- The hook immediately surfaces the real confusion inside the cluster.
- The on-screen payload is lean enough for runtime state reveals.
- The four states in `08-production-frame-map.md` match the reveal logic in the deck.

Keep:
- Japanese first, explanation second.
- Final takeaway stays short: same `わけ`, different speaker logic.

Risk:
- none worth patching in this sprint

### Slide 02 - Hook Quiz

```text
Phase: Hook quiz
Template: Quiz Before / After
Verdict: PASS_WITH_NOTES
```

Why it mostly passes:
- The question and answer timing are already clear enough for runtime rendering.
- The temporary payoff gives momentum without over-teaching too early.

Notes:
- The runtime should keep the 3-second pause as an explicit timing contract, not as a narrator-only convention.
- Wrong-answer trap reasoning is present in script intent, but still lives more strongly in narration than on-screen state definition.

Next patch if needed:
- add a more explicit state-level trap label for the answer reveal if the first video render feels too fast

### Slide 03 - Topic Intro + Dual Promise

```text
Phase: Promise board
Template: Promise Board
Verdict: PASS_AFTER_MAP_PATCH
```

What was patched:
- The scene/state map now treats `title + 4 patterns` as one state instead of leaving the pattern reveal implicit.

Why it now passes:
- The slide cleanly bridges from hook tension to lesson mission.
- Both promises remain aligned with Lucida's teaching logic:
  exam transfer and real-life interpretation.

Risk:
- If runtime pacing is too slow, this slide can feel like two slides compressed into one.

Agile note:
- Keep as-is for pilot render 1.
- Re-split only if timing review shows attention drop.

### Slide 04 - Story

```text
Phase: Story context
Template: Story Context
Verdict: PASS
```

Why it passes:
- The slide does one job only: create conflict.
- Runtime states are simple and easy to sync.
- It expands the lesson from exam context to real-life context without prematurely teaching all four patterns.

Keep:
- Stay minimal.
- Do not overload with labels or grammar names.

### Slide 05 - 3 Cách Nhìn + Big Idea

```text
Phase: Method board
Template: Method Board
Verdict: REVISE_LIGHT
```

Why it is close but not fully locked:
- Teaching logic is good.
- Vietnamese is natural enough.
- But the old timing map drifted from the actual reveal structure.

What was patched:
- `08-production-frame-map.md` now reflects:
  - state 05.1 = guiding question + `Ý nghĩa - Dạng - Cách dùng`
  - state 05.2 = the three guiding questions
  - state 05.3 = the final mantra

Remaining risk:
- This slide is text-denser than Slides 01-04, so runtime timing must be slightly more deliberate.
- If rendered too quickly, the learner may read the labels but miss the methodological shift.

Recommended next patch:
- Consider slightly shortening the three guiding lines after the first pilot render if readability feels tight.

---

## 5. Pilot Outcome

Overall pilot decision:

```text
Slides 01-05 = PASS_WITH_LIGHT_REVISION
```

Meaning:
- The new HTML runtime process is valid on the opening sequence.
- The biggest issue was not lesson logic.
- The biggest issue was scene/state fidelity between deck reveal and runtime map.

This is a good sign for the upgrade, because it means the main work ahead is execution discipline, not concept rescue.

---

## 6. Agile Readout

### What we learned in this sprint

1. The opening five-slide sequence already fits the runtime model better than the old PNG-first pipeline suggested.
2. The most likely failure mode is not template mismatch, but reveal-state drift between `03-slide-deck.md` and `08-production-frame-map.md`.
3. Agile should work in blocks of `3-5 slides`, not whole-deck rewrites.

### Working rule for the next sprint

For each sprint slice:

```text
1. Pick 3-5 contiguous slides.
2. Check template contract.
3. Check Vietnamese explanation fit.
4. Check scene/state timing fidelity.
5. Render-review mentally before scaling.
6. Patch only the highest-leverage drift.
```

---

## 7. Next Sprint Recommendation

Best next sprint:

```text
Slides 06-09
```

Why:
- This is the first heavy-content block.
- It will test whether `Grammar Card` can survive the runtime model without becoming too dense.
- If Slides 06-09 pass, the whole upgrade becomes much more credible.

Secondary sprint after that:

```text
Slides 10-14
```

Because that block will test:
- comparison timing
- clue map timing
- worked example timing

---

## 8. Current Patch Log

Patched during this pilot:

```text
08-production-frame-map.md
- Slide 03 state 03.1 now explicitly includes title + 4 patterns
- Slide 05 states now match the real reveal structure in 03-slide-deck.md
```
