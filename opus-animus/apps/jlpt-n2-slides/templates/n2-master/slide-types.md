# Slide Types — N2 Master Template

11 slide types. Every slide in any deck must map to exactly one of these. Each has a fixed slot contract that `slide-plan.json` fields map to 1:1.

Slot format: Mustache-style `{{slot_name}}`.

---

## 1. `HookSlide`

Opening curiosity hook. One punchy question or surprising fact.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `hook_jp` | ✓ | string (JP) | Big Japanese line, e.g. `「わけ」って何？` |
| `hook_vi` | ✓ | string (VI) | Short VI translation below |
| `subtitle` | – | string | Optional teaser |

Layout: single centered block, `fs-hook`, generous top/bottom space.

---

## 2. `PainPointSlide`

Why this grammar matters / common learner failure mode.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `pain_label` | ✓ | string | "Global" / "Local" / "Common Mistake" |
| `pain_jp` | – | string (JP) | Example of wrong/confusing usage |
| `pain_vi` | ✓ | string (VI) | VI explanation, max 80 chars |

---

## 3. `StorySlide`

Narrative anchor — recurring character (Nam) encounters the grammar in real life.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `scene` | ✓ | string (VI) | One-line scene-setter |
| `dialogue_jp` | ✓ | string (JP) | One JP line |
| `dialogue_vi` | ✓ | string (VI) | VI translation |
| `image_ref` | – | path | Optional illustration |

---

## 4. `GrammarMapSlide`

Visual map of N grammar points covered in this lesson. No prose.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `points[]` | ✓ | array of `{pattern, gloss_vi}` | 2–6 items. `pattern` is JP form like `〜わけだ` |
| `family_label` | ✓ | string | E.g. "わけ family" |

Layout: pill grid, accent color on patterns.

---

## 5. `ThreeViewGrammarSlide`

One grammar point from 3 angles: **form** / **meaning** / **nuance**. The workhorse slide.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `pattern` | ✓ | string (JP) | E.g. `〜わけだ` |
| `pattern_reading` | – | string | Furigana if needed |
| `form` | ✓ | string | Connecting form, e.g. `普通形 + わけだ` |
| `meaning_vi` | ✓ | string (VI) | One-line meaning |
| `nuance_vi` | ✓ | string (VI) | Nuance vs neighbors |

Layout: three columns or three rows. Pattern bold-color at top.

---

## 6. `ExampleSlide`

1–2 natural example sentences with VI gloss.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `pattern_ref` | ✓ | string | Which pattern this exemplifies |
| `examples[]` | ✓ | array of `{jp, vi, breakdown?[]}` | Max 2 |

`breakdown[]`: optional per-token gloss `[{token, gloss}]` for hard sentences.

---

## 7. `ComparisonSlide`

A vs B for near-synonyms / common confusions.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `left` | ✓ | `{title, points[]}` | E.g. `わけだ` |
| `right` | ✓ | `{title, points[]}` | E.g. `はずだ` |
| `verdict_vi` | – | string (VI) | One-line takeaway |

`points[]`: max 4 per side, max 60 chars each.

---

## 8. `JLPTClueMapSlide`

Exam-style clue patterns — what to look for in JLPT reading/listening.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `clues[]` | ✓ | array of `{trigger, hint_vi}` | 3–5 items. `trigger` is the JP cue word/phrase |
| `pattern_ref` | ✓ | string | The grammar point this maps to |

---

## 9. `PracticeSlide`

Quick MCQ with reveal. Only interactive slide type.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `prompt_jp` | ✓ | string (JP) | Question stem |
| `prompt_vi` | – | string (VI) | Optional VI scaffold |
| `choices[]` | ✓ | array of strings | Exactly 4 |
| `answer_index` | ✓ | int | 0–3 |
| `explanation_vi` | ✓ | string (VI) | Revealed after click |

Interactivity: hotspot-toggle pattern (see `template-rules.md` §7).

---

## 10. `RecapSlide`

End-of-lesson summary.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `bullets[]` | ✓ | array of strings | 5–7 items, max 40 chars each |
| `family_label` | – | string | Reuse from GrammarMapSlide |

---

## 11. `CTASlide`

Closing call to action.

| Slot | Required | Type | Notes |
|---|---|---|---|
| `cta_headline_vi` | ✓ | string (VI) | E.g. "Tải worksheet luyện わけ family" |
| `cta_url` | – | string | Worksheet / next video link |
| `next_lesson_hint` | – | string | Teaser for next video |

---

## Adding a New Slide Type

1. Add row to this file with slot contract.
2. Add char budget to `template-rules.md` §5.
3. Add component to `templates/n2-master/sample-template.html`.
4. Add demo instance to the sample so it's exercised visually.
5. Bump `brand-tokens.json._meta.version`.
