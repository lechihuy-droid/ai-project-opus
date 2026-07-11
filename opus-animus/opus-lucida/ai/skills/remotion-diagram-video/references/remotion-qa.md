# Remotion Diagram Video QA

Use this reference before declaring a generated video complete.

## Required Commands

Run from the Remotion app folder:

```powershell
npm run lint
npm run render
```

For visual checks:

```powershell
npx remotion still LucidaMotionDemo out\check-060.png --frame=60
npx remotion still LucidaMotionDemo out\check-300.png --frame=300
npx remotion still LucidaMotionDemo out\check-660.png --frame=660
```

If `npx remotion still` fails with `spawn EPERM`, rerun the same command with elevated permission when available.

## Still Frame Checklist

Inspect at least one frame from early, middle, and late sections for important revisions.

Check:

- Header text fits and does not collide with scene subtitle.
- Diagram stage is in the middle of the screen, not crowded near the top.
- Nodes do not overlap.
- Node labels fit inside cards.
- Arrows touch node edges and point in the expected direction.
- Arrow labels do not sit on top of node text.
- Subtitle bar is not empty.
- Subtitle text fits inside the bottom bar.
- Diagram does not overlap subtitle bar.
- Overall visual maps to the scene's actual claim.

## Content Mapping Checklist

For each scene, ask:

- Does this diagram explain this scene, or is it just decorative?
- Are all visible nodes mentioned or implied by the narration?
- Are there missing concepts that the narration depends on?
- Would a viewer understand the relationship without hearing audio?
- Can this scene be split if it has too many concepts?

## Performance Checklist

Render speed matters. Prefer stable output over expensive effects.

Avoid:

- `backdropFilter`
- animated SVG Gaussian blur
- dozens of large shadows
- huge node counts
- unnecessary overlays

Prefer:

- static gradients
- simple opacity
- moderate box shadows
- deterministic layouts
- 2-6 nodes per scene

## Acceptance Bar

A render is acceptable when:

- Lint passes.
- MP4 render completes.
- Representative still frame passes the checklist.
- Diagram is content-mapped, not generic.
- Subtitle timing feels continuous.
- Output path is reported.
