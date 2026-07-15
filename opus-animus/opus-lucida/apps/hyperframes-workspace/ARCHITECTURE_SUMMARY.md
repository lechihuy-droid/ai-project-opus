# Architecture Summary

## Core package layout

- `packages/cli`
  - User-facing command surface
  - Commands for `preview`, `render`, `init`, `lint`, `capture`, `lambda`, and cloud workflows

- `packages/core`
  - Shared contracts
  - Composition metadata types
  - Timing model
  - Runtime artifacts and helpers

- `packages/parsers`
  - HTML composition parsing
  - Slideshow parsing
  - Variable scanning
  - Asset path normalization

- `packages/engine`
  - Chrome capture
  - BeginFrame and screenshot capture paths
  - FFmpeg integration
  - Video frame extraction
  - Audio and media utilities

- `packages/producer`
  - Main render orchestrator
  - Pipeline stages:
    1. compile
    2. browser probe
    3. extract videos
    4. process audio
    5. capture frames
    6. encode
    7. assemble

- `packages/player`
  - Embeddable player and slideshow web component

- `packages/studio`
  - Browser editing surface
  - Timeline UI
  - Block browser
  - Composition editing
  - Preview and render controls

- `packages/studio-server`
  - Server routes and helpers used by Studio

- `packages/aws-lambda` and `packages/gcp-cloud-run`
  - Remote render packaging and deployment targets

## CLI

- Entry point lazily loads commands from the CLI package.
- The CLI handles argument parsing, environment checks, browser resolution, and routing to producer workflows.
- Local preview and local render are the two primary commands for authoring.

## Render pipeline

1. CLI resolves the project.
2. `core` and `parsers` compile HTML timing and composition metadata.
3. `producer` creates a render job.
4. `engine` launches Chrome, captures frames, and invokes FFmpeg.
5. `producer` assembles the final deliverable.

## Composition model

- A composition is plain HTML.
- Timing is driven by attributes such as:
  - `data-start`
  - `data-duration`
  - `data-end`
  - `data-track-index`
- Animation can be driven by CSS, WAAPI, GSAP, Lottie, Three.js, or custom code.

## AI Video Engine layer

- `scene-schema/hyperframes.scene.schema.json` is the LLM-facing contract.
- `renderer/scene-json-to-hyperframes.mjs` compiles declarative Scene JSON into a normal HyperFrames project with `index.html` and `meta.json`.
- `renderer/render-project.mjs` renders any generated or hand-written project through `@hyperframes/producer`.
- The validated path is now:
  1. LLM or user writes Scene JSON
  2. Compiler emits HyperFrames composition files
  3. Producer renders MP4 output
  4. FFprobe and frame extraction verify the artifact

## Timeline and animation

- Timeline state is encoded in HTML attributes and runtime helpers rather than a separate proprietary scene language.
- Studio adds visual editing over the same underlying composition contract.
- The producer resolves deterministic frame timing before capture.

## Asset management

- Remote assets can be localized before capture.
- Fonts are normalized and injected for deterministic rendering.
- Asset paths are rewritten to safe project-local paths.

## Player

- `player` is a reusable runtime for preview and embed use cases.
- It shares the same composition contract as the renderer.

## Studio

- Studio is the interactive authoring layer on top of the same rendering primitives.
- It combines file editing, preview, timeline control, block browsing, and render actions.

## Lambda render

- Cloud render support exists, but this workspace is configured and validated for local authoring first.
- Lambda and Cloud Run packages package Chrome, FFmpeg, and render entrypoints for remote execution.

## Catalog and block system

- Registry types classify reusable units as examples, blocks, or components.
- Blocks are reusable standalone sub-compositions.
- Components are reusable fragments merged into larger compositions.
- This is the distribution layer that powers reusable launch content.

## Reference repo patterns

### `hyperframes-launches`

- Project-per-video structure
- Reusable compositions and local asset folders
- Strong emphasis on launch-story sequencing and polished motion

### `website-to-hyperframes-demo`

- Single entry `index.html`
- `meta.json` for video metadata
- Storyboard-first workflow with `STORYBOARD.md`
- Good reference for converting structured content into scenes
