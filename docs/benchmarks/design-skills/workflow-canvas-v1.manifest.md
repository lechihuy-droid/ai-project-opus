# workflow-canvas-v1

## Benchmark Identity

- Target ID: `workflow-canvas-v1`
- Repository: `C:\Users\HUY\workspace\ai-project-opus`
- Baseline commit: `6a57162298b29093f8d10b3f89c9bd6137ad63c1`
- Application: `harness/hub/web-v3`
- Primary source: `harness/hub/web-v3/src/pages/WorkflowsPage.tsx`
- Route: `http://<host>:<port>/#/workflows`

## Fixture

- Workflow file: `harness/hub/workflows/software-delivery.workflow.yaml`
- Layout file: `harness/hub/workflows/software-delivery.layout.json`
- Fixture ID: `software-delivery`
- Node count: 19
- Edge count: 18
- Node-type counts: `agent` 16, `validate` 3

The canonical workflow must be **explicitly selected** in the sidebar. Do not rely on API `rows[0]` ordering.

## Canonical Viewport

- 1440x900

## Canonical UI State

- mode: `design`
- workflow: `software-delivery` (explicitly selected)
- sidebar: open (mounted whenever `mode === 'design'`; no independent toggle)
- inspector: open (`inspector` state default `true`)
- inspector tab: `overview`
- RunLog: collapsed (`runLogOpen === false` and `mode !== 'run'`)
- selected node: `validate-design` (confirmed present in fixture, `type: validate`; explicit click required — no default selection exists)
- zoom: fit (`fit()` result after layout fetch resolves and `requestAnimationFrame` settles; not a manually typed zoom value)
- validation: `none_active` (no live run attached; ValidationBar hidden unless workflow explicitly checked — canonical state = not checked)
- minimap: **present** — `<Minimap layout={layout} zoom={zoom} pan={pan} canvasRef={canvasRef} onJump={...} />`, `WorkflowsPage.tsx:215/253`. Always rendered inside the canvas section whenever a workflow with layout is loaded (no visibility toggle, no independent open/closed state). Its rendered content (node dots + viewport frame) is fully derived from `layout`, `zoom`, and `pan` — deterministic once those three inputs are deterministic. No additional state beyond that.
- transient-state rules: no open popovers, no open menus, no hover-only state, no active drag, no active edge draft (`draftEdge === null`)

## Runtime Requirements

- Frontend: `vite` (dev server; `harness/hub/web-v3` package.json `dev` script) / `pnpm dev`
- Backend: `python harness/hub/server.py` (FastAPI/uvicorn, default port 8799, `harness/hub/config.py:PORT`)
- Proxy: frontend `/api` → `127.0.0.1:8799` (`vite.config.ts`)
- Token handling: set `HUB_TOKEN` explicitly before starting backend; open `#/workflows?k=<TOKEN>` once; token is captured into `localStorage` and stripped from the URL (`lib/api.ts`). Represent the token in this manifest as `<BENCHMARK_HUB_TOKEN>` — never a real value.
- Network/auth notes: fully local; no external network calls required to render the page. API is token-gated server-side (`_auth_guard` middleware); the SPA shell itself loads unauthenticated.

## Reproduction Procedure

1. Checkout baseline commit
2. Start backend with explicit `HUB_TOKEN`
3. Start frontend
4. Open `/#/workflows?k=<BENCHMARK_HUB_TOKEN>`
5. Wait for workflow API to load
6. Explicitly select workflow `software-delivery`
7. Wait for `software-delivery.layout.json` positions to resolve
8. Wait for `fit()` / `requestAnimationFrame` to settle
9. Explicitly select node `validate-design`
10. Ensure Inspector tab = Overview
11. Ensure mode = Design
12. Ensure RunLog = collapsed
13. Ensure no popovers/menus/hover/drag state
14. Verify viewport = 1440x900

## Determinism Rules

DO NOT use API `rows[0]` as workflow selection.
DO NOT rely on default selected node.
DO NOT capture before layout fetch + `fit()` settle.
DO NOT use an arbitrary `HUB_TOKEN`.
DO NOT use a different viewport.
DO NOT alter fixture/layout files.
DO NOT attach a live run.

## Screenshot

- status: `captured`
- path: `docs/benchmarks/design-skills/screenshots/workflow-canvas-v1-baseline.png`
- automation: `python_playwright_system_edge`
- required viewport: 1440x900

A future screenshot-capture step must reproduce this manifest exactly before capture. Screenshot absence does not invalidate the source/runtime manifest.

## Functional Freeze

Future skill benchmarks must preserve:

- routes
- APIs
- backend behavior
- state/data model
- workflow semantics
- node/edge semantics
- SSE behavior
- keyboard behavior
- persistence
- domain terminology
- i18n semantics
- runtime/test data-* attributes

## Comparison Rule

Every Hallmark, Taste, and Impeccable same-target benchmark must BEGIN from:

commit:
6a57162298b29093f8d10b3f89c9bd6137ad63c1

fixture:
software-delivery

selected node:
validate-design

viewport:
1440x900

mode:
design

and the canonical panel/runtime state in this manifest.
