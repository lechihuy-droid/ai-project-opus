# jlpt-n2-slides

HTML slide deck generator for JLPT N2 grammar lessons, built from teaching skeletons and video scripts.

Parent: `opus-animus/` — see parent `CLAUDE.md` (SDD, Python 3.11, Vietnamese responses, Task Scheduler).

---

## Roles

```
Claude / Codex     = Orchestrator + Content Planner + Reviewer
Open Design MCP    = Design Renderer / Artifact Generator / Preview Layer
```

Claude = não. OD MCP = tay thiết kế / render. **Không** dùng OD MCP làm "não bài giảng".

---

## Core Rule

**Do not generate HTML directly from raw script.**

Always follow this pipeline:

1. Read `lessons/<id>/teaching-skeleton.md` + `video-script.md`
2. Create or update `lessons/<id>/slide-plan.json`
3. Map every slide to an existing slide type (see `templates/n2-master/slide-types.md`)
4. Use Open Design MCP to generate or update `lessons/<id>/final-deck.html`
5. Review layout + teaching quality → `lessons/<id>/qa-report.md`
6. Apply fixes via OD MCP, re-review until publish-ready

---

## Pipeline

```
teaching-skeleton.md + video-script.md
        │   (Claude analyses lesson)
        ▼
   slide-plan.json
        │   (OD MCP renders)
        ▼
   final-deck.html
        │   (Claude reviews)
        ▼
   qa-report.md
        │   (OD MCP fixes)
        ▼
   final-deck.html (revised)
```

---

## Open Design MCP — 4 Operating Modes

| Mode | When | Trigger prompt |
|---|---|---|
| **Template Builder** | Build the N2 master template (once) | `prompts/00-build-master-template.md` (TBD) |
| **Deck Renderer** | `slide-plan.json` exists, no HTML yet | `prompts/02-generate-html-with-mcp.md` |
| **Layout Fixer** | After QA, apply only listed fixes | `prompts/04-fix-layout.md` |
| **Export Assistant** | Package final HTML / PDF / PPTX | TBD |

Never use OD MCP in a "think up the lesson and make slides" mode — quality is unverifiable.

---

## Design Rules

- Preserve the existing N2 master template. Do not redesign visual style unless explicitly asked.
- Keep on-slide text short. Long explanations → speaker notes.
- Vietnamese explanations + Japanese examples. Add `<ruby>` for difficult kanji.
- Every slide must map back to a section of the teaching skeleton.
- Avoid text overflow at all costs.
- Every slide root has `data-slide-id` and `data-duration` (seconds).
- 16:9 YouTube format primary. Template must be portable to 3:4 vertical later.

---

## Required Outputs (per lesson)

| File | Purpose |
|---|---|
| `slide-plan.json` | Structured plan — slide_id, slide_type, title, on_slide_text, speaker_notes, source_section, duration_sec, layout_constraints |
| `final-deck.html` | Self-contained HTML deck |
| `qa-report.md` | Layout + pedagogy + skeleton-mapping QA |
| `slide-map.md` | Short summary: slide_id → skeleton section → grammar point |

---

## Folder Structure

```
jlpt-n2-slides/
├── CLAUDE.md                        ← this file
├── AGENTS.md                        ← agent roles + handoff rules
├── template-rules.md                ← style rules — read every session
├── brand-tokens.json                ← canonical color/type/spacing tokens (mirror of tokens.css)
│
├── ai/                              ← opus-animus session tracking
│   ├── status.md
│   └── sessions/
│
├── lessons/
│   └── <lesson-id>/                 ← e.g. wake-family
│       ├── teaching-skeleton.md     ← input — lesson structure
│       ├── video-script.md          ← input — narration script
│       ├── slide-plan.json          ← Claude-generated, user-approved
│       ├── final-deck.html          ← OD MCP-generated
│       ├── qa-report.md             ← Claude review output
│       └── slide-map.md             ← slide_id ↔ skeleton ↔ grammar point
│
├── templates/
│   └── n2-master/
│       ├── slide-types.md           ← 11 slide types with slot contracts
│       ├── design-system.md         ← palette, type, spacing rationale
│       └── sample-template.html     ← reusable master HTML (TBD)
│
└── prompts/
    ├── 01-create-slide-plan.md
    ├── 02-generate-html-with-mcp.md
    ├── 03-review-slide-deck.md
    └── 04-fix-layout.md
```

---

## Slide Types (v1 — 11 types)

See `templates/n2-master/slide-types.md` for slot contracts.

1. `HookSlide` — opening question / curiosity hook
2. `PainPointSlide` — learner pain (global or local)
3. `StorySlide` — narrative anchor (Nam character arc)
4. `GrammarMapSlide` — visual map of N grammar points covered
5. `ThreeViewGrammarSlide` — one grammar point shown 3 ways: form / meaning / nuance
6. `ExampleSlide` — example sentence(s) with VI gloss
7. `ComparisonSlide` — A vs B (near-synonyms, common confusions)
8. `JLPTClueMapSlide` — exam-style clue patterns
9. `PracticeSlide` — quick prompt + answer reveal (only slide type with interactivity)
10. `RecapSlide` — end-of-lesson summary
11. `CTASlide` — call to action (worksheet, next video, subscribe)

---

## Conventions

- **Schema-first.** Lock `slide-plan.json` schema before generating any deck.
- **One design system, many decks.** Never edit tokens inside a lesson — fix `templates/n2-master/` and re-propagate.
- **Self-contained exports.** `final-deck.html` runs offline. Fonts via Google Fonts `<link>`; everything else inline.
- **No JS frameworks.** Plain HTML + CSS; minimal vanilla JS only for `PracticeSlide` reveal.

---

## Next Step

1. User provides `slide-plan.json` schema spec → write `docs/slide-plan-schema.md`.
2. Build N2 master template (Mode 1) via `prompts/` driver.
3. Test pipeline with **わけ family** lesson (`lessons/wake-family/`).
