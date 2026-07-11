# Lucida Create Workflow v1.02

## 1. Scope

This workflow starts only after a topic and approved content already exist. Business discovery, audience research, market need validation, topic selection, and script ideation belong to a separate upstream workflow.

The Create Workflow has one responsibility:

> Transform an approved script and project configuration into a validated, reproducible, publishable video artifact.

The workflow is artifact-centric rather than model-centric. Every gate transforms validated input artifacts into versioned output artifacts. GPT, Codex, retrieval systems, deterministic workers, and human reviewers are interchangeable implementations behind those contracts.

```text
Approved Script + ProjectConfig
  -> CreativeBrief
  -> StoryPlan
  -> SceneRequirements
  -> ResourcePlan
  -> CreativePlan
  -> ImplementationPlan
  -> VideoSpec
  -> PreviewBundle
  -> IssueReport / Approval
  -> VideoArtifact
  -> PublicationBundle
```

---

## 2. Global artifact contract

Every workflow artifact must contain or inherit the following envelope:

```yaml
artifact_id: string
artifact_type: string
schema_version: string
artifact_version: string
project_id: string
status: draft | validated | rejected | superseded | published
created_at: ISO-8601
created_by: worker-or-human-id
input_artifact_ids: []
dependency_hashes: {}
content_hash: sha256
producer:
  gate_id: string
  worker_type: deterministic | retrieval | llm | codex | human
  worker_version: string
quality:
  validation_status: pass | fail | warning
  score: 0.0-1.0
  warnings: []
provenance:
  source_ids: []
  model_id: optional
  prompt_version: optional
  tool_versions: {}
```

No gate may consume an artifact whose schema validation failed or whose status is `rejected` or `superseded`.

## 3. Global workflow rules

1. Every gate must be idempotent for identical inputs and worker versions.
2. Every gate must validate entry criteria before running.
3. Every output must pass schema validation before exit criteria are evaluated.
4. LLM output is never trusted directly; deterministic validators must verify structure and hard constraints.
5. A failed gate routes to the smallest upstream gate that owns the defect.
6. Scene-level changes invalidate only dependent scene artifacts when possible.
7. Human review is mandatory before production render unless the project policy explicitly allows unattended publication.
8. Raw prompts and model responses may be logged privately for debugging, but canonical state is stored only in structured artifacts.
9. The workflow engine owns orchestration. GPT and Codex are workers, not the source of truth.
10. Every gate emits start, success, warning, failure, retry, and invalidation events.

---

# Gate contracts

## G0 — Intake and Project Initialization

### Purpose

Create the project record and validate that the Create Workflow has sufficient approved input.

### Owner

Workflow Orchestrator.

### Input artifacts

- `ApprovedScript`
- `ProjectConfig`
- optional `BrandPolicy`
- optional user-supplied assets

### Required input fields

`ApprovedScript`:

- complete script text
- language
- approval status
- source/version identifier

`ProjectConfig`:

- platform
- aspect ratio
- target duration or accepted duration range
- frame rate
- output resolution
- brand identifier
- caption requirement
- audio requirement
- creative intensity
- motion intensity

### Worker

Deterministic application code. No GPT or Codex.

### Transform

- allocate `project_id`
- normalize paths and identifiers
- calculate script/config hashes
- resolve default render settings
- create workflow state record

### Output artifact

`ProjectEnvelope`

### Entry criteria

- script status is approved
- script is not empty
- platform and aspect ratio are supported
- duration range is valid
- referenced brand exists or an explicit unbranded policy is selected

### Verification

- JSON Schema validation
- duplicate project/idempotency check
- supported-platform matrix
- brand-policy existence
- asset URI and checksum validation for supplied assets

### Exit criteria

- `ProjectEnvelope.status = validated`
- all required inputs are immutable and hash-addressed

### Retry policy

No model retry. Correct invalid input or configuration.

### Cache policy

Not applicable; project creation is idempotent by request key.

### Human review

Not required unless input approval status is ambiguous.

### Failure routing

Return to upstream content workflow or user input.

### Metrics

- intake validation failure rate
- duplicate request rate
- time to initialize project

---

## G1 — Creative Brief Construction

### Purpose

Translate the approved script and project constraints into a concise creative intent without selecting concrete styles, assets, components, or animations.

### Owner

Creative Planning module.

### Input artifacts

- `ProjectEnvelope`
- `ApprovedScript`
- `ProjectConfig`
- `BrandPolicy` summary

### Required context

Only brand principles, tone constraints, audience assumptions supplied by upstream content, platform conventions, and duration budget. Do not provide the full Style or Motion libraries.

### Worker

Primary: GPT reasoning worker.

Fallback: deterministic template for simple projects.

Codex role: none.

### GPT task contract

GPT receives:

- role: Creative Brief Analyst
- approved script
- project constraints
- allowed tone and objective taxonomies
- output JSON Schema
- prohibition against adding facts or selecting implementation resources

GPT must return:

- core message
- communication objective
- audience framing inherited from input
- tone
- pacing intent
- information-density target
- emotional arc
- explicit non-goals
- ambiguity list
- evidence spans linking decisions to script/config

### Output artifact

`CreativeBrief`

### Verification

Deterministic:

- schema valid
- all enumerations belong to taxonomy
- no style ID, asset ID, component ID, or motion preset appears
- all factual claims are traceable to input spans
- duration and platform constraints are preserved
- no unresolved ambiguity marked critical

Optional second-model verifier:

- check unsupported inference
- check contradiction with script

### Exit criteria

- communication objective is singular and clear
- no critical ambiguity remains
- every major brief decision has source evidence

### Retry policy

- retry once with validation errors injected into the task
- if still invalid, route to human clarification

### Cache policy

Cache by script hash + config hash + brand-policy version + prompt version + model version.

### Timeout/SLA

Target: under 30 seconds for a normal script.

### Human review

Optional for ordinary projects; mandatory for high-value brand campaigns.

### Failure routing

- unsupported content assumption -> G0/input correction
- creative ambiguity -> human review at G1

### Metrics

- schema pass rate
- unsupported-inference rate
- human correction rate
- brief generation cost

---

## G2 — Story Planning

### Purpose

Convert the script into a coherent narrative structure of sections and scenes while preserving content coverage and timing.

### Owner

Narrative Planning module.

### Input artifacts

- `ApprovedScript`
- validated `CreativeBrief`
- `ProjectConfig`

### Worker

Primary: GPT narrative reasoning worker.

Deterministic helpers:

- sentence segmentation
- word-count and voice-duration estimation
- timestamp calculation when audio exists

Codex role: none.

### GPT task contract

GPT receives:

- role: Narrative and Scene Planner
- script with stable character or sentence indexes
- CreativeBrief
- allowed section-intent and scene-intent taxonomy
- timing budget
- output schema

GPT must not select styles, motion presets, components, or assets.

GPT returns:

- section structure
- scene boundaries
- intent per section and scene
- voiceover/source spans
- key message per scene
- information priority
- target duration per scene
- transition rationale at narrative level
- energy curve

### Output artifact

`StoryPlan`

### Verification

Deterministic:

- script coverage threshold; default >= 98% of approved substantive content
- no overlapping source spans unless explicitly marked repetition
- no hallucinated script content
- scene durations sum to accepted project duration range
- minimum and maximum scene-duration rules
- section and scene IDs unique
- scene order continuous
- every scene has an intent, key message, and evidence span

Quality verifier:

- detect duplicated purpose across adjacent scenes
- detect excessively fragmented scenes
- detect missing hook, explanation, or conclusion only when required by format policy

### Exit criteria

- complete, timed, non-overlapping StoryPlan
- coverage and continuity checks pass
- critical content omissions equal zero

### Retry policy

- deterministic timing adjustment first
- GPT repair only for failed scenes or sections, not entire plan
- maximum two repair iterations

### Cache policy

Section-level and scene-level caching based on source spans and brief hash.

### Timeout/SLA

Target: under 60 seconds for scripts below 10 minutes.

### Human review

Recommended first major approval gate. User may edit, lock, merge, split, or reorder scenes. Locked scenes cannot be regenerated without explicit unlock.

### Failure routing

- incorrect brief interpretation -> G1
- missing/incorrect source content -> G2 repair
- invalid project timing -> G0/config correction

### Metrics

- content coverage
- timing variance
- scenes modified by human
- average number of repair loops

---

## G3 — Scene Requirement Analysis

### Purpose

Describe what each scene must communicate and what representational forms it may require, without choosing concrete creative resources.

### Owner

Scene Analysis module.

### Input artifacts

- validated `StoryPlan`
- `CreativeBrief`
- relevant script spans
- controlled content taxonomy

### Worker

Hybrid:

- deterministic keyword/entity/data detection
- GPT semantic classification only for ambiguous scene meaning

Codex role: none.

### Transform

For each scene identify:

- content type: statement, list, comparison, process, timeline, diagram, code, chart, quote, product UI, demonstration, photo-led, or mixed
- entities and factual data
- hierarchy and reading order
- required visual evidence
- text-density estimate
- data visualization requirements
- interaction or transformation to demonstrate
- accessibility concerns
- forbidden representation patterns

### Output artifact

`SceneRequirements`

### Verification

- all classifications belong to taxonomy
- each requirement links to a StoryPlan scene
- numbers/data referenced in requirements exist in source content
- required visual elements are justified by scene purpose
- no specific style, asset, component, or animation ID appears
- text-density and complexity ranges are internally consistent

### Exit criteria

Every scene has a complete requirement record and zero unresolved critical classifications.

### Retry policy

Retry only ambiguous scenes. Human review if confidence remains below threshold.

### Cache policy

Scene-level cache keyed by scene hash + taxonomy version + analyzer version.

### Human review

Only low-confidence or high-risk scenes.

### Failure routing

- narrative defect -> G2
- taxonomy gap -> taxonomy-governance task; do not let GPT invent permanent categories

### Metrics

- classification confidence
- taxonomy fallback rate
- human escalation rate

---

## G4 — Resource Planning

### Purpose

Translate scene requirements into abstract resource needs without binding actual assets or implementation components.

### Owner

Resource Planning module.

### Input artifacts

- `SceneRequirements`
- `StoryPlan`
- `ProjectConfig`
- `BrandPolicy`

### Worker

Rule engine for standard mappings, with GPT used only for novel mixed scenes.

Codex role: none.

### Transform

Generate requirements such as:

- icon roles
- illustration roles
- image roles
- chart/data requirements
- diagram primitives
- UI mockup requirements
- typography roles
- background/texture roles
- audio cues
- caption behavior
- transition capability
- reusable component capability

The output describes what is needed, not where it comes from.

### Output artifact

`ResourcePlan`

### Verification

- every required resource maps to a scene requirement
- no unjustified resource is added
- every resource has role, priority, fallback strategy, and license class requirement
- dependencies are complete
- complexity and render-cost budgets are respected

### Exit criteria

No scene has unresolved mandatory resource dependencies.

### Retry policy

Rule-based repair first, GPT repair only for incomplete novel scenes.

### Cache policy

Scene-level by requirement hash + planning-rule version.

### Human review

Not normally required.

### Failure routing

- missing scene need -> G3
- unsupported resource category -> platform capability backlog or human decision

### Metrics

- mandatory-resource completeness
- planned reuse ratio
- estimated generation cost

---

## G5 — Creative Resolution

### Purpose

Choose the creative strategy for the full video and each scene using the Lucida Knowledge Platform, while maintaining continuity, brand compliance, resource feasibility, and controlled novelty.

### Owner

Style Director.

### Input artifacts

- `CreativeBrief`
- `StoryPlan`
- `SceneRequirements`
- `ResourcePlan`
- `BrandPolicy`
- retrieved Style, Motion, and composition candidates
- evidence and compatibility metadata

### Worker

Two-stage hybrid:

1. deterministic/hybrid retrieval and filtering
2. GPT creative decision and explanation among valid candidates

Codex role: none.

### Retrieval stage

Hard filters:

- status is approved or stable
- license permits intended use
- supported aspect ratio
- supported renderer version
- content capacity
- accessibility requirements
- required asset/component capability
- brand compatibility

Ranking:

- semantic fit
- content fit
- continuity
- evidence strength
- reuse value
- novelty budget
- render cost
- asset availability

### GPT task contract

GPT receives only the top validated candidates and compact metadata. It must not invent unregistered IDs.

GPT returns:

- dominant visual family
- supporting visual families
- scene-level style selection
- motion strategy and intensity
- transition strategy
- asset strategy: reuse, procedural, generate, or licensed external
- rationale per choice
- rejected alternatives and reasons
- continuity explanation

### Output artifact

`CreativePlan`

### Verification

Deterministic:

- every selected ID exists and version is explicit
- compatibility matrix passes
- style-family budget passes
- motion-intensity budget passes
- brand-policy constraints pass
- license constraints pass
- dominant style duration threshold passes
- transition compatibility passes
- required scene capacity passes

Creative consistency verifier:

- adjacent style changes occur at narrative boundaries
- no arbitrary simultaneous typography and layout-system changes
- conclusion returns to dominant visual grammar unless explicitly justified

### Exit criteria

- all scenes have valid creative choices
- video-level continuity score meets threshold
- no license or brand violation
- unresolved candidate count is zero

### Retry policy

- deterministic optimizer may substitute candidates automatically
- GPT re-decision only for failed scenes/sections
- maximum two creative retries before human review

### Cache policy

Cache retrieval independently from GPT selection. Scene choices invalidate only when relevant inputs or candidate library versions change.

### Timeout/SLA

Target under 90 seconds for normal short-form projects.

### Human review

Second major approval gate. User can lock styles, motion, sections, or individual scenes.

### Failure routing

- insufficient candidate coverage -> library backlog or G4 fallback revision
- continuity failure -> G5 optimizer
- missing resource feasibility -> G4
- incorrect story intent -> G2/G3

### Metrics

- style reuse ratio
- retrieval precision at top K
- human override rate
- continuity score
- creative decision token cost

---

## G6 — Resource and Component Binding

### Purpose

Resolve the approved CreativePlan into concrete assets, components, motion implementations, and renderer bindings.

### Owner

Implementation Planner.

### Input artifacts

- validated and approved `CreativePlan`
- `ResourcePlan`
- `SceneRequirements`
- Asset Registry
- Component Registry
- Motion Registry
- renderer capability manifest

### Worker

Primary: deterministic registry resolver.

Codex participation:

- only when an approved reusable component or adapter is missing
- may implement or modify React/TypeScript components in a controlled branch/worktree
- must run tests, lint, type-check, and render fixtures
- must never silently change the approved creative intent

GPT participation:

- optional for semantic asset search query generation
- not allowed to commit code or bind unverified assets

### Resolution priority

1. existing approved Lucida asset
2. existing reusable component
3. procedural SVG/CSS/Canvas generation
4. approved image-generation task
5. licensed external asset
6. implementation backlog requiring human approval

### Output artifact

`ImplementationPlan`

It contains:

- component ID and version per scene
- asset IDs and versions
- motion preset IDs and parameters
- transition implementation
- data bindings
- font and audio bindings
- missing-resource tasks
- Codex change references when code was created

### Verification

- every bound ID exists
- content hashes and licenses verified
- renderer compatibility verified
- component props validate against schema
- motion parameters are within bounds
- assets meet dimensions, alpha, color-space, and format requirements
- Codex-created code passes CI and reference render tests
- no unresolved mandatory dependency remains

### Exit criteria

Every scene is implementation-complete or explicitly blocked with an owned task.

### Retry policy

- try next ranked asset/component candidate
- procedural fallback
- Codex implementation task
- human decision if no safe fallback exists

### Cache policy

Asset/component binding cached by versioned registry query and scene requirement hash.

### Human review

Required for newly generated external-facing imagery, commercial assets, new fonts, and new Codex-created component families.

### Failure routing

- creative mismatch -> G5
- missing abstract need -> G4
- code/renderer limitation -> engineering backlog or Codex repair loop at G6

### Metrics

- existing-asset reuse rate
- existing-component reuse rate
- Codex intervention rate
- unresolved dependency rate
- license rejection rate

---

## G7 — VideoSpec Compilation

### Purpose

Compile all approved planning artifacts into the single canonical execution contract consumed by the renderer.

### Owner

Spec Compiler.

### Input artifacts

- `ProjectEnvelope`
- `CreativeBrief`
- `StoryPlan`
- `SceneRequirements`
- `CreativePlan`
- `ImplementationPlan`
- audio/caption configuration

### Worker

Deterministic compiler.

Codex participation:

- may maintain compiler code and schema migrations
- does not make creative decisions during a workflow run

GPT participation: none.

### Output artifact

`VideoSpec`

Required top-level domains:

- project and version metadata
- creative intent snapshot
- narrative sections
- frame-exact scene timeline
- visual and motion bindings
- assets and components
- audio and captions
- transitions
- render settings
- provenance and dependency graph
- cache keys

### Verification

- JSON Schema validation
- all references resolvable and version-pinned
- frame ranges continuous and non-overlapping
- scene duration sum equals composition duration
- audio/caption timestamps fit timeline
- no mutable latest-version references
- dependency graph is acyclic
- renderer capability checks pass
- canonical hash generated

### Exit criteria

`VideoSpec.status = validated` and immutable content hash exists.

### Retry policy

Compiler errors are deterministic; repair the owning upstream artifact. Do not use GPT to patch invalid JSON ad hoc.

### Cache policy

Compile cache by all dependency hashes and compiler version.

### Human review

Not required if G5/G6 approvals are complete.

### Failure routing

Route each validation error to the artifact owner identified by dependency path.

### Metrics

- first-pass compile success
- dependency resolution failures
- schema migration failures

---

## G8 — Preview Build and Automated Validation

### Purpose

Produce inexpensive evidence that the VideoSpec is visually, temporally, technically, and semantically viable before production rendering.

### Owner

Preview and Validation service.

### Input artifacts

- validated `VideoSpec`
- renderer and browser-image versions

### Worker

Deterministic Remotion/render workers plus automated visual validators.

Codex participation:

- only to repair implementation defects discovered by tests

GPT participation:

- not used until deterministic checks complete

### Preview outputs

`PreviewBundle` includes:

- static representative frame per scene
- contact sheet
- low-resolution motion preview
- scene-level preview clips
- transition handles
- validation report
- render logs and timings

### Deterministic verification

- render completes without exception
- text overflow and clipping
- safe area
- contrast
- missing glyph/font
- missing asset
- broken image/SVG
- frame continuity
- transition overlap
- duration and FPS
- audio clipping and silence anomalies
- caption bounds and reading duration
- deterministic frame hash sample
- memory and render-time budgets

### Exit criteria

All hard technical checks pass. Warnings are recorded for critique.

### Retry policy

- transient render retry
- scene-only rerender after localized fixes
- Codex repair loop for implementation defects
- route planning defects upstream

### Cache policy

Per-scene render cache using scene hash, renderer version, browser version, and asset hashes.

### Human review

Optional static review; motion preview approval occurs at G9.

### Failure routing

- component defect -> G6/Codex
- spec defect -> G7
- creative/layout infeasibility -> G5 or G6
- narrative timing defect -> G2

### Metrics

- preview render success rate
- cache hit rate
- overflow incidence
- render time per frame
- deterministic mismatch rate

---

## G9 — Critique, Approval, and Revision Routing

### Purpose

Assess whether the preview communicates the approved story effectively and route each issue to its owning gate.

### Owner

Quality Director.

### Input artifacts

- `PreviewBundle`
- `VideoSpec`
- `CreativeBrief`
- `StoryPlan`
- validation warnings
- project quality thresholds

### Worker

Three layers:

1. deterministic quality checks from G8
2. GPT multimodal critique over selected preview evidence
3. human approval

Codex role:

- receives only implementation issues routed to G6

### GPT task contract

GPT receives compressed evidence rather than the full raw project:

- contact sheet
- selected scene clips
- StoryPlan and CreativeBrief summaries
- deterministic warning list
- scoring rubric

GPT returns structured `IssueReport`:

- issue ID
- affected scene(s)
- category
- severity
- evidence
- expected outcome
- recommended owning gate
- confidence
- quality scores

GPT may not directly modify VideoSpec or code.

### Output artifacts

- `IssueReport`
- `ApprovalDecision`

### Verification

- every issue references visible or measurable evidence
- owning gate is valid
- no duplicate issue IDs
- severity belongs to taxonomy
- recommendation does not violate locked decisions
- quality scores include rationale

Human reviewer can:

- approve
- approve with warnings
- reject selected scenes
- request a specific revision
- lock approved scenes

### Exit criteria

- approval granted, or
- every blocking issue is assigned to an upstream owner with an invalidation scope

### Retry and revision policy

Issue routing examples:

- wrong message or ordering -> G2
- wrong scene requirement -> G3
- missing resource need -> G4
- poor style/motion choice -> G5
- wrong asset/component/code -> G6
- malformed timing/reference -> G7
- renderer defect -> G8

Only affected artifacts and dependencies are invalidated.

### Cache policy

Critique cache keyed by preview hashes + rubric version + model/prompt version. Human decision is never replaced by cache.

### Human review

Mandatory default approval gate before G10.

### Metrics

- first-preview approval rate
- issue count by owning gate
- revision-cycle count
- human/GPT disagreement rate
- cost per approved minute

---

## G10 — Production Render

### Purpose

Render the approved immutable VideoSpec at production quality.

### Owner

Render Service.

### Input artifacts

- approved `VideoSpec`
- `ApprovalDecision`
- production render profile

### Worker

Deterministic Remotion and media workers. No GPT.

Codex role:

None during an active approved render. Code changes require returning to G6 and repeating validation.

### Output artifact

`VideoArtifact`

Includes:

- master video
- optional platform variants
- subtitles
- audio stems when configured
- thumbnails/poster frames
- checksums
- render manifest
- logs

### Verification

- output checksum
- codec/container profile
- resolution, FPS, duration
- frame count
- audio loudness and clipping
- subtitle synchronization
- file integrity
- sampled frame comparison against approved preview
- provenance and version embedding

### Exit criteria

All production checks pass and render manifest is complete.

### Retry policy

- infrastructure/transient retry
- resume or rerender failed shards
- deterministic mismatch blocks publication and returns to G8/G6

### Cache policy

Immutable final-render cache by VideoSpec hash + render profile + renderer stack version.

### Human review

Optional final watch-through according to project policy; mandatory for premium/high-risk projects.

### Failure routing

- infrastructure -> G10 retry
- renderer/code -> G6/G8
- unexpected creative mismatch -> G9/G5

### Metrics

- render success rate
- render cost per minute
- render time per minute
- retry rate
- output defect rate

---

## G11 — Publication and Archival

### Purpose

Package approved output, preserve auditability, and publish or hand off the video.

### Owner

Publication Service.

### Input artifacts

- verified `VideoArtifact`
- `ApprovalDecision`
- publication configuration
- complete provenance and history

### Worker

Deterministic publication integration. No GPT or Codex by default.

### Output artifact

`PublicationBundle`

Includes:

- published or deliverable media URLs
- metadata
- captions and thumbnails
- project/version IDs
- final checksums
- provenance manifest
- license manifest
- workflow history
- source VideoSpec hash
- publication status

### Verification

- publication target credentials and policy
- all mandatory rights/license records complete
- metadata and language validation
- checksum preserved after upload
- no draft or unapproved asset referenced
- retention and privacy policy applied

### Exit criteria

Publication or delivery confirmed and immutable audit record stored.

### Retry policy

Destination-specific retry with idempotency key. Never create duplicate publication records silently.

### Cache policy

Not content cache; publication state uses idempotency and reconciliation.

### Human review

Required when publishing directly to external channels unless project policy explicitly permits automation.

### Failure routing

- rights/provenance defect -> G6/G9
- metadata defect -> publication configuration correction
- media defect -> G10

### Metrics

- publication success rate
- duplicate prevention rate
- time from approval to publication
- rights-block incidence

---

# 4. Workflow state machine

```text
RECEIVED
  -> INITIALIZED
  -> BRIEF_VALIDATED
  -> STORY_APPROVED
  -> REQUIREMENTS_VALIDATED
  -> RESOURCES_PLANNED
  -> CREATIVE_APPROVED
  -> IMPLEMENTATION_READY
  -> SPEC_VALIDATED
  -> PREVIEW_VALIDATED
  -> APPROVED_FOR_RENDER
  -> RENDERED
  -> PUBLISHED
```

Blocking states:

```text
BLOCKED_INPUT
BLOCKED_AMBIGUITY
BLOCKED_TAXONOMY
BLOCKED_MISSING_RESOURCE
BLOCKED_LICENSE
BLOCKED_IMPLEMENTATION
BLOCKED_SPEC
BLOCKED_PREVIEW
BLOCKED_APPROVAL
RENDER_FAILED
PUBLICATION_FAILED
```

# 5. Context policy for GPT and Codex

## GPT

GPT receives the minimum context required for its current gate.

- G1: script + project constraints + compact brand policy
- G2: script + CreativeBrief + timing/taxonomy
- G3/G4: only scene-local context when ambiguity requires reasoning
- G5: top-ranked valid candidates, not the whole knowledge base
- G9: selected preview evidence + rubric + planning summaries

GPT must always receive:

- explicit role
- objective
- allowed and forbidden decisions
- immutable input artifacts
- taxonomy
- output schema
- validation checklist
- repair feedback on retry

GPT never receives authority to publish, commit code, bypass license rules, or directly mutate canonical artifacts.

## Codex

Codex participates primarily at G6 and as an engineering repair worker for G8 failures.

Codex receives:

- exact repository/worktree scope
- approved CreativePlan and ImplementationPlan requirement
- component and schema contracts
- files allowed to change
- tests and reference fixtures
- forbidden changes
- acceptance checks

Codex must:

- work on a controlled branch or worktree
- change only declared files
- run type checks, tests, lint, and reference renders
- provide commit/diff and validation results
- never alter narrative or creative decisions without routing back to G5

# 6. Human-control points

Default human gates:

1. StoryPlan approval after G2
2. CreativePlan approval after G5
3. Preview approval after G9
4. Publication approval at G11

Projects may reduce approvals only through an explicit policy profile. High-risk or premium projects may add approvals at G6 and G10.

# 7. Minimal MVP implementation

The MVP may implement the same contracts with fewer services:

- one workflow/orchestration service
- PostgreSQL artifact and job tables
- object storage
- JSON Schema registry
- GPT worker adapter
- registry/retrieval module
- Codex engineering workflow invoked manually or through controlled automation
- Remotion preview/render worker
- simple review UI

Logical gates do not require separate microservices.

# 8. Definition of done for v1.02

The workflow specification is implementation-ready when:

- every artifact has a schema
- every gate has executable entry and exit validation
- every LLM gate has a versioned prompt and output schema
- every Codex task has a repository scope and automated checks
- issue routing identifies the owning upstream gate
- scene-level invalidation and caching are supported
- approval policies are configurable
- a complete test project can traverse G0 through G11 with auditable artifacts
