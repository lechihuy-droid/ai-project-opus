# Slide / Script Sync Criteria
**Status:** Active
**Role:** Sync gate between slide architecture and spoken script
**Target slide deck:** `production/00-active/<topic-slug>/03-slide-deck.md`
**Target script:** `production/00-active/<topic-slug>/02-script.md`
**Upstream source:** `production/00-active/<topic-slug>/01-master-teaching-skeleton.md`
**Architecture source:** `production/00-active/<topic-slug>/05-<topic-slug>-mvp-output-architecture.md`

---

## 1. QA Goal

This gate checks whether the slide deck and script are synchronized siblings.

They should both come from:

```text
01-master-teaching-skeleton.md
05-<topic-slug>-mvp-output-architecture.md
```

The slide deck has two layers:

```text
Slide Structure Layer
Slide Design Layer
```

The script syncs primarily with:

```text
Slide Structure Layer
Build / reveal order
```

The script should not narrate every design detail.

The script is the spoken teaching layer.

Neither file should casually add, remove, or reorder teaching beats without updating the architecture first.

---

## 2. Correct Dependency Model

Use this model:

```text
01-master-teaching-skeleton.md
        |
        v
05-<topic-slug>-mvp-output-architecture.md
        |
        +-----------------------------+
        |                             |
        v                             v
03-slide-deck.md                 02-script.md
structure + design               spoken teaching layer
        |                             |
        +-------------sync------------+
                      |
                      v
recording / video production
```

Do not use this outdated model:

```text
skeleton -> script -> slide -> video
```

That model makes slide design reactive and often causes weak on-screen structure.

---

## 3. File Responsibilities

### 3.1 Skeleton

Answers:

```text
What is true?
```

Owns:

- grammar scope;
- learner pain;
- promise;
- core logic;
- examples;
- traps;
- worked example answer logic;
- worksheet / quiz promise.

### 3.2 Output Architecture

Answers:

```text
What beats does this lesson move through?
```

Owns:

- slide count;
- slide order;
- role of each beat;
- timing range;
- worked example location;
- diagnostic practice location;
- CTA location;
- MVP-specific decisions.

### 3.3 Slide Deck

Answers:

```text
What does the learner see?
```

Owns:

Structure layer:
- on-screen text;
- reveal states;
- clue highlights;
- answer/trap reveal;
- screenshot-friendly recap.

Design layer:
- layout;
- visual elements;
- hierarchy / emphasis;
- color / accent;
- motion notes;
- reusable component choice.

Does not own:

- full narration;
- grammar scope changes;
- new teaching beats.

### 3.4 Script

Answers:

```text
What does the learner hear?
```

Owns:

- spoken explanation;
- examples said aloud;
- transition lines;
- pause and emphasis;
- TTS / audio notes;
- CTA delivery.

Does not own:

- slide count changes;
- new grammar scope;
- visual reveal decisions.

---

## 4. Pass Definition

Slide/script sync passes when:

- slide count matches script slide blocks;
- slide numbers match exactly;
- each slide has the same role in both files;
- each slide's script explains the on-screen text for that slide;
- each slide's script follows the structure layer and reveal order;
- script does not introduce a major idea that has no slide anchor;
- slide deck does not show a major idea that script does not explain;
- worked example reasoning is present in both visual reveal and narration;
- diagnostic practice pause/reveal is present in both visual reveal and narration;
- CTA promise is the same in both files;
- parser/audio requirements are satisfied if the production uses slide-based audio blocks.
- script does not waste time describing non-essential design details.

---

## 5. Required Checks

### 5.1 Structural Sync

Check:

```text
Slide 01 in deck = Slide 01 in script
Slide 02 in deck = Slide 02 in script
...
```

Fail if:

- slide count differs;
- numbering differs;
- script has unnumbered teaching sections;
- deck has a slide not represented in script.

### 5.2 Role Sync

Check:

- Does each slide teach the same beat in both files?
- Does the script respect the role defined in the deck?
- Does the deck reflect the role defined in the architecture?

Fail if:

- deck says a slide is diagnostic practice but script treats it as passive explanation;
- deck says a slide is recap but script introduces new teaching;
- script explains a different grammar contrast than the slide displays.

### 5.3 On-screen / Spoken Sync

Check:

- Is on-screen text short enough to support the narration?
- Does the narration explain every visible decision point?
- Are Japanese examples pronounced / explained when shown?
- Are clue highlights described in speech?

Fail if:

- the speaker talks about text that is not visible and not prepared by the slide;
- visible text is never explained;
- script repeats full slide text mechanically instead of teaching.
- script narrates layout/color/icon details that do not teach the point.

### 5.4 Reveal / Audio Sync

Check:

- Does the script contain pause cues where the slide has learner retrieval?
- Does the script cue answer reveal after the learner has time to think?
- Does the script explain trap reveal after the answer?
- Can the audio be split by slide blocks if needed?

Fail if:

- answer is spoken before the slide reveal;
- diagnostic slide has no pause;
- worked example reveal order and narration order conflict.

### 5.6 Design Non-Interference

Check:

- Does the script avoid describing design details unless they are pedagogically meaningful?
- Does the design layer avoid forcing the script to add unnecessary narration?
- Does visual emphasis support the spoken explanation without changing its meaning?

Fail if:

- the script explains decorative layout instead of the lesson;
- design creates a promise or contrast that the script does not teach;
- color coding changes the grammar logic or adds unsupported categories.

### 5.5 Scope Sync

Check:

- No new grammar points added by script or slide.
- Bonus items remain visually and narratively secondary.
- CTA promise is the same across slide and script.

Fail if:

- script adds a new lesson branch;
- slide shows a bonus as if it were a main target;
- CTA advertises a different asset than the deck prepares.

---

## 6. Severity Levels

### Critical

Must fix before audio/video.

- slide count mismatch;
- slide numbers mismatch;
- grammar scope mismatch;
- worked example answer logic differs;
- answer reveal order conflicts with script.

### Major

Should fix before recording.

- script explains a slide too vaguely;
- slide displays text that script does not explain;
- CTA promise differs;
- a key clue/trap appears in only one file.
- design creates a teaching implication not covered by script/structure.

### Minor

Can fix during polish.

- wording mismatch that does not affect meaning;
- one reveal cue could be clearer;
- slide title and script heading differ slightly.

---

## 7. Output Format

Use this report format:

```text
Decision: Pass / Pass with minor revisions / Pass with revisions / Block

Structural sync:

Role sync:

On-screen / spoken sync:

Reveal / audio sync:

Design non-interference:

Scope sync:

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

## 8. Decision Rule

Move to recording or audio generation only when:

```text
Slide / Script Sync = Pass
or
Slide / Script Sync = Pass with minor revisions
```

If sync is `Pass with revisions`, patch slide or script first.

If sync is `Block`, return to output architecture before continuing.
