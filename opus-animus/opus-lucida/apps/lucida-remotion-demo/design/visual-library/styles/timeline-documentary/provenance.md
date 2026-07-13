# Timeline Documentary Provenance

## Status

- Package ID: `timeline-documentary`
- Status: `experimental`
- Promotion wave: `wave-2`
- Registered third-party media: `none`
- Registered video binary: `none`

## Ownership

This implementation writes only inside the three ownership roots for the family: `src/styles/families/timeline-documentary/`, `design/visual-library/styles/timeline-documentary/`, and `pipeline/fixtures/styles/timeline-documentary/`. Shared registries, schemas, scripts, app roots, and other families remain untouched.

## Internal Sources Used

- `design/planning/ALL_STYLE_IMPLEMENTATION_PLAN.md`
- `design/schemas/visual-package.schema.json`
- `src/styles/core/`
- Completed `technical-editorial`, `minimal-education`, `cinematic-type`, and `dashboard-data` packages

## External References Studied

- https://www.loc.gov/pictures/
- https://catalog.archives.gov/
- https://www.remotion.dev/docs/animating-properties

Only general practices were adapted: date-forward cataloging, visible source context, record identifiers, missing-record transparency, and deterministic frame-driven motion. No third-party photograph, logo, font binary, interface, or brand identity was copied.

## Original Renderer

The dated spine, archival paper frames, blueprint/newsprint/contact-sheet abstractions, title hierarchy, event layout, and thesis footer are original Lucida compositions. Fixture fields provide every date, title, detail, era, and source label. Missing imagery is shown explicitly through the shared `MediaFrame` placeholder.

## Fixtures

- `milestone.fixture.ts`: four events, one missing image, full motion
- `era-change.fixture.ts`: seven events, three missing images, reduced motion
- `conclusion.fixture.ts`: three events, two missing images, static motion

## Validation Artifacts

- `artifacts/review-scenes.json`
- `artifacts/render-props.json`
- `artifacts/demo-video-map.json`
- `artifacts/render-report.json`
- `artifacts/frames/scene-01.png` through `scene-03.png`

## Limitations

- Shared registry and app-root availability are outside this ownership slice.
- 16:9 is metadata-ready but not rendered in this review pass.
- Review images are archival abstractions, not historical photographic evidence.
