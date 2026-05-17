# Core Output Review Gates - Teaching Lane MVP
**Status:** Active
**Scope:** Skeleton / Output architecture / Slide structure / Slide design / Script / Sync
**Workflow:** `automation/workflows/20-lesson-production-sop.md`
**Standard:** `strategy/standards/01-lucida-lesson-architecture-standard.md`

---

## Purpose

Use this as the quick gate map before producing video.

The core outputs must pass through a branching flow:

```text
01-master-teaching-skeleton.md
-> 05-<topic-slug>-mvp-output-architecture.md
-> 03-slide-deck.md
   -> Slide Structure Layer
   -> Slide Design Layer
-> 02-script.md
-> slide/script sync
```

Do not build audio/video if any upstream gate is blocked.

---

## Gate 1 - Skeleton

Criteria file:

```text
production/03-qa/criteria/01-skeleton-qa-criteria.md
```

Pass means:

- topic scope is locked;
- grammar logic is accurate;
- learner pain and promise are clear;
- each pattern has `Nghia - Hinh - Dung`;
- minimal pairs and traps are explicit;
- worked example and diagnostic plan exist;
- worksheet / quiz metadata can be generated.

---

## Gate 2 - Output Architecture

Criteria file:

```text
production/03-qa/criteria/01-skeleton-qa-criteria.md
production/03-qa/criteria/04-slide-script-sync-criteria.md
```

Pass means:

- slide count is locked;
- slide order is locked;
- role of each lesson beat is clear;
- worked example location is clear;
- diagnostic practice location is clear;
- CTA location and promise are clear;
- script and slide can be generated as sibling outputs from the same architecture.

---

## Gate 3 - Slide Structure

Criteria file:

```text
production/03-qa/criteria/03-slide-qa-criteria.md
```

Topic-specific extension, when available:

```text
production/03-qa/criteria/wake-slide-qa-criteria.md
```

Pass means:

- deck follows skeleton + output architecture;
- major skeleton sections are mapped to slide functions;
- each slide has source link, role, on-screen text, build/reveal, script beat, and teaching check;
- slide structure does not change grammar scope;
- worked example and diagnostic logic exist structurally;
- exam and real-life promise are represented where relevant.

---

## Gate 4 - Slide Design

Criteria file:

```text
production/03-qa/criteria/03-slide-qa-criteria.md
production/02-assets/design-briefs/lucida-slide-design-direction.md
```

Pass means:

- each slide has layout, visual elements, hierarchy/emphasis, motion/reveal notes, and design-system link;
- design follows Lucida program direction;
- Japanese remains the visual anchor;
- Vietnamese supports decision-making without becoming paragraph-heavy;
- design uses reusable components where possible;
- design makes the learning operation visible.

---

## Gate 5 - Script

Criteria file:

```text
production/03-qa/criteria/02-script-qa-criteria.md
```

Pass means:

- script follows the skeleton + output architecture + slide structure;
- script does not change scope or slide count casually;
- opening hits pain point before greeting/meta;
- explanation sounds like a coach, not a textbook;
- grammar is accurate and natural;
- worked example uses think-aloud reasoning;
- CTA points to worksheet / diagnostic quiz naturally;
- text is ready for audio draft.

---

## Gate 6 - Slide / Script Sync

Criteria file:

```text
production/03-qa/criteria/04-slide-script-sync-criteria.md
```

Pass means:

- slide count and script slide blocks match;
- slide numbers match exactly;
- each slide has the same role in both files;
- on-screen text and spoken explanation are aligned;
- reveal / pause / answer timing does not conflict;
- worked example and diagnostic logic match across both files;
- script syncs to slide structure and reveal order, not every decorative design detail;
- audio/video can be produced without guessing which file is authoritative.

## Decision Labels

Use the same labels for all gates:

```text
Pass
Pass with minor revisions
Pass with revisions
Block
```

Rules:

- `Pass`: can move to next output.
- `Pass with minor revisions`: patch directly, then move on.
- `Pass with revisions`: patch and re-check the changed sections.
- `Block`: stop downstream production and fix upstream source.
