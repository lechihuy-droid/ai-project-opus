# Lucida Design Source History

This file records where every selected visual style, motion pattern, and derived Lucida package came from.

It is an audit log, not a general bookmark list. `RESOURCES.md` lists candidates; this file records sources that were actually selected for research or conversion.

## Recording rules

For every selection or derived package, record:

- date and batch ID
- layer: `style` or `motion`
- original source and reviewed URL
- source version, commit, or review date when available
- concepts selected
- Lucida target artifact
- license and trademark status
- whether code/assets were copied, adapted, or only studied
- reviewer and current status

Allowed statuses:

- `selected-for-research`
- `spec-drafted`
- `prototype-created`
- `validated`
- `rejected`
- `deprecated`

## 2026-07-11 — Batch B001

Initial source selection for the Lucida Style and Motion layers.

| ID | Layer | Source | Status | Selected concepts | Target Lucida artifact | License / rights note |
|---|---|---|---|---|---|---|
| B001-S01 | Style | [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) | selected-for-research | Agent-readable style documentation, semantic palette roles, typography hierarchy, component rules, layout grammar, do/don't guardrails | Visual package contract; future `technical-editorial`, `minimal-education`, and `cinematic-type` packages | Repository is MIT; third-party brand identities and trademarks remain separate. No branded assets selected. |
| B001-S02 | Style | [GitHub Primer](https://primer.style/) and [Primer React](https://github.com/primer/react) | selected-for-research | Semantic primitives, color/spacing/typography tokens, accessibility-first component structure, product UI density | `technical-editorial` and `dashboard-data` research base | Primer React is MIT; GitHub marks, brand assets, and individual asset licenses remain separate. |
| B001-M01 | Motion | [Remotion animation documentation](https://www.remotion.dev/docs/animating-properties) | selected-for-research | Frame-driven animation, `useCurrentFrame()`, interpolation, spring simulation, render determinism | Motion package contract; `fade-rise`, `diagram-build`, and deterministic render rules | Remotion licensing and commercial eligibility must be checked against current official terms before deployment. No premium code/assets copied. |
| B001-M02 | Motion | [Motion for React](https://motion.dev/docs/react) and [motion repository](https://github.com/motiondivision/motion) | selected-for-research | Declarative transition vocabulary, spring/tween parameterization, entrance patterns, layout motion, reduced-motion concepts | `shared-axis-x`, `stagger-list`, and `kinetic-type-impact` research base | Core Motion repository is MIT. Lucida will adapt concepts into frame-driven Remotion implementations rather than copy browser-timed behavior. |

### Batch B001 decision

- No third-party logo, screenshot, font binary, illustration, or proprietary media was imported.
- The selected sources are being used to derive original Lucida schemas and presets.
- Each source has a dedicated research note under `visual-library/research/` or `motion-library/research/`.
- Production package status remains blocked until provenance, deterministic render tests, accessibility checks, and license review are complete.
