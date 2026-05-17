# Template Rules — JLPT N2 Slide Deck

Style + structure contract for `templates/n2-master/` and every `lessons/<id>/final-deck.html`. Read every session before generating or editing a deck.

---

## 1. Slide Geometry

- **Primary:** 16:9 (1280×720 logical) for YouTube horizontal.
- **Secondary (v2):** 3:4 (720×960) vertical. Template must use logical units (`%`, `vw`, `vh`, `clamp()`) so geometry swaps cleanly.
- **Stage:** Single content stage, `max-width: 1120px` for 16:9, `max-width: 640px` for 3:4. Centered. Padding 48px (16:9) / 32px (3:4).
- **Safe zone:** All text ≥ 40px from any edge. Title/CTA elements ≥ 64px from edge.

---

## 2. Root Element Contract

Every slide:

```html
<section
  class="slide slide--<type>"
  data-slide-id="<plan.slide_id>"
  data-duration="<plan.duration_sec>">
  <!-- slot content -->
  <aside class="notes" hidden>{{speaker_notes}}</aside>
</section>
```

- `data-slide-id` matches `slide-plan.json.slides[].slide_id` exactly.
- `data-duration` is an integer (seconds) for YouTube timing.
- `<aside class="notes">` always present, `hidden` by default. Toggle via deck-level `?notes=1` query param (handled by minimal inline JS in the deck shell).

---

## 3. Design Tokens (canonical: `brand-tokens.json`, mirrored to `tokens.css`)

Source of truth: `brand-tokens.json`. CSS variables in `templates/n2-master/sample-template.html` derive from it. Never hardcode hex / px / font-name outside tokens.

| Token | Purpose |
|---|---|
| `c-bg` | Slide background (warm off-white, McKinsey paper feel) |
| `c-ink` | Primary text |
| `c-muted` | Secondary text, VI gloss, captions |
| `c-accent` | Primary accent (one per deck, used for grammar pattern highlight) |
| `c-accent-soft` | Tint of accent for backgrounds, callouts |
| `c-correct` / `c-wrong` | Practice slide feedback only |
| `c-rule` | Dividers |
| `f-jp` | Japanese serif (display) — `"Noto Serif JP", "Yu Mincho", serif` |
| `f-jp-ui` | Japanese sans — `"Noto Sans JP", "Yu Gothic UI", sans-serif` |
| `f-vi` | Vietnamese / Latin — `"Inter", "Segoe UI", sans-serif` |
| `fs-hook` | Hook slide hero | ~96px |
| `fs-title` | Slide H1 | ~56px |
| `fs-h2` | Slide H2 | ~36px |
| `fs-body` | Body | ~22px |
| `fs-jp-lg` | Featured Japanese | ~64px |
| `fs-furigana` | Furigana | ~14px |
| `sp-1`..`sp-6` | Spacing scale | 4 / 8 / 16 / 24 / 40 / 64 |

---

## 4. Typography Rules (mixed Vietnamese + Japanese)

- **JP feature text** (vocab, grammar pattern, example): `--f-jp`, line-height 1.4, no bold on kanji (use `--c-accent` color for emphasis).
- **VI gloss / explanation:** `--f-vi`, line-height 1.5, sits *below* JP, smaller, in `--c-muted`.
- **Furigana:** `<ruby><rb>漢字</rb><rt>かんじ</rt></ruby>`. Never inline parentheses. Add ruby only for kanji above N3.
- **Pattern highlight:** wrap the N2 grammar form in `<span class="accent">…</span>`. One accent span per slide max.

---

## 5. On-Slide Text Budget

Hard caps to prevent overflow:

| Type | Max on-slide chars (JP + VI combined) |
|---|---|
| `HookSlide` | 60 (one punchy question) |
| `PainPointSlide` | 120 |
| `StorySlide` | 180 |
| `GrammarMapSlide` | 12 grammar pattern strings, no prose |
| `ThreeViewGrammarSlide` | 240 (≈80 per view) |
| `ExampleSlide` | 200 (1–2 example sentences + VI) |
| `ComparisonSlide` | 280 (140/side) |
| `JLPTClueMapSlide` | 200 |
| `PracticeSlide` | 200 (prompt + 4 choices) |
| `RecapSlide` | 240 (5–7 bullets) |
| `CTASlide` | 100 |

If content exceeds the cap → move overflow to `speaker_notes`, not the slide. The generator must enforce this; QA flags violations.

---

## 6. Speaker Notes

- All long-form explanation lives in `<aside class="notes">{{speaker_notes}}</aside>`.
- Plain prose, no nested HTML except `<br>` and `<strong>`.
- Audience: the narrator (YouTube voiceover). Write in second-person Vietnamese.

---

## 7. PracticeSlide Interactivity (only interactive slide type)

- 4 choices, click reveals `.correct` / `.wrong` + `.explanation`.
- Keyboard: `1`–`4` select, `Space` reveal.
- Inline `<script>` block. No external file.
- Reset state on slide re-entry.
- Reuse the **hotspot toggle pattern** from OD skill `swiss-creative-mode-template` for the reveal mechanic — see `prompts/02-generate-html-with-mcp.md`.

---

## 8. Export Constraints

When OD MCP exports `final-deck.html`:

- Inline all CSS into one `<style>` block.
- Fonts: `<link>` to Google Fonts. Do not base64-embed font files.
- Images: base64 inline if < 50KB, else relative path + warn.
- Strip OD dev comments, `<!-- slot:* -->` markers, unused component scaffolding.
- Output validates as standalone HTML5. Open in browser, no daemon needed.

---

## 9. What NOT To Do

- No utility CSS (Tailwind etc.) — tokens *are* the system.
- No CSS-in-JS, no PostCSS.
- No animation beyond opacity/transform on PracticeSlide reveal.
- No SVG icons in v1 — emoji or none.
- Never hardcode hex / px / font-name outside `brand-tokens.json` / `tokens.css`.
- Never redesign during a Layout Fixer pass (Mode 3).
- Never add a new slide type without updating `templates/n2-master/slide-types.md` + this file.
