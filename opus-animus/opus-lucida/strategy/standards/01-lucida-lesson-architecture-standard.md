# Lucida Lesson Architecture Standard
**Status:** Active standard v1
**Date:** 2026-05-01
**Scope:** Reusable production rule for JLPT N2 grammar cluster lessons
**Applies to:** teaching skeleton, script, slide deck, worksheet, diagnostic quiz, shorts, CTA, QA

---

## 1. Purpose

This file defines the reusable Lucida lesson architecture.

It is not a script.
It is not a single-topic implementation.

Use it as the standard for building:

```text
confusable JLPT N2 grammar cluster lessons
```

Examples:

```text
wake / hazu / mono / koto
kai ga atte / kai mo naku / gai
kakeru / kiru / nuku
ni kagiri / ni kagitte / to wa kagiranai
ijou / kara ni wa / ue wa
```

---

## 2. Core Positioning

Lucida does not only teach meanings.

Lucida trains learners to identify:

```text
what the speaker is doing
what clue the sentence gives
which answer is tempting
why the tempting answer fails
```

Core learner pain:

```text
I can translate the sentence,
but I still choose the wrong answer.
```

Core promise:

```text
Learn the logic behind the grammar cluster,
so you can choose the right answer instead of guessing from Vietnamese meanings.
```

---

## 3. Two-layer Operating Model

Lucida has two layers:

```text
Front-end learner ecosystem
Back-end AI production engine
```

### Front-end learner ecosystem

The learner-facing system may use AI, but it should be rule-anchored.

Recommended flow:

```text
learner answer
-> pre-tagged trap type
-> reviewed explanation template / knowledge base
-> AI explains the tagged error in coach-like language
-> link to exact review asset
```

Do not ask learner-facing AI to infer grammar errors from scratch in the MVP.

Use AI to:

- personalize reviewed explanations;
- make feedback warmer and clearer;
- recommend the next review asset;
- adjust explanation length to learner level.

Do not use AI to:

- change the answer key;
- invent new grammar rules;
- diagnose an untagged error as fact;
- generate unreviewed examples as authoritative.

### Back-end AI production engine

Use AI aggressively backstage, but split work by asset.

Recommended chain:

```text
1. Cluster extraction
2. Teaching skeleton
3. Cross-check / quality gate
4. Asset generation
5. Human Japanese review
6. Production assembly
7. Analytics review
```

Asset prompts should be split:

```text
A. Long-form script
B. Slide text / visual spec
C. Shorts scripts
D. Worksheet / quiz
E. Email follow-up
F. Thumbnail / title ideas
```

---

## 4. Grammar Cluster Schema

Every cluster should be represented by a reviewed schema before downstream production.

Minimum schema:

```text
cluster_name
core_logic
grammar_points
form_rules
usage_rules
vietnamese_traps
minimal_pairs
jlpt_clues
typical_distractors
worked_example
worksheet_plan
shorts_angles
cta_angle
```

This schema is the shared source of truth for:

```text
script
slide
worksheet
quiz
shorts
email
```

---

## 5. Three Internal Layers

Every lesson should be designed from three internal layers.

### Core pedagogy

```text
Nghia - Hinh - Dung
common Vietnamese learner mistake
minimal pair / contrast
```

### Exam engine

```text
worked example
JLPT clue map
trap / distractor analysis
```

### YouTube packaging

```text
problem hook
attention rhythm
soft CTA
shorts / worksheet repurposing
```

These layers are internal production rules.

Do not explain them as theory in the learner-facing script.

---

## 6. Eight-part Lesson Architecture

Default long-form lesson structure:

1. Pain Point
2. Promise
3. Grammar Core via `Nghia - Hinh - Dung`
4. Contrast / Minimal Pair
5. JLPT Trap Map
6. Worked Example
7. Retention Design
8. Asset Repurposing

For YouTube 8-13 minute lessons, map this into:

| Phase | Goal |
|---|---|
| Problem Hook | make the right learner recognize the pain |
| Quick Quiz | create active attention and early payoff |
| Pain Naming + Promise | explain why the learner gets it wrong |
| Teaching Frame | introduce `Nguoi noi dang lam gi?` and `Nghia - Hinh - Dung` |
| Core Grammar Blocks | teach each pattern through speaker action |
| Comparison Blocks | separate nearest confusions |
| Worked Example | model JLPT reasoning step by step |
| Practice Retrieval | make learner choose before reveal |
| Soft CTA | offer the next practice asset |
| Recap | compress memory, no new teaching |

---

## 7. Teaching Block Rule

Each grammar point should include:

```text
1. Nguoi noi dang lam gi?
2. Nghia cot loi
3. Hinh thuc / cau truc
4. Cach dung / sac thai
5. Tin hieu chon dap an
6. Bay de nham
```

The spoken script should sound natural, not like a checklist.

Preferred rhythm:

```text
pain / situation
-> Japanese example
-> speaker action
-> short label
-> exam signal
-> trap warning
```

---

## 8. Worked Example Rule

Every long-form lesson should include at least one worked example.

Use this solving path:

```text
read question
-> mark clue
-> identify speaker action / logic relation
-> eliminate two tempting wrong answers
-> compare final two
-> choose answer
-> summarize trap
```

Answer explanations must include:

```text
why correct answer works
why wrong answer looks tempting
why wrong answer fails
```

---

## 9. Trap Taxonomy

Use this lightweight 5Ps system for quiz and worksheet distractors.

| Tag | Meaning |
|---|---|
| Plausible | wrong answer looks close to correct answer |
| Prejudicial | Vietnamese translation habit / L1 interference |
| Polyconceptual | multiple concepts, double negative, or overloaded reasoning |
| Pragmatic | wrong tone, register, or usage context |
| Peripheral | clearly wrong option for quick elimination |

Operational tags may be added:

```text
Form_error
Clue_missed
Speaker_action_missed
```

---

## 10. Slide Standard

Slide principle:

```text
Slides are anchors, not scripts.
```

But do not reduce slide density blindly.

Use layered density:

```text
clue -> pattern -> contrast -> trap -> reveal
```

Good:

```text
one slide with 3-5 sequential states
```

Bad:

```text
one static slide full of text from the beginning
```

Japanese pattern/example should usually be the object of attention.

Vietnamese explanation should act as interpretation and guidance.

---

## 11. Worksheet And Diagnostic Standard

Worksheet and quiz are diagnostic assets, not summaries.

They should include:

- one-page logic map;
- `Nghia - Hinh - Dung` table;
- exam-signal table;
- minimal pair drills;
- worked example;
- progressive practice;
- answer key with distractor explanations;
- trap metadata for each wrong option.

Progressive fading:

```text
Set 1: clues visible
Set 2: partial clues
Set 3: no clues, JLPT-style
```

---

## 12. Quality Gate

Every lesson asset should pass:

- Does it teach root logic, not only Vietnamese meaning?
- Does it include form rules?
- Does it include realistic usage or context?
- Does it name the Vietnamese learner trap?
- Does it include at least one minimal pair?
- Does it include JLPT clue/signpost words?
- Are wrong answers tagged by trap type?
- Is there a worked example with think-aloud reasoning?
- Does slide density use staged reveal when rich information is needed?
- Does quiz feedback diagnose the learner's likely error?

---

## 13. Validation Metrics

Treat numeric goals as hypotheses, not guarantees.

Track:

- retention through 0:15, 0:30, 1:00, and CTA;
- replay around worked example and practice;
- quiz click-through rate;
- worksheet download rate;
- most common trap tags;
- comment confusion patterns;
- conversion from quiz to email/course.

Do not optimize only for retention.

For Lucida, a lesson can be successful if it produces:

```text
high-quality learner diagnosis
trust
worksheet completion
course intent
```

