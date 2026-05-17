# Lucida Slide Design / Production Rules
**Status:** Active v1  
**Scope:** HTML deck, PNG frames, audio/video assembly  
**Role:** Convert slide architecture and templates into production-ready frames

---

## 1. Layer Rule

Do not mix these layers casually:

```text
Skeleton = teaching truth
Slide architecture = visual learning journey
Template / wireframe = what appears where
Script = spoken narration
Design = visual execution
Video = rendered production truth
```

If a later layer changes lesson meaning, update the earlier source first.

---

## 2. Heading Rule

Learner-facing headings should be in Vietnamese and should describe the lesson function.

Good:

```text
Hook tinh huong
Quiz thu chon
Chu de & muc tieu
Mau 1: dinh chinh
Ban do dau hieu
Giai de tung buoc
Luyen chan doan
```

Avoid:

```text
Opening Situation
Core Method
Diagnostic Practice
Intensity Check
Payoff
Reveal
```

Internal English labels may appear in docs, not on public frames.

---

## 3. Visual Hierarchy Rule

Default hierarchy:

```text
1. Japanese target sentence or grammar pattern
2. Speaker action / core logic
3. Form or clue
4. Short Vietnamese explanation
5. Trap / note / CTA
```

The learner should identify the slide's main point within 3 seconds.

---

## 4. Density Rule

Do not follow "few words" mechanically.

Preferred rule:

```text
Layered density.
```

Meaning:

```text
Slides may contain rich information if it is grouped into clear cards, rows, or before/after states.
Do not place long paragraphs as one flat block.
```

MVP static frames must still look organized without animation.

---

## 5. Quiz / Reveal Rule

Current MVP:

```text
1 logical slide = 1 PNG frame = 1 audio segment
```

Therefore quiz slides should use:

```text
Before state
After state
Trap explanation
```

Example labels:

```text
Truoc khi chot: tu chon
Sau khi chot: dap an + bay
```

Do not depend on hidden animation for the learner to understand the frame.

Future upgrade:

```text
Split before / pause / answer / trap into separate frames.
```

---

## 6. Script Sync Rule

Every production slide must match one script block.

Required sync:

```text
slide number
slide heading
on-screen text
speaker explanation
pause / reveal cue
audio segment
```

If script changes meaningfully:

```text
re-check slide architecture
re-check deck HTML
re-export PNG frames
```

---

## 7. Example Naturalness Rule

Examples should fit the learner persona:

```text
Vietnamese learner at late N3 / early N2
JLPT prep context
work / study / SNS / daily communication
```

Avoid:

```text
repeated "Nam goes to work" style examples
stiff textbook-only examples
overusing one trendy scenario across many slides
```

Each example must pass:

```text
Natural Japanese
Natural Vietnamese explanation
Correct grammar nuance
Useful for the slide's teaching function
```

---

## 8. Production Frame Rule

Current HTML pipeline:

```text
wake-cluster-deck.html
-> screenshot_slides.py
-> frames/slide-01.png ... slide-NN.png
```

Production requirements:

```text
resolution: 1920x1080
format: PNG
numbering: slide-01.png, slide-02.png, ...
count: must match script slide count
```

Do not ship frames with:

```text
mojibake text
clipped Japanese
clipped Vietnamese
placeholder labels
unreadable small headings
```

---

## 9. HTML Deck Rule

For current MVP, production decks must preserve:

```html
<deck-stage>
  <div class="slide" data-n="1">...</div>
</deck-stage>
```

Reason:

```text
screenshot_slides.py expects deck-stage.length and deck-stage.goTo(i).
```

External design prototypes may use other structures, but production decks must remain screenshot-compatible unless the tooling is updated.

---

## 10. Design QA Order

Review in this order:

```text
1. Is the slide's learning function clear?
2. Does it match the skeleton?
3. Does it use the right template?
4. Does the script explain the visible structure?
5. Is the Japanese / Vietnamese natural?
6. Is visual hierarchy clear?
7. Is it renderable in the current pipeline?
```

Do not approve a slide just because it looks beautiful.

