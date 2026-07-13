# Minimal Education Provenance

## Status

- Package ID: `minimal-education`
- Status: `experimental`
- Layer: Style family renderer plus production package metadata
- Registered video binary: none
- Registered third-party media: none

## Owned Scope

This wave adds only files inside:

- `src/styles/families/minimal-education/`
- `design/visual-library/styles/minimal-education/`
- `pipeline/fixtures/styles/minimal-education/`

Shared registry, root compositions, shared schemas, and other existing files were intentionally left untouched.

## Internal Sources Used

- Plan: `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- Shared primitives: `src/styles/core/index.ts`
- Shared layout utilities: `src/styles/core/layout.ts`
- Shared motion utilities: `src/styles/core/motion.ts`
- Shared typography fitting: `src/styles/core/typography.ts`
- Valid package reference: `pipeline/fixtures/styles/package-valid/technical-editorial/style-package.json`

## Renderer Sources

- Family types: `src/styles/families/minimal-education/types.ts`
- Family tokens: `src/styles/families/minimal-education/tokens.ts`
- Family renderer: `src/styles/families/minimal-education/renderer.tsx`
- Remotion root: `src/styles/families/minimal-education/render-root.tsx`
- Remotion entry: `src/styles/families/minimal-education/render-entry.tsx`
- Review renderer script: `src/styles/families/minimal-education/render-review.mjs`

## Fixtures

- `pipeline/fixtures/styles/minimal-education/definition-scene.json`
- `pipeline/fixtures/styles/minimal-education/steps-scene.json`
- `pipeline/fixtures/styles/minimal-education/comparison-dense-scene.json`

The comparison fixture is the dense edge case for Wave 1.

## External References Studied

- Nielsen Norman Group, visual hierarchy in UX
- Nielsen Norman Group, aesthetic and minimalist design
- Material Design 3 color roles

Only general principles were carried over: whitespace hierarchy, low-noise structure, and semantic color roles. No brand identity, screenshots, logos, or copied source assets were registered.

## Selected Concepts

- One dominant teaching headline with generous breathing room.
- Small semantic accent marks instead of decorative card stacking.
- Calm process rails for steps and aligned rows for dense comparisons.
- Reduced-motion behavior that keeps structure intact while lowering travel distance.

## Validation Artifacts

- Demo scene map: `design/visual-library/styles/minimal-education/artifacts/demo-video-map.json`
- Render props: `design/visual-library/styles/minimal-education/artifacts/render-props.json`
- Preview frames: `design/visual-library/styles/minimal-education/artifacts/frames/`
- Render report: `design/visual-library/styles/minimal-education/artifacts/render-report.json`
- Source review report: `design/visual-library/styles/minimal-education/artifacts/source-review-report.json`

## Copy Status

Principles-only. The package uses original Lucida copy, original layout decisions, and shared project primitives. No third-party screenshot, logo, font binary, or branded visual system is part of the package.
