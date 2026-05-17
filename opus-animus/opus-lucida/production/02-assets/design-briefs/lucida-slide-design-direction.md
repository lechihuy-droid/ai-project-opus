# Lucida Slide Design Direction
**Status:** Working direction placeholder
**Role:** Program-level visual source for Lucida lesson slide decks
**Applies to:** `production/00-active/<topic-slug>/03-slide-deck.md`

---

## 1. Purpose

This file defines the visual direction that lesson slide decks should link to.

It is not the final design system yet.

It gives enough direction so slide decks do not become plain text outlines or one-off designs.

For HTML prototype generation, use the more specific companion brief:

```text
production/02-assets/design-briefs/lucida-n2-html-design-rules.md
```

---

## 2. Program Feel

Lucida slide decks should feel:

```text
serious but not cold
exam-focused but not cram-school ugly
clear enough for N2 grammar
warm enough for Vietnamese learners
premium enough to become a course system
```

Avoid:

```text
generic white slide with bullet list
random colors per lesson
overly cute anime classroom style
dark mode with no hierarchy
text-only decks that look like markdown screenshots
```

---

## 3. Core Visual Principle

Every slide should make one learning operation visible:

```text
contrast
clue spotting
speaker action
trap elimination
grammar form
real-life situation
exam decision
recap
CTA / next action
```

If a slide cannot answer "what should the learner see?", it is not ready for design.

---

## 4. Reusable Slide Components

Use reusable components across the program:

```text
Grammar Card
Comparison Board
Exam Mission Board
JLPT Quiz Board
Clue Map
Trap Reveal
Worked Example Board
Diagnostic Practice Board
Recap Table
Worksheet / Quiz CTA Board
```

Each active deck should name which component a slide uses in its `Design layer`.

---

## 5. Japanese / Vietnamese Hierarchy

Default hierarchy:

```text
Japanese example or pattern = visual anchor
Vietnamese explanation      = decision support
metadata / note             = small secondary text
```

Do not let Vietnamese explanation bury the Japanese pattern.

Do not show long Vietnamese paragraphs as the main slide body.

---

## 6. Motion / Reveal Direction

Use reveal to manage density:

```text
state 1: situation / question
state 2: clue highlight
state 3: target grammar
state 4: trap / contrast
state 5: answer / takeaway
```

Dense educational slides are allowed only if information appears in layers.

---

## 7. Current Working Visual Direction

Until the final Lucida design system is chosen, use this working direction:

```text
base: dark navy / ink
accent: warm amber for key logic
secondary accents: blue for correction, red for strong denial, green for constraint
type direction: clean humanist sans for Vietnamese, readable Japanese font for examples
layout feel: structured cards, boards, clue strips, and answer reveals
```

This can be replaced by the final Claude Design / brand system later.

For Gemini / Claude HTML generation, follow:

```text
lucida-n2-html-design-rules.md
```
