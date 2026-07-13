# Product Showcase Provenance

## Scope

Implemented as a Wave 3 asset-led family inside the allowed ownership paths:

- `src/styles/families/product-showcase/`
- `design/visual-library/styles/product-showcase/`
- `pipeline/fixtures/styles/product-showcase/`

## Inputs Read

- `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- `design/schemas/visual-package.schema.json`
- `schemas/video-map.schema.json`
- `src/styles/core/index.ts`
- `src/styles/core/media.tsx`
- `src/styles/families/dashboard-data/`
- `design/visual-library/styles/dashboard-data/`
- `pipeline/fixtures/styles/dashboard-data/`

## Source Policy

The review frames use original SVG data URI mockups authored in fixtures. The renderer does not embed third-party screenshots, logos, copied brand identity, external image files, or font binaries.

Asset binding rules:

- `embed_asset` with `src` is eligible to render.
- `embed_asset` without `src` renders a deliberate placeholder.
- `style_reference` always renders a deliberate placeholder if selected.
- `context_only` always renders a deliberate placeholder if selected.

## Determinism

Crop behavior is driven by fixture metadata:

- `orientation`
- `focalPoint.x`
- `focalPoint.y`

The renderer converts those values to CSS `object-position` and uses Remotion frame-driven still rendering. Review frames are rendered at 1080x1920 and recorded in `design/visual-library/styles/product-showcase/artifacts/render-report.json`.

## Limitations

Registry integration and shared Director routing remain outside this task's ownership scope. Landscape 16:9 support is recorded in metadata but only portrait review frames are rendered for this pass.
