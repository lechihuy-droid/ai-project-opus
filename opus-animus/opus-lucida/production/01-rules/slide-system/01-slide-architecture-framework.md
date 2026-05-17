# Lucida Slide Architecture Framework
**Status:** Active v1  
**Scope:** All Lucida JLPT N2 lesson videos  
**Role:** Canonical rule for turning a teaching skeleton into a slide architecture

---

## 1. Core Position

Slides are not a decoration layer for the script.

Slides are the learner-facing thinking structure between the teaching skeleton and the spoken script.

Canonical flow:

```text
Skeleton
-> Slide Architecture
-> Slide Template / Wireframe
-> Script
-> Slide Design
-> Audio / Video
```

Avoid this flow:

```text
Skeleton
-> Script
-> Slides that merely illustrate the script
```

Reason:

```text
If slides are made after script as visual notes, they become passive subtitles.
For N2 grammar education, slides must expose the logic:
- what the pattern does
- how it differs from nearby patterns
- where the clue is
- why a wrong answer feels plausible but fails
```

---

## 2. Inputs

Slide architecture must read from these sources before any visual deck is built.

| Input | Provides | Used to decide |
|---|---|---|
| `01-master-teaching-skeleton.md` | topic, promise, grammar truth, trap logic, minimal pairs, worked example | which slides must exist |
| Example bank / approved examples | natural Japanese, Vietnamese persona, real-life context | which examples belong on screen |
| Script notes or draft | pacing, pause markers, reveal points | whether a slide needs quiz states or multiple frames |
| Production constraints | current technical limits | whether reveal is static, flattened, or animated |
| Design system | brand, typography, component language | how templates look after structure is locked |

Skeleton is the source of truth for lesson meaning.

Slide architecture is the source of truth for what the learner sees.

---

## 3. Phase System

Every lesson deck should be assembled from these phases.

| Phase | Function | Typical template |
|---|---|---|
| 1. Hook | Name a real learner pain or contrast | Hook Situation / Hook Contrast |
| 2. Try First | Let the learner attempt before explanation | Quiz Before / After |
| 3. Promise | Clarify the outcome of the lesson | Promise Board |
| 4. Context | Ground the grammar in a concrete situation | Story Context |
| 5. Method | Give the learner a way to think | Method Board |
| 6. Grammar Core | Teach each pattern | Grammar Card / Form Table / Example Stack |
| 7. Contrast | Separate confusable patterns | Minimal Pair / Comparison Matrix |
| 8. Exam Transfer | Convert understanding into exam behavior | Clue Map / Decision Rule |
| 9. Worked Example | Model the solving process | Worked Example Board |
| 10. Practice | Let the learner retrieve and self-diagnose | Diagnostic Practice |
| 11. Recap | Lock the memory map | Recap Map |
| 12. CTA | Lead to worksheet / diagnostic quiz | CTA Diagnostic |

Not every lesson needs every phase as a separate slide, but every long-form N2 lesson must cover these functions.

---

## 4. Skeleton Alignment Rule

Every slide must link to one skeleton section.

Required metadata for each slide:

```text
Slide number
Phase
Skeleton link
Template
Learning function
On-screen role
Script role
Production note
```

If a slide cannot link back to the skeleton:

```text
Option 1: remove the slide.
Option 2: update the skeleton first because a real lesson idea is missing.
```

Downstream assets must not invent lesson scope casually.

---

## 5. Script Alignment Rule

Script should be written from the slide architecture, not the other way around.

Each script block should map to the slide by:

```text
Slide purpose
-> On-screen structure
-> Spoken explanation
-> Pause / reveal cue
-> Speaker note
```

Target condition:

```text
If the learner watches without audio, the slide still shows the lesson function.
If the learner only hears the audio, the spoken logic still works.
If both are present, slide and script complement each other instead of repeating each other.
```

---

## 6. Production Constraint Rule

Current MVP constraint:

```text
1 logical slide = 1 PNG frame = 1 audio segment
```

Therefore:

```text
Quiz reveal cannot rely on actual animation unless the frame pipeline is upgraded.
```

MVP solution:

```text
Use static before/after quiz structure:
- Before: question, choices, what to think about
- After: answer, reason, trap explanation
```

Future solution:

```text
Flatten reveal states into multiple production frames
or upgrade assembly timing to support multiple frames inside one audio segment.
```

---

## 7. Architecture QA

Review slide architecture in this order:

```text
1. Does each slide have a clear learning function?
2. Does each slide link to the skeleton?
3. Is the chosen template right for the function?
4. Does the sequence create a coherent learning journey?
5. Does the slide prepare the script, worksheet, or quiz properly?
6. Does it respect current production constraints?
```

Do not review visual beauty before these questions pass.

