---
name: remotion-diagram-video
description: Use this skill to turn a long technical script or explanation into a vertical Remotion diagram video with structured scene data, deterministic layout, animated arrows, subtitle timing, render validation, and still-frame QA. Use for Codex, Claude, or other LLM agents working inside Lucida video/motion workflows.
---

# Remotion Diagram Video

Use this skill when asked to generate or revise a short vertical technical video in the Lucida Remotion app, especially when the output should feel like a dark tech diagram with cards, arrows, glow accents, and subtitles.

## Core Principle

Do not let the LLM directly place every visual element by freehand coordinates.

Use this flow:

```text
source script
-> scene breakdown
-> structured video input
-> deterministic layout pattern
-> Remotion render
-> still-frame QA
-> patch and render again
```

The main artifact is structured scene data. The renderer owns layout, arrows, spacing, subtitle behavior, and animation.

## Project Locations

Default Lucida Remotion app:

```text
apps/lucida-remotion-demo/
```

Useful reference template repo:

```text
apps/remotion-templates/templates/
```

Current output path:

```text
apps/lucida-remotion-demo/out/video.mp4
```

## Recommended Template References

Read only the needed templates:

```text
progress-steps.tsx       -> pipeline / step reveal
animated-list.tsx        -> staggered node entrance
typewriter-subtitle.tsx  -> subtitle reveal
line-chart.tsx           -> SVG draw pattern
```

## Workflow

1. Read current app files.

```powershell
Get-Content src\data.ts
Get-Content src\Composition.tsx
Get-Content src\Root.tsx
```

2. Break the source script into 6-10 scenes.

Default structure:

```text
hook
problem
old way
solution
mechanism
subagents / parallel work
use cases
summary
```

3. Create or update `src/data.ts`.

Use explicit fields:

```ts
VideoInput {
  title
  subtitle
  sourceBlocks
  scenes: VideoScene[]
}

VideoScene {
  id
  kicker
  title
  subtitle
  narration[]
  nodes[]
  links[]
  durationFrames
}
```

4. Map each scene to a deterministic diagram layout.

Do this in the renderer, not in ad hoc data coordinates. See `references/diagram-patterns.md`.

5. Keep screen zones fixed.

```text
top: title and short explainer
middle: diagram stage
bottom: subtitle bar
```

Never let diagram nodes overlap the subtitle bar. Avoid placing diagrams above the middle third unless it is an intentional intro scene.

6. Render and validate.

```powershell
npm run lint
npm run render
npx remotion still LucidaMotionDemo out\check-300.png --frame=300
```

Use several still frames for nontrivial edits:

```powershell
npx remotion still LucidaMotionDemo out\check-060.png --frame=60
npx remotion still LucidaMotionDemo out\check-300.png --frame=300
npx remotion still LucidaMotionDemo out\check-660.png --frame=660
```

7. Visually inspect still frames before calling the video done.

See `references/remotion-qa.md`.

## Layout Rules

- Use a `layoutSceneNodes(scene)` style function or equivalent layout layer.
- Keep node positions deterministic and scene-specific.
- Link arrows from computed node edges, not from hardcoded left/right assumptions.
- Prefer larger stable spaces over dense diagrams.
- Use 2-6 nodes per scene for vertical shorts.
- Use two-row diagrams for use cases, hub-spoke for orchestration, and pipeline for process.
- If a diagram needs more than 6 nodes, split it into another scene.

## Subtitle Rules

- Narration belongs in the subtitle bar, not scattered across the diagram.
- Use 1-3 narration lines per scene.
- Subtitle should not go blank during segment transitions.
- Typewriter reveal is acceptable, but keep a minimum visible prefix when a new segment begins.
- On-screen scene title should summarize; subtitle should explain.

## Performance Rules

At 1080x1920, avoid expensive effects:

- Avoid CSS `backdropFilter`.
- Avoid SVG Gaussian blur filters on animated links.
- Keep large shadows modest.
- Prefer gradients and simple opacity to heavy blur.
- If render time explodes, reduce filters before reducing resolution.

## Completion Criteria

The task is not complete until:

- `npm run lint` passes.
- `npm run render` passes.
- `out/video.mp4` is regenerated.
- At least one representative still frame is inspected.
- The final report mentions output path and validation.

## References

- `references/diagram-patterns.md`: how to choose diagram layouts from content.
- `references/remotion-qa.md`: visual QA checklist and common fixes.
