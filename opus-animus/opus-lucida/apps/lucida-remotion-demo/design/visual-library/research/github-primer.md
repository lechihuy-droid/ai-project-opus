# Source Research — GitHub Primer

- History ID: `B001-S02`
- Layer: Style
- Status: `selected-for-research`
- Reviewed: 2026-07-11
- Primary documentation: https://primer.style/
- Implementation reference: https://github.com/primer/react
- Source type: Production design system and React component library
- Primer React license: MIT
- Rights note: GitHub trademarks, brand assets, Octicons, illustrations, and other separately distributed assets require their own rights review.

## Why Lucida selected this source

Primer is useful because it separates shared foundations from product and brand interfaces. It also treats primitives—especially color, spacing, and typography—as reusable system inputs rather than ad hoc CSS values.

This is a strong reference for Lucida's technical, dashboard, code, and information-dense video scenes.

## Concepts selected for Lucida

- semantic design primitives for color, spacing, and typography
- accessibility as a foundation rather than a final audit
- clear separation between product UI and brand/marketing UI
- production-oriented component states
- compact information hierarchy for technical content
- token-driven themes instead of component-local styling
- predictable density and alignment rules

## Lucida target artifacts

This research will inform:

- `visual-library/styles/technical-editorial/`
- `visual-library/styles/dashboard-data/`
- the semantic token naming convention
- component-state metadata
- accessibility and contrast requirements
- technical-layout compatibility rules

## Proposed Lucida token categories

```text
color.canvas.*
color.surface.*
color.foreground.*
color.border.*
color.accent.*
color.success.*
color.warning.*
color.danger.*
space.*
type.family.*
type.size.*
type.weight.*
type.lineHeight.*
radius.*
border.width.*
shadow.*
```

For video packages, Lucida will extend these with:

```text
video.safeArea.*
video.caption.*
video.focusRegion.*
video.dataDensity.*
video.readingTime.*
```

## Lucida adaptation rules

1. Preserve semantic token thinking, but create original Lucida names and values.
2. Treat accessibility constraints as machine-readable metadata.
3. Separate dashboard/product scenes from cinematic/brand scenes.
4. Define maximum data density and text capacity for each aspect ratio.
5. Use original icons unless a selected icon set has a verified compatible license.
6. Do not reproduce GitHub's visual identity or imply official GitHub integration.

## Not selected

- GitHub logos and marks
- GitHub-specific brand colors as Lucida defaults
- Octicons without a separate license/provenance record
- direct copies of GitHub pages or components
- code copied into Lucida without dependency and license review

## Extraction checklist

- [ ] Draft Lucida semantic token naming rules
- [ ] Define technical scene density levels
- [ ] Define data-card and code-card component roles
- [ ] Add contrast and minimum-size requirements
- [ ] Create a 16:9 `technical-editorial` preview
- [ ] Create a 9:16 adaptation test
- [ ] Verify icon-source licensing before adding any icon assets

## Current decision

Use Primer as a **systems-engineering reference** for technical and data-rich visual styles. Lucida packages must remain visually original and brand-neutral.
