# Source Research — Remotion Core Animation

- History ID: `B001-M01`
- Layer: Motion
- Status: `selected-for-research`
- Reviewed: 2026-07-11
- Animation documentation: https://www.remotion.dev/docs/animating-properties
- License and compliance: https://www.remotion.dev/docs/license
- Source type: Official frame-based video rendering documentation
- License status: `review-required` for commercial deployment; check current official eligibility and pricing terms

## Why Lucida selected this source

Remotion is Lucida's target renderer, so its frame model must define the execution contract for every production motion preset.

The central requirement is deterministic rendering: the same input, frame number, FPS, and configuration should produce the same visual output.

## Concepts selected for Lucida

- drive animation from `useCurrentFrame()`
- convert frame ranges into visual values with `interpolate()`
- use frame- and FPS-aware spring simulation
- clamp output ranges where overshoot is not intended
- avoid CSS transitions and wall-clock animations during render
- keep motion logic independent from browser event timing
- parameterize duration, delay, easing, spring configuration, and intensity

## Lucida target artifacts

This research will inform:

- `schemas/motion-preset.schema.json`
- deterministic-render rules
- motion preset utility functions
- initial presets:
  - `fade-rise`
  - `diagram-build`
  - `counter-reveal`
  - `camera-push`
  - `reduced-motion-fade`

## Required motion contract

Every Lucida production preset should accept at least:

```ts
type MotionContext = {
  frame: number;
  fps: number;
  durationInFrames: number;
  intensity: number;
  reducedMotion: boolean;
};
```

A preset must declare:

- valid duration range
- parameter types and limits
- entry and exit behavior
- reduced-motion fallback
- supported content types
- transition compatibility
- deterministic test cases

## Derived implementation rules

1. No `setTimeout()`, `setInterval()`, CSS keyframes, or untracked wall-clock state in render-critical animation.
2. Clamp values when a property must stay inside a legal range, such as opacity.
3. Springs must receive the composition FPS.
4. Randomness must use a stable seed derived from the video and scene IDs.
5. Asset loading must complete before render frames are evaluated.
6. A preset must not depend on DOM layout measurement unless the result is resolved deterministically before rendering.
7. Every preset must expose a low-motion alternative.

## Not selected

- premium Remotion assets or templates
- code whose commercial usage has not been reviewed
- browser-timed transitions
- undocumented internal APIs
- renderer-specific behavior that cannot be tested deterministically

## Extraction checklist

- [ ] Draft `motion-preset.schema.json`
- [ ] Implement a deterministic `fade-rise` prototype
- [ ] Add frame snapshot tests
- [ ] Add an FPS variation test
- [ ] Add reduced-motion fallback tests
- [ ] Record current Remotion license eligibility before production release

## Current decision

Remotion is the **authoritative execution model** for Lucida motion. Other animation sources may contribute vocabulary and creative patterns, but all production behavior must be translated into deterministic frame-based logic.
