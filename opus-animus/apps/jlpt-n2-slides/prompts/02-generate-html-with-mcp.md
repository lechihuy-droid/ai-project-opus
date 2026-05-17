# Prompt 02 — Generate HTML deck via Open Design MCP

**Mode:** OD MCP as **Deck Renderer**.

**Pre-req:** `lessons/<id>/slide-plan.json` exists and is user-approved.

---

## Prompt

```
Use Open Design MCP to generate the HTML slide deck from slide-plan.json.

Inputs:
- templates/n2-master/sample-template.html      (master template — do not modify)
- templates/n2-master/slide-types.md            (slot contracts)
- template-rules.md                             (style rules)
- brand-tokens.json                             (canonical tokens)
- lessons/<id>/slide-plan.json                  (the plan)

Output:
- lessons/<id>/final-deck.html

Rules:
- Do not change slide order.
- Do not add slides not in slide-plan.json.
- Do not redesign the master template — tokens, type, spacing untouched.
- Use the existing slide-type components verbatim, substituting slots from slide-plan.
- Every <section class="slide"> must carry data-slide-id and data-duration.
- Speaker notes go in <aside class="notes" hidden>, not on the slide.
- Add <ruby> for kanji above N3 level in any JP text.
- Honor char budgets in template-rules.md §5. If any on_slide_text exceeds, STOP and report — do not silently truncate.
- PracticeSlide: implement reveal via the hotspot-toggle pattern from OD skill `swiss-creative-mode-template` (see od://skills/swiss-creative-mode-template/SKILL.md). Adapt it: hotspot = correct/wrong state + explanation. Keyboard 1-4 select, Space reveal. Inline <script> only.

Self-contained output requirements:
- Inline all CSS into one <style> block in <head>.
- Fonts via Google Fonts <link>, not base64.
- Images: base64 if <50KB, else relative path + log warning.
- No external JS, no build step required to open.

After writing, print:
- output path
- slide count rendered
- char-budget violation count (must be zero)
- list of any kanji where ruby was added
- any unresolved slots (must be zero)
```

---

## Done when

- `lessons/<id>/final-deck.html` opens in a browser, all 15 slides render
- Zero budget violations
- Zero unresolved slots
- PracticeSlide reveal works (click + keyboard)
- File is self-contained (works offline after fonts load)
