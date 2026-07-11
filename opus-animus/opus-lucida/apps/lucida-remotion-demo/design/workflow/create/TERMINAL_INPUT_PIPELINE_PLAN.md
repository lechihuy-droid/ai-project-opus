> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# Terminal Input Pipeline Plan

Version: 0.1
Status: Proposed
Owner: Opus Lucida

## Purpose

Define a deterministic pipeline that collects terminal-oriented sources, sanitizes and normalizes them, maps them into Lucida scene requirements, and supplies versioned input to the existing Remotion workflow.

The pipeline does not embed Reveal.js, terminal emulators, or third-party CSS frameworks in the renderer. External sources provide content, timing, design tokens, or component references. Lucida converts them into its own contracts before render.

## Scope

Included: approved script excerpts, bounded repository inspection, allowlisted command output, local asciinema `.cast` recordings, curated terminal theme references, sanitization, normalization, scene mapping, validation, preview, render, cache, and resume.

Excluded from MVP: Reveal.js embedding, live shell access from Remotion, network crawling during render, arbitrary LLM-generated commands, global third-party CSS imports, and automatic publication.

## Workflow Position

```text
ApprovedScript + ProjectSpec
  -> G06 Resource Plan
  -> T01 Collect Terminal Inputs
  -> T02 Sanitize
  -> T03 Normalize
  -> T04 Map Terminal Scenes
  -> G07 Creative Resolution
  -> G08 Resource Binding
  -> G09 VideoSpec Compile
  -> G10 Preview & Validation
  -> G11 Render
```

G06 owns source permission. T01-T03 own acquisition and normalization. T04 creates renderer-independent scene requirements. G07-G08 approve and bind resources. G09 compiles renderer input. G10-G11 remain the preview and render gates.

## Design Rules

1. Collectors acquire facts; they do not choose layouts.
2. Remotion receives validated JSON, never a live repository or shell.
3. Every artifact records provenance, checksum, schema version, and worker version.
4. A failed step cannot leave downstream output marked valid.
5. Secret detection is a hard failure.
6. Timing is normalized once and reused by preview and final render.
7. Third-party themes become curated Lucida tokens.
8. LLM workers may classify and summarize but may not invent command output.
9. Runs resume from the first invalid or missing artifact.
10. Source changes invalidate only dependent artifacts.

## Source Contracts

### Script

Input: approved script artifact, excerpt IDs, and locked timeline references.

Output: narrative intent, concepts, emphasis, and permitted labels. Every excerpt retains its source reference.

### Repository

Input: approved root, include/exclude patterns, file/byte limits, and optional commit SHA.

Output: directory entries, selected code excerpts, package metadata, and architecture relationships. Exclude Git metadata, environments, dependencies, caches, generated output, credentials, binaries, and runtime logs.

### Command

Input: allowlisted executable and argument array, approved working directory, timeout, environment allowlist, and exit-code policy.

Output: command text, stdout/stderr chunks, exit code, and timestamps. Untrusted content cannot supply executable commands.

### Asciicast

Input: local `.cast`, idle-time limit, optional markers, and playback speed.

Output: geometry, output, markers, resize events, optional input events, and theme metadata. Input events are disabled by default because they may contain passwords.

### Theme Reference

Input: approved repository revision, selected files, license, and attribution.

Output: color, typography, border, spacing, glow, scanline, and component recipe candidates. Production consumes only approved Lucida tokens.

## Run Configuration

```json
{
  "schemaVersion": "terminal-flow/v1",
  "projectId": "terminal-demo",
  "fps": 30,
  "themeId": "lucida-command/v1",
  "sources": [
    { "id": "script", "type": "script", "artifactId": "approved-script:v3" },
    {
      "id": "tests",
      "type": "command",
      "command": "npm",
      "args": ["test"],
      "timeoutSeconds": 120
    },
    {
      "id": "demo",
      "type": "asciicast",
      "path": "inputs/demo.cast",
      "captureInputEvents": false,
      "idleTimeLimitSeconds": 1.5
    }
  ],
  "mapping": {
    "allowedPresets": ["command", "dashboard", "architecture", "code"],
    "defaultPreset": "command",
    "minSceneSeconds": 3,
    "maxSceneSeconds": 8,
    "maxLinesPerScene": 10
  }
}
```

## Run Artifacts

```text
pipeline/runs/<run-id>/
  manifest.json
  01-raw-input.json
  02-sanitized-input.json
  03-normalized-input.json
  04-terminal-scenes.json
  05-video-map.json
  06-validation.json
  preview/
  output/
  report.json
```

The run directory is ignored by Git. Approved resources move into the artifact store through G08.

## Canonical Data

Normalized event:

```json
{
  "id": "event-0042",
  "sourceId": "demo",
  "sourceRef": "inputs/demo.cast#event-18",
  "kind": "output",
  "level": "success",
  "timeSeconds": 1.24,
  "frame": 37,
  "text": "Composition loaded",
  "styleRuns": [],
  "provenance": {
    "sourceChecksum": "sha256:...",
    "collectorVersion": "asciicast-collector/1"
  }
}
```

Initial event kinds: `command`, `output`, `log`, `code`, `tree`, `metric`, `marker`, and `resize`.

Terminal scene:

```json
{
  "sceneId": "terminal-scene-01",
  "preset": "command",
  "themeId": "lucida-command/v1",
  "title": "agent-runtime",
  "path": "~/opus-lucida",
  "durationInFrames": 180,
  "blocks": [
    {
      "kind": "command",
      "at": 12,
      "text": "npm run render",
      "sourceEventIds": ["event-0001"]
    },
    {
      "kind": "log",
      "at": 48,
      "level": "success",
      "text": "Composition loaded",
      "sourceEventIds": ["event-0042"]
    }
  ]
}
```

Initial block kinds: `command`, `output`, `log`, `code`, `tree`, `progress`, and `metric`.

## Sequential Execution

### T00 - Initialize

Validate configuration, generate run ID, create the manifest, resolve paths/checksums, and verify source permissions and command allowlists.

Exit: supported source types, approved roots, allowlisted commands, and manifest status `running`. Configuration defects return to G06.

### T01 - Collect

Run in order: script, repository, command, asciicast, then theme reference.

Output: `01-raw-input.json`.

Exit criteria:

- at least one content source succeeds
- all required sources succeed
- size/count limits pass
- command timeout and exit code are recorded
- every record has provenance

Optional failures require a warning policy. Required-source failures return to G06.

### T02 - Sanitize

Detect credentials, tokens, cookies, private keys, and authorization headers; redact approved low-risk identifiers; reject secrets, path traversal, binaries, and unsupported controls; retain ANSI styling only as parsed data.

Output: `02-sanitized-input.json` plus findings.

Exit: no high-confidence secret remains, redactions are traceable, and raw input remains immutable. Secret findings stop the run.

### T03 - Normalize

Convert records to canonical events, map seconds to frames, cap idle gaps, merge granular chunks, wrap lines, classify logs, parse ANSI styles, retain markers, and resolve geometry changes.

Output: `03-normalized-input.json`.

Exit: monotonic frames, valid style ranges, complete provenance, and recorded timing transformations. Malformed sources return to T01; timeline conflicts return to G02.

### T04 - Map Terminal Scenes

Match events to approved story beats, group by marker/topic/duration, select a preset, trim repetition without changing facts, derive titles from approved content, attach event IDs, and report omissions.

Preset rules:

- `command`: sequential commands and output dominate
- `dashboard`: metrics, statuses, and logs dominate
- `architecture`: tree and dependency relationships dominate
- `code`: one code excerpt with limited explanation dominates

Output: `04-terminal-scenes.json`.

Exit: duration/content limits pass, every block has provenance, no output is invented, and preset/theme IDs resolve. Excessive content receives one constrained retry.

### T05 - Resolve and Bind

Run through G07-G08. Approve preset/theme, bind React components, fonts, captions, transitions, and sound, record licenses, and replace temporary references with immutable artifacts.

Outputs: existing `CreativePlan` and `ImplementationPlan`.

### T06 - Compile

Run through G09. Compile scenes into `VideoSpec`, generate `video-map.json`, calculate duration from the locked timeline, and bind registered templates.

Exit: schemas pass, IDs exist in `templateRegistry.tsx`, ranges are valid, and duration matches audio/captions.

### T07 - Validate and Preview

Run through G10 with schema, semantic/provenance, renderer-contract, representative-frame, and visual validation.

Visual QA checks overflow, glyphs, fonts, safe areas, caption overlap, readability, blank/duplicate scenes, and deterministic output.

Outputs: `06-validation.json`, preview/contact sheet, and `PreviewBundle`.

### T08 - Render and Report

Run through G11. Render validated `VideoSpec`, record versions, calculate checksum, and persist metrics, warnings, and diagnostics.

Outputs: final video, `RenderReport`, and `report.json`.

## Orchestrator

```text
npm run terminal-flow -- --config pipeline/config/terminal-flow.json
```

Required modes:

```text
--dry-run
--stop-after collect
--stop-after normalize
--no-render
--resume <run-id>
--from <step> --run <run-id>
```

The orchestrator invokes steps, persists state atomically, enforces criteria, applies retry/cache policy, and exits non-zero on hard failure. Parsing and mapping remain dedicated modules.

## State, Cache, and Retry

```text
created -> collecting -> sanitizing -> normalizing -> mapping
  -> binding -> compiling -> validating -> awaiting_approval
  -> rendering -> completed
```

Terminal states: `completed`, `failed`, `cancelled`, and `superseded`.

Cache keys include implementation version, relevant configuration, input checksums, policies, and schemas.

- source change invalidates T01 onward
- sanitization-policy change invalidates T02 onward
- FPS change invalidates T03 onward
- script timing change invalidates T04 onward
- theme-token change invalidates G08 and render output
- component change invalidates preview/render only

Retry policy: command/transient file lock once; no automatic retry for secrets/parser failures; one stricter retry for scene constraints; shared Lucida policy for preview/render infrastructure errors.

## Security and Observability

- execute allowlisted binaries with argument arrays
- resolve paths inside approved roots
- deny environment variables by default
- disable asciinema input events by default
- exclude runtime artifacts from Git
- never log detected secret values
- keep collectors read-only
- disable network unless policy permits it
- record third-party revision, license, and attribution

Each run reports source types, bytes, redactions, normalized events, omissions, scenes, presets, cache hits, step durations, warnings, failure owner, and output paths.

## Implementation Phases

### Phase 1 - Contracts

Deliver configuration, raw/sanitized/normalized/scene schemas, manifest state, artifact writer, fixtures, and tests.

Acceptance: valid fixtures pass; invalid timing, provenance, enum, and path fixtures fail.

### Phase 2 - MVP Collectors

Deliver script, command, and asciicast v2 collectors.

Acceptance: command output/exit status are preserved; asciicast timing, markers, output, and resize parse; input events remain excluded.

### Phase 3 - Sanitize and Normalize

Deliver sensitive-data policy, ANSI parser boundary, frame conversion, idle-gap handling, and deterministic classification.

Acceptance: secret fixtures stop the run; timing is reproducible; style ranges remain valid.

### Phase 4 - Scene Mapper

Deliver grouping, four preset selectors, constraints, and provenance-preserving trimming.

Acceptance: every block links to events; output is not invented; identical inputs produce identical scenes.

### Phase 5 - Lucida Integration

Deliver G07/G08 bindings, G09 compiler support, `video-map.json` compatibility, and `templateRegistry.tsx` registrations.

Acceptance: scenes load in Remotion Studio, IDs resolve, and duration matches `VideoSpec`.

### Phase 6 - Preview and Orchestration

Deliver preview rendering, layout checks, orchestrator, resume, and cache.

Acceptance: failed runs resume without repeating valid upstream work; preview failure blocks final render.

### Phase 7 - Repository and Theme Ingestion

Deliver bounded repository collector, curated theme-token extractor, and license records.

Acceptance: excluded paths never enter artifacts; output contains Lucida tokens, immutable revision, and license metadata.

## MVP Definition

One command must:

1. load an approved script, one allowlisted command, and one local asciicast
2. collect and sanitize inputs
3. normalize events at project FPS
4. produce `command`, `dashboard`, `architecture`, or `code` scenes
5. compile through the existing `VideoSpec` path
6. validate and render representative preview frames
7. stop before production render unless approval policy permits it
8. resume without repeating valid upstream work

Repository crawling and automatic theme extraction are not required for MVP.

## Definition of Done

- versioned contracts and schemas
- source boundaries enforced
- sensitive data hard-stops
- complete event provenance
- deterministic scene output
- all IDs resolve through `video-map.json` and `templateRegistry.tsx`
- preview QA covers Lucida target aspect ratios
- retry, cache, and resume follow shared policies
- tests cover malformed sources, secrets, timeout, invalid timing, missing templates, and render failure
- runtime artifacts and secrets remain outside Git

## Decisions Before Implementation

1. Embed terminal scenes in `VideoSpec` or reference a separate versioned artifact.
2. Select and license-check the ANSI parser.
3. Confirm the approval gate before G11.
4. Choose the canonical location for terminal theme tokens.
5. Support asciicast v2 only or v2 plus v3.
6. Run commands in the main workspace or an isolated worktree/container.
7. Define terminal and caption safe areas for vertical video.

Decisions 1, 3, 4, and 6 must be resolved before implementation because they affect contracts, security boundaries, and workflow ownership.

## Implementation Progress

### Step 1 - Contracts and deterministic core

Status: Completed.

Recorded results:

- added general visual-flow TypeScript contracts
- added JSON Schema 2020-12 definitions for flow, normalized events, and scenes
- added valid and invalid fixtures
- added dependency-free contract validator
- verified with `npm run validate:visual-contracts`
- verified TypeScript and ESLint with `npm run lint`

The contract is broader than terminal and supports editorial, infographic, dashboard, code, data visualization, product demo, and cinematic typography sources.

### Step 2 - MVP collectors

Status: Completed.

Deliverables:

- script collector
- allowlisted command collector using executable plus argument arrays
- asciicast v2 collector with input events excluded by default
- sequential runner producing `01-raw-input.json`
- collector fixtures and tests

Verified results:

- `npm run test:visual-collectors` passed
- `npm run validate:visual-contracts` passed
- `npm run lint` passed
- sequential fixture run collected `script`, `command`, and `asciicast`
- generated artifact uses `raw-visual-input/v1`
- asciicast input-event fixture was excluded from output
- collection completed with zero warnings


### Step 3 - Sanitization and normalization

Status: Completed.

Deliverables:

- recursive sensitive-content scanner with hard-stop findings
- user-home path redaction and unsupported-control cleanup
- deterministic ANSI SGR parser producing plain text and style runs
- source-record normalization into general visual events
- idle-gap clamping and seconds-to-frame conversion
- resize geometry parsing and provenance preservation
- sequential processor producing `02-sanitized-input.json` and `03-normalized-input.json`

Verified results:

- `npm run test:visual-processors` passed
- `npm run validate:visual-contracts` passed
- `npm run lint` passed
- fixture pipeline normalized 8 events
- output kinds: `narrative`, `output`, `marker`, and `resize`
- every normalized event retains provenance
- no raw ANSI escape remains in normalized output
- fixture completed with zero warnings


### Step 4 - Visual scene mapper

Status: Completed.

Deliverables:

- general visual scene mapper
- terminal and editorial mapping for the MVP fixture
- provenance-backed scene blocks
- deterministic family and preset selection
- compiler from visual scenes to the existing Lucida `VideoMap`

Verified results:

- `npm run test:visual-mapper` passed
- fixture produced 2 scenes
- compiled templates: `animated-list` and `code-panel`
- compiled duration: 9.1 seconds

### Step 5 - Lucida integration

Status: Completed.

Deliverables:

- Remotion composition accepts generated `videoMap` through input props
- default checked-in `video-map.json` remains the fallback
- `calculateMetadata` resolves generated duration, FPS, width, and height
- generated `render-props.json` does not overwrite the current production map
- generated template validation reads the canonical registry map

Verified results:

- generated VideoMap validation passed
- TypeScript and ESLint passed
- every generated template resolves in the catalog and adapter registry

### Step 6 - Orchestration

Status: Completed through validation.

Deliverables:

- one `visual-flow` command for collect, sanitize, normalize, map, compile, validate, preview, and render
- `--no-preview` and `--no-render` controls
- per-run report with stage status
- generated validation report

Verified end-to-end run:

- run ID: `full-pipeline-test-4`
- 3 sources collected
- 8 normalized events
- 2 visual scenes
- 9.1-second compiled VideoMap
- collect through validation completed successfully

### Step 7 - Preview and render

Status: Blocked by local Remotion process execution.

Observed evidence:

- Remotion inside the sandbox fails when esbuild starts with `spawn EPERM`
- Remotion outside the sandbox no longer reports EPERM but hangs before emitting logs or frames
- standalone `npm run build` exhibits the same hang
- no preview frame or final video was produced
- JSON contracts, mapper, compiler, registry validation, TypeScript, and ESLint all pass

Resume command after the local Remotion/esbuild process issue is cleared:

```text
npm run visual-flow -- --config pipeline/fixtures/collector-flow.json --run-id full-render-test
```
