# Wake Runtime Prototype Review 01-02
**Status:** Active review v0.1  
**Date:** 2026-05-06  
**Scope:** Prototype review for script-driven HTML runtime on Slides 01-02  
**Role:** Runtime architecture review  
**Owner layer:** lane review  
**Parent:** `production/00-active/wake-cluster/15-html-video-upgrade-plan.md`  
**Supersedes:** none  
**Superseded by:** none

---

## 1. Prototype Artifact

```text
production/00-active/wake-cluster/wake-cluster-runtime-prototype-01-02.html
```

This prototype is intentionally not a full deck viewer.
It is a small runtime demo for the new concept:

```text
script drives the timing
HTML holds the slide stage
slide content reveals over time
transition between slides is part of the runtime
```

---

## 2. What This Prototype Proves

### Pass

1. The concept is viable.
   The opening hook and hook quiz can be modeled as timed scene/state behavior rather than static slide pages.

2. The old slides can stay as base layouts.
   We do not need to invent a completely different visual system to get runtime behavior.

3. Script markers map naturally to runtime events.
   In particular:
   - Slide 01 hook progression
   - Slide 02 pause before answer
   - Slide 02 reveal answer
   - Slide 02 temporary payoff

4. Transition now belongs to the runtime layer, not to manual review behavior.
   This is much closer to the intended final video system.

---

## 3. What Is Still Only Prototype-Level

### Not yet production-ready

1. Timing is hard-coded in JavaScript.
   It is good enough to prove the interaction model, but not yet good enough as the long-term pipeline contract.

2. The prototype uses a manual scene list.
   It is not generated yet from:
   - `03-slide-deck.md`
   - `08-production-frame-map.md`
   - `02-script.md`

3. Pause markers are interpreted manually.
   They are not yet parsed into a durable timing schema.

4. This prototype only covers Slides 01-02.
   It does not yet test:
   - grammar card density
   - worked example sequencing
   - diagnostic review timing

---

## 4. Architecture Verdict

```text
Decision: PASS
```

Why:
- This is the first artifact that matches the intended concept more closely than the old screenshot-deck path.
- It shows the right separation of responsibility:

```text
Skeleton = teaching logic
Script = narration timing intent
Scene/state map = runtime event structure
HTML = visual stage
Runtime engine = reveal + transition execution
```

That separation is strong enough to keep building on.

---

## 5. Main Risks

1. If timing remains hand-authored per prototype, the system will become expensive to maintain.
2. If we overfit to custom HTML per block, we will lose the benefit of a reusable engine.
3. If we jump to full-deck runtime too early, we may hide unresolved spec questions under more code.

---

## 6. Recommended Next Step

Best next move:

```text
Build a small runtime spec format
```

For example, each slide block should eventually declare:

```text
slide id
state id
event type
trigger
duration
target element
effect
```

Then the runtime engine can read that spec instead of hard-coded scene arrays.

After that, scale to:

```text
Slides 01-05
```

not by rebuilding custom HTML again,
but by keeping one engine and extending the runtime spec.

---

## 7. Recommendation For Wake Upgrade

```text
Do not scale the old next/prev deck viewer.
Scale the runtime engine idea instead.
```

Concretely:

1. Treat `wake-cluster-runtime-prototype-01-02.html` as architecture proof.
2. Next, extract a reusable runtime event model.
3. Then re-run Sprint 1 on Slides 01-05 using that model.

