# workflow-canvas-v1 — Scoring Rubric

Frozen BEFORE any redesign comparison. Independent of any prior Hallmark/Taste/Impeccable
findings or issue lists (Bxx/Hxx/Ixx/Cxx/Txx) — none were consulted while writing this
rubric. This rubric is the sole scoring instrument for every future comparison against
target `workflow-canvas-v1`.

## Screenshot Verification

Baseline: `docs/benchmarks/design-skills/screenshots/workflow-canvas-v1-baseline.png`
Manifest: `docs/benchmarks/design-skills/workflow-canvas-v1.manifest.json`

Visually confirmed present in the baseline screenshot:
- workflow `software-delivery` selected (sidebar row highlighted, header title, "19 nodes · 18 connections")
- Design mode active (segmented control shows "Design" selected)
- sidebar open (left navigation + workflow list visible)
- node `validate-design` selected (accent-highlighted node on canvas; Inspector header reads "validate-design")
- Inspector Overview tab open (target/on_fail/checks JSON visible under the Overview tab)
- RunLog collapsed (bottom strip reads "RUN LOG · 0 events · No run yet", collapsed height)
- minimap visible (bottom-right of canvas region, dot-grid representation with viewport frame)
- viewport 1440x900 (confirmed by PNG IHDR: width=1440, height=900)

## Scoring Dimensions (Total = 100)

### A. Task & Information Hierarchy — 15
Does the screen make primary/secondary actions and information priority obvious?

- **1 (poor):** No visual priority — primary action (Run/Save/Check workflow) has the same
  weight as secondary/destructive actions; a first-time user cannot tell what to do next
  without reading every label.
- **3 (acceptable):** Primary action is distinguishable (color/position) but competes with
  2+ other elements of similar visual weight; task completion requires a brief scan, not
  instant recognition.
- **5 (excellent):** Primary action is unambiguous at a glance (weight, color, position);
  secondary/tertiary actions are visibly subordinate; a new user identifies "what do I do
  here" in under 2 seconds without reading text.

### B. Canvas & Workflow Readability — 15
Can users understand graph structure, direction, node relationships and workflow state quickly?

- **1 (poor):** Edge direction is ambiguous or occluded; node order/flow cannot be
  determined without clicking through each node; overlapping or crossing edges obscure
  structure.
- **3 (acceptable):** Direction and flow are inferable with a few seconds of tracing;
  minor occlusion/crossing exists but doesn't block comprehension of the overall shape.
- **5 (excellent):** Flow direction, branching, and stage grouping are immediately legible;
  arrowheads/edge routing make the execution order obvious without tracing lines by hand.

### C. Node Type & State Differentiation — 10
Can node role/type/state be recognized without reading every detail?

- **1 (poor):** Agent, Validate, and Render nodes look identical except for text; run
  status (ready/running/done/fail) has no distinct color/icon and must be read as text.
- **3 (acceptable):** Type is distinguishable via icon or border color but requires a
  half-second lookup; status is color-coded but low-contrast or inconsistent across states.
- **5 (excellent):** Type and status are recognizable from icon/color/shape alone at a
  glance, consistently across all 19 nodes, without reading the label text.

### D. Toolbar & Action Hierarchy — 10
Are controls grouped logically with clear primary actions?

- **1 (poor):** Zoom, fit, mode switch, run/check/save, and overflow actions are
  scattered with no grouping logic; related controls are visually separated.
- **3 (acceptable):** Controls are grouped (e.g. zoom cluster, mode switch, action
  cluster) but grouping boundaries are weak or inconsistent with spacing/dividers.
- **5 (excellent):** Controls are grouped by function with clear visual separation;
  primary action (Run/Check) is visually distinct from utility actions (zoom/fit); overflow
  menu isolates rare actions.

### E. Error / Validation / Status Visibility — 10
Are important operational states noticeable and located where users need them?

- **1 (poor):** Validation issues, run status, and node-level errors are not visible
  without navigating away from the canvas (e.g. buried in a menu or another tab).
- **3 (acceptable):** Status is shown (chip/badge/bar) but positioned where it's easy to
  miss on first glance, or only shown for one of {workflow, node, run} but not others.
- **5 (excellent):** Workflow status, per-node status, and validation issues are all
  visible in-context without extra navigation, using consistent color/iconography.

### F. Information Density & Scanability — 10
Is the UI compact without becoming cognitively overloaded?

- **1 (poor):** Either so sparse that the 1440x900 viewport wastes space and forces
  excessive panning, or so dense that node cards/toolbar become visually noisy and hard
  to parse at a glance.
- **3 (acceptable):** Reasonable density; some crowding or some wasted space, but no
  paragraph-level reading is required to locate a given node or control.
- **5 (excellent):** Information is compact and purposeful; every visible element earns
  its space; a user can scan the 19-node graph and toolbar without feeling overwhelmed or
  underinformed.

### G. Panel Composition & Workspace Balance — 10
Do sidebar, canvas, inspector and RunLog allocate space according to task importance?

- **1 (poor):** Canvas (the primary work surface) is cramped relative to sidebar/inspector,
  or RunLog/inspector consume disproportionate space for their actual information content.
- **3 (acceptable):** Canvas gets the majority of space but sidebar/inspector proportions
  feel arbitrary rather than deliberate relative to their content needs.
- **5 (excellent):** Canvas clearly dominates as the primary surface; sidebar and inspector
  widths match their actual content density; collapsed RunLog takes minimal vertical space
  without disappearing entirely.

### H. Interaction Discoverability — 5
Are important actions/affordances understandable without excessive trial-and-error?

- **1 (poor):** Key interactions (connect nodes, delete edge, fit canvas, toggle inspector)
  have no visible affordance; a user must guess or trial-and-error to find them.
- **3 (acceptable):** Most affordances are discoverable via icons/tooltips but one or two
  key interactions (e.g. edge connect handles) are hidden until hover with no other hint.
- **5 (excellent):** Every primary interaction has a visible, labeled, or tooltip-clarified
  affordance; hover-only affordances are limited to genuinely secondary actions.

### I. Visual System Consistency — 5
Typography, spacing, controls, borders, states and tokens feel systematic.

- **1 (poor):** Inconsistent spacing units, mismatched border radii/colors across similar
  components, ad-hoc typography scale.
- **3 (acceptable):** Mostly consistent, with a few one-off deviations (e.g. a control
  that doesn't match the established button/chip system).
- **5 (excellent):** Spacing, radii, color tokens, and typography are uniform across every
  panel and control; the UI clearly reads as one coherent design system, not assembled
  pieces.

### J. Product Appropriateness / Anti-AI-Slop — 5
Does it feel like a serious operational product rather than generic AI SaaS decoration?

- **1 (poor):** Decorative gradients, oversized rounded cards, generic "AI dashboard"
  chrome, or ornamentation that adds no functional value and reads as templated.
- **3 (acceptable):** Mostly restrained but has 1-2 decorative flourishes that don't serve
  the operator's task (unnecessary shadow/glow, mismatched iconography tone).
- **5 (excellent):** Every visual choice serves legibility or task speed for an operator
  running real workflows; no decoration for decoration's sake; reads as professional
  internal tooling.

### K. Responsive / Viewport Robustness — 5
Does the composition appear likely to survive constrained viewport conditions?

- **1 (poor):** Layout clearly depends on generous width (e.g. toolbar text/controls would
  collide or clip at moderately smaller viewports); no evidence of responsive fallback.
- **3 (acceptable):** Core layout would likely survive modest viewport reduction, but some
  toolbar/label elements would need to truncate or wrap awkwardly.
- **5 (excellent):** Grid/column proportions and text truncation strategy (visible in the
  markup/behavior) suggest the composition degrades gracefully well below 1440px width.

**TOTAL = 15+15+10+10+10+10+10+5+5+5+5 = 100**

## Non-Visual Gates (do NOT modify the 100-point score)

### Functional Safety — PASS / FAIL

Must preserve, unchanged in contract/behavior:
- routes
- API contracts
- state/data models
- workflow semantics
- backend
- persistence
- keyboard behavior

Any regression in the above is an automatic FAIL on this gate, independent of visual score.

### Validation
- build: PASS / FAIL
- lint: PASS / FAIL
- test: PASS / FAIL

### Code Churn (record only — not a scored input)
- files changed: N
- lines added: N
- lines removed: N
- dependencies added: N

Churn is not rewarded or penalized directly. It is used only as a lens to judge whether
implementation complexity is justified by the measured UX improvement (rubric score delta).
A large churn with a small score delta is a flag for over-engineering; a small churn with a
large score delta is a flag for high-leverage change. Neither raises or lowers the 100-point
total.

## Final Comparison Rule

Every final implementation compared against this target must:

**START FROM:** commit `6a57162298b29093f8d10b3f89c9bd6137ad63c1`

**USE:** the `workflow-canvas-v1` manifest (`docs/benchmarks/design-skills/workflow-canvas-v1.manifest.json`)

**CAPTURE AFTER:**
- same 1440x900 state
- same fixture (`software-delivery`)
- same selected node (`validate-design`)
- same panels (sidebar open, inspector open/Overview, RunLog collapsed)
- same zoom/fit behavior (auto `fit()`, not a manually typed zoom value)

Then compare baseline screenshot vs. candidate screenshot using this exact rubric — the
same eleven dimensions, the same weights, the same anchor criteria. No skill may receive a
different scoring rubric, different weights, or different anchor language.

## Benchmark Interpretation

Do NOT declare one universal "best skill." Final results must separately distinguish:

- **Actual Harness Fit** — does the output work correctly inside this specific app's
  routing/state/data model, not just look plausible in isolation?
- **Product UX quality** — the rubric's A–K score.
- **Visual redesign capability** — how much of the score delta came from genuine
  comprehension/usability gains vs. surface restyling.
- **Technical QA capability** — Functional Safety gate + build/lint/test results.
- **Functional safety** — PASS/FAIL on the non-visual gate, independent of score.
- **Scope fit** — whether the skill's changes stayed proportionate to the task (see Code
  Churn) rather than over-reaching into unrelated surface area.

A skill may score well on visual redesign capability while failing Functional Safety, or
score high on Functional Safety while making no meaningful UX improvement. Either is a
valid, specific outcome — neither implies a single ranked "winner" across all axes. A skill
excellent in its native role may still be unsuitable as the default Harness design skill if
it fails Actual Harness Fit or Functional Safety.

## Scoring Template

| Dimension | Weight | Baseline | Candidate | Notes |
|---|---:|---:|---:|---|
| Task & Information Hierarchy | 15 | | | |
| Canvas & Workflow Readability | 15 | | | |
| Node Type & State Differentiation | 10 | | | |
| Toolbar & Action Hierarchy | 10 | | | |
| Error / Validation / Status Visibility | 10 | | | |
| Information Density & Scanability | 10 | | | |
| Panel Composition & Workspace Balance | 10 | | | |
| Interaction Discoverability | 5 | | | |
| Visual System Consistency | 5 | | | |
| Product Appropriateness / Anti-AI-Slop | 5 | | | |
| Responsive / Viewport Robustness | 5 | | | |
| TOTAL | 100 | | | |

Functional Safety:
Build:
Lint:
Test:
Files changed:
Lines +:
Lines -:
Dependencies added:
