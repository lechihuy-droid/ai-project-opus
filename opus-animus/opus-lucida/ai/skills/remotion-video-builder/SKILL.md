---
name: remotion-video-builder
description: Use this skill to build or update a Remotion video from an existing video-map JSON contract, implement template components, register compositions, wire subtitle timing, and render a vertical short. Use after script-template-mapper has produced scene/template data, or when Codex must convert structured video JSON into Remotion React/TypeScript.
---

# Remotion Video Builder

Build from JSON. Do not redesign the content mapping unless the JSON is invalid.

## Inputs

Expected input:

```text
video-map.json
Remotion app path
target composition id
```

Default Lucida app:

```text
apps/lucida-remotion-demo/
```

Read when needed:

- `references/builder-prompt.md`: implementation prompt for another LLM/Codex.
- `references/component-registry.md`: template-to-component registry.

## Workflow

1. Read `video-map.json`.
2. Check every scene has supported `templateId` from `apps/remotion-templates/template-catalog.json`.
3. Create/update `src/data.ts` with typed scene data.
4. Implement a template registry keyed by `templateId` instead of scene-specific one-off branches.
5. Keep layout deterministic inside renderer components.
6. Put long narration in subtitle bar.
7. Register composition in `src/Root.tsx`.
8. Run lint and render.

## Implementation Rules

- Use Remotion primitives: `AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`.
- Avoid external animation libraries.
- Avoid arbitrary absolute node positions from LLM output.
- Compute arrow endpoints from card bounds or layout anchors.
- Keep title, visual stage, and subtitle zones separate.
- Use vertical-safe layout for TikTok/Reels overlays.

## Completion Criteria

- `npm run lint` passes.
- `npm run render` passes.
- Output MP4 is regenerated under `out/flow-runs/<run-id>/video.mp4`.
- At least one representative still frame exists for QA.
