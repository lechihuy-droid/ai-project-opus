# Remotion Script-To-Video Flow Tracking Draft

**Status:** Draft tracking  
**Date:** 2026-07-09  
**Scope:** Remotion short-video generation from script plus optional raw sources  
**Role:** Working note for how the new skill workflow should operate end-to-end  
**Owner layer:** Skill workflow reference  
**Parent:** `ai/skills/remotion-script-to-video/SKILL.md`  
**Supersedes:** None  
**Superseded by:** None  

## Purpose

Track the intended operating flow for generating a Remotion video from:

```text
script
URLs
GitHub repos
PDFs
screenshots
image references
local media assets
```

This file is not the project-wide Lucida production SOP. It is a draft reference for the Remotion skill workflow.

## Core Principle

Do not jump directly from raw input to React.

Use typed intermediate artifacts:

```text
raw inputs
-> clean-brief.json
-> video-map.json
-> Remotion source
-> still frames
-> QA report
-> MP4
```

The LLM decides content and mapping through JSON. The renderer owns layout, animation, spacing, arrows, and subtitle behavior.

## Stage 1: Source Ingestion And Cleaning

**Skill:** `source-ingestor-cleaner`

**Input:**

```text
raw script
URLs
GitHub repos
PDFs
screenshots
images
local files
user notes
```

**Output:**

```text
clean-brief.json
```

**Responsibility:**

- Inventory every source.
- Classify each source automatically.
- Clean noisy input before mapping.
- Extract factual claims, entities, mechanisms, use cases, caveats.
- Extract visual direction from images without copying them by default.
- Separate `visualReferences` from `usableAssets`.

**Source usage classes:**

```text
content_truth   = source supports factual claims or content structure
style_reference = source guides mood/layout/color/composition only
embed_asset     = source can be used directly inside video
context_only    = source helps understanding but should not render
ignore          = source is irrelevant, duplicate, unsafe, or low-signal
```

**Important rule:**

Images default to `style_reference`. Promote to `embed_asset` only when user supplied/owns the file or explicitly wants it embedded.

## Stage 2: Script-To-Template Mapping

**Skill:** `script-template-mapper`

**Input:**

```text
clean-brief.json
target duration
style direction
platform constraints
```

**Output:**

```text
video-map.json
```

**Responsibility:**

- Split script into intent-based scenes.
- Choose template archetype per scene.
- Use visual references as style guidance.
- Use usable assets only when they improve the scene.
- Keep long narration in subtitles, not cards.
- Add `reason` for each template decision.

**Template mapping examples:**

```text
hook -> hero_title / kinetic_typography
failure modes -> warning_card_stack
old vs new -> split_screen_compare
step sequence -> process_timeline
orchestrator + subagents -> hub_spoke_diagram
network relationship -> node_graph
JavaScript explanation -> code_panel
three principles -> numbered_cards
use cases -> use_case_carousel
summary -> recap_cards
```

**Important rule:**

Do not map every scene to a diagram. Diagram is only for relationships, systems, agents, flows, and dependencies.

## Stage 3: Remotion Build

**Skill:** `remotion-video-builder`

**Input:**

```text
video-map.json
Remotion app path
target composition id
```

**Output:**

```text
src/data.ts
src/Composition.tsx
src/Root.tsx
out/video.mp4
```

**Responsibility:**

- Convert `video-map.json` into typed data.
- Implement or reuse template components.
- Use a template registry keyed by `scene.template`.
- Keep layout deterministic.
- Render subtitles as narration.
- Keep visual stage separate from subtitle zone.

**Component registry target:**

```text
hero_title
kinetic_typography
warning_card_stack
split_screen_compare
process_timeline
hub_spoke_diagram
node_graph
code_panel
numbered_cards
use_case_carousel
recap_cards
```

**Important rule:**

Do not accept arbitrary freehand coordinates from LLM JSON. Components compute layout.

## Stage 4: Visual QA

**Skill:** `remotion-visual-qa`

**Input:**

```text
video-map.json
out/video.mp4
out/check-*.png
```

**Output:**

```text
QA findings
patch list
render-report.json
```

**Responsibility:**

- Check scene template matches narration.
- Check subtitle continuity.
- Check safe area.
- Check overlap.
- Check arrow alignment.
- Check visual density.
- Check if reference images were copied too directly.

**Frame checks:**

```text
scene start
scene midpoint
transition-heavy frames
final recap
```

## Failure Routing

| Failure | Route Back To |
|---|---|
| Raw source misunderstood | `source-ingestor-cleaner` |
| Third-party image copied too directly | `source-ingestor-cleaner` |
| Useful local image not embedded | `source-ingestor-cleaner` |
| Scene uses wrong template | `script-template-mapper` |
| Scene is too dense | `script-template-mapper` |
| Cards overlap | `remotion-video-builder` |
| Arrows do not connect correctly | `remotion-video-builder` |
| Subtitle is blank or unreadable | `remotion-video-builder` |
| Render fails | `remotion-video-builder` |
| QA lacks enough frames | `remotion-visual-qa` |

## Artifact Contract

Minimum output set for a completed run:

```text
clean-brief.json
video-map.json
out/video.mp4
out/check-*.png
out/render-report.json
```

For implementation runs, source files should also be updated:

```text
src/data.ts
src/Composition.tsx
src/Root.tsx
```

## Current Skill Map

```text
remotion-script-to-video
  -> source-ingestor-cleaner
  -> script-template-mapper
  -> remotion-video-builder
  -> remotion-visual-qa
```

Related specialized skill:

```text
remotion-diagram-video
```

Use `remotion-diagram-video` only for focused diagram/card/arrow revisions, not as the full script-to-video orchestrator.

## Open Tracking Items

- Decide whether `clean-brief.json` and `video-map.json` should live in `apps/lucida-remotion-demo/src/` or `apps/lucida-remotion-demo/out/`.
- Add a lightweight JSON validator for `clean-brief.json`.
- Add a lightweight JSON validator for `video-map.json`.
- Consider a script to export still frames at scene boundaries automatically.
- Consider a render report generator that records duration, frames checked, and QA status.
