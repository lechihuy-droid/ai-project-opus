# Lucida Slide Template Library
**Status:** Active v2.1  
**Date:** 2026-05-14  
**Scope:** All Lucida JLPT N2 lesson slides  
**Role:** Canonical template definitions for slide structure, wireframe generation, script sync, and production framing

---

## 1. Template Contract

Runtime implementation:

```text
Active renderer: apps/slide-agent/
Template files: apps/slide-agent/templates/<template_id>/{template.html,slots.json,template.css}
Renderer: apps/slide-agent/scripts/render.js
Frame export: apps/slide-agent/scripts/exportFrames.js
Rollback reference: 99-archive/schema-html-prototype-pre-mcp/
```

Current implemented template IDs:

```text
hero_title
section_divider
key_message
two_column
comparison_table
figure_focus
summary
quiz_before_after
grammar_card
minimal_pair
clue_map
worked_example
diagnostic_practice
cta_diagnostic
grammar_card_v2
```

Every slide template must define:

```text
Purpose
Use when
Do not use when
Required on-screen fields
Optional fields
Script responsibility
Design / layout variants
Production behavior
QA checklist
Example skeleton mapping
```

Templates are teaching tools first and design components second.

Each generated slide must declare:

```text
Phase:
Template:
Skeleton link:
Learning function:
On-screen fields:
Script role:
Production state:
QA risk:
```

---

## 2. Hook Situation

Purpose:

```text
Make the learner feel the lesson problem before grammar explanation begins.
```

Use when:

```text
Opening with a realistic learner situation, pain point, or social context.
```

Do not use when:

```text
The slide's main job is to compare grammar forms or ask a quiz.
```

Required on-screen fields:

```text
- situation label
- concrete scenario
- visible tension
- one short anchor sentence in Japanese or Vietnamese
```

Optional fields:

```text
- target grammar highlight
- emotional learner line
- one-sentence takeaway
```

Script responsibility:

```text
Name the pain quickly. Do not explain the full grammar yet.
```

Design / layout variants:

```text
- cinematic single quote
- two-panel situation / tension
- dark premium opening frame
```

Production behavior:

```text
MVP: one static frame.
Future: can reveal situation -> tension -> grammar highlight.
```

QA checklist:

```text
- Does the viewer know why this matters within 5-15 seconds?
- Is the situation concrete rather than abstract?
- Is the grammar curiosity created without over-teaching?
```

Example skeleton mapping:

```text
Skeleton §3 Hook Core
```

---

## 3. Hook Contrast

Purpose:

```text
Show that similar-looking forms can carry different speaker logic.
```

Use when:

```text
Two sentences, forms, or answer choices look similar but mean different things.
```

Do not use when:

```text
Only one grammar point is being introduced.
```

Required on-screen fields:

```text
- sentence A
- sentence B
- highlighted contrast point
- short contrast label
- one takeaway
```

Optional fields:

```text
- Vietnamese micro-translation
- speaker action labels
```

Script responsibility:

```text
Point out the difference in logic, not just the difference in wording.
```

Design / layout variants:

```text
- stacked contrast lines
- left/right comparison
- highlight overlay on target grammar
```

Production behavior:

```text
MVP: static contrast with both forms visible.
Future: reveal A -> reveal B -> highlight difference.
```

QA checklist:

```text
- Does the contrast create curiosity without becoming a full grammar lesson?
- Can the learner say what is different between A and B?
```

Example skeleton mapping:

```text
Skeleton §3 Hook Quiz / Contrast
```

---

## 4. Quiz Before / After

Purpose:

```text
Let the learner attempt before explanation, then show answer logic.
```

Use when:

```text
The learner should choose an answer, predict a pattern, or retrieve a rule.
```

Do not use when:

```text
The slide only explains a grammar point with no retrieval moment.
```

Required on-screen fields:

```text
- before state: question
- before state: choices or blank
- before state: thinking prompt
- after state: correct answer
- after state: reason
- after state: trap explanation
```

Optional fields:

```text
- countdown or pause cue
- trap tag
- clue highlight
- source-frame / worksheet link
```

Script responsibility:

```text
Pause before answer. Explain why wrong options were tempting but wrong.
```

Design / layout variants:

```text
- side-by-side before / after
- stacked before / after
- single quiz card plus answer review card
```

Production behavior:

```text
MVP: static before/after frame because current assembly is one PNG per audio segment.
Future: split into question frame -> pause frame -> answer frame -> trap frame.
```

QA checklist:

```text
- Does the slide support self-attempt and answer review?
- Is the answer not visually ambiguous?
- Is at least one wrong-answer trap explained?
```

Example skeleton mapping:

```text
Skeleton §3 Hook Quiz
Skeleton §11 Practice
```

---

## 5. Promise Board

Purpose:

```text
State why the lesson is worth watching and what changes after the lesson.
```

Use when:

```text
After the hook, before deeper teaching begins.
```

Do not use when:

```text
The slide should teach grammar detail or show a quiz.
```

Required on-screen fields:

```text
- lesson topic
- exam outcome
- real-life usage outcome
- guiding question or method preview
```

Optional fields:

```text
- list of target patterns
- small promise-to-worksheet bridge
```

Script responsibility:

```text
Make a grounded promise. Do not overpromise score gains.
```

Design / layout variants:

```text
- two outcome cards
- topic header plus pattern strip
- problem -> promise board
```

Production behavior:

```text
MVP: static.
Future: reveal exam outcome -> real-life outcome -> method.
```

QA checklist:

```text
- Does it balance JLPT performance and real communication?
- Does it avoid vague motivation?
- Does it tell the learner what to watch for?
```

Example skeleton mapping:

```text
Skeleton §2 Audience and Promise
Skeleton §5 Big Idea
```

---

## 6. Story Context

Purpose:

```text
Ground grammar in a situation where the pattern is naturally needed.
```

Use when:

```text
The lesson needs real-world context before grammar explanation.
```

Do not use when:

```text
The slide is only a form table or recap.
```

Required on-screen fields:

```text
- setting
- speaker intention
- constraint / tension
- natural Japanese line
- short Vietnamese meaning
```

Optional fields:

```text
- character role
- social nuance label
- workplace / SNS / study context tag
```

Script responsibility:

```text
Explain why the grammar fits the situation.
```

Design / layout variants:

```text
- situation card + Japanese line card
- timeline setup
- dialogue card
```

Production behavior:

```text
MVP: static.
Future: reveal setting -> constraint -> Japanese line.
```

QA checklist:

```text
- Is the Japanese natural?
- Is the Vietnamese explanation natural?
- Does the context explain why this grammar is needed?
```

Example skeleton mapping:

```text
Skeleton §4 Story Core
```

---

## 7. Method Board

Purpose:

```text
Give the learner a reusable way to think before details begin.
```

Use when:

```text
Introducing a lesson method such as Ý nghĩa - Dạng - Cách dùng or speaker-action logic.
```

Do not use when:

```text
The slide's job is to teach one specific pattern.
```

Required on-screen fields:

```text
- method name in learner-facing Vietnamese
- 2-4 guiding questions
- one memorable mantra
```

Preferred learner-facing terms:

```text
Ý nghĩa - Dạng - Cách dùng
Dấu hiệu chọn mẫu
Ở câu này, người nói đang muốn nói gì?
```

Do not include:

```text
Meaning / Form / Use as public English labels
Clue Map as public English label
```

Script responsibility:

```text
Make the method feel useful immediately, not theoretical.
```

Design / layout variants:

```text
- three-card method board
- question ladder
- mantra centerpiece
```

Production behavior:

```text
MVP: static.
Future: reveal one guiding question at a time.
```

QA checklist:

```text
- Can this method be reused in later lessons?
- Does it help the learner process the next grammar slides?
```

Example skeleton mapping:

```text
Skeleton §5 Big Idea
Skeleton §6 Terminology System
```

---

## 8. Grammar Card

Purpose:

```text
Teach one grammar pattern through a consistent mental structure.
```

Use when:

```text
Introducing or reviewing one grammar point.
```

Do not use when:

```text
The main purpose is comparing two patterns or solving a full quiz.
```

Required on-screen fields:

```text
- pattern
- Ở câu này, người nói đang muốn nói gì?
- Nghĩa cốt lõi
- Hình / cấu trúc
- Dụng / sắc thái
- one natural example
- Bẫy người Việt hay mắc
```

Optional fields:

```text
- clue words
- form warning
- common wrong answer
```

Script responsibility:

```text
Explain logic and nuance. Do not merely read the card aloud.
```

Design / layout variants:

```text
- pattern hero + 3-view cards
- split: logic left / example right
- card with trap footer
```

Production behavior:

```text
MVP: static grammar card.
Future: reveal pattern -> logic -> form -> example -> trap.
```

QA checklist:

```text
- Does the slide answer what the speaker is doing?
- Are Nghĩa, Hình, and Dụng visible or clearly represented?
- Is there at least one trap or usage warning?
```

Example skeleton mapping:

```text
Skeleton §7 Grammar point
```

---

## 8.5 Grammar Card v2

Runtime template id:

```text
grammar_card_v2
```

Purpose:

```text
Teach one grammar pattern as a speaker-intent card with meaning, form, usage, example, and trap visible in one static frame.
```

Use when:

```text
- one grammar pattern needs a full learner-facing explanation
- the learner must see what the speaker is doing before memorizing translation
- the slide needs a stronger hierarchy than the original grammar_card template
```

Do not use when:

```text
- comparing two patterns side by side
- asking a quiz or diagnostic question
- showing a clue map, worked example, recap, or CTA
```

Required on-screen fields:

```text
- pattern_jp
- speaker_action_vi
- Ý nghĩa
- Dạng
- Cách dùng
- example_jp
- trap_vi
```

Optional fields:

```text
- bonus_vi
```

Script responsibility:

```text
Explain why the speaker chooses this pattern in context. Do not merely read the labels.
```

Design / layout variants:

```text
- pattern hero at top left
- speaker intent as the main teaching thesis
- three-view row: Ý nghĩa / Dạng / Cách dùng
- example and trap as separated lower panels
- optional Ghi nhớ strip
```

Production behavior:

```text
MVP: one static frame, no reveal, no animation, all slots plain text.
OD source: .od/artifacts/lucida-grammar-card-v2/
Runtime path: apps/slide-agent/templates/grammar_card_v2/
```

QA checklist:

```text
- Are all required fields visible?
- Does the card answer: "Ở câu này, người nói đang muốn nói gì?"
- Are Ý nghĩa / Dạng / Cách dùng public labels present and not replaced by English?
- Are example and trap visually separated?
- Does no-bonus mode still fill the frame cleanly?
- Does worst-case content remain readable without overlap?
```

Example skeleton mapping:

```text
Skeleton §7 Grammar point
```

---

## 9. Form Table

Purpose:

```text
Prevent form errors by isolating connection rules.
```

Use when:

```text
The form itself is exam-relevant, irregular, or easy to confuse.
```

Do not use when:

```text
The pattern's main difficulty is nuance rather than form.
```

Required on-screen fields:

```text
- connection rule
- valid forms
- one micro-example
- common form mistake
```

Optional fields:

```text
- wrong form crossed out
- before/after transformation
```

Script responsibility:

```text
State what to check before and after the target grammar.
```

Design / layout variants:

```text
- compact table
- formula card
- correct / wrong split
```

Production behavior:

```text
MVP: static.
Future: reveal formula -> example -> mistake.
```

QA checklist:

```text
- Can the learner avoid a form error after seeing this slide?
- Is the form visually separated from meaning?
```

Example skeleton mapping:

```text
Skeleton §7 Form
```

---

## 10. Example Stack

Purpose:

```text
Show range, nuance, or usage through multiple examples.
```

Use when:

```text
One example is not enough to show the pattern's range.
```

Do not use when:

```text
The slide becomes a list of random examples.
```

Required on-screen fields:

```text
- 2-3 examples maximum
- one shared logic label
- short translations
- highlighted target grammar
```

Optional fields:

```text
- context labels
- tone labels
```

Script responsibility:

```text
Explain how the examples share one logic but differ in context.
```

Design / layout variants:

```text
- vertical stack
- context cards
- example ladder from easy to hard
```

Production behavior:

```text
MVP: static stack.
Future: reveal examples one by one.
```

QA checklist:

```text
- Do examples add range rather than clutter?
- Are Japanese and Vietnamese natural?
- Does each example serve the template purpose?
```

Example skeleton mapping:

```text
Skeleton §7 Usage / examples
Example bank
```

---

## 11. Minimal Pair

Purpose:

```text
Separate two confusable patterns by one clear contrast axis.
```

Use when:

```text
Two patterns are often confused by learners or in JLPT options.
```

Do not use when:

```text
Comparing three or more patterns; use Comparison Matrix instead.
```

Required on-screen fields:

```text
- pattern A
- pattern B
- contrast axis
- example A
- example B
- trap warning
```

Optional fields:

```text
- wrong-answer cue
- Vietnamese nuance comparison
```

Script responsibility:

```text
Explain why A is not B in terms of speaker logic or context.
```

Design / layout variants:

```text
- two cards
- split screen
- contrast axis down the middle
```

Production behavior:

```text
MVP: static comparison.
Future: reveal A -> reveal B -> reveal trap.
```

QA checklist:

```text
- Is the contrast axis explicit?
- Can the learner explain why one option is wrong?
```

Example skeleton mapping:

```text
Skeleton §8 Minimal pair / contrast
```

---

## 12. Comparison Matrix

Purpose:

```text
Organize 3-4 related patterns into one decision map.
```

Use when:

```text
The learner needs to see a family of patterns together.
```

Do not use when:

```text
Only two patterns need contrast; use Minimal Pair.
```

Required on-screen fields:

```text
- patterns
- speaker action or logic
- core meaning
- short clue or use case
```

Optional fields:

```text
- short example per row
- trap tag per row
```

Script responsibility:

```text
Turn the matrix into a usable decision map, not a dictionary.
```

Design / layout variants:

```text
- table
- four-card grid
- logic map rows
```

Production behavior:

```text
MVP: static.
Future: reveal row by row.
```

QA checklist:

```text
- Does the matrix reduce confusion?
- Is it visually scan-friendly?
- Does each row have a distinct logic?
```

Example skeleton mapping:

```text
Skeleton §5 Big Idea
Skeleton §12 Summary
```

---

## 13. Clue Map / Decision Rule

Purpose:

```text
Convert grammar understanding into answer-choice behavior.
```

Use when:

```text
Preparing learners for JLPT-style questions or trap recognition.
```

Do not use when:

```text
The slide is only teaching meaning or form.
```

Required on-screen fields:

```text
- before clue
- after clue
- speaker action
- likely pattern
- common wrong-answer trap
- decision question
```

Optional fields:

```text
- worksheet follow-up
- trap tag
- short sample stem
```

Script responsibility:

```text
Show how to decide, not just how to understand.
```

Design / layout variants:

```text
- 3-column clue table
- decision flow
- question stem with clue highlights
```

Production behavior:

```text
MVP: static clue map.
Future: highlight before clue -> after clue -> answer decision.
```

QA checklist:

```text
- Does it help the learner choose under exam pressure?
- Is at least one wrong-answer trap visible?
- Can this map generate worksheet questions?
```

Example skeleton mapping:

```text
Skeleton §9 JLPT Clue Map
Worksheet / diagnostic quiz spec
```

---

## 14. Worked Example Board

Purpose:

```text
Model the full solving process for a JLPT-style item.
```

Use when:

```text
The teacher needs to think aloud through a question.
```

Do not use when:

```text
The slide only asks for retrieval without teacher modeling.
```

Required on-screen fields:

```text
- question
- Step 1: đọc câu / chỗ trống
- Step 2: tìm dấu hiệu
- Step 3: gọi tên logic
- Step 4: loại bẫy
- Step 5: chốt đáp án
- generalizable decision rule
```

Optional fields:

```text
- before/after state
- trap tag
- clue highlight
```

Script responsibility:

```text
Think aloud step by step. Do not jump directly to the answer.
```

Design / layout variants:

```text
- step board
- question left / reasoning right
- before-answer / after-answer board
```

Production behavior:

```text
MVP: static step board or before/after board.
Future: one frame per reasoning step.
```

QA checklist:

```text
- Can the learner copy the solving process on a new question?
- Are wrong answers explained as traps, not merely marked wrong?
- Is the final rule reusable?
```

Example skeleton mapping:

```text
Skeleton §10 Worked Example
```

---

## 15. Diagnostic Practice

Purpose:

```text
Let the learner attempt transfer and diagnose their error type.
```

Use when:

```text
The lesson wants practice to feed worksheet / diagnostic quiz logic.
```

Do not use when:

```text
The teacher is modeling the full solving process; use Worked Example Board.
```

Required on-screen fields:

```text
- question
- answer choices
- correct answer
- trap tag
- short error diagnosis
- review target
```

Optional fields:

```text
- difficulty label
- source slide link
- worksheet item ID
```

Script responsibility:

```text
Pause for retrieval. Then explain what each wrong answer reveals about the learner's misunderstanding.
```

Design / layout variants:

```text
- before/after diagnostic board
- question card + diagnosis card
- answer row + trap labels
```

Production behavior:

```text
MVP: static before/after diagnostic board.
Future: question frame -> pause -> answer -> diagnosis.
```

QA checklist:

```text
- Does the slide diagnose why a learner might choose a wrong option?
- Does it connect to later worksheet / quiz feedback?
```

Example skeleton mapping:

```text
Skeleton §11 Practice
Worksheet / diagnostic quiz spec
```

---

## 16. Trap Explanation Board

Purpose:

```text
Explain why a wrong answer feels right but fails.
```

Use when:

```text
A distractor is pedagogically important enough to teach.
```

Do not use when:

```text
The wrong answer is peripheral and obvious.
```

Required on-screen fields:

```text
- tempting wrong answer
- why it looks right
- why it is wrong
- correct decision rule
- trap tag
```

Optional fields:

```text
- learner misconception label
- quick fix line
```

Script responsibility:

```text
Respect the learner's reasoning, then show the missing distinction.
```

Design / layout variants:

```text
- looks right / actually wrong split
- trap card
- wrong path -> correction path
```

Production behavior:

```text
MVP: static.
Future: reveal wrong appeal -> failure reason -> rule.
```

QA checklist:

```text
- Does it teach a real misconception?
- Does it avoid shaming the learner?
- Does it improve future decision-making?
```

Example skeleton mapping:

```text
5Ps distractor taxonomy
Worksheet answer explanation
```

---

## 17. Decision Rule Card

Purpose:

```text
Compress a lesson point into one usable answer-selection rule.
```

Use when:

```text
After grammar explanation, comparison, or worked example.
```

Do not use when:

```text
The learner has not yet seen enough examples to trust the rule.
```

Required on-screen fields:

```text
- decision condition
- choose this pattern
- avoid this trap
- one micro-example or clue
```

Optional fields:

```text
- exam label
- real-life label
```

Script responsibility:

```text
Explain the rule as a shortcut after understanding, not as blind memorization.
```

Design / layout variants:

```text
- if / then card
- decision checkpoint
- rule strip
```

Production behavior:

```text
MVP: static.
Future: reveal condition -> answer -> trap.
```

QA checklist:

```text
- Is the rule short enough to use under time pressure?
- Is it accurate enough to avoid overfitting?
```

Example skeleton mapping:

```text
Skeleton §9 Clue Map
Skeleton §10 Worked Example
```

---

## 18. Recap Map

Purpose:

```text
Close the teaching loop with a screenshot-friendly memory map.
```

Use when:

```text
At the end of a lesson or after a major section.
```

Do not use when:

```text
New explanation is still being introduced.
```

Required on-screen fields:

```text
- all main patterns or rules
- one-line meaning / speaker action per item
- memorable grouping
```

Optional fields:

```text
- next review path
- worksheet reference
```

Script responsibility:

```text
Summarize without re-teaching the whole lesson.
```

Design / layout variants:

```text
- memory table
- logic map
- four-card recap
```

Production behavior:

```text
MVP: static.
Future: reveal row by row.
```

QA checklist:

```text
- Can this slide be screenshotted as a useful memory map?
- Is each item distinct?
```

Example skeleton mapping:

```text
Skeleton §12 Summary
```

---

## 19. Worksheet Bridge

Purpose:

```text
Connect a video moment to a worksheet or diagnostic asset before the final CTA.
```

Use when:

```text
A slide creates a practice need that should continue outside the video.
```

Do not use when:

```text
The video is ending; use CTA Diagnostic instead.
```

Required on-screen fields:

```text
- skill just learned
- worksheet section or quiz type
- reason to practice it
- what error it diagnoses
```

Optional fields:

```text
- item count
- trap tags
- QR / link placeholder
```

Script responsibility:

```text
Make the external asset feel like the next step in learning.
```

Design / layout variants:

```text
- small bridge card
- footer callout
- practice continuation card
```

Production behavior:

```text
MVP: static, often as a small card inside another template.
Future: can be a standalone mid-video CTA frame.
```

QA checklist:

```text
- Is the bridge tied to a real asset?
- Does it avoid feeling like an ad interruption?
```

Example skeleton mapping:

```text
Worksheet promise
Diagnostic quiz spec
```

---

## 20. CTA Diagnostic

Purpose:

```text
Lead to worksheet, quiz, lead magnet, or next lesson as a learning continuation.
```

Use when:

```text
Closing the video or transitioning to the next asset.
```

Do not use when:

```text
The learner still needs core explanation before being sent elsewhere.
```

Required on-screen fields:

```text
- learner problem
- asset promise
- what the asset contains
- why it is the next learning step
```

Optional fields:

```text
- diagnostic categories
- next lesson teaser
- URL / QR placeholder
```

Script responsibility:

```text
Keep tone learning-first. Do not sound salesy.
```

Design / layout variants:

```text
- two asset cards
- problem -> asset -> result board
- final dark premium CTA
```

Production behavior:

```text
MVP: static.
Future: animate asset cards or QR reveal.
```

QA checklist:

```text
- Does the CTA feel like a continuation of learning rather than an ad?
- Does it avoid promising missing assets?
```

Example skeleton mapping:

```text
Skeleton §2 Worksheet Promise
CTA direction
```
