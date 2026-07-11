# Source Research — Motion for React

- History ID: `B001-M02`
- Layer: Motion
- Status: `selected-for-research`
- Reviewed: 2026-07-11
- Documentation: https://motion.dev/docs/react
- Repository: https://github.com/motiondivision/motion
- Source type: Declarative React animation library
- Core repository license: MIT
- Rights note: Motion+ examples, tutorials, and premium APIs may have separate access and usage terms; they are not selected by this note.

## Why Lucida selected this source

Motion for React provides a clear vocabulary for describing animation intent in React: entrance and exit states, transitions, spring and tween behavior, layout change, orchestration, and reduced-motion handling.

Lucida will use that vocabulary at the specification layer while translating the behavior into deterministic Remotion frame functions.

## Concepts selected for Lucida

- declarative start and end states
- transition objects with duration, delay, easing, and spring parameters
- different defaults for physical properties and visual properties
- reusable animation variants
- parent/child orchestration and stagger concepts
- layout-change animation concepts
- accessibility-aware reduced-motion behavior
- clean separation between animation intent and component content

## Lucida target artifacts

This research will inform:

- motion taxonomy and parameter names
- `shared-axis-x`
- `stagger-list`
- `kinetic-type-impact`
- entrance/exit preset pairing
- sequence orchestration metadata
- reduced-motion policy

## Proposed neutral transition vocabulary

```yaml
type: spring | tween | keyframes
propertyClass: physical | visual | spatial | text
 durationFrames: 18
delayFrames: 0
easing: ease-out
spring:
  mass: 1
  damping: 20
  stiffness: 170
staggerFrames: 3
```

The final schema will use frames rather than seconds as the canonical stored unit. Tools may display seconds as a derived value.

## Lucida adaptation rules

1. Treat Motion's API as a vocabulary reference, not the production renderer.
2. Convert duration and delay into frames using the composition FPS.
3. Convert browser spring behavior into explicit, tested Remotion spring configuration.
4. Replace DOM-driven layout animation with precomputed scene geometry where possible.
5. Ignore hover, drag, scroll, and pointer gestures for offline video unless converted into scripted narrative events.
6. Provide deterministic orchestration for parent/child sequences.
7. Add a reduced-motion fallback to every high-energy preset.

## Browser features not directly portable to Remotion

- user-driven hover and tap
- drag gestures
- live scroll-linked animation
- runtime layout observation
- wall-clock interruption and retargeting
- browser-native animation scheduling

These concepts can inspire a scripted video sequence, but must not be copied as runtime dependencies without a deterministic adapter.

## Not selected

- Motion+ premium source code or examples
- gesture-driven behavior as production video logic
- scroll listeners
- direct use of browser timing as the render clock
- exact examples copied without attribution and license review

## Extraction checklist

- [ ] Normalize spring and tween parameter names
- [ ] Define frame-based stagger semantics
- [ ] Prototype `shared-axis-x`
- [ ] Prototype `stagger-list`
- [ ] Prototype `kinetic-type-impact`
- [ ] Add reduced-motion variants
- [ ] Compare rendered behavior at 24, 30, and 60 FPS

## Current decision

Use Motion for React as a **creative and declarative motion vocabulary**. Remotion remains the execution engine and source of truth for frame timing.
