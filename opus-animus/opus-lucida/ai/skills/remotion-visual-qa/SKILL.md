---
name: remotion-visual-qa
description: Use this skill to validate a rendered Remotion vertical video or still frames for content-template fit, subtitle continuity, safe areas, card overlap, arrow alignment, visual density, and render readiness. Use after rendering a Remotion explainer or when the user reports mismatched arrows, overlapping visuals, bad subtitle timing, or scenes that do not match narration.
---

# Remotion Visual QA

Validate the output visually and structurally before calling the video done.

## Inputs

```text
video-map.json
rendered mp4 path
still frames
Remotion app path
```

Read when needed:

- `references/qa-prompt.md`: visual review prompt.
- `references/frame-checklist.md`: concrete checks and fixes.

## Workflow

1. Export still frames at scene starts and midpoints.
2. Inspect frames visually.
3. Compare visible template against `video-map.json`.
4. Check subtitle continuity.
5. Check safe area and overlap.
6. Report pass/fail with exact fixes.
7. Patch renderer/data if needed, then re-render.

## Mandatory Checks

- Scene template matches narration intent.
- Subtitle is visible and not blank during active narration.
- Cards/nodes do not overlap.
- Arrows connect correct visual anchors.
- Diagram does not sit too high on screen.
- Text is readable on mobile.
- No visual object enters subtitle safe zone.
- Render completed without warnings that affect output.

## Completion Criteria

- Representative still frames inspected.
- Issues are either fixed or explicitly reported.
- Final answer includes output path and validation commands.
