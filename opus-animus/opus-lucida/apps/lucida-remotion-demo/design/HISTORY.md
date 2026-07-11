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

## 2026-07-11 — Batch B002

Reference Ingestion Pipeline design and initial source selection.

| ID | Layer | Source | Status | Selected concepts | Target Lucida artifact | License / rights note |
|---|---|---|---|---|---|---|
| B002-R01 | Style + Motion | User-defined reference-video workflow | spec-drafted | Source registration, private raw-media storage, shot sampling, observed/inferred separation, taxonomy normalization, rights gate, Remotion validation, human review | `REFERENCE_INGESTION.md` and `reference-lab/` architecture | Workflow is original Lucida documentation. Third-party reference media remains subject to source rights. |
| B002-T01 | Motion analysis | [PySceneDetect](https://www.scenedetect.com/docs/latest/) | selected-for-research | Shot-boundary detection, scene lists, keyframe export, video splitting | Default MVP segmentation worker | License must be verified before vendoring. Analysis output does not grant redistribution rights for input media. |
| B002-T02 | Media processing | [FFmpeg](https://ffmpeg.org/) | selected-for-research | Media probing, normalization, sampling, contact sheets, scaling, trimming, frame-rate conversion | Media normalization and evidence extraction worker | Deployment build, codec, LGPL/GPL configuration, and redistribution obligations require implementation review. |
| B002-T03 | Motion analysis | [OpenCV optical flow](https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html) | selected-for-research | Sparse and dense optical flow, apparent displacement measurement, feature tracking | Supporting evidence for Motion Observer | Preserve applicable license notices. Optical flow is measurement only, not semantic interpretation. |
| B002-T04 | Motion analysis | [TransNetV2](https://github.com/soCzech/TransNetV2) | selected-for-research | Learned shot-transition detection, difficult cuts, gradual transitions | Optional fallback after PySceneDetect | Repository is MIT. Model weights and runtime dependencies require separate verification. |
| B002-P01 | Motion research | [Motion Vectorization and Transformation](https://arxiv.org/abs/2309.14642) | selected-for-research | Object-level decomposition of motion graphics into editable SVG motion programs | Future vector-motion decomposition research | Paper selected as a conceptual source only; no paper assets, dataset, or code copied. |
| B002-P02 | Motion research | [AniMINT](https://arxiv.org/abs/2604.26148) | selected-for-research | Separation of primitive motion, animation purpose, and animation meaning; evaluation design for VLM motion understanding | Future Motion Observer taxonomy and benchmark | Dataset/code release and license must be verified before use. Paper publication is not redistribution permission. |
| B002-L01 | Style + Motion reference | [Mobbin](https://mobbin.com/) and [Page Flows](https://pageflows.com/) | selected-for-research | Real product UI flows, micro-interactions, transition sequencing, screen-state changes | Human-led UI reference intake adapter | Reference-only. Follow account terms; do not scrape or commit copied media by default. |
| B002-L02 | Style + Motion reference | [Art of the Title](https://www.artofthetitle.com/), [ShotDeck](https://shotdeck.com/), and [FilmGrab](https://film-grab.com/) | selected-for-research | Cinematic typography, composition, lighting, framing, title-sequence motifs | Human-led cinematic reference intake adapter | Reference-only. Store links and private evidence metadata unless explicit permission allows media retention or redistribution. |

### Batch B002 decision

- Added `design/REFERENCE_INGESTION.md` as the canonical workflow.
- Added `design/reference-lab/AVAILABLE_SOURCES.md` with implementation tools, research leads, and reference libraries.
- Added `design/reference-lab/.gitignore` to block raw video, audio, full-resolution frames, optical-flow maps, embeddings, and caches from normal Git commits.
- Selected PySceneDetect, FFmpeg, and OpenCV for the MVP stack; TransNetV2 is an optional fallback.
- Selected Motion Vectorization and AniMINT as research leads, not production dependencies.
- Mobbin, Page Flows, Art of the Title, ShotDeck, and FilmGrab are reference-only sources unless their exact terms permit further use.
- No third-party reference video, screenshot collection, premium asset, model dataset, or commercial font was imported in this batch.

## 2026-07-11 — Batch B003

Create Flow architecture refinement.

| ID | Layer | Source | Status | Selected concepts | Target Lucida artifact | License / rights note |
|---|---|---|---|---|---|---|
| B003-C01 | Create orchestration | System architecture review and user-approved refinement | spec-drafted | User Brief, Creative Brief, Narrative Plan, Scene Plan, Style/Motion retrieval, Asset Plan, unified VideoSpec, static and motion validation, incremental rendering, quality evaluation, revision loop | `CREATE_FLOW_v1.01.md` | Original Lucida architecture documentation. No third-party code or assets copied. |

### Batch B003 decision

- Added `design/CREATE_FLOW_v1.01.md` as the canonical create-flow specification for version `1.01`.
- Refined the former Script -> Scene -> Style -> Render sequence into staged creative planning, resource resolution, validation, incremental rendering, and publish gates.
- `VideoSpec` is the source of truth; `StyleSpec` becomes a contained sub-document.
- The renderer accepts structured specifications and registered packages, not uncontrolled style prompts.
- Static preview validation must pass before motion preview validation.
- Scene dependency hashing enables partial rerender and cache reuse.

## 2026-07-11 — Batch B004

Create Flow v1.02 gate-contract refinement.

| ID | Layer | Source | Status | Selected concepts | Target Lucida artifact | License / rights note |
|---|---|---|---|---|---|---|
| B004-C01 | Create orchestration | User-directed workflow refinement with AI architecture and BPR review | spec-drafted | Artifact-centric gate contracts, scoped GPT tasks, Codex implementation boundary, deterministic verification, human approvals, retry/cache/SLA policies, localized invalidation, issue routing | `CREATE_FLOW_v1.02.md` | Original Lucida architecture documentation. No third-party code or assets copied. |

### Batch B004 decision

- Added `design/CREATE_FLOW_v1.02.md` with eleven explicit gates from project intake through publication.
- Business/need discovery remains outside the Create Workflow; this flow starts from approved topic, script, and project configuration.
- Each gate now defines owner, inputs, context, worker, GPT/Codex participation, transform, output, entry and exit criteria, validation, retry, cache, human review, failure routing, and metrics.
- GPT is restricted to creative and semantic reasoning gates and must return schema-bound artifacts.
- Codex is restricted primarily to component/adapter implementation and engineering repair, with repository scope and automated validation.
- `VideoSpec` remains the immutable execution contract; GPT and Codex cannot mutate it outside their controlled gates.
- Human approvals are defined after Story Planning, Creative Resolution, Preview Critique, and Publication by default.
