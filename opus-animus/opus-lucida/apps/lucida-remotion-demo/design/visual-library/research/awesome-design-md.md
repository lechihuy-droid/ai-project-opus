# Source Research — Awesome DESIGN.md

- History ID: `B001-S01`
- Layer: Style
- Status: `selected-for-research`
- Reviewed: 2026-07-11
- Source: https://github.com/VoltAgent/awesome-design-md
- Source type: Curated repository of agent-readable `DESIGN.md` analyses
- Repository license: MIT
- Rights note: The repository license does not grant ownership of the visual identities, trademarks, logos, proprietary fonts, or brand assets represented by the analyzed websites.

## Why Lucida selected this source

The repository demonstrates a practical plain-Markdown format that coding agents can read without a dedicated parser. Its documents organize visual systems into explicit rules rather than vague prompts.

The useful structural categories are:

1. visual theme and atmosphere
2. semantic color palette and roles
3. typography hierarchy
4. component styling and states
5. layout, grid, spacing, and whitespace
6. depth, elevation, and surface hierarchy
7. do/don't guardrails
8. responsive behavior
9. agent-facing prompt guidance

## Concepts selected for Lucida

Lucida will adopt the **documentation shape**, not the branded values.

Selected concepts:

- one style package should be readable by both humans and agents
- tokens should include semantic roles, not only raw values
- style packages need positive rules and explicit anti-patterns
- layout grammar and content capacity must be documented
- every style needs a compact agent summary
- previews should accompany the written specification

## Lucida target artifacts

This research will inform:

- `schemas/visual-style.schema.json`
- the package-level `README.md` contract
- `tokens.json`
- `component-map.json`
- package-specific `provenance.md`
- initial style families:
  - `technical-editorial`
  - `minimal-education`
  - `cinematic-type`

## Lucida adaptation rules

1. Replace brand-specific names with neutral Lucida role names.
2. Derive an original palette rather than copying public CSS values as a finished identity.
3. Use open or properly licensed fonts; never bundle proprietary brand fonts.
4. Replace copied component appearances with original component grammar.
5. Record every source consulted by a generated style package.
6. Require previews in all supported aspect ratios.
7. Add video-specific fields absent from web design systems:
   - safe title area
   - text-on-screen duration
   - scene density
   - transition compatibility
   - motion intensity range
   - 16:9, 9:16, and 1:1 composition behavior

## Not selected

- third-party logos
- screenshots
- proprietary fonts
- exact brand palettes as production defaults
- wording that implies official affiliation
- direct cloning of a named company's identity

## Extraction checklist

- [ ] Define the neutral Visual Style schema
- [ ] Create one original style package from the schema
- [ ] Add text-capacity limits
- [ ] Add aspect-ratio variants
- [ ] Add preview requirements
- [ ] Add provenance template
- [ ] Validate that no protected asset is included

## Current decision

Use this source as a **format and taxonomy reference**. Do not import its brand-specific `DESIGN.md` files into the Lucida production library unchanged.
