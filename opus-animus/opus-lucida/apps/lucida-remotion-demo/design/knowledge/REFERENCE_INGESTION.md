# Lucida Reference Ingestion Workflow

This document defines how Lucida turns reference videos or screenshot sequences into structured observations, reusable Style and Motion candidates, and validated Remotion presets.

The pipeline is based on **observation and abstraction**, not pixel-perfect copying:

```text
reference video or frame sequence
  -> register source and rights
  -> normalize media
  -> detect shots and sample evidence frames
  -> extract visual observations
  -> extract motion observations
  -> normalize against Lucida taxonomy
  -> review provenance and rights
  -> create candidate packages
  -> render validation examples
  -> human review
  -> publish or reject
  -> append HISTORY.md
```

## 1. Core principles

1. A static screenshot can support Style analysis but cannot reliably describe Motion.
2. Motion extraction requires the original video or a timestamped frame sequence.
3. Observed facts must be separated from model inference.
4. The pipeline must not guess a precise font, easing curve, or implementation when evidence is insufficient.
5. Reference media is evidence, not a production asset by default.
6. Raw third-party video and screenshots should not be committed to a public repository without explicit permission.
7. Every published Style or Motion package must be traceable to its source observations and review decision.
8. The final Lucida implementation should use original tokens, assets, components, and frame-driven animation code.

## 2. Storage model

### 2.1 In Git

Store only small, auditable, machine-readable artifacts:

- source manifest
- scene and shot metadata
- low-resolution contact sheet when rights allow
- visual observations
- motion observations
- review decisions
- provenance
- derived candidate specifications
- validation reports

### 2.2 Outside Git

Store raw or restricted material in private object storage, a local workspace, or an approved media archive:

- original video
- extracted full-resolution frames
- audio
- optical-flow maps
- temporary crops
- embeddings
- model caches

The manifest should reference an internal storage URI and SHA-256 content hash instead of committing restricted media.

## 3. Proposed repository structure

```text
design/
├── REFERENCE_INGESTION.md
├── HISTORY.md
├── reference-lab/
│   ├── AVAILABLE_SOURCES.md
│   ├── manifests/
│   ├── sources/
│   │   └── <reference-id>/
│   │       ├── manifest.json
│   │       ├── shots.json
│   │       ├── frame-index.json
│   │       ├── contact-sheet.jpg
│   │       ├── visual-observations.json
│   │       ├── motion-observations.json
│   │       ├── provenance.md
│   │       ├── review.md
│   │       └── validation.json
│   ├── schemas/
│   │   ├── reference-manifest.schema.json
│   │   ├── visual-observations.schema.json
│   │   ├── motion-observations.schema.json
│   │   └── review-decision.schema.json
│   └── raw/                       # ignored by Git
├── visual-library/
│   ├── candidates/
│   └── styles/
└── motion-library/
    ├── candidates/
    └── presets/
```

## 4. Pipeline states

```text
registered
  -> normalized
  -> segmented
  -> analyzed
  -> normalized-to-taxonomy
  -> rights-reviewed
  -> candidate-created
  -> render-validated
  -> human-reviewed
  -> published | rejected | needs-revision
```

State transitions must be append-only in the source review log.

## 5. Stage A — Register the source

Each input receives a stable reference ID.

Example:

```json
{
  "schemaVersion": "1.0",
  "referenceId": "ref-20260711-001",
  "title": "AI explainer reference",
  "sourceType": "video",
  "sourceUrl": "https://example.com/reference",
  "creator": "unknown",
  "rights": {
    "classification": "internal-reference",
    "downloadAuthorized": false,
    "redistributionAuthorized": false,
    "derivativeUseAuthorized": "unknown"
  },
  "storage": {
    "uri": "private://lucida-references/ref-20260711-001/source.mp4",
    "sha256": "sha256:..."
  },
  "ingestedAt": "2026-07-11T00:00:00Z",
  "requestedAnalysis": ["style", "motion"],
  "notes": "Study composition, typography behavior, and transitions only."
}
```

Required checks:

- input exists and is readable
- source URL or origin is recorded
- content hash is computed
- rights classification is present
- requested analysis is compatible with the input type

A screenshot-only source must not request high-confidence motion analysis.

## 6. Stage B — Normalize media

Use `ffprobe` to capture:

- duration
- frame rate
- dimensions
- pixel format
- color space when available
- audio presence
- variable-frame-rate status

Create a normalized analysis proxy:

- constant frame rate
- standard pixel format
- bounded resolution, for example 1280px on the long edge
- original aspect ratio preserved
- no watermark removal or content alteration

The original file remains immutable.

## 7. Stage C — Detect shots and sample evidence

### 7.1 Default two-pass strategy

**Pass 1: inexpensive discovery**

- run shot-boundary detection
- sample 1–3 frames per second
- calculate frame-difference metrics
- create a contact sheet

**Pass 2: targeted analysis**

For selected shots:

- decode at source frame rate
- retain a short pre-roll and post-roll
- sample first, middle, last, and maximum-change frames
- optionally calculate optical flow

### 7.2 Shot detector order

1. PySceneDetect content/adaptive detector for a fast default.
2. TransNetV2 when gradual transitions or difficult edits need a learned detector.
3. Manual correction when detector confidence is low.

Detector output must remain editable; no detector is treated as ground truth.

Example `shots.json` entry:

```json
{
  "shotId": "shot-004",
  "startFrame": 420,
  "endFrame": 510,
  "startTimeMs": 14000,
  "endTimeMs": 17000,
  "detector": "pyscenedetect-adaptive",
  "confidence": 0.88,
  "evidenceFrames": [
    "frames/shot-004-first.jpg",
    "frames/shot-004-mid.jpg",
    "frames/shot-004-last.jpg"
  ]
}
```

## 8. Stage D — Visual observation

The Visual Observer analyzes representative frames and outputs structured evidence.

Recommended fields:

```json
{
  "shotId": "shot-004",
  "evidenceFrames": ["shot-004-first.jpg", "shot-004-mid.jpg"],
  "observed": {
    "composition": {
      "layout": "asymmetric-two-column",
      "primaryFocus": "left",
      "safeMarginsPercent": 7,
      "visualDensity": "medium"
    },
    "color": {
      "backgroundRole": "near-black",
      "accentRoles": ["electric-blue", "warm-white"],
      "contrast": "high"
    },
    "typography": {
      "familyClass": "neo-grotesk-sans",
      "headlineScale": "display",
      "weight": "bold",
      "alignment": "left"
    },
    "surface": {
      "radius": "medium",
      "border": "subtle",
      "shadow": "none"
    }
  },
  "inferred": {
    "grid": "12-column-likely",
    "styleTags": ["technical", "minimal", "dark", "editorial"]
  },
  "unknown": ["exact-font-family", "original-token-values"],
  "confidence": 0.84
}
```

### 8.1 Visual dimensions to extract

- composition and focal hierarchy
- grid and alignment
- spacing rhythm
- color roles and contrast
- typography class and hierarchy
- shape language
- border, radius, shadow, and texture
- icon and illustration style
- image treatment
- information density
- aspect-ratio behavior
- repeated visual motifs

Do not infer brand ownership or exact token names from appearance alone.

## 9. Stage E — Motion observation

Motion analysis combines temporal vision with measured frame evidence.

Recommended dimensions:

- camera pan, tilt, push, zoom, rotation, or parallax
- object translation, scale, rotation, opacity, and mask changes
- text entrance and exit behavior
- stagger order
- duration in frames and milliseconds
- velocity profile
- overshoot and settling
- transition type
- foreground/background motion separation
- motion intensity
- temporal hierarchy

Example:

```json
{
  "shotId": "shot-004",
  "evidenceRange": {
    "startFrame": 420,
    "endFrame": 510
  },
  "camera": {
    "type": "slow-push-in",
    "scaleFrom": 1.0,
    "scaleTo": 1.06,
    "confidence": 0.72
  },
  "elements": [
    {
      "role": "headline",
      "animation": "fade-rise",
      "delayFrames": 8,
      "durationFrames": 18,
      "distancePx": 24,
      "easingEstimate": "ease-out",
      "confidence": 0.81
    }
  ],
  "transitionOut": {
    "type": "shared-axis-x",
    "durationFrames": 15,
    "confidence": 0.77
  }
}
```

Optical flow is supporting evidence, not semantic interpretation. It can estimate displacement but cannot alone determine narrative purpose.

## 10. Stage F — Normalize against Lucida taxonomy

The Normalizer must prefer reuse over creating near-duplicate packages.

Decision order:

```text
existing package matches
  -> attach new evidence and tune parameters

existing package is close
  -> create a candidate variant

pattern is materially different and reusable
  -> create a new candidate package

pattern is unique, branded, or too specific
  -> keep as observation only
```

Example Style mapping:

```text
observed:
  dark + technical + grid + blue accent

normalized:
  technical-editorial / dark-grid
```

Example Motion mapping:

```text
observed:
  opacity 0 -> 1
  y 24 -> 0
  duration 18 frames

normalized:
  fade-rise
  parameters:
    durationFrames: 18
    distancePx: 24
```

## 11. Stage G — Rights and provenance review

Before a candidate is created, classify every selected element:

- principle only
- measured behavior
- adapted code
- copied code
- copied asset
- unknown

Default policy:

- principles and measured values may be used to create an original implementation
- third-party logos, font files, illustrations, screenshots, video clips, and premium code remain external unless explicit rights permit repository inclusion
- short contact sheets should only be committed when permitted and necessary
- when rights are unclear, store a private URI and hash instead of the media

Each source receives `provenance.md` containing:

- source and creator
- reviewed URL
- access date
- rights classification
- selected observations
- excluded elements
- files copied, if any
- licenses and notices
- reviewer decision

## 12. Stage H — Candidate package creation

A candidate must be an original Lucida specification.

Example paths:

```text
visual-library/candidates/technical-editorial-dark-grid/
motion-library/candidates/fade-rise-soft/
```

Each candidate contains:

- specification JSON
- provenance
- evidence references
- implementation or adapter
- synthetic example content
- expected behavior
- supported aspect ratios
- accessibility fallback
- test cases

The candidate must not use the reference video's original text, logo, character, image, or artwork in its validation scene.

## 13. Stage I — Remotion validation

Generate a neutral validation composition with:

- synthetic copy
- Lucida or neutral brand tokens
- original vector primitives
- no reference artwork
- deterministic animation

Validation checks:

- same inputs produce the same frames
- text does not overflow
- animation works at supported frame rates
- reduced-motion fallback exists
- contrast passes the configured target
- motion duration remains readable
- the candidate is reusable across at least three content examples
- multi-style transitions remain coherent

## 14. Stage J — Human review

The review board should show:

- source metadata
- contact sheet or secure preview
- shot timeline
- observed versus inferred fields
- Style and Motion normalization proposals
- confidence values
- rights status
- Remotion validation video
- Accept, Edit, Reject, and Needs Revision actions

AI may create candidates, but only a reviewed candidate may become `stable`.

## 15. History requirements

Every accepted, rejected, or revised candidate appends an entry to `design/HISTORY.md`.

Required fields:

```markdown
## YYYY-MM-DD — Reference <batch-id>

- Source: ...
- Layer: Style | Motion | Style + Motion
- Evidence: ...
- Selected observations: ...
- Derived artifacts: ...
- Copy status: principles-only | measured-behavior | adapted-code | copied-code | copied-assets
- License and rights: ...
- Review decision: ...
```

Do not erase previous decisions. A later decision should reference the earlier history entry.

## 16. Suggested agent architecture

```text
Reference Intake Agent
        -> Media Normalization Worker
        -> Scene Segmentation Worker
        -> Visual Observer
        -> Motion Observer
        -> Lucida Taxonomy Normalizer
        -> Provenance and Rights Checker
        -> Candidate Builder
        -> Remotion Validation Worker
        -> Human Review
        -> Library Publisher
```

Each worker should produce a schema-validated artifact rather than passing unstructured prose.

## 17. Suggested CLI

```bash
lucida reference ingest \
  --input ./reference.mp4 \
  --source-url "https://example.com/video" \
  --rights internal-reference \
  --analysis style,motion
```

Follow-up commands:

```bash
lucida reference segment ref-20260711-001
lucida reference analyze ref-20260711-001
lucida reference normalize ref-20260711-001
lucida reference validate ref-20260711-001
lucida reference review ref-20260711-001
lucida reference publish ref-20260711-001
```

## 18. MVP implementation order

1. Manifest schema and content hashing.
2. FFmpeg/ffprobe normalization.
3. PySceneDetect segmentation.
4. Keyframe and contact-sheet generation.
5. Visual observation schema and VLM prompt.
6. Motion observation using frame differences and OpenCV optical flow.
7. Rule-based mapping to existing Lucida tags and presets.
8. Rights/provenance gate.
9. Remotion validation composition.
10. Human review page.
11. HISTORY automation.
12. Optional TransNetV2 fallback and learned ranking.

## 19. Success criteria

The MVP is successful when it can take one authorized reference video and produce:

- a valid manifest
- editable shot boundaries
- a compact evidence set
- separate observed/inferred Style data
- measured Motion observations
- normalized Lucida candidate IDs
- provenance and rights notes
- a deterministic Remotion validation render
- a human review decision
- an appended HISTORY entry

The guiding rule is:

> Observe -> abstract -> normalize -> reconstruct. Do not copy the source scene as a finished template.
