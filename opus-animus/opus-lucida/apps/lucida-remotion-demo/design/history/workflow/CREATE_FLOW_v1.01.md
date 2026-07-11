# Lucida Create Flow v1.01

## 1. Purpose

This document defines the refined video creation workflow for Lucida. It covers the path from an initial user brief to a validated, rendered, and publishable React/Remotion video.

Version `v1.01` introduces three planning layers, explicit asset resolution, a unified `VideoSpec`, two preview-validation stages, incremental rendering, and structured quality evaluation.

## 2. Core design principles

1. Separate creative direction from scene implementation.
2. Plan sections before individual scenes.
3. Retrieve Style and Motion from controlled registries instead of inventing them during rendering.
4. Resolve assets before scene implementation.
5. Treat `VideoSpec` as the source of truth.
6. Validate static composition before motion.
7. Render incrementally and cache by scene dependency hash.
8. Use deterministic checks before AI critique.
9. Keep human approval available at creative and release gates.
10. The renderer must not receive an uncontrolled free-form style prompt.

## 3. End-to-end flow

```text
User Brief
  -> Creative Brief
  -> Narrative Plan
  -> Scene Plan
  -> Style and Motion Retrieval
  -> Asset Plan
  -> VideoSpec Compilation
  -> Scene Implementation
  -> Static Preview Validation
  -> Motion Preview Validation
  -> Approval
  -> Incremental Final Render
  -> Quality Evaluation
  -> Revision or Publish
```

## 4. Stage 1 — User Brief

The creation flow should accept more than a script.

```json
{
  "script": "...",
  "goal": "explain",
  "audience": "AI engineers",
  "platform": "youtube",
  "aspectRatio": "16:9",
  "targetDurationSeconds": 90,
  "brand": "lucida",
  "language": "vi",
  "creativeIntensity": 0.65,
  "motionIntensity": 0.5,
  "accessibility": {
    "reducedMotionSafe": true,
    "minimumContrast": "AA"
  }
}
```

### 4.1 Creative intensity

- `0.0–0.3`: conservative, highly consistent, minimal style changes
- `0.4–0.6`: controlled variation between narrative sections
- `0.7–1.0`: cinematic and experimental, still bounded by brand and continuity rules

## 5. Stage 2 — Creative Brief

The Brief Agent converts user intent into one global creative direction.

```json
{
  "coreMessage": "AI agents need a harness, not only a model.",
  "tone": ["technical", "confident", "modern"],
  "visualThesis": "Dark technical editorial with selective cinematic moments",
  "dominantStyle": "technical-editorial",
  "supportingStyles": ["cinematic-type", "dashboard-data"],
  "motionArc": "fast hook, controlled explanation, energetic reveal, calm close",
  "noveltyBudget": 0.35
}
```

The Creative Brief prevents individually valid scenes from becoming an incoherent video.

## 6. Stage 3 — Narrative Plan

The Narrative Director divides the script into semantic sections before creating renderable scenes.

Typical sections:

- hook
- context
- problem
- explanation
- evidence
- comparison
- demonstration
- reveal
- conclusion
- call to action

Example:

```json
{
  "sectionId": "problem",
  "purpose": "create tension",
  "durationSeconds": 12,
  "energy": 0.7,
  "dominantVisual": "cinematic-type",
  "contentBeats": [
    "Models are powerful",
    "Production systems still fail"
  ]
}
```

Style changes should normally occur at section boundaries, not arbitrarily per scene.

## 7. Stage 4 — Scene Plan

The Scene Planner converts narrative sections into renderable units.

```json
{
  "sceneId": "scene-005",
  "sectionId": "explanation",
  "intent": "explain",
  "voiceover": "A harness controls tools, memory, and execution.",
  "durationFrames": 150,
  "contentType": "diagram",
  "requiredElements": [
    "agent node",
    "tool nodes",
    "memory node",
    "execution arrows"
  ],
  "informationPriority": ["agent", "harness", "tools"],
  "readingComplexity": "medium"
}
```

The Scene Planner determines content and structure. It does not choose CSS details or write animation code.

## 8. Stage 5 — Style and Motion Retrieval

Retrieval follows this sequence:

```text
Hard filters
  -> metadata and lexical retrieval
  -> vector retrieval
  -> compatibility scoring
  -> continuity optimization
  -> final selection
```

### 8.1 Hard filters

Reject candidates that fail any required condition:

- unsupported aspect ratio
- incompatible brand
- insufficient content capacity
- invalid or restricted license
- unsupported renderer feature
- missing reduced-motion fallback
- unavailable required asset
- excessive render cost
- incompatible neighboring transition

### 8.2 Candidate scoring

```text
score =
  0.25 * semantic_fit
+ 0.18 * content_fit
+ 0.14 * brand_compatibility
+ 0.14 * continuity
+ 0.10 * asset_availability
+ 0.07 * rendering_cost
+ 0.07 * novelty_budget
+ 0.05 * evidence_strength
```

- `novelty_budget` controls variation without allowing uncontrolled style drift.
- `evidence_strength` rewards Style and Motion packages supported by reviewed references and successful render tests.

## 9. Stage 6 — Asset Plan

The Asset Director resolves the visual material required by each scene.

```json
{
  "sceneId": "scene-005",
  "assets": [
    {
      "role": "agent-icon",
      "query": "abstract AI agent node",
      "source": "asset-library",
      "assetId": "icon-agent-03"
    },
    {
      "role": "background-texture",
      "source": "procedural",
      "generator": "tech-grid-background-v2"
    }
  ]
}
```

Resolution order:

1. existing Asset Registry item
2. reusable Lucida component
3. procedural SVG, Canvas, or CSS asset
4. generated image or illustration
5. externally licensed asset

Every external asset must include provenance, license, and permitted-use metadata.

## 10. Stage 7 — VideoSpec Compilation

`VideoSpec` is the canonical contract for the create flow.

```text
VideoSpec
├── userBrief
├── creativeBrief
├── narrativePlan
├── scenePlan
├── stylePlan
├── motionPlan
├── assetPlan
├── audioPlan
├── captionPlan
├── renderConfig
└── versionMetadata
```

Example shape:

```json
{
  "version": "1.01",
  "creative": {},
  "narrative": {},
  "scenes": [],
  "style": {},
  "motion": {},
  "assets": {},
  "audio": {},
  "captions": {},
  "render": {},
  "versions": {
    "schema": "1.01",
    "taxonomy": "1.0.0",
    "renderer": "lucida-remotion-demo",
    "promptSet": "create-flow-1.01"
  }
}
```

`StyleSpec` remains a sub-document inside `VideoSpec`.

## 11. Stage 8 — Scene Implementation

The renderer receives structured inputs only:

```text
SceneSpec
+ Style Package
+ Motion Preset
+ Asset Bindings
+ Brand Tokens
```

Example:

```tsx
<DiagramScene
  content={scene.content}
  visual={resolvedVisual}
  motion={resolvedMotion}
  assets={resolvedAssets}
/>
```

Recommended component boundaries:

- scene template
- content component
- layout primitive
- motion wrapper
- transition component
- asset renderer

Do not create an entirely new React architecture for every scene.

## 12. Stage 9 — Static Preview Validation

Render one or more representative still frames before motion rendering.

Validate:

- visual hierarchy
- text overflow
- contrast
- safe areas
- line wrapping
- asset crop
- content density
- aspect-ratio adaptation
- brand consistency
- section-to-section visual continuity

A scene that fails static validation must not advance to full motion preview.

## 13. Stage 10 — Motion Preview Validation

Render low-cost proxies for selected scenes or sections.

Recommended proxy settings:

- 720p
- 15, 24, or target FPS depending on test purpose
- draft audio
- only changed sections and transition handles

Validate:

- pacing
- voiceover synchronization
- entrance and exit timing
- transition compatibility
- simultaneous-motion conflicts
- minimum reading duration
- excessive motion
- reduced-motion fallback
- deterministic rendering

## 14. Stage 11 — Approval gate

Approval may be automatic or human depending on risk.

Require human review when:

- a new Style family is introduced
- a new Motion preset is introduced
- external licensed assets are used
- creative intensity exceeds the configured threshold
- AI critique reports a high-severity coherence issue
- a brand or legal constraint is uncertain

## 15. Stage 12 — Incremental rendering

Each scene receives a dependency hash:

```text
sceneHash = hash(
  sceneSpec
  + styleVersion
  + motionVersion
  + assetVersions
  + brandVersion
  + rendererVersion
)
```

If the hash has not changed, reuse the cached render.

When a scene changes:

1. identify affected scenes
2. invalidate their cached artifacts
3. include neighboring transition handles
4. render only affected ranges
5. assemble the final timeline

## 16. Stage 13 — Quality Evaluation

### 16.1 Deterministic checks

- JSON Schema validation
- required assets exist
- frame ranges are valid
- duration is correct
- fonts load successfully
- captions fit safe regions
- render dimensions and FPS match config
- renderer output is deterministic
- no missing dependencies

### 16.2 Heuristic checks

- text remains visible long enough
- content density is below scene capacity
- motion intensity stays within the section budget
- visual-family changes are not too frequent
- transitions do not consume excessive duration
- audio peaks do not clip
- captions do not overlap critical content

### 16.3 AI critique

AI critique runs only after deterministic checks pass.

```json
{
  "coherence": 0.82,
  "visualHierarchy": 0.76,
  "motionClarity": 0.88,
  "brandConsistency": 0.91,
  "issues": [
    {
      "sceneId": "scene-007",
      "type": "visual-density",
      "severity": "medium",
      "recommendation": "Reduce supporting labels and delay the secondary chart reveal."
    }
  ]
}
```

## 17. Revision loop

```text
Quality issue
  -> identify affected specifications
  -> propose minimal revision
  -> update VideoSpec
  -> invalidate dependent artifacts
  -> rerender affected scenes
  -> rerun relevant validation
  -> approve or repeat
```

The system should avoid regenerating unrelated scenes.

## 18. Create-flow state machine

```text
DRAFT
  -> BRIEF_READY
  -> NARRATIVE_PLANNED
  -> SCENES_PLANNED
  -> RESOURCES_RESOLVED
  -> SPEC_VALIDATED
  -> STATIC_PREVIEW_READY
  -> MOTION_PREVIEW_READY
  -> APPROVED
  -> RENDERING
  -> QUALITY_CHECKED
  -> PUBLISHED
```

Blocking and failure states:

```text
BLOCKED_MISSING_ASSET
BLOCKED_INVALID_SPEC
BLOCKED_LICENSE
REQUIRES_CREATIVE_REVIEW
STATIC_VALIDATION_FAILED
MOTION_VALIDATION_FAILED
RENDER_FAILED
QUALITY_FAILED
```

All state transitions must be idempotent, auditable, and retryable.

## 19. Logical agent roles

### Brief Agent

Converts user input into a validated User Brief and Creative Brief.

### Narrative Director

Builds sections, purposes, content beats, duration budgets, and energy curves.

### Scene Planner

Creates renderable SceneSpecs and information-priority rules.

### Style Director

Retrieves and selects Visual and Motion packages under compatibility and continuity constraints.

### Asset Director

Finds, generates, licenses, and binds assets.

### Spec Compiler

Produces and validates `VideoSpec`.

### Render Worker

Maps the specification to React/Remotion compositions and generates previews or final media.

### Quality Agent

Evaluates previews, explains issues, and proposes minimal revisions.

These are logical roles. The MVP may implement them as modules in one orchestration service rather than separate microservices.

## 20. LLM boundary

Use LLMs for:

- creative direction
- narrative decomposition
- semantic scene planning
- Style and Motion reranking
- asset-query formulation
- critique and revision proposals

Do not use LLMs for:

- schema validation
- hard filtering
- hash computation
- asset existence checks
- license policy enforcement
- deterministic animation
- frame arithmetic
- rendering
- cache invalidation

## 21. MVP implementation sequence

### Phase A

- User Brief schema
- Creative Brief schema
- Narrative Plan schema
- Scene Plan schema
- three Visual packages
- five Motion presets

### Phase B

- Style and Motion retrieval
- Asset Plan
- unified `VideoSpec`
- static preview renderer

### Phase C

- motion proxy renderer
- deterministic and heuristic validators
- scene-level caching
- revision loop

### Phase D

- hybrid retrieval with evidence strength
- AI critique
- creative approval UI
- incremental final rendering

## 22. Success criteria

The create flow is successful when:

1. the same validated `VideoSpec` produces the same render
2. every Style, Motion, and Asset decision is traceable
3. a failed scene can be revised without rerendering the whole video
4. Style changes align with narrative boundaries
5. no scene requires uncontrolled manual CSS patching
6. static and motion errors are caught before final rendering
7. the final output passes deterministic, heuristic, and creative quality gates

## 23. Version note

`v1.01` refines the earlier Script -> Scene -> Style -> Render flow into:

```text
Brief
  -> Creative Direction
  -> Narrative Sections
  -> Scene Structure
  -> Style and Motion Retrieval
  -> Asset Resolution
  -> VideoSpec Compilation
  -> Static Validation
  -> Motion Validation
  -> Incremental Render
  -> Quality Evaluation
  -> Publish
```
