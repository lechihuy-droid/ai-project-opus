# Technical Editorial Provenance

## Status

- Package ID: `technical-editorial`
- Status: `experimental`
- Promotion wave: `wave-1`
- Registered third-party media: `none`
- Registered video binary: `none`

## Ownership

This implementation only writes inside:

- `src/styles/families/technical-editorial/`
- `design/visual-library/styles/technical-editorial/`
- `pipeline/fixtures/styles/technical-editorial/`

Shared registry, schemas, scripts, and existing integration files were intentionally left untouched.

## Local Sources Used

- Implementation plan: `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- Package contract: `design/schemas/visual-package.schema.json`
- Shared primitives: `src/styles/core/index.ts`
- Family renderer: `src/styles/families/technical-editorial/TechnicalEditorialScene.tsx`
- Dedicated Remotion entry: `src/styles/families/technical-editorial/renderRoot.tsx`
- Deterministic fixtures: `pipeline/fixtures/styles/technical-editorial/`

## References Studied

- `design/visual-library/research/github-primer.md`
- `design/visual-library/research/awesome-design-md.md`
- `design/knowledge/DESIGN_LAYER.md`

## Selected Concepts

- Semantic technical hierarchy with explicit surfaces instead of decorative illustration.
- Strict rule-based grid that makes mechanism, evidence, and caveats readable in portrait format.
- Original annotation rails, diagram nodes, and code/data callouts built from Lucida core primitives.
- Reduced-motion and static fallbacks that preserve the same structure for QA review.

## Exclusions

- No copied GitHub, Primer, or other third-party brand identity.
- No external raster media, screenshots, logos, icon packs, or bundled font binaries.
- No shared-registry integration changes beyond this ownership slice.

## Validation Artifacts

- Review scene manifest: `design/visual-library/styles/technical-editorial/artifacts/review-scenes.json`
- Render props: `design/visual-library/styles/technical-editorial/artifacts/render-props.json`
- Render report: `design/visual-library/styles/technical-editorial/artifacts/render-report.json`
- Preview frames: `design/visual-library/styles/technical-editorial/artifacts/frames/`

## Notes

The family is fully renderable through its dedicated local Remotion root, but shared runtime availability remains pending because `src/styles/registry.ts` is outside the ownership boundary for this task.
