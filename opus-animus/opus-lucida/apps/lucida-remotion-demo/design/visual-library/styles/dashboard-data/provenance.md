# Dashboard Data Provenance

## Status

- Package ID: `dashboard-data`
- Status: `experimental`
- Promotion wave: `wave-2`
- Registered third-party media: `none`
- Registered video binary: `none`

## Ownership

This implementation writes only inside:

- `src/styles/families/dashboard-data/`
- `design/visual-library/styles/dashboard-data/`
- `pipeline/fixtures/styles/dashboard-data/`

Shared registry files, scripts, schemas, and broader runtime integration remain untouched by design.

## Internal Sources Used

- Plan: `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- Package contract: `design/schemas/visual-package.schema.json`
- Shared primitives: `src/styles/core/index.ts`
- Technical reference package: `design/visual-library/styles/technical-editorial/`
- Technical reference renderer: `src/styles/families/technical-editorial/TechnicalEditorialScene.tsx`
- Shared-style fixture reference: `pipeline/fixtures/styles/core/shared-style-core.fixture.tsx`

## Renderer Sources

- Family types: `src/styles/families/dashboard-data/types.ts`
- Family tokens: `src/styles/families/dashboard-data/tokens.ts`
- Family renderer: `src/styles/families/dashboard-data/DashboardDataScene.tsx`
- Preview wrapper: `src/styles/families/dashboard-data/DashboardDataPreview.tsx`
- Remotion root: `src/styles/families/dashboard-data/render-root.tsx`
- Remotion entry: `src/styles/families/dashboard-data/render-entry.tsx`
- Review renderer script: `src/styles/families/dashboard-data/render-review.mjs`

## Fixtures

- `pipeline/fixtures/styles/dashboard-data/normal.fixture.ts`
- `pipeline/fixtures/styles/dashboard-data/dense.fixture.ts`
- `pipeline/fixtures/styles/dashboard-data/edge.fixture.ts`

These fixtures provide all displayed values, labels, state messages, trend points, and operations rows used by the renderer.

## External References Studied

- `design/visual-library/research/github-primer.md`
- https://primer.style/
- https://github.com/primer/react
- https://www.remotion.dev/docs/animating-properties

Only general system concepts were adapted: semantic status color roles, compact operational hierarchy, deterministic frame-driven motion, and accessibility-minded spacing. No GitHub or third-party brand identity was copied.

## Selected Concepts

- Quiet operational UI with one sibling panel per responsibility.
- Semantic status colors for success, warning, danger, and neutral monitoring states.
- Data-first layout where KPI, chart, and operations surfaces stay explicit even under dense content.
- Explicit loading, empty, and error handling that preserves structure without phantom data.

## Exclusions

- No third-party screenshots, logos, icon packs, or bundled font binaries.
- No nested cards inside panel surfaces.
- No derived metrics beyond the values supplied in fixtures.
- No shared registry or root integration changes outside the owned path slice.

## Validation Artifacts

- Review scene manifest: `design/visual-library/styles/dashboard-data/artifacts/review-scenes.json`
- Render props: `design/visual-library/styles/dashboard-data/artifacts/render-props.json`
- Render report: `design/visual-library/styles/dashboard-data/artifacts/render-report.json`
- Preview frames: `design/visual-library/styles/dashboard-data/artifacts/frames/`

## Notes

The package is intentionally self-contained. It can be validated and rendered through its local entry point, but broader runtime availability remains a separate integration step outside this ownership boundary.
