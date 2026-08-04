# Paper Notebook Provenance

## Status

- Package ID: `paper-notebook`
- Status: `experimental`
- Promotion wave: `wave-2`
- Registered third-party media: `none`
- Registered raster dependency: `none`
- Registered video binary: `none`

## Ownership

This implementation writes only inside:

- `src/styles/families/paper-notebook/`
- `design/visual-library/styles/paper-notebook/`
- `pipeline/fixtures/styles/paper-notebook/`

Shared core, registry, schemas, scripts, package files, indexes, and unrelated families remain untouched.

## Internal Sources Used

- Plan and family contract: `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- Production package schema: `design/schemas/visual-package.schema.json`
- Shared layout, typography, motion, and primitive APIs: `src/styles/core/`
- Completed package structure: `design/visual-library/styles/dashboard-data/`
- Completed standalone review renderer pattern: `src/styles/families/dashboard-data/`

## Original Renderer Sources

- Family types: `src/styles/families/paper-notebook/types.ts`
- Family tokens: `src/styles/families/paper-notebook/tokens.ts`
- Family renderer: `src/styles/families/paper-notebook/PaperNotebookScene.tsx`
- Preview wrapper: `src/styles/families/paper-notebook/PaperNotebookPreview.tsx`
- Remotion root: `src/styles/families/paper-notebook/render-root.tsx`
- Remotion entry: `src/styles/families/paper-notebook/render-entry.tsx`
- Review renderer: `src/styles/families/paper-notebook/render-review.mjs`

The renderer creates paper grain, ruled lines, a margin rail, binding holes, circles, underlines, checks, and annotations from CSS and DOM elements. It performs no network request and has no raster image input.

## Fixtures

- `pipeline/fixtures/styles/paper-notebook/research-notes.fixture.ts` - research note hierarchy
- `pipeline/fixtures/styles/paper-notebook/derivation.fixture.ts` - dense equation sequence with reduced motion
- `pipeline/fixtures/styles/paper-notebook/annotated-paper.fixture.ts` - bounded correction annotations with reduced motion
- `pipeline/fixtures/styles/paper-notebook/checklist.fixture.ts` - edge review state with static motion and one open gate
- `pipeline/fixtures/styles/paper-notebook/lab-log.fixture.ts` - sparse lab run record with ordered observations

All displayed copy, equation terms, checklist states, labels, and annotations come from these typed fixtures.

## Local Variant Records

`variants.json` contains five local, fixture-bound records: `research-notes`, `derivation`, `annotated-paper`, `checklist`, and `lab-log`. Each remains `proposed`, cites one package-declared source, and does not assert approval, promotion, or an approved visual pattern.

## Source References

- `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- `design/schemas/visual-package.schema.json`
- `src/styles/core/index.ts`
- https://www.remotion.dev/docs/animating-properties

Only general implementation concepts were used: portrait safe areas, deterministic frame-driven motion, typed content fitting, and still review. No external notebook design, brand identity, logo, screenshot, texture, font binary, or media asset was copied.

## Selected Concepts

- Continuous paper field rather than card-based layout.
- Dark navy primary ink, graphite support copy, blue structure, and sparse red correction marks.
- A fixed annotation rail that keeps the main reasoning column readable.
- Static and reduced-motion modes that preserve the full information hierarchy.

## Validation Artifacts

- Review scene record: `design/visual-library/styles/paper-notebook/artifacts/review-scenes.json`
- Render props: `design/visual-library/styles/paper-notebook/artifacts/render-props.json`
- Render report: `design/visual-library/styles/paper-notebook/artifacts/render-report.json`
- Preview frames: `design/visual-library/styles/paper-notebook/artifacts/frames/`

## Limitations

- The shared registry and app root are outside this ownership slice, so package discovery is a later integration task.
- `16:9` is declared for future QA, but this implementation pass renders only `1080x1920` review frames.
- `stable` status requires human visual approval after the rendered review.
