# Style RAG Phase 1 Standard: 14 Renderable Packages

- **Owner:** Sol, standards and final acceptance only
- **Execution:** Terra collects, classifies, and implements bounded batches
- **Independent verification:** Luna
- **Status:** approved implementation standard
- **Scope:** visual-style evidence only; factual evidence remains a separate domain

## 1. Goal

Phase 1 expands the approved visual-style corpus and renderer vocabulary to:

- exactly 14 production renderable packages;
- 4-8 variants per package, with a Phase 1 target of 5 each;
- exactly 70 target variants;
- 300-600 approved visual patterns, with a Phase 1 target of 420;
- 100 unique approved visual-style sources;
- at least three source types represented for every package;
- package and variant selection that is evidence-backed, deterministic, capacity-safe, and renderer-supported.

The 100-source target means 100 unique canonical sources after approval, not raw candidates. Terra should collect 140-160 candidates to allow rejection and deduplication.

## 2. Role Boundary

Sol may define contracts, quotas, quality gates, evaluation methodology, and final acceptance findings. Sol must not collect sources, classify sources, assign sources to packages, or approve source quality.

Terra owns collection, sanitization, pattern extraction, classification proposals, package implementation, and remediation. Luna independently verifies provenance, rights metadata, deduplication, taxonomy fit, schema validity, renderer availability, retrieval metrics, and claimed counts. Human reviewers own source approval and final visual judgment.

## 3. Package Taxonomy

The existing nine package IDs remain backward compatible. Five content-job packages are added.

| Package | Content job | Required variants |
|---|---|---|
| `terminal-command-center` | CLI, agents, runtime, operations | `clean-cli`, `agent-runtime`, `system-monitor`, `cyberdeck`, `retro-crt` |
| `technical-editorial` | technical news and structured explanation | `technical-brief`, `annotated-explainer`, `data-essay`, `research-digest`, `evidence-grid` |
| `minimal-education` | teaching and compact explanation | `single-concept`, `step-sequence`, `comparison-cards`, `checklist`, `takeaway` |
| `cinematic-type` | hook, quote, reset, outro | `kinetic-hook`, `quote`, `chapter-reset`, `manifesto`, `outro` |
| `dashboard-data` | metrics and structured comparison | `benchmark-grid`, `operations-monitor`, `comparison-dashboard`, `trend-panel`, `scorecard` |
| `paper-notebook` | papers, derivations, working notes | `research-notes`, `derivation`, `annotated-paper`, `checklist`, `lab-log` |
| `product-showcase` | launch and product capability presentation | `product-hero`, `feature-reveal`, `before-after`, `capability-grid`, `launch-summary` |
| `editorial-collage` | multi-source visual story | `source-montage`, `culture-recap`, `visual-essay`, `quote-collage`, `multi-source-evidence` |
| `timeline-documentary` | sourced chronology and case history | `chronology`, `milestones`, `case-study`, `evolution`, `roadmap` |
| `system-architecture` | systems, agents, dependencies, data flow | `layered-stack`, `request-flow`, `agent-graph`, `data-pipeline`, `dependency-map` |
| `code-walkthrough` | code, APIs, diffs, debugging | `code-focus`, `diff-review`, `api-sequence`, `debugging-trace`, `terminal-code-split` |
| `news-rundown` | multi-story and weekly AI news | `headline-stack`, `top-stories`, `bulletin-grid`, `breaking-update`, `weekly-roundup` |
| `claim-evidence` | claim validation and source comparison | `claim-proof`, `pro-con`, `benchmark-audit`, `myth-reality`, `source-triangulation` |
| `interface-walkthrough` | inspectable UI and step-by-step product flow | `annotated-screen`, `step-flow`, `feature-tour`, `state-transition`, `before-after-ui` |

Package names are content-job contracts, not aesthetic labels. Palette, typography, motion, composition, and component patterns belong to variants and visual-pattern records.

## 4. Source and Pattern Quotas

Phase 1 must produce:

- 100 unique approved sources;
- 140-160 raw candidates before rejection;
- at least 7 approved source associations per package;
- at least 3 source types per package;
- no package dependent on one source for more than 25% of its pattern records;
- exactly 70 target variants;
- 20-40 visual patterns per package;
- approximately 30 patterns per package and 420 total.

Allowed source types are `repository`, `web`, `image`, and `theme`. A source may support multiple packages only when each association has separate evidence and classification reasons. Cross-package association does not increase the unique-source count.

## 5. Visual Pattern Contract

Each approved pattern must contain:

```text
patternId
packageId
variantIds
patternType
intentTags
beatRoles
contentDensity
aspectRatios
layoutTraits
typographyTraits
paletteTraits
motionTraits
componentTraits
contentCapacity
positiveUseCases
antiPatterns
sourceEvidenceIds
classificationReasons
classifierVersion
reviewStatus
```

`patternType` must be one of `layout`, `typography`, `palette`, `motion`, `component`, `composition`, `content-density`, `use-case`, or `anti-pattern`.

A pattern without approved evidence, classification reasons, content fit, and anti-fit guidance cannot enter canonical retrieval.

## 6. Renderable Package Gate

A package counts toward the total of 14 only when all of the following exist and pass:

1. versioned `style-package.json`;
2. component map and content-capacity contract;
3. runtime renderer registration;
4. 4-8 schema-valid variants;
5. deterministic fixtures for every variant;
6. 9:16 still render for every variant;
7. nonblank, dimension, overflow, and text-fit checks;
8. Director traits, intent mappings, hard rejection rules, and continuity rules;
9. at least seven approved source associations across three source types;
10. Luna independent verification.

RAG must never select a package or variant that fails renderer availability.

## 7. Collection and Approval Flow

```text
candidate registry
-> repository/web/image/theme collectors
-> immutable raw snapshots
-> sanitize and normalize
-> Terra pattern extraction and classification proposal
-> duplicate and rights checks
-> human source approval
-> canonical promotion
-> compile and SQLite projection
-> Luna coverage/retrieval/renderability verification
```

Raw collector output is never queryable production evidence. Human approval must bind the exact source revision or snapshot checksum and rights evidence. Source approval does not automatically approve every proposed pattern; rejected patterns remain outside the canonical index.

## 8. Evaluation Gates

### Corpus quality

| Metric | Phase 1 gate |
|---|---:|
| Unique approved visual-style sources | 100 |
| Primary/canonical or clearly attributable sources | >=80% |
| Provenance, checksum, and rights completeness | 100% |
| Duplicate source rate after promotion | <5% |
| Packages meeting source/type quota | 14/14 |
| Schema-valid variants | 70/70 |
| Approved visual patterns | 300-600; target 420 |
| Patterns with evidence and reasons | 100% |

### Retrieval and selection quality

The holdout set must contain at least three positive queries and two hard negatives per package, plus cross-package ambiguity cases.

| Metric | Phase 1 gate |
|---|---:|
| Package Recall@5 | >=0.90 |
| Package MRR | >=0.80 |
| Correct package Top-1 | >=0.85 |
| Correct variant Top-3 | >=0.80 |
| JSON/SQLite ranking parity | 100% |
| Visual/factual domain leakage | 0 |
| Unsupported renderer selection | 0 |
| Deterministic replay | 100% |

### Render and human quality

| Metric | Phase 1 gate |
|---|---:|
| Variant still technical QA | 70/70 |
| Blank or corrupt stills | 0 |
| Text overflow or capacity violation | 0 |
| Human content-style fit average | >=4/5 |
| Human readability average | >=4/5 |
| Individual reviewed variant below 3/5 | 0 |
| Auto-style override rate on canary videos | <20% |
| Five-scene layout diversity | >=3 layouts |
| Maximum consecutive identical layout | <=2 |

Technical QA cannot substitute for human visual approval.

## 9. Workload and Agent Gates

Work is split into bounded batches with disjoint write ownership:

1. contracts and variant schema;
2. five new package skeletons and renderer registry;
3. existing-package variant expansion;
4. candidate collection batches by source type;
5. classification batches by package group;
6. canonical approval and promotion batches;
7. retrieval gold/holdout evaluation;
8. 70-variant still QA and canary videos.

Each Terra batch must report exact files, source IDs, counts, rejected items, and commands. Each Luna batch must independently recompute counts and reject unsupported claims. Sol accepts only evidence produced by current artifacts and tests.

## 10. Completion Decision

Phase 1 is complete only when all numeric gates above are proven by canonical manifests, approval artifacts, retrieval evaluation reports, variant render reports, and human review records. A lower source count, a non-renderable package, inferred approval, raw candidate evidence, or a pattern without source evidence is incomplete rather than partial success.
