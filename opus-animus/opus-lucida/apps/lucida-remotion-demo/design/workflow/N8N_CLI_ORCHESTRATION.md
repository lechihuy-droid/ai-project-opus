# n8n + CLI Orchestration Architecture

## Decision

Lucida uses **n8n as the workflow orchestrator** and keeps AI reasoning and implementation work in local CLI workers.

The production path does not require an LLM API key for the MVP:

- n8n coordinates state, gates, retries, approvals, and artifact movement.
- Claude Code performs semantic and creative planning tasks.
- Codex CLI performs repository-scoped implementation, repair, and validation tasks.
- Whisper produces the word-level timing source of truth.
- Remotion compiles deterministic video output from validated specifications.
- FFmpeg handles media probing, normalization, and post-processing.

## Runtime topology

```text
User / Manual Trigger / Scheduled Trigger
                  |
                  v
                n8n
     orchestration and run control
                  |
      +-----------+-----------+
      |           |           |
      v           v           v
Claude Code   Codex CLI   Deterministic workers
  planning    implementation  Whisper / FFmpeg / Remotion
      |           |           |
      +-----------+-----------+
                  |
                  v
        versioned workflow artifacts
                  |
                  v
      validation -> approval -> publish
```

## Responsibility boundaries

### n8n

n8n owns workflow execution, not creative generation or rendering logic.

Responsibilities:

- trigger and resume runs
- invoke CLI commands
- pass explicit artifact paths
- validate command exit status
- validate JSON against schemas
- enforce gate entry and exit criteria
- apply retry, timeout, and failure-routing policies
- pause at human approval gates
- record events, run state, artifact versions, and hashes
- call render and publishing commands

n8n must not:

- generate free-form scene specifications inside a single opaque agent node
- mutate `VideoSpec` without the owning gate
- infer success only from natural-language CLI output
- control frame timing, subtitle layout, or animation parameters directly

### Claude Code

Claude Code is the primary semantic and creative CLI worker.

Preferred tasks:

- source synthesis and script refinement
- creative brief generation
- story and scene planning
- visual direction and asset requirements
- critique of script, pacing, visual density, and repetition
- revision planning from human review notes

Claude Code must return schema-bound artifacts or write them to explicit output paths. It must not directly publish, bypass approval gates, or modify renderer internals unless the task explicitly assigns repository implementation work.

### Codex CLI

Codex CLI is the primary repository implementation and engineering-repair worker.

Preferred tasks:

- implement approved scene plans in the Remotion codebase
- add or modify registered components and adapters
- repair TypeScript, schema, render, and test failures
- run type checks, tests, linting, and preview renders
- apply localized revisions without changing approved upstream artifacts

Codex must be restricted to the repository and to the files allowed by the task. It must report validation results through machine-readable files and command exit codes.

### Deterministic workers

- **Whisper:** transcript alignment and word timing
- **FFmpeg:** media probe, conversion, normalization, audio muxing, and post-processing
- **Remotion:** frame-deterministic composition and rendering
- **Schema validators:** contract validation before state transitions

These workers are authoritative for measurable outputs. LLM workers may interpret their results but may not replace them with guessed values.

## Canonical execution flow

```text
G00 Initialize project
 -> G01 Normalize approved script and project configuration
 -> G02 Generate voice, run Whisper, lock TimedScript and captions
 -> G03 Claude Code creates CreativeBrief
 -> G04 Claude Code creates StoryPlan
 -> G05 Claude Code creates SceneRequirements
 -> G06 Resolve assets and registered style/motion packages
 -> G07 Claude Code creates CreativePlan
 -> G08 Codex CLI creates ImplementationPlan and applies repository changes
 -> G09 Compile immutable VideoSpec
 -> G10 Remotion preview render and automated checks
 -> G11 Claude Code critique + human approval + localized revision routing
 -> G12 final render, PublicationBundle, and publication approval
```

## Command contract

Each n8n Execute Command node calls one task wrapper instead of embedding long prompts directly in the workflow.

Example:

```bash
./scripts/run-ai-task.sh \
  --worker claude \
  --task prompts/create-story-plan.md \
  --input runs/$RUN_ID/artifacts/creative-brief.json \
  --output runs/$RUN_ID/artifacts/story-plan.json \
  --schema schemas/story-plan.schema.json
```

Implementation example:

```bash
./scripts/run-ai-task.sh \
  --worker codex \
  --task prompts/implement-video-spec.md \
  --input runs/$RUN_ID/artifacts/video-spec.json \
  --output runs/$RUN_ID/reports/implementation-result.json \
  --schema schemas/implementation-result.schema.json
```

The wrapper must:

1. resolve absolute repository and run paths
2. invoke the selected CLI in non-interactive mode
3. capture stdout and stderr to run-scoped logs
4. enforce a timeout
5. validate the expected output file
6. return non-zero on missing or invalid output
7. emit a compact machine-readable execution result

## Artifact exchange

CLI workers exchange data through versioned files, never hidden conversation state.

Recommended run structure:

```text
runs/<run-id>/
  input/
  artifacts/
    approved-script.json
    project-spec.json
    timed-script.json
    creative-brief.json
    story-plan.json
    scene-requirements.json
    resource-plan.json
    creative-plan.json
    implementation-plan.json
    video-spec.json
    publication-bundle.json
  reviews/
  reports/
  logs/
  previews/
  renders/
```

Every artifact must include or be associated with:

- run ID
- schema version
- artifact version
- producer and producing gate
- input dependency hashes
- creation timestamp
- validation status

## n8n workflow design

Use one parent workflow and small sub-workflows:

- `create-video-parent`
- `run-claude-task`
- `run-codex-task`
- `run-whisper-alignment`
- `validate-artifact`
- `render-preview`
- `render-final`
- `human-approval`
- `publish-output`
- `handle-workflow-error`

The parent workflow passes `runId`, `gateId`, artifact paths, schema path, and retry count. Sub-workflows must remain stateless beyond the supplied run context.

## Approval and revision routing

Human approval remains mandatory after:

- Story Planning
- Creative Resolution
- Preview Critique
- Publication preparation

A rejected preview must not restart the full pipeline by default. n8n determines the smallest affected gate from the changed artifact and routes execution backward according to the workflow state machine and dependency hashes.

Examples:

- caption timing issue -> G02
- weak scene concept -> G04 or G05
- wrong asset or visual package -> G06 or G07
- TypeScript or render failure -> G08 or G10
- publication metadata issue -> G12

## Security and execution constraints

- Run n8n and both CLIs under a dedicated local account or isolated worker environment.
- Do not expose Execute Command workflows directly to untrusted public input.
- Allowlist commands, task files, schemas, and repository paths.
- Never interpolate raw user text into shell commands.
- Pass user content through files or safely encoded parameters.
- Keep Claude Code and Codex authentication outside the repository.
- Do not commit CLI credentials, session files, raw private media, or run logs.
- Use repository-scoped permissions and explicit working directories.

## Deployment stages

### Stage 1 — Local MVP

- n8n installed locally
- Claude Code and Codex CLI authenticated on the same machine
- Execute Command nodes call task wrappers
- run artifacts stored in the local project workspace
- manual approval through n8n

### Stage 2 — Local worker separation

- n8n remains the controller
- CLI and render tasks move behind a local worker service
- n8n calls allowlisted HTTP endpoints
- long-running renders use polling or callback events

### Stage 3 — Production scale

- queue-backed workers
- external artifact storage
- PostgreSQL-backed n8n
- concurrency limits per worker type
- centralized observability and audit logs
- isolated rendering environments

LangGraph is not part of the MVP. It may be introduced later only if semantic workers require complex autonomous loops, checkpointed reasoning, or dynamic multi-agent routing that is no longer maintainable as explicit n8n gates.

## Acceptance criteria

This architecture is implemented correctly when:

- the complete create flow can run without an LLM API key
- each AI task is invokable non-interactively through Claude Code or Codex CLI
- each gate produces a schema-valid, versioned artifact
- n8n can pause and resume at human approval gates
- failures route to the smallest affected gate
- subtitle timing is sourced from Whisper and remains deterministic in Remotion
- final rendering does not depend on free-form LLM output at runtime
