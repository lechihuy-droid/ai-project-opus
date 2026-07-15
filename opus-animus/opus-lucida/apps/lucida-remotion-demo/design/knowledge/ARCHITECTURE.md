# Lucida Knowledge Architecture

## 1. Purpose

This document defines the target architecture for Lucida's style, motion, asset, evidence, retrieval, ingestion, and Remotion-rendering platform.

The architecture is designed to support:

- script-driven video generation
- ingestion of reference videos and frame sequences
- structured extraction of visual and motion knowledge
- reusable Style and Motion registries
- multimodal RAG for style selection
- provenance, licensing, auditability, and versioning
- deterministic rendering with React and Remotion

The active local RAG storage decision is [ADR-001](ADR-001-local-rag-storage.md):

> Git canonical packages and schemas -> generated JSON runtime index + SQLite
> FTS5 local query projection. PostgreSQL and pgvector are deferred behind the
> triggers in ADR-001.

The core architectural principle is:

> Lucida should use one unified knowledge platform with multiple logical domains, not multiple isolated physical databases.

---

## 2. Architectural principles

1. **Separate observation from canonical knowledge.**
   Model outputs from reference analysis must first become observations and candidates. They must not enter the production library directly.

2. **Use structured specifications as the source of truth.**
   Prompts may produce suggestions, but production decisions must be represented as validated schemas.

3. **Keep LLMs outside deterministic work.**
   Media probing, frame extraction, hashing, scene detection, optical flow, filtering, license enforcement, schema validation, and rendering should not depend on LLM reasoning.

4. **Use deterministic local retrieval before vector similarity.**
   The active v0.1 path combines hard filters, FTS5/BM25 lexical search, and
   compatibility scoring. Vector retrieval is a future candidate generator,
   never the decision maker.

5. **Preserve evidence lineage.**
   Every Style, Motion preset, Asset, and derived package should be traceable to observations, sources, versions, and review decisions.

6. **Treat rights metadata as ingestion data.**
   License, trademark, retention, redistribution, and allowed-use fields must be recorded when the source enters the system.

7. **Version every transformation.**
   Extractor, model, prompt, schema, taxonomy, renderer, and canonical entity versions must be recorded.

8. **Optimize for a small reliable vocabulary before scale.**
   A few validated styles and motion presets are more valuable than a large noisy library.

---

## 3. System context

```text
Reference Sources                  Script / Brief
video / image / docs                    |
        |                               |
        v                               v
+-------------------+          +-------------------+
| Ingestion Pipeline|          | Script Analyzer   |
| normalize / split |          | intent / content  |
| observe / validate|          | scene requirements|
+---------+---------+          +---------+---------+
          |                              |
          +--------------+---------------+
                         |
                         v
          +--------------------------------------+
          |       Lucida Knowledge Core          |
          |                                      |
          | Style | Motion | Asset | Evidence    |
          | Brand | Scene Intent | Taxonomy      |
          | Prompt Registry | Compatibility      |
          +-------------------+------------------+
                              |
                              v
          +--------------------------------------+
          | Retrieval and Ranking Layer          |
          | hard filters / FTS5 / compatibility  |
          +-------------------+------------------+
                              |
                              v
          +--------------------------------------+
          | Style Director                       |
          | planning / continuity / explanation  |
          +-------------------+------------------+
                              |
                              v
          +--------------------------------------+
          | StyleSpec / SceneSpec                |
          +-------------------+------------------+
                              |
                              v
          +--------------------------------------+
          | React + Remotion Renderer            |
          +--------------------------------------+
```

---

## 4. Physical architecture

### 4.1 Active v0.1 storage stack

```text
+ Git canonical packages + schemas
+ deterministic compiler
+ generated JSON runtime index
+ SQLite FTS5 local query projection
+ local restricted-media storage outside Git
+ Remotion renderer
```

### 4.2 Storage responsibilities

#### Git canonical packages

Store:

- canonical package definitions
- JSON Schemas
- taxonomy definitions
- approved provenance and rights metadata
- compatibility rules
- deterministic motion implementations
- validation fixtures and source history

#### Generated JSON

Store:

- renderer-ready indexes and manifests
- normalized package relationships
- source hashes used to validate the published index

Generated JSON is published only after validation. The renderer reads this
projection and must not open SQLite.

#### SQLite FTS5

Store:

- rebuildable local query tables
- FTS5 search documents
- query-time metadata needed by local tooling

SQLite lives under `.generated/knowledge/`, is local derived data, and can be
removed before a clean rebuild.

#### Restricted media storage

Raw reference media, frames, previews, and render artifacts remain outside
Git. They are not canonical knowledge and enter a projection only through the
approved reference-package flow.

#### Deferred service-backed storage

PostgreSQL, pgvector, object storage services, and distributed queues are not
part of the active v0.1 stack. Their adoption is governed by the future trigger
in ADR-001.

---

## 5. Logical domains

The following domains are logical registries within one knowledge platform. They are not required to be separate physical databases.

### 5.1 Style domain

A Style is a versioned visual system, not just an embedding or tag list.

```text
Style
├── identity
├── semantic tags
├── visual family
├── visual tokens
├── layout grammar
├── typography rules
├── component compatibility
├── supported aspect ratios
├── scene-intent recommendations
├── exclusion rules
├── rendering requirements
├── estimated rendering cost
├── embeddings
├── version and status
└── provenance
```

A Style must answer:

- which scene intents it supports
- which content types it handles well
- which aspect ratios are supported
- which brands can constrain it
- which Motion presets are compatible
- which Assets it requires
- which neighboring Styles it can transition to
- what evidence supports it

### 5.2 Motion domain

A Motion preset is a deterministic, parameterized behavior.

```text
MotionPreset
├── identity
├── category
├── semantic intent
├── duration range
├── parameter schema
├── implementation reference
├── compatible styles
├── transition compatibility
├── reduced-motion fallback
├── deterministic status
├── rendering cost
├── embedding
├── version and status
└── provenance
```

Example:

```json
{
  "id": "fade-rise",
  "version": "1.0.0",
  "intent": ["introduce", "explain"],
  "durationFrames": {
    "minimum": 8,
    "maximum": 45,
    "default": 18
  },
  "parameters": {
    "distancePx": {
      "type": "number",
      "minimum": 0,
      "maximum": 120,
      "default": 24
    },
    "opacityFrom": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "default": 0
    }
  },
  "reducedMotionFallback": "fade-only",
  "deterministic": true
}
```

### 5.3 Asset domain

An Asset is a searchable, rights-aware entity, not merely a file path.

```text
Asset
├── type
├── storage URI
├── content hash
├── semantic description
├── visual embedding
├── text embedding
├── dimensions and duration
├── alpha-channel information
├── dominant colors
├── source
├── license
├── permitted uses
├── restrictions
├── variants
├── status
└── provenance
```

Asset types may include:

- SVG
- icon
- image
- illustration
- texture
- Lottie
- audio
- video clip
- 3D model

### 5.4 Evidence domain

Evidence is the lineage layer linking source material to observations and canonical entities.

```text
Evidence
├── source reference
├── media reference
├── timestamp or frame range
├── observation
├── confidence
├── observed / inferred / unknown
├── extractor version
├── model version
├── prompt version
├── linked candidate
├── linked canonical entity
└── review decision
```

Evidence enables:

- auditability
- model reprocessing
- source tracing
- comparison between extractor versions
- explanation of why a Style or Motion preset exists

### 5.5 Prompt registry

Prompts should be treated as versioned configuration or code, not as general knowledge records.

```text
PromptTemplate
├── task
├── version
├── model compatibility
├── input schema
├── output schema
├── evaluation score
├── release status
└── rollback target
```

Examples:

- `analyze-style@3`
- `extract-motion@2`
- `critique-scene-plan@1`

### 5.6 Brand domain

A Brand profile constrains Style selection and rendering.

```text
Brand
├── semantic color roles
├── typography roles
├── spacing and grid
├── logo and watermark rules
├── corner and border rules
├── icon rules
├── accessibility constraints
├── prohibited combinations
└── version
```

### 5.7 Taxonomy domain

Taxonomy is a controlled vocabulary for retrieval and normalization.

Core fields:

- `scene_intent`
- `visual_family`
- `layout_type`
- `typography_class`
- `color_character`
- `motion_category`
- `transition_type`
- `camera_motion`
- `content_density`
- `emotional_tone`
- `asset_type`

Free-form tags may be added, but core retrieval fields must use normalized values.

---

## 6. Core entity model

Recommended entities:

```text
Source
ReferenceMedia
Shot
Frame
Observation
Candidate
Style
MotionPreset
Asset
Brand
SceneIntent
CompatibilityRule
Review
Artifact
PromptTemplate
Embedding
IngestionJob
RenderJob
```

Important relationships:

```text
Source
  -> ReferenceMedia
  -> Shot
  -> Frame
  -> Observation

Observation
  -> produces Candidate

Candidate
  -> may become Style
  -> may become MotionPreset
  -> may become Asset metadata

Style
  <-> compatible_with MotionPreset

Style
  <-> uses Asset

Brand
  -> constrains Style

SceneIntent
  -> recommends Style
  -> recommends MotionPreset

Evidence
  -> supports Candidate
  -> supports canonical Style or MotionPreset
```

---

## 7. Observation-to-canonical lifecycle

AI-generated observations must not enter the production registry directly.

```text
Raw Observation
      |
      v
Candidate
      |
      v
Human or policy review
      |
      v
Validation render and tests
      |
      v
Canonical entity
```

Example:

```text
Observed:
"Headline appears to move upward approximately 20 pixels."

Candidate:
fade-rise, distance 20-24 px, duration 16-20 frames

Validated canonical preset:
fade-rise@1.0.0
```

Recommended candidate states:

```text
DRAFT
ANALYZED
CANDIDATE_CREATED
REVIEW_PENDING
APPROVED
VALIDATING
PUBLISHED
REJECTED
DEPRECATED
```

---

## 8. Ingestion architecture

### 8.1 Workflow states

```text
UPLOADED
-> RIGHTS_REGISTERED
-> PROBED
-> NORMALIZED
-> SEGMENTED
-> FRAMES_EXTRACTED
-> VISUAL_ANALYZED
-> MOTION_ANALYZED
-> NORMALIZED_TO_TAXONOMY
-> CANDIDATES_CREATED
-> REVIEWED
-> VALIDATED
-> PUBLISHED
```

### 8.2 Required workflow properties

Every step must be:

- idempotent
- retryable
- independently observable
- schema validated
- version recorded
- resumable after failure
- able to emit actionable errors

A failure in Motion analysis should not require rerunning media normalization or scene detection.

### 8.3 Workers

Future ingestion workers may include:

```text
Media Probe Worker
Media Normalization Worker
Scene Detection Worker
Frame Sampling Worker
Visual Observer
Motion Analyzer
Taxonomy Normalizer
Rights and Provenance Checker
Candidate Builder
Remotion Validation Worker
Library Publisher
```

### 8.4 Future queue and orchestration

When service-backed ingestion is needed, options include:

- PostgreSQL-backed job table
- BullMQ with Redis
- lightweight task queue

Temporal is suitable later when the workflow requires:

- durable long-running execution
- retries and backoff
- human approval pauses
- resumability
- workflow versioning

Kafka remains unnecessary until independently scaled event processing is
required.

---

## 9. Retrieval architecture

The long-term target may use hybrid retrieval. The active v0.1 path is local
and deterministic:

```text
1. Hard filters
2. SQLite FTS5/BM25 lexical and metadata retrieval
3. Compatibility scoring
```

### 9.1 Hard filters

Examples:

- status must be `stable` or explicitly allowed
- license must allow intended use
- aspect ratio must be supported
- renderer implementation must exist
- required Assets must be available
- Brand constraints must pass
- rendering cost must remain within budget

### 9.2 Future vector retrieval

Embeddings should help answer:

- which Style is semantically similar to this scene
- which Motion preset matches the desired intent
- whether a new observation is close to an existing canonical entity
- which Assets match the scene description

Vector similarity must not make the final decision by itself. It is deferred
until the ADR-001 trigger is met.

### 9.3 Compatibility scoring

Scoring should include:

- Style-to-Motion compatibility
- Style-to-Brand compatibility
- Style-to-Asset compatibility
- neighboring-scene continuity
- transition compatibility
- text-capacity fit
- rendering cost

Example:

```text
score =
  0.25 * semantic_fit
+ 0.15 * content_fit
+ 0.15 * brand_compatibility
+ 0.15 * continuity
+ 0.10 * motion_compatibility
+ 0.10 * asset_availability
+ 0.10 * rendering_cost_fit
```

Weights should be configurable and evaluated with real projects.

---

## 10. Style Director boundary

The Style Director is a planning and constraint-solving service.

Inputs:

- scene intent
- script segment
- content requirements
- Brand profile
- neighboring scenes
- available Assets
- render budget
- user preference
- retrieved Style and Motion candidates

Outputs:

- selected Style
- selected Motion preset
- parameters
- transition
- selection reason
- rejected alternatives
- confidence
- required Assets

The Style Director must only select registered IDs and validated parameters.

It must not emit arbitrary CSS or unregistered animation code into the production render path.

---

## 11. Renderer boundary

The renderer accepts validated `StyleSpec` and `SceneSpec` objects.

```text
StyleSpec
-> registry lookup
-> React component composition
-> deterministic motion functions
-> Remotion render
-> validation report
```

The renderer should:

- fail early on unknown IDs
- clamp invalid parameters
- operate without network access after assets are resolved
- record renderer version
- generate reproducible output from identical input

---

## 12. LLM usage boundary

### LLMs are suitable for

- semantic visual observation
- scene-intent classification
- style abstraction
- motion-purpose interpretation
- candidate explanation
- reranking near-equivalent choices
- critique and review assistance

### LLMs should not perform

- media probing
- scene cutting
- frame extraction
- hashing
- optical flow
- schema validation
- license enforcement
- database filtering
- deterministic animation execution
- final rights approval

This boundary reduces token cost and improves reliability.

---

## 13. Versioning strategy

Every derived output must record:

```text
extractor_version
model_version
prompt_version
taxonomy_version
schema_version
renderer_version
source_version
```

Canonical entities use immutable semantic versions:

```text
technical-editorial@1.0.0
technical-editorial@1.1.0
fade-rise@1.0.0
```

Production entities must not be silently modified in place.

Changes should create a new version and retain lineage to prior versions.

---

## 14. Rights and provenance architecture

Rights data is part of the Source and Asset models.

Recommended fields:

```text
source_url
creator
copyright_holder
license_name
license_url
license_status
allowed_uses
retention_policy
redistribution_allowed
commercial_use_allowed
attribution_required
trademark_restrictions
reviewed_at
reviewed_by
```

Rules:

1. Reference media is not automatically a production asset.
2. Analysis rights do not imply redistribution rights.
3. Source-code licenses and trademark rights are separate.
4. Restricted raw media remains outside public Git.
5. Every published entity must have provenance.
6. Unknown rights block production publication.

---

## 15. Observability and audit

Each job should record:

- job ID
- source ID
- current state
- input hash
- output hash
- worker version
- start and finish timestamps
- retries
- errors
- token and model cost
- CPU/GPU processing time
- reviewer decision

Recommended metrics:

- scene-detection accuracy
- observation acceptance rate
- duplicate-candidate rate
- retrieval precision at K
- reranker acceptance rate
- render failure rate
- average cost per minute of source video
- average LLM token usage per approved candidate
- time from ingestion to publication

---

## 16. Security and reliability

- Do not concatenate untrusted user input into FFmpeg commands.
- Use constrained argument builders.
- Scan uploaded media and validate MIME type.
- Apply storage quotas and duration limits.
- Use content hashes for deduplication.
- Make source media immutable after ingestion.
- Restrict access to private reference media.
- Separate public preview assets from restricted source evidence.
- Record every publication and deletion action.

---

## 17. Active v0.1 architecture

The active implementation remains deliberately local-first. Wave 0 locks this
architecture; later waves add the compiler and projections without changing
the renderer's database-independent boundary.

```text
Git canonical packages + schemas
        |
        v
Knowledge compiler
        |
        +--> generated JSON index --> Style Director --> Remotion Renderer
        |
        +--> SQLite FTS5 --> local query and review tooling
```

### Active v0.1 scope

- Git canonical packages and schemas
- generated JSON as the renderer runtime projection
- SQLite FTS5 as a rebuildable local query projection
- hard filters, BM25, and compatibility scoring
- local tooling only; no remote database or distributed write path
- renderer operation when SQLite is absent

---

## 18. Historical delivery phases

The phases below are retained as historical planning context only. The active
delivery order is Wave 0 through Wave 6 in
`design/planning/RAG_IMPLEMENTATION_PLAN_V1.html`; its storage decision is
ADR-001.

### Phase 1 — Structured foundation

- schemas
- taxonomy
- ingestion jobs
- frame extraction
- five Style presets
- ten Motion presets
- manual review
- historical proposal: PostgreSQL and pgvector

### Phase 2 — Retrieval and deduplication

- image and text embeddings
- hybrid retrieval
- similarity-based deduplication
- candidate promotion workflow
- render validation

### Phase 3 — Advanced planning

- contextual reranking
- compatibility graph
- motion observation improvements
- continuity optimizer
- evaluation harness

### Phase 4 — Learning loop

- feedback from rendered output
- user preference modeling
- Brand-specific adaptation
- automatic candidate suggestions
- controlled evolution of Style and Motion packages

---

## 19. Key risks

### 19.1 Over-modeling too early

Avoid creating separate physical databases, graph infrastructure, streaming infrastructure, and complex orchestration before one reference video can be processed end to end.

### 19.2 Knowledge-base pollution

If every observation creates a new Style or Motion preset, the registry becomes noisy.

Controls:

- similarity deduplication
- candidate state
- review gate
- minimum evidence count
- canonical naming rules

### 19.3 Schema drift from prompts

LLMs must not invent production fields.

All outputs must pass JSON Schema validation.

### 19.4 Confusing inspiration with implementation

A screenshot may support an observation about composition. It is not automatically an implementation specification or reusable Asset.

### 19.5 Rights review added too late

Rights metadata must be captured during ingestion, not immediately before publication.

### 19.6 Vector search becoming the decision engine

Vector search is a future candidate generator. Constraints, compatibility, and
continuity determine the final selection; v0.1 uses no vector search.

---

## 20. Architecture decision summary

Lucida is implemented for v0.1 as:

```text
Git canonical packages + schemas
+ deterministic generated JSON runtime index
+ rebuildable SQLite FTS5 query projection
+ evidence lineage and review lifecycle
+ one deterministic rendering boundary
```

The main competitive advantage is not a database choice alone.

It is the combination of:

```text
structured specifications
+ evidence lineage
+ deterministic local retrieval
+ rights-aware ingestion
+ human review
+ deterministic Remotion rendering
```

This local-first architecture is the active v0.1 decision and provides a
clear path toward a production-grade multimodal RAG and AI-video platform.
