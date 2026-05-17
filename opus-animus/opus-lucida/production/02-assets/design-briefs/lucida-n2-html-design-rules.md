# Lucida N2 HTML Design Rules
**Status:** Active design brief v1  
**Role:** Design rules for generating editable HTML slide / lesson interfaces for Lucida N2 lessons  
**Applies to:** Gemini Design, Claude Design, HTML slide prototypes, Canva/PPT visual translation

---

## 1. Design Thesis

Lucida is not a cute Japanese class and not a cram-school worksheet.

Lucida should feel like:

```text
clarity under pressure
```

The learner is at the N3 -> N2 wall:

```text
They know the grammar shapes.
They can translate many sentences.
But they still hesitate when answers are close.
```

So the design must help them see:

```text
logic
contrast
speaker intention
exam traps
real-life usage
```

The visual world should carry both names:

```text
Lucida = clarity, focus, practical learning
Opus Animus = depth, inner system, serious craft
```

Short direction:

```text
premium learning system
warm analytical coaching
exam-ready but human
structured, not sterile
```

---

## 2. Audience Fit

Primary learner:

```text
Vietnamese learner around late N3 / early N2
preparing for JLPT N2
wants practical Japanese, not just exam tricks
often confused by near-meaning grammar patterns
```

Design should make the learner feel:

```text
I can finally see the difference.
This is useful for N2 and real life.
The system is serious, but not intimidating.
```

Avoid making them feel:

```text
This is a dense textbook.
This is a random YouTube template.
This is only for memorizing definitions.
```

---

## 3. Core Visual Principle

Every screen must make one learning operation visible:

```text
contrast
clue spotting
speaker action
trap elimination
form pattern
real-life situation
exam decision
diagnostic feedback
recap
CTA / next action
```

If a screen only displays text, it needs a stronger visual operation.

Good screen:

```text
The learner can tell what to look at before reading every word.
```

Weak screen:

```text
The learner sees a paragraph and waits for narration to explain it.
```

---

## 4. Visual Direction

Use this as the main direction:

```text
Ink Study Room + Exam Console
```

It should combine:

```text
quiet editorial depth
structured exam interface
warm coaching cues
Japanese text as the visual anchor
Vietnamese as decision support
```

Do not make the design:

```text
generic startup SaaS dashboard
anime classroom
plain markdown on dark background
beige worksheet
purple gradient education app
```

---

## 5. Color System

Use a balanced palette, not one-color dark mode.

### Base

```text
Ink:        #111827
Charcoal:   #1F2937
Warm Paper: #F7F1E5
Mist:       #E7E2D6
Line:       rgba(247, 241, 229, 0.18)
```

### Action Accents

Use accents semantically and consistently:

```text
Amber   #F5B841  = logic / conclusion / key decision
Blue    #4A90E2  = correction / clarification
Red     #D95D59  = strong denial / impossible / trap warning
Green   #2F7D5C  = constraint / responsibility / cannot do
Violet  #7C6A9E  = meta / system / map, use sparingly
```

### Rule

```text
One screen should have one dominant accent and at most two support accents.
```

Avoid:

```text
all-navy screens
all-amber screens
random rainbow grammar cards
purple as the default brand look
```

---

## 6. Typography

Use typography to show language hierarchy.

### Recommended Pairing

```text
Vietnamese / UI:
Sora, Manrope, or DM Sans

Japanese:
Noto Sans JP or BIZ UDPGothic

Optional editorial accent:
Source Serif 4 or Fraunces for big title moments only
```

### Hierarchy

```text
Japanese example = largest readable anchor
grammar pattern = bold and highly visible
Vietnamese meaning = medium support text
trap / clue / note = small label
```

Do not make Vietnamese paragraphs the largest element unless the slide is a promise / recap slide.

---

## 7. Layout Grammar

Use structured boards rather than floating decorative cards.

Preferred layouts:

```text
2-column contrast board
2x2 grammar action map
JLPT quiz board
clue map with highlighted phrase
worked example board
diagnostic reveal board
story scene board
recap matrix
CTA action board
```

Each layout must have:

```text
clear title zone
main learning object
support / explanation zone
takeaway or action strip
```

Avoid:

```text
centered title + bullet list only
too many equal cards
cards inside cards
decorative panels with no teaching job
```

---

## 8. Component Rules

### Grammar Card

Use for one grammar pattern.

Must include:

```text
pattern
speaker action
natural Vietnamese line
small form note
```

### Comparison Board

Use for minimal pairs.

Must include:

```text
left pattern
right pattern
one shared confusion
one decisive difference
```

### JLPT Quiz Board

Use for retrieval and practice.

Must include:

```text
question
answer choices
pause / thinking state
clue highlight
answer reveal
trap explanation
```

### Clue Map

Use when turning knowledge into exam action.

Must include:

```text
before blank
after blank
speaker intention
wrong-answer trap
```

### Real-Life Scene Board

Use when showing practical transfer.

Must include:

```text
who is speaking
situation tension
Japanese line
natural Vietnamese meaning
why this pattern fits
```

---

## 9. Motion / Reveal Rules

HTML should support reveal states even if final video uses duplicated frames.

Use states like:

```text
state 1: situation or question
state 2: highlight clue
state 3: show target pattern
state 4: show trap / wrong option
state 5: reveal answer / takeaway
```

Motion should feel:

```text
precise
quiet
purposeful
```

Avoid:

```text
bouncy gamified motion
random fades everywhere
long animations that slow the lesson
```

---

## 10. N2-Specific Teaching Design

Every N2 grammar screen should help with at least one of:

```text
meaning contrast
form attachment
speaker intention
JLPT distractor logic
real-life register
```

Grammar action color mapping:

```text
conclusion / logic        = amber
correction / clarification = blue
strong denial / trap       = red
constraint / obligation    = green
system / meta map          = violet, used sparingly
```

This is a reusable grammar-action color system.

For a specific lesson, map the lesson's grammar points into these action categories.

---

## 11. HTML Generation Requirements

When generating HTML:

```text
Use semantic HTML sections.
Use CSS variables for colors, spacing, radius, and typography.
Use responsive layout for 16:9 slide canvas and mobile preview.
Use real text, not image text.
Keep Japanese text selectable.
Do not rely on external image assets unless explicitly provided.
Use simple JS only if needed for reveal states.
```

Recommended viewport:

```text
Primary: 1920x1080 slide frame
Secondary: responsive preview for browser review
```

CSS rules:

```text
No giant border radius.
No nested cards.
No negative letter spacing.
No viewport-scaled font size.
No decorative gradient blobs or orbs.
```

Current MVP prototype:

```text
production/02-assets/design-prototypes/lucida-n2-design-system-mvp.html
```

---

## 12. Gemini Design Prompt

Copy this prompt into Gemini Design when generating an HTML prototype:

```text
Create an editable HTML/CSS prototype for a Lucida JLPT N2 program-level lesson design system.

Project:
Lucida is part of Opus Animus. It teaches Japanese grammar to Vietnamese learners around late N3 / early N2. The positioning is not "memorize meanings", but "understand speaker intention, exam traps, and real-life usage".

Design thesis:
clarity under pressure.
The style should feel like Ink Study Room + Exam Console:
premium, structured, warm, analytical, serious but not cold.

Audience:
Vietnamese learners preparing for JLPT N2 who can often translate sentences but still choose wrong answers when grammar patterns are close.

Do not make it:
- cute anime classroom
- generic SaaS dashboard
- purple gradient education app
- plain markdown on dark background
- beige worksheet

Color system:
- Ink #111827
- Charcoal #1F2937
- Warm Paper #F7F1E5
- Mist #E7E2D6
- Amber #F5B841 for logic / conclusion
- Blue #4A90E2 for correction
- Red #D95D59 for strong denial / trap
- Green #2F7D5C for constraint / responsibility
- Violet #7C6A9E only for meta/system accents

Typography:
Use a clean humanist sans for Vietnamese/UI such as Sora, Manrope, or DM Sans.
Use Noto Sans JP or BIZ UDPGothic for Japanese.
Japanese examples should be the visual anchor. Vietnamese supports understanding and decision-making.

Build an HTML prototype with these reusable components for the whole Lucida N2 program:
1. Exam Mission Board
2. Grammar Card
3. Comparison Board
4. JLPT Quiz Board
5. Clue Map
6. Worked Example Board
7. Diagnostic Practice Board
8. Recap Matrix
9. Worksheet / Quiz CTA Board

Use reusable placeholder content that can work across many JLPT N2 grammar clusters.
Do not make the system depend on one grammar topic only.

Use this semantic color mapping:
- conclusion / logic: amber
- correction / clarification: blue
- strong denial / trap warning: red
- constraint / obligation: green
- system / meta map: violet, used sparingly

For demo content, you may include one optional Wake example set, but label it clearly as "Sample lesson data", not as the core design system:
- わけだ = conclusion
- わけではない = correction
- わけがない = strong denial
- わけにはいかない = constraint

Interaction:
Add simple reveal-state buttons or keyboard controls so a reviewer can move through:
state 1 situation/question
state 2 clue highlight
state 3 target pattern
state 4 trap explanation
state 5 answer/takeaway

HTML requirements:
- single HTML file with embedded CSS and minimal JS
- responsive but optimized for 16:9 lesson slides
- use real selectable text
- no image text
- no external assets required
- no nested cards
- no decorative gradient orbs/blobs
- keep layout readable at 1920x1080 and browser preview sizes

Output:
Generate the complete HTML/CSS/JS file.
Also include a short component inventory or design-token panel, but do not make it feel like a marketing landing page.
The first viewport should show the actual design system components, not a hero page.
```

---

## 13. QA Checklist For Generated HTML

Generated HTML should pass:

```text
[ ] It looks like a serious N2 learning system, not a generic template.
[ ] Japanese is visually dominant where needed.
[ ] Vietnamese is natural support text, not long paragraph blocks.
[ ] Each component shows one learning operation.
[ ] Color accents follow grammar-action meaning.
[ ] Reveal states are understandable.
[ ] 16:9 slide frame works.
[ ] No nested cards.
[ ] No purple-gradient / cute anime / plain markdown look.
[ ] The design can be translated into Canva/PPT later.
```
