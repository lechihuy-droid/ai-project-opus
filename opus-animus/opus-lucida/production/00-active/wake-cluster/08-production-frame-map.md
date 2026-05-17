# Wake Scene / State Timing Map
**Status:** Active draft v1  
**Date:** 2026-05-02  
**Role:** Bridge between slide structure, script pacing, HTML runtime scene/state behavior, and worksheet / diagnostic follow-up

---

## 1. Purpose

This file answers:

```text
Which visual state appears when?
Which script beat / TTS marker drives it?
Which later worksheet or quiz item should reinforce it?
```

Use this before:

```text
- building HTML / Canva / Remotion frames
- generating worksheet questions
- generating diagnostic quiz items
- recording or TTS timing
```

This file does not replace:

```text
02-script.md
03-slide-deck.md
06-worksheet-quiz-operating-spec.md
```

It is a production bridge.

---

## 2. Scene / State Naming Rule

Use logical slide numbers and runtime states:

```text
Slide 02 = logical slide
State 02.1 = first reveal state
State 02.2 = second reveal state
```

Frame states can be built by:

```text
- HTML reveal state
- duplicated slide / frame
- Remotion sequence
- video editor overlay
```

Do not assume animation is required.

Current active production path:

```text
03-slide-deck.md
-> deck_generator.py (Jinja2)
-> wake-cluster-deck.html
-> runtime scene/state render
-> audio sync
-> timed video output
```

In this path, reveal states remain the production logic.

Implementation rule:

```text
Reveal state = renderable HTML runtime state.
Timing map decides when a state appears, advances, or resolves.
If a slide needs multiple visual beats inside one script segment, that timing must be declared here.
```

Current rule:

```text
Keep one logical slide ID per script segment unless timing explicitly calls for multiple runtime states.
Use reveal states as design / script / exercise alignment and as future-ready runtime timing hooks.
```

Legacy support note:

```text
Legacy screenshot export can still flatten runtime states into separate inspection frames if needed.
That export path is support-only and no longer defines the production contract.
```

Current assembly constraint:

```text
Legacy assembly path paired one frame with one audio file by matching stem:
frames/slide-01.png <-> audio/slide-01.mp3
```

So any remaining screenshot-based assembly assumptions should be treated as upgrade debt, not as source-of-truth behavior.

---

## 3. Global Reinforcement Tags

Use these tags to connect video moments to worksheet / quiz items:

```text
Speaker_action_missed
Clue_missed
Form_error
Intensity_mismatch
L1_interference
Constraint_missed
Conclusion_vs_constraint
Correction_vs_denial
```

---

## 4. Frame Map

| Slide | Frame | Visual state | Script / TTS cue | Exercise follow-up | Trap tag |
|---|---|---|---|---|---|
| 01 | 01.1 | Show first Japanese hook line | opening situation | none | n/a |
| 01 | 01.2 | Show second Japanese hook line | `明日N2だから...` | worksheet warm-up: identify speaker action | Speaker_action_missed |
| 01 | 01.3 | Highlight `わけじゃない` and `わけにはいかない` | `[TTS_PAUSE_SHORT]` before Japanese lines | diagnostic Q1 seed | Correction_vs_denial / Constraint_missed |
| 01 | 01.4 | Takeaway: same `わけ`, different logic | final hook promise | worksheet logic-map intro | Speaker_action_missed |
| 02 | 02.1 | Show hook quiz blanks | "Thử dừng 3 giây" | quiz Q1 same stem or near-transfer | Clue_missed |
| 02 | 02.2 | Show answer choices | `[TTS_PAUSE_LONG]` | diagnostic immediate retrieval | Speaker_action_missed |
| 02 | 02.3 | Reveal answer A | `[TTS_REVEAL]` | explain why B/C are traps | Correction_vs_denial / Constraint_missed |
| 02 | 02.4 | Temporary payoff for two patterns | "Tạm nhớ nhanh" | worksheet Set 1 guided clue | Speaker_action_missed |
| 03 | 03.1 | Topic title + 4 `わけ` patterns | topic intro | none | n/a |
| 03 | 03.2 | Outcome 1: N2 faster / more confident | exam promise | worksheet front page promise | n/a |
| 03 | 03.3 | Outcome 2: real-life usage | real-life promise | real-life practice set | Pragmatic |
| 03 | 03.4 | Guiding question: `Ở câu này, người nói đang muốn nói gì?` | 4 action labels | all diagnostic explanations | Speaker_action_missed |
| 04 | 04.1 | Workplace dinner invitation | story setup | real-life scenario practice | Pragmatic |
| 04 | 04.2 | Client document obligation | conflict reveal | quiz item: `資料を送らないといけない` | Constraint_missed |
| 04 | 04.3 | Want to go / cannot go | story tension | worksheet example WK-02 | Constraint_missed |
| 05 | 05.1 | Show guiding question + `Ý nghĩa - Dạng - Cách dùng` | method intro | worksheet 3-view table | n/a |
| 05 | 05.2 | Show three guiding questions for `Ý nghĩa - Dạng - Cách dùng` | `[TTS_PAUSE_SHORT]` | all answer explanations | Speaker_action_missed |
| 05 | 05.3 | Show mantra: do not lock onto `わけ` too early | "người nói đang muốn nói theo hướng nào?" | diagnostic feedback template | Speaker_action_missed |
| 06 | 06.1 | Pattern card: `わけではない` | grammar intro | worksheet grammar card | n/a |
| 06 | 06.2 | Meaning: not necessarily / not that | example `行きたくない...` | minimal pair drill vs `わけがない` | Intensity_mismatch |
| 06 | 06.3 | Form: `普通形 + わけではない` | form explanation | form drill | Form_error |
| 06 | 06.4 | Support example: seen / meeting | SNS micro example | optional short / one worksheet support line only | Pragmatic |
| 06 | 06.5 | Trap: do not overuse `わけがない` | final warning | diagnostic Q: soft correction vs strong denial | Correction_vs_denial |
| 07 | 07.1 | Pattern card: `わけにはいかない` | grammar intro | worksheet grammar card | n/a |
| 07 | 07.2 | Core meaning: cannot because constrained | "Muốn cũng không thể làm" | quiz item with deadline / responsibility | Constraint_missed |
| 07 | 07.3 | Client deadline example | `[TTS_PAUSE_SHORT]` | worksheet WK-02 | Constraint_missed |
| 07 | 07.4 | Bonus: `Vないわけにはいかない` | bonus explanation | dedicated 2 quiz questions | Form_error / Polyconceptual |
| 07 | 07.5 | Trap: not same as `わけがない` | `[TTS_PAUSE_MED]` before check | minimal pair drill | Constraint_missed |
| 08 | 08.1 | Pattern card: `わけだ` | grammar intro | worksheet grammar card | n/a |
| 08 | 08.2 | Reason -> conclusion arrow | example with documents | worksheet logic arrow drill | Conclusion_vs_constraint |
| 08 | 08.3 | "thảo nào" but not only exclamation | `[TTS_PAUSE_SHORT]` | diagnostic item with prior data | L1_interference |
| 08 | 08.4 | Trap: conclusion is not constraint | final warning | compare with `わけにはいかない` | Conclusion_vs_constraint |
| 09 | 09.1 | Pattern card: `わけがない` | grammar intro | worksheet grammar card | n/a |
| 09 | 09.2 | Strong denial scene | `みんなを嫌っている...` | diagnostic Q15-like item | Intensity_mismatch |
| 09 | 09.3 | Cue words: `絶対 / ありえない / そんなこと` | clue explanation | signal table | Clue_missed |
| 09 | 09.4 | Trap: not same as `わけではない` | final warning | minimal pair drill | Correction_vs_denial |
| 10 | 10.1 | Four-pattern map | recap transition | worksheet one-page logic map | Speaker_action_missed |
| 10 | 10.2 | Reveal each action row | "4 hành động" | diagnostic feedback labels | Speaker_action_missed |
| 10 | 10.3 | Final rescue question | "Ở câu này, người nói đang muốn nói gì?" | all practice sets | Speaker_action_missed |
| 11 | 11.1 | Compare `わけではない` vs `わけがない` | pair intro | minimal pair drill 1 | Correction_vs_denial |
| 11 | 11.2 | `嫌いなわけではない` | soft correction | form + nuance drill | Intensity_mismatch |
| 11 | 11.3 | `嫌いなわけがない` | strong denial | diagnostic Q for intensity | Intensity_mismatch |
| 12 | 12.1 | Compare `わけがない` vs `わけにはいかない` | pair intro | minimal pair drill 2 | Constraint_missed |
| 12 | 12.2 | Possibility judgment | `そんなことを言う...` | quiz item: ability / likelihood | Clue_missed |
| 12 | 12.3 | Constrained action | `今日は休む...` | quiz item: responsibility | Constraint_missed |
| 13 | 13.1 | 3-step checklist | clue map intro | worksheet signal table | Clue_missed |
| 13 | 13.2 | Before / after / speaker action | `[TTS_PAUSE_SHORT]` | guided practice Set 1 | Speaker_action_missed |
| 13 | 13.3 | Four clue mapping rows | examples by pattern | all diagnostic explanations | Clue_missed |
| 13 | 13.4 | Worksheet seed | "bảng này có trong worksheet" | CTA continuity | n/a |
| 14 | 14.1 | Show full hook question again | "Quay lại câu hook" | quiz Q1 review item | Clue_missed |
| 14 | 14.2 | Blank 1 highlight | `[TTS_PAUSE_SHORT]` | diagnostic: correction blank | Correction_vs_denial |
| 14 | 14.3 | Trap 1: `わけがない` too strong | after blank 1 explanation | trap explanation template | Intensity_mismatch |
| 14 | 14.4 | Blank 2 highlight | `[TTS_PAUSE_SHORT]` | diagnostic: constraint blank | Constraint_missed |
| 14 | 14.5 | Trap 2: `わけだ` only conclusion | before final reveal | compare `わけだ` vs `わけにはいかない` | Conclusion_vs_constraint |
| 14 | 14.6 | Reveal answer A | `[TTS_REVEAL]` | worked example solution | Speaker_action_missed |
| 15 | 15.1 | Show diagnostic question | "tự chọn" | diagnostic quiz item | Intensity_mismatch |
| 15 | 15.2 | Pause before reveal | `[TTS_PAUSE_MED]` | retrieval moment | n/a |
| 15 | 15.3 | Reveal `わけがない` | `[TTS_REVEAL]` | quiz answer key | Intensity_mismatch |
| 15 | 15.4 | Highlight form `嫌いな` | form note | form drill | Form_error |
| 15 | 15.5 | Trap tag explanation | "nhầm mức độ phủ định" | diagnostic feedback template | Intensity_mismatch |
| 16 | 16.1 | Reveal four main labels | recap | worksheet front-page table | n/a |
| 16 | 16.2 | Reveal bonus form | bonus note | quiz 2 items | Form_error / Polyconceptual |
| 16 | 16.3 | Screenshot-friendly final | final recap | worksheet summary | n/a |
| 17 | 17.1 | Problem: understand but still hesitate | CTA setup | quiz positioning | n/a |
| 17 | 17.2 | Worksheet contents | `[TTS_PAUSE_SHORT]` | worksheet sections | n/a |
| 17 | 17.3 | Quiz diagnoses trap type | feedback promise | diagnostic quiz | n/a |
| 17 | 17.4 | Review only weak part | final CTA | email / review asset linkage | n/a |

---

## 5. Exercise Coverage Targets

The worksheet / quiz should cover every high-value frame cluster:

```text
Slide 06 / 11 / 15
-> correction vs strong denial

Slide 07 / 12 / 14
-> constraint vs possibility / conclusion

Slide 08 / 13 / 14
-> reason -> conclusion vs constrained action

Slide 09 / 15
-> intensity and form with な-adjective

Slide 13
-> clue before / clue after / speaker action workflow
```

Minimum diagnostic coverage:

```text
4 questions for correction vs denial
4 questions for constraint logic
3 questions for conclusion logic
2 questions for Vないわけにはいかない
3 questions for form / attachment
4 mixed JLPT-style questions
```

---

## 6. Production Notes

Priority frames for visual build:

```text
02.1-02.4 Hook quiz
03.1-03.4 Mission board
06.1-06.5 Grammar card / correction
07.1-07.5 Grammar card / constraint
13.1-13.4 Clue map
14.1-14.6 Worked example
15.1-15.5 Diagnostic practice
17.1-17.4 CTA
```

If production time is tight, build these first.

Do not overbuild:

```text
04 Story
10 Comparison map
16 Recap
```

These can be clean static boards for MVP.
