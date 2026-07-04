# BD — Build Plan: Slide Compiler Agent (JLPT N2)
**Date:** 2026-05-13
**Status:** 🔵 Planning v0.2 — pending Codex Phase 4 execution
**Ref:** `RD-jlpt-n2-slide-agent.md` v0.4 + `SD-jlpt-n2-slide-agent.md` v0.2
**Estimate:** 28-37 hours (3-4 focused sessions)
**Planning owner:** Claude
**Implementation owner:** Codex

**Architecture mantra:** `Claude plans. Node renders. OD previews. Playwright validates.`

**Changelog:**
- v0.2 (2026-05-13): renamed to "Slide Compiler Agent"; Step 3 CLAUDE.md content locked; Phase D consolidated to `templates/n2-master/`; CI gate added before Phase H Step 21.
- v0.1 (2026-05-13): initial 26 steps.

---

## Phase 4 Execution Status - Codex 2026-05-14

- [x] Step 0 sign-off recorded in session/status notes
- [x] Phase A scaffold complete: `apps/slide-agent/`
- [x] Phase B schemas complete: lesson, slide-plan, slots
- [x] Phase C renderer complete: Mustache substitution, slot validator, deterministic output
- [x] Phase D templates complete: 14 existing React template IDs ported 1:1
- [x] Phase E prompts complete: `prompts/00..04-*.md`
- [x] Phase F QA scripts complete: layout, mapping, banned label
- [x] Phase G frame export complete: Playwright via installed Chrome fallback
- [x] Phase H Wake gate complete: render PASS, QA PASS, visual review PASS, audio prefix sync PASS, reproducibility PASS
- [x] Phase I doc sync + archive complete: canonical docs updated, React app moved to `99-archive/schema-html-prototype-pre-mcp/`

Implementation notes:

- Wake migration used existing accepted `wake-typed-deck.json` normalized into `apps/slide-agent/lessons/wake-cluster/slide-plan.json`.
- Production frames now use `slide-NN-wake-NN.png`; audio sync is by numeric `slide-NN` prefix.
- Existing production frames were backed up under `apps/slide-agent/lessons/wake-cluster/baseline-frames/` before overwrite.
- React archive rollback steps live in `99-archive/schema-html-prototype-pre-mcp/ROLLBACK.md`.

---

## Prerequisites

Trước khi bắt đầu build:
- [x] RD approved (Gate 1 — user-approved v0.3; Codex sign-off pending)
- [ ] SD approved (Gate 2 — pending Codex)
- [ ] Node 20+ available
- [ ] Lucida `wake-cluster` baseline frames intact at `production/00-active/wake-cluster/frames/` (for FR-MIG-002 visual diff)
- [ ] Existing React app `apps/schema-html-prototype/` still functional (rollback path)
- [ ] No active edits on Lucida canonical docs that would conflict with FR-MIG-005

---

## Build Sequence Overview

```
Phase A — Scaffold (Steps 1-3)         ~3h
Phase B — Schemas + Validators (4-6)   ~4h
Phase C — Renderer (7-9)               ~5h
Phase D — Templates port (10-12)       ~10h
Phase E — Orchestrator prompts (13-15) ~4h
Phase F — QA Loop (16-18)              ~4h
Phase G — Frame export (19)            ~2h
Phase H — Wake migration + CI gate + visual (20, 20.5, 21-23) ~6.5h   ← test target = Wake
Phase I — Doc sync + archive (24-26)   ~3h
```

> **Note:** Test target = Wake (Q5: "apply test cho Wake"). No separate "new lane" final integration test — Phase H Wake regen + visual review + audio sync + reproducibility check IS the end-to-end gate.

---

## Build Steps

### Step 0 — Codex Onboarding Spike
**Mục tiêu:** Codex confirm hiểu RD + SD; identify any blocking ambiguity before Phase A.
**Việc làm:**
- [ ] Codex đọc RD v0.3, SD v0.1, BD v0.1
- [ ] Codex record verdict in the current session/status notes: approve/request-changes, questions, locked decision interpretation acknowledgement
- [ ] Nếu request-changes → Claude revises planning docs, loop
- [ ] Nếu approve → mark RD+SD status v1.0, proceed Step 1
**Smoke test:** current session/status notes contain verdict line `Status: APPROVED FOR BUILD RD v0.4 / SD v0.2 / BD v0.2`
**Estimate:** 1-2h (Codex review + Q&A)

---

### Phase A — Scaffold

#### Step 1 — Create agent root + package
**Mục tiêu:** Skeleton folder structure + Node project.
**Files:**
- Tạo mới: `opus-lucida/apps/slide-agent/`
  - `README.md` (entry: how to run)
  - `package.json` (deps: mustache, ajv, @playwright/test)
  - `.gitignore` (`node_modules/`, `lessons/*/final-deck.html` optional)
**Việc làm:**
- [ ] Create folder per SD §8 layout
- [ ] `npm init -y` + add deps
- [ ] Write README.md (one-pager: install + 5 run commands)
**Smoke test:** `cd opus-lucida/apps/slide-agent && npm install` → exit 0
**Estimate:** 30min

#### Step 2 — Create empty subfolders
**Files:**
- `scripts/` `prompts/` `schemas/` `templates/` `lessons/` `tests/` (with `.gitkeep` for empty dirs)
**Việc làm:**
- [ ] mkdir all
- [ ] .gitkeep where empty
**Smoke test:** `ls opus-lucida/apps/slide-agent/` shows 6 subfolders
**Estimate:** 10min

#### Step 3 — CLAUDE.md for agent
**Files:**
- Tạo mới: `opus-lucida/apps/slide-agent/CLAUDE.md` — orient future Claude/Codex sessions
**Việc làm:**
- [ ] Embed locked architecture text (block dưới)
- [ ] Cite RD + SD + BD paths
- [ ] List 5 modes + entry commands
- [ ] Banned-dict link + 3-view labels lock
- [ ] How to run (3-line cheat sheet)
**Smoke test:** Open CLAUDE.md, verify Rendering Architecture section present + 5-mode table
**Estimate:** 30min

**Locked content cho CLAUDE.md (Rendering Architecture section):**

````markdown
# Rendering Architecture

Open Design MCP is read-only in this project.

It must not be treated as the production renderer.

## Open Design MCP role

Use OD MCP only for:
- reading project files
- inspecting generated artifacts
- checking active design context
- supporting template authoring preview
- reviewing rendered HTML

Do not use OD MCP for:
- generating final-deck.html
- substituting template slots
- writing files
- creating slides
- exporting final artifacts

## Production Rendering

Production rendering is handled by deterministic Node scripts:

- scripts/validate-slide-plan.js
- scripts/render-deck.js
- scripts/check-overflow.js
- scripts/export-frames.js

The renderer must be deterministic:
same input files must produce byte-identical final-deck.html.

No LLM generation is allowed in the render path.

## Mantra

Claude plans. Node renders. OD previews. Playwright validates.
````

---

### Phase B — Schemas + Validators

#### Step 4 — `schemas/lesson.schema.json`
**Mục tiêu:** JSON Schema 2020-12 for lesson.json.
**Việc làm:**
- [ ] Schema cover all fields in SD §4.1 (lane_id, lesson_title, promise, pain, story_anchor, method_note, grammar_points[], comparisons[], clue_map[], practices[], recap_bullets[], cta)
- [ ] Mark required vs optional per RD scope
- [ ] Add `additionalProperties: false` for tight contract
**Smoke test:** `npx ajv validate -s lesson.schema.json -d tests/fixtures/sample-lesson.json` (after Step 4b creates fixture)
**Estimate:** 1h

#### Step 4b — Create sample fixture
**Files:** `tests/fixtures/sample-lesson.json` — hand-crafted Wake lesson digest, ≥4 grammar points
**Estimate:** 30min

#### Step 5 — `schemas/slide-plan.schema.json`
**Mục tiêu:** JSON Schema for slide-plan.json per SD §4.2.
**Việc làm:**
- [ ] Schema: lane_id, source_lesson, slides[]
- [ ] Each slide: slide_id (kebab), phase (enum from Lucida 12 phases), template_id (string, validated at render), source_section (string with anchor pattern), duration_sec (int), slots (object, free-form for now), speaker_notes (string)
**Smoke test:** ajv validate on `tests/fixtures/sample-slide-plan.json`
**Estimate:** 1h

#### Step 6 — `schemas/slots.schema.json`
**Mục tiêu:** JSON Schema for per-template slots.json file per SD §4.3.
**Việc làm:**
- [ ] Schema: template_id, version, required_slots (object: name → {type, max_chars, optional pattern}), optional_slots
**Smoke test:** ajv validate on each template's `slots.json` after Phase D
**Estimate:** 30min

---

### Phase C — Renderer

#### Step 7 — `scripts/validateTemplate.js`
**Mục tiêu:** Detect drift between template.html `{{slots}}` and slots.json declarations.
**Files:**
- Tạo mới: `scripts/validateTemplate.js`
**Phụ thuộc:** Step 6 done
**Việc làm:**
- [ ] Parse template.html with regex `\{\{(\w+)\}\}` (also handle `{{#section}}…{{/section}}`)
- [ ] Compare set against slots.json required+optional
- [ ] Exit 1 with diff if mismatch
**Smoke test:** `node scripts/validateTemplate.js templates/hero_title/` exit 0 (after templates exist Phase D)
**Estimate:** 1.5h

#### Step 8 — `scripts/render.js`
**Mục tiêu:** Mode 2 renderer. Read slide-plan + templates → emit final-deck.html.
**Files:**
- Tạo mới: `scripts/render.js`
**Phụ thuộc:** Steps 4, 5, 6, 7
**Việc làm:**
- [ ] CLI: `--lane <id>` required, `--mode render|fix` optional
- [ ] Load slide-plan.json, validate against schema
- [ ] For each slide:
  - Resolve template_id → load templates/<id>/template.html + slots.json
  - Validate slots present + max_chars + type
  - Banned label scan on slot values (load banned-dict from Lucida read-only)
  - Mustache render
- [ ] Concatenate all slide sections + wrap in deck shell HTML (head with inline CSS, script for keyboard nav from MVP)
- [ ] Inline all template.css files into single `<style>` block
- [ ] Write `lessons/<lane>/final-deck.html`
- [ ] Exit codes per SD §4.4
**Smoke test:** `node scripts/render.js --lane wake-cluster` after Phase D → final-deck.html opens in browser, all sections present
**Estimate:** 2.5h

#### Step 9 — `tests/render.test.js`
**Mục tiêu:** Cover render happy path + 3 error exits.
**Việc làm:**
- [ ] Test: happy path with fixture slide-plan → output has N `<section>`s
- [ ] Test: missing required slot → exit 2
- [ ] Test: slot > max_chars → exit 2
- [ ] Test: banned label in slot → exit 3
**Smoke test:** `node --test tests/render.test.js` all pass
**Estimate:** 1h

---

### Phase D — Templates Port (consolidated `templates/n2-master/`)

> **Approach:** Per RD v0.4, consolidated structure — 1 folder `templates/n2-master/` chứa tất cả slide variants. Variants kept as Mustache partials hoặc `<template id="...">` blocks trong cùng `template.html`. Use OD daemon to preview. Visual diff vs React output baseline.
>
> **Codex decides Step 10:** Mustache partials (separate files concat at render) vs inline `<template>` blocks (single file, render extracts by id). Both work; pick based on diff-friendliness.

#### Step 10 — Build n2-master shell + 5 common variants
**Files:**
- `templates/n2-master/template.html` (shell + 5 variants: hero_title, key_message, two_column, comparison_table, summary)
- `templates/n2-master/template.contract.json` (slot specs cho 5 variants)
- `templates/n2-master/styles.css`
**Phụ thuộc:** Step 7 (validator), Step 8 (render)
**Việc làm per variant:**
- [ ] Read source TSX in `apps/schema-html-prototype/src/layouts/components/`
- [ ] Extract slot names from JSX props
- [ ] Add variant block to template.html với `{{slot}}` syntax + semantic HTML
- [ ] Append variant slots to template.contract.json (types + max_chars per template-rules.md §5 budgets)
- [ ] Add scoped CSS `.slide--<variant>` to styles.css
- [ ] Run `validateTemplate.js` → exit 0
- [ ] Add fixture slide to `tests/fixtures/sample-slide-plan.json`
- [ ] Run render → visual check
**Smoke test:** validator exit 0 cho cả 5 variants; render fixture outputs 5 valid `<section>` blocks
**Estimate:** 1h × 5 = 5h

#### Step 11 — Add Wake-specific 3 variants
**Variants:** `grammar_card`, `quiz_before_after`, `minimal_pair` (extracted from `WakeTemplateLayouts.tsx` 245 LOC)
**Việc làm:** Append vào cùng `template.html` + `template.contract.json` + `styles.css`. Same workflow Step 10. Wake variants phức tạp hơn — 1.5h mỗi cái.
**Smoke test:** Tất cả 8 variants validator pass; fixture slide-plan với 8 slide types render thành công
**Estimate:** 1.5h × 3 = 4.5h

#### Step 12 — `scripts/runAgent.js` — mode-all runner
**Files:** `scripts/runAgent.js` — orchestrate render → qa → fix loop
**Việc làm:**
- [ ] CLI: `--lane <id> --mode all|render|qa|fix`
- [ ] Sequence: render → qa scripts → consolidate qa-report stub → invoke fix mode (Mode 4 = re-render with patches)
- [ ] Mode 0/1 are Claude prompt-driven, not invoked here (user runs Claude session separately)
**Smoke test:** `node scripts/runAgent.js --lane wake-cluster --mode render` chains validator + render
**Estimate:** 1h

---

### Phase E — Orchestrator Prompts

> Prompts are markdown files Claude reads in user session. Not auto-executed.

#### Step 13 — `prompts/00-ingest-skeleton-script.md`
**Mục tiêu:** Mode 0 prompt — instruct Claude to read Lucida files + emit lesson.json.
**Việc làm:**
- [ ] Input list: skeleton.md, script.md, library.md, banned-dict.md
- [ ] Schema reference: schemas/lesson.schema.json
- [ ] Output path: `lessons/<lane>/lesson.json`
- [ ] Pass condition: JSON Schema validate exit 0; ≥4 grammar_points for Wake
- [ ] Honor 3-view labels lock + banned dict
**Estimate:** 1h

#### Step 14 — `prompts/01-create-lesson.md` and `prompts/02-create-slide-plan.md`
**Note:** Possibly merge if lesson.json + slide-plan.json review combined. Default: split per user spec.
**Việc làm:**
- [ ] 01: digest content into lesson.json (subset of Mode 0?)
- [ ] 02: map lesson → slides (phases + template_id assignment)
- [ ] Both honor banned dict + 3-view labels
**Estimate:** 1.5h

#### Step 15 — `prompts/03-run-qa-loop.md` and `prompts/04-apply-fixes.md`
**Việc làm:**
- [ ] 03: instruct Claude to run rule-based QA scripts + author teaching QA + consolidate qa-report.md
- [ ] 04: read qa-report → patch slide-plan.json → re-invoke render
- [ ] Both cite SD §4.5 qa-report format
**Estimate:** 1.5h

---

### Phase F — QA Loop Scripts

#### Step 16 — `scripts/qa-layout.js`
**Mục tiêu:** Rule-based layout check.
**Việc làm:**
- [ ] Parse final-deck.html
- [ ] For each slide: extract on-screen text, count chars per template's max_chars
- [ ] Check `.accent` count ≤ 1 per slide
- [ ] Emit JSON findings to stdout
**Smoke test:** Test fixture with overflow → findings include overflow entry
**Estimate:** 1.5h

#### Step 17 — `scripts/qa-mapping.js`
**Mục tiêu:** Verify every slide.source_section exists in skeleton.md anchors.
**Việc làm:**
- [ ] Parse skeleton.md → extract all `#anchor` IDs (look for headings)
- [ ] For each slide: parse source_section path + anchor
- [ ] Emit JSON findings for missing anchors
**Estimate:** 1h

#### Step 18 — `scripts/qa-bannedlabel.js`
**Mục tiêu:** Scan final-deck.html for banned EN labels (defense in depth — render.js already checked slot values; this checks rendered HTML).
**Việc làm:**
- [ ] Load banned-dict.md → parse banned terms list
- [ ] Scan all text nodes in final-deck.html
- [ ] Emit JSON findings: {slide_id, banned_term, suggested_replacement}
**Estimate:** 1.5h

---

### Phase G — Frame Export

#### Step 19 — `scripts/exportFrames.js`
**Mục tiêu:** Replace Lucida's React-based Playwright export.
**Files:**
- Tạo mới: `scripts/exportFrames.js`
- Reuse `playwright.config.ts` (simplified copy from existing React app)
**Việc làm:**
- [ ] CLI: `--lane <id>`
- [ ] Open final-deck.html in headless Chromium
- [ ] For each `<section data-slide-id>`, hide siblings (style override), screenshot at 1280×720, save as `slide-NN-<slide-id>.png`
- [ ] Write into `production/00-active/<lane>/frames/`
- [ ] Match existing audio sync naming convention
**Smoke test:** `node scripts/exportFrames.js --lane wake-cluster` outputs 17 PNG matching audio segment count
**Estimate:** 2h

---

### Phase H — Wake Migration + End-to-End Gate (FR-MIG-002)

> Wake is THE test target per Q5. This phase is both the migration step AND the final integration test — no separate "new lane" check needed.

#### Step 20 — Run agent on wake-cluster end-to-end
**Mục tiêu:** Apply test cho Wake (per Q5). Cover Mode 0..4 driven by user via prompts.
**Việc làm:**
- [ ] User runs Mode 0 prompt → emit lessons/wake-cluster/lesson.json
- [ ] User runs Mode 1 prompt → emit slide-plan.json
- [ ] User runs Mode 2 render → emit final-deck.html
- [ ] User runs Mode 3 QA → emit qa-report.md
- [ ] User runs Mode 4 fix until verdict PASS or PASS_WITH_NOTES
- [ ] `node scripts/exportFrames.js --lane wake-cluster` → frames/*.png
**Smoke test:** 17 PNG output, render exit 0, qa-report verdict ≥ PASS_WITH_NOTES
**Estimate:** 2h (assuming prompts work first time; +1h for iteration)

#### Step 20.5 — CI gate (must pass trước Step 21)
**Mục tiêu:** Automated checks chạy đầy đủ trước khi tốn human attention cho visual review.
**Files:**
- Tạo mới: `scripts/ci-gate.js` — orchestrate 5 checks
**Việc làm:**
- [ ] Compose 5-check sequence:
  1. `validate-slide-plan.js --lane wake-cluster` → exit 0
  2. `render-deck.js --lane wake-cluster` → exit 0
  3. Diff hash of final-deck.html vs previous render → empty (reproducibility)
  4. `check-overflow.js --lane wake-cluster` → exit 0
  5. Playwright smoke test: open HTML, verify ≥1 `<section>` per template_id in slide-plan → exit 0
- [ ] Exit non-zero nếu bất kỳ check fail; print which check + summary
- [ ] Document trong CLAUDE.md là CI gate phải pass trước Step 21
**Smoke test:** `node scripts/ci-gate.js --lane wake-cluster` exit 0 với deck render fresh
**Estimate:** 1.5h

---

#### Step 21 — Visual review gate (FR-MIG-002)
**Mục tiêu:** Compare new frames vs pre-migration baseline.
**Phụ thuộc:** Step 20.5 CI gate exit 0
**Files:**
- Tạo mới: `lessons/wake-cluster/VISUAL-REVIEW.md` — record verdict per slide
**Việc làm:**
- [ ] Side-by-side view: pre-migration baseline frames vs new frames
- [ ] Note differences per slide (font hinting, spacing, color) — acceptable if visual review thường (Q8)
- [ ] Verdict: PASS / REVISE
- [ ] If REVISE: identify which template needs patch, loop Step 20-21
**Smoke test:** VISUAL-REVIEW.md verdict = PASS
**Estimate:** 1h

#### Step 22 — Audio sync verify (NFR-008)
**Mục tiêu:** Confirm existing audio still syncs with new frames.
**Việc làm:**
- [ ] Use Lucida's existing audio sync tool/pipeline (not changed)
- [ ] Verify frame slide-NN-*.png aligns with audio slide-NN.mp3
- [ ] If mismatch: investigate naming or duration_sec drift
**Smoke test:** Audio sync tool exits 0 / passes existing gate
**Estimate:** 1h

#### Step 23 — Reproducibility check (NFR-005)
**Mục tiêu:** Verify cùng input = cùng output (deterministic agent).
**Việc làm:**
- [ ] Backup current `lessons/wake-cluster/final-deck.html` → `.baseline.html`
- [ ] `rm lessons/wake-cluster/final-deck.html`
- [ ] Re-run `node scripts/render.js --lane wake-cluster`
- [ ] `diff lessons/wake-cluster/final-deck.html lessons/wake-cluster/.baseline.html` → expect empty (byte-identical)
- [ ] If diff: investigate non-determinism source (timestamp, ordering, etc.)
**Smoke test:** diff empty
**Estimate:** 1h

---

### Phase I — Doc Sync + Archive

#### Step 24 — Update Lucida canonical docs (FR-MIG-005)
**Files to update:**
- `opus-lucida/ai/status.md` — locked decisions: renderer = agent's substitution engine
- `opus-lucida/production/01-rules/slide-system/02-slide-template-library.md` — each template entry → link `apps/slide-agent/templates/<id>/`
- `opus-lucida/production/01-rules/slide-system/06-slide-template-acceptance-process.md` — §11.5 promote OD MCP Pass from optional → primary
- `opus-lucida/automation/workflows/20-lesson-production-sop.md` — replace `npm run dev/build` with `node scripts/runAgent.js`
- `opus-lucida/11-current-operating-flow.md` — update §5 Current Slide Creation Flow
**Việc làm:**
- [ ] One commit per file ideally, or one consolidated commit with clear message
- [ ] Bump version + Date in each file's header
- [ ] Cross-link RD/SD/BD paths
**Smoke test:** `grep -l "schema-html-prototype" opus-lucida/**/*.md` returns only `99-archive/` matches after this step
**Estimate:** 2h

#### Step 25 — Archive React app
**Files:**
- Move: `opus-lucida/apps/schema-html-prototype/` → `opus-lucida/99-archive/schema-html-prototype-pre-mcp/`
- Tạo mới: `opus-lucida/99-archive/schema-html-prototype-pre-mcp/ROLLBACK.md`
**Việc làm:**
- [ ] `git mv` (preserves history)
- [ ] ROLLBACK.md content:
  - When to roll back (criteria)
  - Steps: `git mv` reverse, `cd … && npm install && npm run dev`
  - Risks (Wake regeneration loss if any work done in agent)
**Smoke test:** `ls opus-lucida/apps/` no longer includes schema-html-prototype; `ls opus-lucida/99-archive/` includes it
**Estimate:** 30min

#### Step 26 — Update agent CLAUDE.md final
**Files:** `opus-lucida/apps/slide-agent/CLAUDE.md`
**Việc làm:**
- [ ] Mark Phase H + I complete
- [ ] Add troubleshooting section (common errors per exit code)
- [ ] Add link to ROLLBACK.md
**Estimate:** 30min

---

## Test Strategy Summary

| Layer | Test | Tool |
|---|---|---|
| Schema | JSON Schema validate fixtures | ajv |
| Renderer | Happy + 3 error exits | node --test |
| Template | Drift validator on all 8 templates | validateTemplate.js |
| QA scripts | Fixture-driven findings JSON | node --test |
| Frame export | 17 PNG output count + size | manual + count |
| Wake regression | Visual review pre/post | VISUAL-REVIEW.md gate (Step 21) |
| Audio sync | Existing Lucida tool | unchanged (Step 22) |
| Reproducibility | Byte-identical re-render | diff (Step 23) |

---

## Rollback Plan

Nếu BD fail at any phase, rollback path:

| Phase failed | Rollback action |
|---|---|
| A-B (scaffold/schemas) | `rm -rf opus-lucida/apps/slide-agent/`. Lucida untouched. |
| C-F (renderer/templates/QA) | Same as above. No Lucida files modified. |
| G (frame export) | Same as above + restore `production/00-active/wake-cluster/frames/` from git if overwritten. |
| H (Wake migration + gate) | Wake baseline frames in git — restore. Agent root stays. Mark Step 21 verdict FAIL, do not proceed to Phase I. |
| I (doc sync + archive) | `git revert` doc commits. `git mv` React app back. |

**Hard rollback:** Restore `apps/schema-html-prototype/` from `99-archive/`, follow ROLLBACK.md.

---

## Checklist Before Done

- [ ] All 26 steps marked ✅ in this BD
- [ ] All FR in RD §2 have implementation traceability
- [ ] NFR-003 Wake gate PASS (VISUAL-REVIEW.md verdict — Step 21)
- [ ] NFR-005 reproducibility PASS (byte-identical re-render — Step 23)
- [ ] NFR-007 Lucida content read-only verified (git diff `production/00-active/` empty except `frames/`)
- [ ] NFR-008 audio sync verified (Step 22)
- [ ] No hardcoded credentials (none expected anyway — agent reads filesystem only)
- [ ] Codex sign-off on completion recorded in current session/status notes
- [ ] User sign-off after Phase H all 4 gates green

---

## Open Items for Phase 4 Implementation

Items Codex resolves during implementation:

1. Exact regex for `{{slot}}` parsing (handles array iteration `{{#items}}…{{/items}}` and escaped `\{\{`).
2. Mustache options: HTML-escape vs no-escape per slot type (JP text often needs no-escape for `<ruby>` markup).
3. Template inheritance: do `quiz_before_after` and `practice_*` share base template? Decide during Step 11.
4. Lucida banned-dict parse format: extract terms from MD table or maintain a derived JSON?
5. Visual review tolerance (Q8 RD): exact criteria for PASS vs REVISE — Codex defines.

---

## Open Items for User After BD

User-facing items not in Codex scope:

1. Forward RD + SD + BD to Codex
2. Schedule Codex session for Step 0 onboarding
3. Cleanup `apps/_archive-jlpt-n2-slides-v2-mis-scoped/` (folder lock) — close OD daemon, rename or delete
4. Run Mode 0/1/3/4 prompts in Claude session during Phase H (user-driven; agent automates Mode 2 + 5)

---

*opus-lucida — BD v0.1 (JLPT N2 Slide Agent) | 2026-05-13*
