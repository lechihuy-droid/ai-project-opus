# Lucida All-Style Implementation Plan

## 1. Objective

Promote the Lucida visual library from one terminal MVP into a reusable,
machine-readable set of production style families for deterministic Remotion
video generation.

Terminal Command Center remains the reference MVP. This plan implements the
eight remaining production families:

1. `technical-editorial`
2. `minimal-education`
3. `cinematic-type`
4. `dashboard-data`
5. `paper-notebook`
6. `product-showcase`
7. `editorial-collage`
8. `timeline-documentary`

The existing generic families in `design/visual-library/index.json` remain
scene-purpose routing aliases until migration is complete. They are not counted
as finished style packages.

## 2. Definition of Done

Each style family is complete only when it has:

- a registered library entry and a versioned package directory;
- `visual.json`, `tokens.json`, `component-map.json`, and `provenance.md`;
- explicit supported intents, avoid rules, content limits, aspect ratios, and
  render-cost metadata;
- one renderer implementation using shared Remotion primitives;
- deterministic fixtures for 9:16, with 16:9 metadata prepared for later QA;
- at least three representative scenes: normal, dense, and edge case;
- preview PNGs, a machine-readable render report, and text-overflow checks;
- reduced-motion behavior and accessibility notes;
- Director compatibility records and a selection reason;
- no third-party logo, screenshot, font binary, or copied brand identity.

Promotion states are `draft -> experimental -> stable`. This project targets
`experimental`; `stable` requires human visual approval after rendered review.

## 3. Architecture

```text
reference inputs
  -> normalized design evidence
  -> style package contracts
  -> shared tokens and primitives
  -> family renderer
  -> scene fixture and StyleSpec
  -> deterministic still render
  -> automated QA report
  -> visual-library registration
  -> Director selection and continuity tests
```

### Shared code ownership

- `src/styles/core/`: token resolver, typography, safe-area, surface, grid,
  media, caption-safe layout, and reduced-motion utilities.
- `src/styles/families/<family>/`: family renderer and local primitives only.
- `design/visual-library/styles/<family>/`: package metadata, provenance,
  fixtures, and checked-in review artifacts.
- `pipeline/fixtures/styles/`: renderer input fixtures.
- `scripts/`: package validation, preview-board generation, and QA reports.

Family code must not import another family's local component. Shared behavior is
promoted to `src/styles/core/` first.

## 4. Style Contracts

| Family | Primary use | Visual grammar | Required scene types |
| --- | --- | --- | --- |
| `technical-editorial` | architecture, concepts, research | strict grid, rules, annotations, code/data callouts | explainer, diagram, summary |
| `minimal-education` | teaching, lists, definitions | generous whitespace, clear hierarchy, restrained accent | definition, steps, comparison |
| `cinematic-type` | hooks, chapter resets, claims | large type, image/texture field, low density | hook, quote, transition |
| `dashboard-data` | metrics, status, monitoring | dense panels, chart/table hierarchy, semantic states | KPI, chart, operations |
| `paper-notebook` | reasoning, study, process notes | paper field, ink hierarchy, marks and annotations | notes, derivation, checklist |
| `product-showcase` | UI/product walkthrough | product-first media, feature focus, clean stage | reveal, feature, before/after |
| `editorial-collage` | culture, multi-source narrative | modular crop system, captions, layered composition | montage, evidence, recap |
| `timeline-documentary` | history, chronology, case study | dated spine, archival frames, source labels | milestone, era change, conclusion |

## 5. Execution Waves

### Wave 0 - Foundation and contracts

Goal: make every family follow one enforceable package contract.

Tasks:

1. Extend `style-spec.schema.json` and add a visual-package schema.
2. Add a typed style registry and token resolver.
3. Add package and registry validators.
4. Add fixture conventions and preview artifact manifest format.
5. Add shared safe-area, text-fit, reduced-motion, and deterministic animation
   utilities.
6. Preserve compatibility with current `VideoMap` and terminal MVP.

Exit criteria:

- invalid family IDs and incomplete packages fail validation;
- Terminal still validates without visual regression;
- a blank family scaffold can render through the common adapter.

### Wave 1 - Core narrative styles

Implement in parallel:

- Agent A: `technical-editorial`
- Agent B: `minimal-education`
- Agent C: `cinematic-type`

These establish the shared typography, grid, and scene-composition vocabulary.
Each agent owns only its family package, renderer, and fixtures.

Exit criteria:

- three preview boards at 1080x1920;
- dense-copy fixtures do not overlap caption or safe areas;
- shared primitives are used instead of duplicated family CSS.

### Wave 2 - Structured information styles

Implement in parallel:

- Agent D: `dashboard-data`
- Agent E: `paper-notebook`
- Agent F: `timeline-documentary`

Exit criteria:

- dashboard never invents metrics and supports empty/error/loading states;
- notebook remains readable without depending on raster paper assets;
- timeline supports 3-8 events and handles missing imagery gracefully.

### Wave 3 - Asset-led styles

Implement in parallel:

- Agent G: `product-showcase`
- Agent H: `editorial-collage`

Exit criteria:

- asset classification (`embed_asset`, `style_reference`, `context_only`) is
  enforced at render binding;
- missing assets produce deliberate placeholders, not broken images;
- crop behavior is deterministic across portrait and landscape sources.

### Wave 4 - Director integration

Tasks:

1. Replace generic alias-only routing with package-backed family candidates.
2. Expand intent-to-family rules, content-fit filters, and rejection reasons.
3. Add family compatibility and bridge-transition matrix.
4. Enforce dominant-family share, maximum family count, and outro return.
5. Add tests for code, numeric data, image availability, chronology, and text
   density constraints.

Exit criteria:

- Director chooses only registered package IDs;
- every choice records selected and rejected reasons;
- no asset-led style is selected without embeddable assets;
- no dashboard style is selected without real structured data.

### Wave 5 - Render QA and promotion

Tasks:

1. Generate three-scene preview boards for all nine families including Terminal.
2. Render one 45-60 second multi-style reference composition.
3. Run schema, lint, type, deterministic-frame, overflow, safe-area, contrast,
   and missing-asset checks.
4. Record results under each package's `artifacts/` directory.
5. Mark passing packages `experimental`; leave failing packages `draft` with an
   issue report.

Exit criteria:

- all preview frames are nonblank and visually reviewed;
- same fixture and frame produce the same checksum;
- no checked-in MP4 is required; package metadata and review PNGs are retained;
- the reference composition uses at least four families coherently.

## 6. Subagent Coding Strategy

Use `gpt-5.5` for newly spawned workers. Interrupted family work may continue
with `gpt-5.6-sol` when preserving in-flight context is more important than
rerouting. The main agent owns architecture, shared files, integration, and
final QA. Workers receive disjoint write scopes.

Concurrency policy:

- maximum three family workers at once;
- never run two workers that edit `src/styles/core/`, registry indexes, Director
  rules, or shared schemas;
- workers may propose shared changes in their handoff but must not edit shared
  ownership files;
- each worker must state changed files, tests run, unresolved issues, and preview
  artifact paths;
- the main agent reviews every patch before integration.

Worker assignment template:

```text
Implement <family> only.
Owned paths:
- src/styles/families/<family>/**
- design/visual-library/styles/<family>/**
- pipeline/fixtures/styles/<family>/**

Do not edit shared registry, schema, core, Director, or unrelated files.
Use existing core APIs. Add package metadata, provenance, three fixtures,
renderer, tests, and preview artifacts. Do not revert other agents' edits.
```

## 7. Verification Matrix

Every family must pass:

| Gate | Method |
| --- | --- |
| Metadata | JSON schema and registry reference validation |
| Renderer | TypeScript and template-registry validation |
| Determinism | repeated frame checksum comparison |
| Layout | 1080x1920 stills for normal, dense, and edge fixtures |
| Text | overflow and longest-word checks |
| Safe area | TikTok, Reels, and Shorts overlays |
| Accessibility | contrast report and reduced-motion fixture |
| Assets | provenance and classification validation |
| Continuity | neighboring-family compatibility tests |
| Visual quality | human review of generated preview board |

## 8. Recommended Run Order

1. Complete Wave 0 locally and freeze shared APIs.
2. Spawn Wave 1 workers (`gpt-5.5`) and integrate one family at a time.
3. Run shared validation before starting Wave 2.
4. Spawn Wave 2 workers and resolve data/chronology edge cases.
5. Spawn Wave 3 workers after asset binding is stable.
6. Integrate Director rules and compatibility matrix locally.
7. Render all preview boards and the multi-style reference composition.
8. Register artifacts and promote passing packages to `experimental`.

## 9. Risks and Controls

- **Style duplication:** enforce distinct grammar and `avoidFor` rules during
  package review.
- **CSS sprawl:** no global family CSS; use scoped components and shared tokens.
- **Renderer instability:** keep animation frame-driven and network-free.
- **Asset licensing:** store metadata and generated review frames only; reject
  unclear assets.
- **Text overflow:** include dense and longest-word fixtures before promotion.
- **Subagent conflicts:** disjoint ownership and sequential shared-file merges.
- **Remotion hang:** keep still-render fallback for QA, but do not count fallback
  video as proof that the Remotion renderer is healthy.

## 10. Execution Result

Completed on 2026-07-14:

- all nine production style packages are registered as `experimental`;
- strict package validation and aggregate QA pass 9/9;
- Director, continuity matrix, runtime dispatch, and legacy fallback tests pass;
- nine preview boards and a 54-second four-family reference composition have
  deterministic PNG evidence;
- the reference composition uses exactly four families, keeps
  `technical-editorial` dominant at 57.41%, and returns to it for the outro;
- final pixel-based visual review passes 9/9 after dashboard and technical
  editorial remediation;
- no MP4 is generated or registered as a reusable visual-library artifact.

Canonical reports:

- `design/visual-library/reports/qa-all-style-packages.json`
- `design/visual-library/reports/preview-boards/preview-boards.json`
- `design/visual-library/reports/reference-composition/render-report.json`
- `design/visual-library/reports/visual-review/visual-review.json`
