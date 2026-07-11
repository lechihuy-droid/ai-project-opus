# Lucida Design Layer — 14-Day Roadmap

This roadmap builds a usable first version of the Visual Library and Motion Library inside `design/`. The output is intended to support script-driven, multi-style React/Remotion video generation.

## Definition of done

At the end of 14 days, Lucida should be able to:

1. Parse a script into scenes.
2. Assign an intent to every scene.
3. Retrieve compatible Visual and Motion candidates.
4. Produce a valid `StyleSpec v1`.
5. Render one reference video with two or three coordinated visual styles.
6. Explain why each style and motion preset was selected.
7. Pass basic continuity, provenance, accessibility, and deterministic-render checks.

## Scope

### Visual sources

- Awesome Design MD — https://github.com/VoltAgent/awesome-design-md
- Material Design 3 — https://m3.material.io/
- GitHub Primer — https://primer.style/

### Motion sources

- Motion for React — https://motion.dev/docs/react
- Remotion animation documentation — https://www.remotion.dev/docs/animating-properties
- React Spring — https://www.react-spring.dev/docs/getting-started

These are research and modeling sources. The goal is to author original Lucida packages, not clone branded designs.

---

## Week 1 — Foundation and seed library

### Day 1 — Contracts and repository skeleton

Create:

```text
design/
├── schemas/
├── brands/lucida/
├── visual-library/styles/
├── motion-library/presets/
├── directors/
├── prompts/
├── examples/
└── tests/
```

Tasks:

- confirm naming conventions
- define package status values: `draft`, `experimental`, `stable`, `deprecated`
- define semantic versioning rules
- define provenance requirements
- create empty indexes for Visual and Motion libraries

Deliverables:

- directory scaffold
- `visual-library/index.json`
- `motion-library/index.json`
- package templates

Acceptance criteria:

- a new package can be added without changing directory conventions
- every package has an owner, version, status, tags, and provenance path

### Day 2 — StyleSpec v1 schema

Tasks:

- write `schemas/style-spec.schema.json`
- write `schemas/brand-profile.schema.json`
- write `schemas/visual-style.schema.json`
- write `schemas/motion-preset.schema.json`
- add positive and negative fixtures

Required StyleSpec fields:

- video format
- brand profile
- global constraints
- scenes
- scene intent
- visual selection and reason
- motion selection and parameters
- transitions
- accessibility settings

Acceptance criteria:

- invalid style IDs fail validation
- frame ranges cannot overlap unexpectedly
- every scene has a selection reason
- every motion preset has a reduced-motion fallback

### Day 3 — Lucida Brand profile

Tasks:

- define Lucida colors as semantic roles, not only hex values
- define typography roles
- define spacing and grid
- define corner, border, shadow, icon, and texture rules
- define logo and watermark rules
- define contrast and minimum text-size constraints

Deliverables:

- `brands/lucida/brand.json`
- `brands/lucida/DESIGN.md`
- two preview frames: light and dark

Acceptance criteria:

- all future visual styles can inherit the Brand profile
- brand tokens are independent of individual React components

### Day 4 — Source analysis: Visual Library

Analyze the three primary visual sources.

Record for each source:

- token structure
- typography hierarchy
- layout grammar
- component-state model
- accessibility model
- documentation format useful for AI retrieval
- ideas to adopt
- branded elements not to copy

Deliverables:

- one internal research note per source
- a cross-source comparison table
- a proposed neutral Visual package schema

Acceptance criteria:

- each adopted concept points to a source
- no third-party logo, font binary, screenshot, or proprietary asset is added

### Day 5 — First three Visual packages

Implement:

1. `technical-editorial`
2. `minimal-education`
3. `cinematic-type`

Each package includes:

- `README.md`
- `visual.json`
- `tokens.json`
- `component-map.json`
- `provenance.md`
- 16:9 preview
- one sample scene

Acceptance criteria:

- all three inherit Lucida Brand tokens
- each has clear `recommendedIntents` and `avoidFor`
- each declares text-capacity limits

### Day 6 — Source analysis: Motion Library

Analyze the three primary motion sources.

Record:

- timing vocabulary
- easing and spring vocabulary
- orchestration patterns
- frame determinism implications
- parameter ranges
- reduced-motion patterns
- patterns suitable for Remotion
- patterns unsuitable for offline deterministic rendering

Deliverables:

- one internal research note per source
- a normalized motion taxonomy
- the initial parameter naming standard

Acceptance criteria:

- animation is defined by frame and input, not wall-clock time
- unsafe browser-only behavior is identified before implementation

### Day 7 — First five Motion presets

Implement:

1. `fade-rise`
2. `shared-axis-x`
3. `stagger-list`
4. `kinetic-type-impact`
5. `diagram-build`

Each preset includes:

- `README.md`
- `motion.json`
- `preset.ts`
- `example.tsx`
- `provenance.md`
- reduced-motion fallback
- preview render or frame sequence

Acceptance criteria:

- same inputs produce the same frames
- parameters are clamped to documented ranges
- presets do not directly depend on scene-specific copy

---

## Week 2 — Director, integration, and quality

### Day 8 — Scene intent analyzer

Define the first scene intent vocabulary:

- hook
- context
- explain
- compare
- demonstrate
- reveal
- emphasize
- transition
- summarize
- call-to-action

Tasks:

- create `prompts/analyze-script.md`
- define structured analyzer output
- add five script fixtures
- include confidence and evidence spans

Acceptance criteria:

- the analyzer does not assign a style directly
- every intent is grounded in a script segment
- low-confidence scenes are explicitly marked

### Day 9 — Retrieval metadata and indexes

Tasks:

- create searchable indexes for styles and motion presets
- normalize tags
- add content requirements:
  - text density
  - media type
  - data complexity
  - code presence
  - diagram presence
  - emotional intensity
- add rendering-cost estimates

Acceptance criteria:

- a scene query can return ranked candidates without reading every full package
- filters can exclude incompatible aspect ratios and asset requirements

### Day 10 — Style Director v0

Implement a rule-first director.

Inputs:

- scene intent
- content requirements
- Brand profile
- global video constraints
- previous and next scene
- available assets
- render budget

Outputs:

- selected visual style
- selected motion preset
- parameter values
- transition
- selection reason
- rejected alternatives

Acceptance criteria:

- the director selects only registered IDs
- multi-style limits are enforced
- it can explain every decision
- it returns a valid `StyleSpec`

### Day 11 — Continuity optimizer

Implement continuity rules:

- dominant style duration
- maximum style families
- minimum distance between major style changes
- shared tokens across neighboring scenes
- transition compatibility
- outro return-to-brand rule
- motion-intensity curve over the full video

Deliverables:

- `directors/compatibility-matrix.json`
- `directors/selection-rules.json`
- continuity tests

Acceptance criteria:

- visually unrelated styles cannot become neighbors without a bridge transition
- the optimizer can replace a locally optimal choice to improve whole-video coherence

### Day 12 — Remotion adapter

Tasks:

- map `StyleSpec` to React component composition
- map Visual IDs to scene templates
- map Motion IDs to deterministic utilities
- create fallbacks for missing assets
- surface validation errors before rendering

Deliverables:

- one adapter module
- one example composition
- one command or script to validate and render a fixture

Acceptance criteria:

- renderer contains no untracked free-form style prompt
- unsupported IDs fail with actionable errors
- rendering can run without network access after assets are resolved

### Day 13 — Reference video

Create one 45–90 second reference video containing:

- one hook
- one explanation
- one diagram or data scene
- one demonstration or code scene
- one summary/outro
- two or three Visual families
- at least five Motion presets

Review:

- narrative fit
- text legibility
- visual continuity
- motion pacing
- transitions
- brand consistency
- render performance

Acceptance criteria:

- every scene traces back to its StyleSpec entry
- style changes align with narrative boundaries
- no scene requires manual CSS patching after specification generation

### Day 14 — Hardening and release

Tasks:

- fix failures found in the reference video
- add schema and render tests to CI
- write contribution guidelines
- write package review checklist
- mark qualified packages as `experimental`
- create backlog for v0.2

Release target:

- `design-layer-v0.1`

Required release artifacts:

- four JSON schemas
- one Lucida Brand profile
- three Visual packages
- five Motion presets
- one Style Director prompt or implementation
- one compatibility matrix
- one reference StyleSpec
- one rendered reference video
- provenance files for every researched package

---

## Prioritized backlog after Day 14

### Visual packages

1. `dashboard-data`
2. `terminal-demo`
3. `paper-notebook`
4. `product-showcase`
5. `editorial-collage`
6. `timeline-documentary`

### Motion presets

1. `counter-reveal`
2. `camera-push`
3. `luma-wipe-soft`
4. `code-highlight-walkthrough`
5. `chart-series-build`
6. `mask-reveal`
7. `parallax-stack`
8. `reduced-motion-fade`

### Director capabilities

- LLM ranking after deterministic filtering
- user-selectable creative intensity
- style diversity budget
- audience-aware text density
- automatic asset query planning
- automatic critique and revision pass
- preview-board generation before full render

## Recommended working method

For every new style or preset:

1. Add metadata first.
2. Add provenance before implementation.
3. Produce the smallest representative example.
4. Validate against the schema.
5. Render previews.
6. Test edge cases.
7. Review compatibility.
8. Promote status only after evidence is available.

This order keeps the library machine-readable and prevents attractive but unmaintainable one-off effects from becoming core infrastructure.
