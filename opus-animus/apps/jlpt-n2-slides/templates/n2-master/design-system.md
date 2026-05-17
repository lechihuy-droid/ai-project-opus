# Design System — N2 Master

Rationale + visual direction for `templates/n2-master/sample-template.html`. Read alongside `brand-tokens.json` and `template-rules.md`.

---

## Visual Direction

**Premium educational, learner-friendly.** McKinsey-inspired discipline (grid, hierarchy, restraint) softened for video lessons.

Reference vibes:
- **McKinsey** → typographic discipline, ample whitespace, single accent color
- **Duolingo** → friendly readability, clear feedback states (✓/✗ on PracticeSlide)
- **Editorial Japanese textbook** → serif JP display, sans VI body, ruby for difficult kanji

NOT:
- ❌ Anime / kawaii aesthetic
- ❌ Corporate sales deck (overly polished, soulless)
- ❌ Maths-heavy reference textbook (too dense)

---

## Palette (placeholder — to confirm)

Single accent over warm off-white paper. One accent per deck.

| Token | Hex | Use |
|---|---|---|
| `c-bg` | `#FAF8F3` | Slide canvas — warm cream, not pure white |
| `c-ink` | `#1A1A1A` | All primary text — softer than `#000` |
| `c-muted` | `#6B6B6B` | VI gloss, captions, furigana |
| `c-accent` | `#0B3D91` | JP grammar pattern highlight, headings on hero slides |
| `c-accent-soft` | `#E6ECF6` | Callout background, hover state |
| `c-correct` | `#2E7D32` | PracticeSlide ✓ only |
| `c-wrong` | `#C62828` | PracticeSlide ✗ only |
| `c-rule` | `#E5E2DA` | 1px dividers |

**Pending decisions** (logged in `brand-tokens.json._pending`):
- Accent color confirmation — JP-blue (`#0B3D91`) is the placeholder. Editorial terracotta (`#B7472A`) is also a candidate.
- Font stack tuning after JP+VI mixed thumbnail testing.

---

## Type Scale

Major-third scale, anchored at 22px body.

```
fs-hook     96px    HookSlide only
fs-title    56px    SectionSlide / RecapSlide H1
fs-jp-lg    64px    Featured JP (vocab, pattern)
fs-h2       36px    Slide-level title
fs-body     22px    All body, VI gloss
fs-furigana 14px    Ruby text
fs-notes    16px    Speaker notes (rendered when ?notes=1)
```

Body never goes below 22px on a slide. If text doesn't fit at 22px, move to notes.

---

## Spacing

4-based modular scale. Use `sp-*` tokens, never raw px.

```
sp-1   4px    Tight inline (ruby gap)
sp-2   8px    Inline label spacing
sp-3  16px    Paragraph rhythm
sp-4  24px    Block separation
sp-5  40px    Major section gap
sp-6  64px    Hero / safe-zone padding
```

---

## Grid

- **16:9:** 12-column grid, 24px gutter, 48px margin.
- **3:4:** 6-column grid, 16px gutter, 32px margin.

Hero slides (Hook, CTA): single-column centered. Workhorse slides (ThreeView, Comparison): 3 or 2 columns.

---

## Interactivity Inventory

| Slide type | Interactive? | Mechanic |
|---|---|---|
| `PracticeSlide` | ✓ | Hotspot toggle — click choice reveals state + explanation |
| All others | – | Static |

Deck shell (not per-slide):
- `?notes=1` query param toggles `<aside class="notes">` visibility
- Keyboard `←` / `→` between slides, `f` for fullscreen — wired in the master template's shell `<script>` block

---

## Future Extensions (v2, not v1)

- 3:4 vertical variant
- Dark mode (`?theme=dark` shell flag)
- Per-deck accent swap (override `--c-accent` at deck root)
- PDF export pass — page-break rules per slide section
