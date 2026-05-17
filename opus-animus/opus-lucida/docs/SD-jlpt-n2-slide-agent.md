# SD — Slide Compiler Agent (JLPT N2)
**Date:** 2026-05-13
**Status:** 🔵 Draft v0.2 — pending Codex review
**Ref:** `RD-jlpt-n2-slide-agent.md` v0.4
**Planning owner:** Claude
**Implementation owner:** Codex

**Architecture mantra:** `Claude plans. Node renders. OD previews. Playwright validates.`

**Changelog:**
- v0.2 (2026-05-13): renamed components per RD v0.4; consolidated `templates/n2-master/` structure; Custom Slide Renderer MCP added to §11 (v2 backlog).
- v0.1 (2026-05-13): initial draft.

---

## 1. Architecture Overview

```
            ┌─────────────────────────────────────────────────┐
            │  Lucida content (read-only)                     │
            │  production/00-active/<lane>/                   │
            │    ├── 01-master-teaching-skeleton.md           │
            │    └── 02-script.md                             │
            │  production/01-rules/slide-system/              │
            │    ├── 02-slide-template-library.md             │
            │    └── 10-banned-preferred-language-dictionary  │
            └────────────────────┬────────────────────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │  Claude Orchestrator         │
                  │  (driven by prompts/00..04)  │
                  └──┬──────────┬─────────┬─────┘
                     │          │         │
            Mode 0   │  Mode 1  │ Mode 3  │
            Ingest   │  Plan    │  QA     │
                     │          │         │
                     ▼          ▼         ▼
              lesson.json  slide-plan.json  qa-report.md
                     │          │           ▲
                     └────┬─────┘           │
                          │                 │
                          ▼                 │
                  ┌──────────────────┐     │
                  │  Substitution    │     │
                  │  Renderer        │     │
                  │  (Mustache + JS) │     │
                  └────────┬─────────┘     │
                           │                │
              Mode 2 Render│  Mode 4 Fix   │
                           ▼                │
                   final-deck.html ─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Playwright      │ (reuse existing
                  │  PNG export      │  Lucida script,
                  └────────┬─────────┘  refactored)
                           ▼
              production/00-active/<lane>/frames/slide-*.png
                           │
                           ▼
                  [Audio + Video pipeline — unchanged]
```

```mermaid
graph LR
    SK[skeleton.md] --> ORC[Claude Orchestrator]
    SCR[script.md] --> ORC
    LIB[Lucida template library MD] --> ORC
    ORC -->|Mode 0| LSN[lesson.json]
    LSN -->|Mode 1| PLN[slide-plan.json]
    PLN -->|Mode 2| REN[Node Renderer (deterministic)]
    TPL[templates/*/] --> REN
    REN --> DECK[final-deck.html]
    DECK -->|Mode 3| QA[qa-report.md]
    QA -->|Mode 4| REN
    DECK --> PW[Playwright export]
    PW --> PNG[frames/*.png]
```

---

## 2. Data Flow

```
Mode 0 — Ingest
  Input  : skeleton.md + script.md + library.md + banned-dict.md
  Action : Claude reads + digests
  Output : lessons/<lane>/lesson.json  (JSON Schema validated)

Mode 1 — Plan
  Input  : lesson.json + template library MD
  Action : Claude maps content → phases → template_id → slots
  Output : lessons/<lane>/slide-plan.json  (JSON Schema validated)

Mode 2 — Render
  Input  : slide-plan.json + templates/<template_id>/template.html
  Action : Mustache substitution + validator + self-contained packaging
  Output : lessons/<lane>/final-deck.html

Mode 3 — QA
  Input  : final-deck.html + slide-plan.json + skeleton.md + qa-criteria
  Action : Rule-based scripts (layout, mapping) + Claude review (teaching)
  Output : lessons/<lane>/qa-report.md  (verdict + fix list)

Mode 4 — Fix
  Input  : qa-report.md + final-deck.html + slide-plan.json
  Action : Apply patches from fix list, re-render
  Output : revised final-deck.html

After loop:
  Playwright export final-deck.html → production/00-active/<lane>/frames/*.png
  (Existing audio + video pipeline unchanged.)
```

---

## 3. Component Breakdown

### 3.1 Claude Orchestrator

**Trách nhiệm:** Drive 5 modes via prompt files. Author lesson.json + slide-plan.json. Review pre-render + run QA Mode 3.

**Implementation:** Not a single script — a set of `prompts/00..04-*.md` that the user pastes into Claude session. Each prompt is self-contained with input/output/rules.

**Input:** Lucida content files (read), JSON Schemas, prompt files.

**Output:** lesson.json, slide-plan.json, qa-report.md (written via Write tool).

**Side effects:** Reads Lucida files only. Writes only inside `apps/slide-agent/lessons/<lane>/`.

### 3.2 Node Renderer (deterministic) (`scripts/render.js`)

**Trách nhiệm:** Mode 2 + Mode 4. Read slide-plan.json + templates, emit final-deck.html.

**Implementation:**
- Node script (~150-200 LOC).
- Deps: `mustache`, `ajv` (JSON Schema validator).
- No build step. Runs as `node scripts/render.js --lane <lane>`.

**Input:** `lessons/<lane>/slide-plan.json`, `templates/<template_id>/template.html` + `slots.json`.

**Output:** `lessons/<lane>/final-deck.html` (self-contained, inline CSS).

**Side effects:** None outside agent root.

### 3.3 Template Validator (`scripts/validateTemplate.js`)

**Trách nhiệm:** Catch drift between `template.html` and `slots.json` per template.

**Implementation:**
- Parse template.html → extract all `{{slot}}` tokens.
- Compare to slots.json declared slots.
- Fail if mismatch (template has slot not in JSON, or vice versa).

**Input:** Path to `templates/<template_id>/`.

**Output:** Exit 0 = OK; exit 1 = mismatch with diff printed.

### 3.4 QA Runners (`scripts/qa-*.js`)

**Trách nhiệm:** Mode 3 rule-based checks.

**Three scripts:**
- `qa-layout.js`: char budget overflow, single-accent rule, safe-zone padding
- `qa-mapping.js`: every slide.source_section exists in skeleton.md anchors
- `qa-bannedlabel.js`: scan final-deck.html for banned EN labels

**Input:** final-deck.html + slide-plan.json + skeleton.md.

**Output:** Emit JSON findings → Claude prompt 03 consolidates into qa-report.md.

### 3.5 Playwright Export Refactor (`scripts/exportFrames.js`)

**Trách nhiệm:** Replace `apps/schema-html-prototype/scripts/exportScreenshots.ts`. Read final-deck.html → emit PNG per `<section data-slide-id>`.

**Implementation:**
- Open final-deck.html in headless Chromium.
- For each `<section.slide>`, hide siblings, screenshot.
- Output naming: `slide-<NN>-<slide-id>.png` matching audio convention.

**Input:** `lessons/<lane>/final-deck.html` + `production/00-active/<lane>/` (output target).

**Output:** `production/00-active/<lane>/frames/slide-*.png`.

### 3.6 Migration Utilities (Phase 4 only, throwaway)

**Trách nhiệm:** Port 8 React layout components to template HTML+slots.json. Manual port per component (no auto-compiler — templates stable, one-time cost).

**Tools:** `Read` TSX file, hand-craft equivalent template.html + slots.json + template.css. Visual diff against React-rendered baseline.

---

## 4. Interface Contracts

### 4.1 lesson.json schema (sketch — finalize in BD)

```json
{
  "lane_id": "wake-cluster",
  "lesson_title": "わけ family — 4 speaker actions",
  "promise": "...",
  "pain": { "global": "...", "local": "..." },
  "story_anchor": { "scene": "...", "character": "Nam", "dialogue_jp": "...", "dialogue_vi": "..." },
  "method_note": "Ý nghĩa - Dạng - Cách dùng",
  "grammar_points": [
    {
      "pattern": "〜わけだ",
      "form": "Plain form + わけだ",
      "meaning_vi": "...",
      "usage_vi": "...",
      "examples": [{ "jp": "...", "vi": "..." }]
    }
  ],
  "comparisons": [
    { "left": "〜わけではない", "right": "〜わけがない", "axis_vi": "..." }
  ],
  "clue_map": [...],
  "practices": [{ "prompt_jp": "...", "choices": [...], "answer_index": 2, "explanation_vi": "..." }],
  "recap_bullets": [...],
  "cta": { "headline_vi": "...", "url": "..." }
}
```

### 4.2 slide-plan.json schema (sketch)

```json
{
  "lane_id": "wake-cluster",
  "source_lesson": "lessons/wake-cluster/lesson.json",
  "slides": [
    {
      "slide_id": "hook-01",
      "phase": "Hook",
      "template_id": "hero_title",
      "source_section": "01-master-teaching-skeleton.md#3-hook-core",
      "duration_sec": 8,
      "slots": {
        "title_jp": "「わけ」って何？",
        "subtitle_vi": "4 mẫu nhìn giống nhau — nhưng người nói đang làm 4 chuyện khác nhau."
      },
      "speaker_notes": "..."
    }
  ]
}
```

### 4.3 templates/<template_id>/slots.json

```json
{
  "template_id": "hero_title",
  "version": "1.0",
  "required_slots": {
    "title_jp": { "type": "string", "max_chars": 30 },
    "subtitle_vi": { "type": "string", "max_chars": 120 }
  },
  "optional_slots": {
    "deck_chip": { "type": "string", "max_chars": 20 }
  }
}
```

### 4.4 render.js CLI

```
node scripts/render.js --lane <lane-id> [--mode render|fix] [--qa-report <path>]

Exit codes:
  0  = success, final-deck.html written
  1  = slot drift in template
  2  = slide-plan missing required slot
  3  = banned label detected in slot value
  4  = file I/O error
```

### 4.5 qa-report.md format (sketch)

```markdown
# QA Report — wake-cluster
**Date:** 2026-05-XX
**Iteration:** 1
**Verdict:** REVISE
**Score:** 7/10

## Critical
- slide_id `practice-02`: choices[2] contains banned label "Reveal"
  → Replace with "Đáp án" per banned-dict.md row 14

## Major
- slide_id `compare-01`: left.points has 5 items (cap 4)
  → Move 5th point to speaker_notes

## Minor
- slide_id `recap-01`: bullet 3 ends with period inconsistency

## Exact Fix List (drives Mode 4)
1. {slide_id: "practice-02", patch: "replace banned label", details: "..."}
2. {slide_id: "compare-01", patch: "trim points to 4", details: "..."}
3. {slide_id: "recap-01", patch: "normalize punctuation", details: "..."}
```

---

## 5. Storage & State

| Data | Location | Format | Lifetime |
|---|---|---|---|
| Lucida skeleton/script | `production/00-active/<lane>/` | `.md` | Permanent (read-only) |
| Lucida rule docs | `production/01-rules/slide-system/` | `.md` | Permanent (read-only) |
| lesson.json | `apps/slide-agent/lessons/<lane>/lesson.json` | JSON | Permanent |
| slide-plan.json | `apps/slide-agent/lessons/<lane>/slide-plan.json` | JSON | Permanent |
| final-deck.html | `apps/slide-agent/lessons/<lane>/final-deck.html` | HTML | Permanent (regenerable) |
| qa-report.md | `apps/slide-agent/lessons/<lane>/qa-report.md` | Markdown | Permanent (per iteration) |
| Templates | `apps/slide-agent/templates/<template_id>/` | HTML+JSON+CSS | Permanent |
| JSON Schemas | `apps/slide-agent/schemas/{lesson,slide-plan,slots}.schema.json` | JSON Schema | Permanent |
| Prompts | `apps/slide-agent/prompts/00..04-*.md` | Markdown | Permanent |
| Frames (output) | `production/00-active/<lane>/frames/` | PNG | Permanent |
| Archived React app | `99-archive/schema-html-prototype-pre-mcp/` | TSX bundle | Permanent (rollback) |

---

## 6. Error Handling Strategy

| Scenario | Behavior | Exit code | Logged? |
|---|---|---|---|
| Template slot drift (validator catches) | Fail before render, print diff | 1 | Yes |
| slide-plan missing required slot | Fail at render, name slide_id + slot | 2 | Yes |
| slide-plan slot value > max_chars | Fail at render, name slide_id + slot + actual chars | 2 | Yes |
| Banned label in slot value | Fail at render, name slide_id + banned term + suggested replace | 3 | Yes |
| Skeleton file missing | Fail at Mode 0, name expected path | 4 | Yes |
| QA Loop > 3 iterations no PASS | Escalate user, do not auto-publish | n/a | Yes |
| Playwright export fails on 1 slide | Continue export others, list failed slide_ids | 0 (with warning) | Yes |
| Codex implements feature outside RD scope | Reject in Phase 5 review | n/a | n/a |

**Principle:** Fail fast at internal contracts (template drift, slot drift, banned label). Be tolerant at external boundary (Playwright per-slide failure).

---

## 7. Technology Decisions

| Quyết định | Chọn | Lý do | Không chọn vì |
|---|---|---|---|
| Substitution engine | **Mustache.js** | Logic-less, ~5KB, well-known | Handlebars: helpers overkill; Eta: less ecosystem; React: bỏ stack đó |
| Schema validator | **ajv** (JSON Schema 2020-12) | De facto standard, fast | Zod: TS-only, không cần TS runtime; Joi: schema không portable |
| HTML render runtime | **Node 20+** (LTS) | Lucida tooling đã có Node | Deno/Bun: lock-in, ít stable |
| Headless browser (frame export) | **Playwright** (reuse Lucida's) | Already verified Wake; just refactor entry point | Puppeteer: chuyển không có lợi |
| Template authoring preview | **OD daemon** | Live preview HTML, designer-friendly | Vite: cần TSX; raw browser refresh: chậm hơn |
| Test runner | **node --test** (built-in) | No extra dep | Vitest: cần TS; mocha: thêm dep |
| Lint | None v1 | Agent code nhỏ, manual review | ESLint: overkill cho ~500 LOC |
| Type checking | **JSDoc + tsc --noEmit** (optional) | Light type hints, không build | Full TS: bỏ stack TS |
| Locked decision compliance | Claude orchestrator output JSON only; renderer owns HTML | Match Lucida locked decisions verbatim | — |

---

## 8. Folder Layout — `opus-lucida/apps/slide-agent/`

```
opus-lucida/apps/slide-agent/
├── README.md                  # entry point — how to run
├── package.json               # node deps (mustache, ajv, playwright)
├── scripts/
│   ├── render.js              # Mode 2 + Mode 4
│   ├── validateTemplate.js    # template drift check
│   ├── qa-layout.js           # layout rules
│   ├── qa-mapping.js          # skeleton mapping
│   ├── qa-bannedlabel.js      # banned dict scan
│   ├── exportFrames.js        # Playwright PNG export
│   └── runAgent.js            # orchestrate all modes
├── prompts/
│   ├── 00-ingest-skeleton-script.md
│   ├── 01-create-lesson.md
│   ├── 02-create-slide-plan.md
│   ├── 03-run-qa-loop.md
│   └── 04-apply-fixes.md
├── schemas/
│   ├── lesson.schema.json
│   ├── slide-plan.schema.json
│   └── slots.schema.json
├── templates/
│   └── n2-master/                # consolidated master family (per RD v0.4)
│       ├── template.html         # all slide variants as Mustache partials / <template> blocks
│       ├── template.contract.json # consolidated slot contract for all variants
│       └── styles.css            # shared styles
├── lessons/
│   └── wake-cluster/             # populated by agent run
│       ├── lesson.json
│       ├── slide-plan.json
│       ├── final-deck.html
│       └── qa-report.md
└── tests/
    ├── render.test.js
    ├── validateTemplate.test.js
    └── fixtures/
        └── sample-slide-plan.json
```

---

## 9. Integration Points

### 9.1 Lucida content read

- Path: `opus-lucida/production/00-active/<lane>/{01-master-teaching-skeleton.md, 02-script.md}`
- Mode: read-only (NFR-007)
- Format: Markdown with `#anchor` IDs for source_section refs

### 9.2 Lucida rule docs read

- Path: `opus-lucida/production/01-rules/slide-system/{02-slide-template-library.md, 10-banned-preferred-language-dictionary.md, 04-slide-framework-qa-checklist.md}`
- Mode: read-only, snapshot at agent build time (Q8 in RD: manual sync)

### 9.3 Playwright export → Lucida frames

- Path: agent reads from `apps/slide-agent/lessons/<lane>/final-deck.html`, writes to `opus-lucida/production/00-active/<lane>/frames/*.png`
- Naming: `slide-NN-<slide-id>.png` (NN = 2-digit zero-padded position, slide-id from data attr)
- Audio sync contract: existing `audio/slide-NN.mp3` matches frame `slide-NN-*.png` by NN

### 9.4 React app archival

- Move: `opus-lucida/apps/schema-html-prototype/` → `opus-lucida/99-archive/schema-html-prototype-pre-mcp/`
- Add: `99-archive/schema-html-prototype-pre-mcp/ROLLBACK.md` describing how to restore (git mv back + npm install + Vite restart)
- Trigger: only after FR-MIG-002 Wake gate passes

---

## 10. Open Items for BD

Items deferred to BD (Build Plan):

1. Exact JSON Schema fields for lesson.json and slide-plan.json (sketches in §4 are illustrative).
2. Per-template HTML structure (will reverse-engineer from existing 8 TSX components).
3. QA rule thresholds (char budget per template — extract from `template-rules.md` sample).
4. Test fixtures (which slides to use as golden output for render.test.js).
5. Wake regeneration playbook — exact step-by-step for FR-MIG-002 gate.

---

## 11. Out of Scope (deferred to v2)

- 3:4 vertical variant
- Animation/reveal beyond static before/after
- Auto-compiler from template.html → template.contract.json
- Live OD daemon as production renderer (only as authoring preview)
- Multi-language output (only VI explanation + JP examples in v1)
- **Custom Slide Renderer MCP** wrapper — expose Node scripts as MCP tools (`render_deck`, `validate_slide_plan`, `check_overflow`, `export_pdf`, `list_templates`). Same scripts inside, just better agent UX. Build when MVP stable + Claude/Codex pipeline matures.

---

*opus-lucida — SD v0.1 (JLPT N2 Slide Agent) | 2026-05-13*
