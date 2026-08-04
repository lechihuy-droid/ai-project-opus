# Editorial Collage Provenance

## Scope

This package implements `editorial-collage` for Wave 3 asset-led production work. Owned source paths are:

- `src/styles/families/editorial-collage/`
- `design/visual-library/styles/editorial-collage/`
- `pipeline/fixtures/styles/editorial-collage/`

## Internal References

- `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- `design/schemas/visual-package.schema.json`
- `src/styles/core/index.ts`
- `src/styles/families/paper-notebook/render-review.mjs`
- `src/styles/families/paper-notebook/PaperNotebookScene.tsx`

## Source Policy

All media-like review assets are original local SVG data URIs authored inside the fixture files. The package contains no proprietary imagery, third-party screenshots, logos, copied brand identity, font binaries, or external raster files.

The renderer accepts only assets with `classification: "embed_asset"`. Any `style_reference`, `context_only`, or missing `src` asset renders through the shared missing-asset placeholder with a reason string.

## Validation Intent

The five local proposed variants and fixtures cover:

- `normal` / `montage`: balanced multi-source culture montage.
- `dense` / `evidence`: higher caption density with reduced motion.
- `edge` / `recap`: rejected context-only asset and missing embeddable source.
- `archive-ledger` / `evidence`: document-led local evidence with explicit source-role captions.
- `signal-thread` / `recap`: broadcast, field-note, and route signals joined by a fixed recap thread.

`variants.json` records these as local fixture-bound proposals only. It does not add approved source evidence, visual patterns, registry entries, or Director routing.

Review artifacts are declared in `design/visual-library/styles/editorial-collage/artifact-manifest.json`.
