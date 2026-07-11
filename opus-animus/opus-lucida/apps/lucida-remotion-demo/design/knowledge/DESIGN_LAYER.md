# Lucida Design Layer

Lucida's Design Layer is the source of truth for converting a script into a coherent, multi-style video rendered with React and Remotion.

The system separates **creative decisions** from **rendering code**:

- AI analyzes the script, segments it into scenes, and selects suitable visual and motion presets.
- Lucida validates those selections against brand and continuity constraints.
- React components and Remotion render the approved specification.
- The renderer should not invent an uncontrolled style at runtime.

## 1. Goals

1. Accept a script and automatically choose an appropriate style for each scene.
2. Allow multiple visual modes in one video without losing brand consistency.
3. Make visual and motion decisions searchable, versioned, testable, and reusable.
4. Keep the style specification independent from the rendering engine.
5. Record the source and license of every imported reference or preset.

## 2. Design model

Lucida uses four cooperating layers.

### 2.1 Brand layer

The non-negotiable identity of the video or channel.

Typical fields:

- logo and safe area
- primary and secondary colors
- font families and fallback stacks
- typography scale
- corner-radius family
- icon family
- watermark and outro rules
- accessibility requirements

The Brand layer remains stable across the whole video.

### 2.2 Visual layer

The appearance of a scene.

Examples:

- editorial
- cinematic title card
- minimal education
- technical diagram
- terminal or code demo
- dashboard
- data story
- product showcase
- collage
- paper or notebook

A video may use several visual modes, but all modes must inherit the Brand layer.

### 2.3 Motion layer

The timing and movement vocabulary.

Examples:

- restrained fade and slide
- spring-based UI motion
- kinetic typography
- camera push or parallax
- staggered data reveal
- diagram build
- code walkthrough
- scene transition

Motion is represented as named presets with explicit parameters. AI chooses and configures presets; it should not generate arbitrary animation logic unless no approved preset can satisfy the scene.

### 2.4 Cinematic / scene layer

The narrative function of each scene.

Common intents:

- hook
- establish context
- explain
- compare
- demonstrate
- reveal
- emphasize
- transition
- summarize
- call to action

This layer is inferred from the script. It guides the selection of Visual and Motion presets.

## 3. Multi-style continuity rules

A multi-style video should feel directed, not assembled from unrelated templates.

Default constraints:

1. Use exactly one Brand profile per video.
2. Use one dominant Visual family for at least 50% of total duration.
3. Use no more than four Visual families in a normal short-form video.
4. Introduce a new Visual family only at a narrative boundary.
5. Reuse at least one shared token across all scenes: typography, grid, color, border, iconography, or texture.
6. Use a transition preset explicitly designed for the outgoing and incoming scene families.
7. Avoid changing typography family and layout grammar at the same time.
8. Return to the dominant style for the summary or outro.
9. Every style change must have a reason recorded in the scene plan.
10. Respect reduced-motion and legibility constraints.

These values are defaults and should be configurable by video format.

## 4. Processing pipeline

```text
Script
  -> semantic segmentation
  -> scene intent classification
  -> content requirements extraction
  -> candidate retrieval from Visual Library
  -> candidate retrieval from Motion Library
  -> compatibility scoring
  -> continuity optimization
  -> StyleSpec
  -> schema validation
  -> React component composition
  -> Remotion render
  -> automated and human quality checks
```

### 4.1 Candidate scoring

A practical first version can score each candidate using:

```text
score =
  0.30 * semantic_fit
+ 0.20 * content_fit
+ 0.15 * brand_compatibility
+ 0.15 * continuity
+ 0.10 * asset_availability
+ 0.10 * rendering_cost
```

Hard constraints should be checked before ranking:

- unsupported aspect ratio
- missing required asset type
- prohibited color or font
- unreadable text density
- incompatible transition
- excessive render cost
- license restrictions

## 5. Proposed repository structure

```text
design/
├── README.md
├── ROADMAP.md
├── schemas/
│   ├── style-spec.schema.json
│   ├── visual-style.schema.json
│   ├── motion-preset.schema.json
│   └── brand-profile.schema.json
├── brands/
│   └── lucida/
│       ├── brand.json
│       ├── DESIGN.md
│       ├── assets/
│       └── previews/
├── visual-library/
│   ├── index.json
│   └── styles/
│       └── <style-slug>/
│           ├── README.md
│           ├── visual.json
│           ├── tokens.json
│           ├── component-map.json
│           ├── provenance.md
│           ├── examples/
│           └── previews/
├── motion-library/
│   ├── index.json
│   └── presets/
│       └── <preset-slug>/
│           ├── README.md
│           ├── motion.json
│           ├── preset.ts
│           ├── example.tsx
│           ├── provenance.md
│           └── previews/
├── directors/
│   ├── style-director.md
│   ├── selection-rules.json
│   └── compatibility-matrix.json
├── prompts/
│   ├── analyze-script.md
│   ├── select-style.md
│   └── critique-style-plan.md
├── examples/
│   ├── scripts/
│   ├── style-specs/
│   └── remotion/
└── tests/
    ├── schema/
    ├── continuity/
    └── render/
```

## 6. StyleSpec v1

`StyleSpec` is the contract between the AI director and the renderer.

Example:

```json
{
  "version": "1.0",
  "video": {
    "id": "ai-agent-explainer",
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "durationFrames": 1800
  },
  "brand": "lucida",
  "global": {
    "dominantVisual": "technical-editorial",
    "maxVisualFamilies": 3,
    "motionIntensity": 0.55,
    "textDensity": "medium",
    "accessibility": {
      "reducedMotionSafe": true,
      "minimumContrast": "AA"
    }
  },
  "scenes": [
    {
      "id": "scene-001",
      "intent": "hook",
      "startFrame": 0,
      "durationFrames": 150,
      "visual": {
        "style": "cinematic-type",
        "variant": "dark",
        "reason": "Open with a high-contrast claim and establish urgency."
      },
      "motion": {
        "preset": "kinetic-type-impact",
        "intensity": 0.7,
        "parameters": {
          "staggerFrames": 3,
          "overshoot": 0.08
        }
      },
      "transitionOut": "luma-wipe-soft"
    },
    {
      "id": "scene-002",
      "intent": "explain",
      "startFrame": 150,
      "durationFrames": 420,
      "visual": {
        "style": "technical-editorial",
        "variant": "grid",
        "reason": "The scene contains a structured explanation and diagram."
      },
      "motion": {
        "preset": "diagram-build",
        "intensity": 0.4,
        "parameters": {
          "stepFrames": 18
        }
      },
      "transitionOut": "shared-axis-x"
    }
  ]
}
```

## 7. Visual Library package contract

Each visual style package must define:

```json
{
  "id": "technical-editorial",
  "version": "1.0.0",
  "status": "experimental",
  "tags": ["technical", "editorial", "diagram", "education"],
  "recommendedIntents": ["explain", "compare", "summarize"],
  "avoidFor": ["emotional-testimonial"],
  "aspectRatios": ["16:9", "9:16", "1:1"],
  "contentCapacity": {
    "headlineChars": 64,
    "bodyChars": 420,
    "maxDataSeries": 4
  },
  "tokens": "./tokens.json",
  "componentMap": "./component-map.json",
  "provenance": "./provenance.md"
}
```

A visual package should include a preview for every supported aspect ratio before it becomes `stable`.

## 8. Motion Library package contract

Each motion preset must define:

```json
{
  "id": "diagram-build",
  "version": "1.0.0",
  "status": "experimental",
  "category": "reveal",
  "tags": ["diagram", "education", "step-by-step"],
  "recommendedIntents": ["explain", "demonstrate"],
  "duration": {
    "minimumFrames": 30,
    "recommendedFrames": 90,
    "maximumFrames": 240
  },
  "parameters": {
    "stepFrames": {
      "type": "integer",
      "minimum": 4,
      "maximum": 60,
      "default": 18
    }
  },
  "reducedMotionFallback": "fade-sequence",
  "implementation": "./preset.ts",
  "provenance": "./provenance.md"
}
```

Motion presets should be deterministic for the same input and frame number.

## 9. Initial source catalog

Use these sources to study principles and seed original Lucida packages. Do not copy a brand identity verbatim into production output.

### 9.1 Visual Library — recommended primary sources

1. **Awesome Design MD**  
   https://github.com/VoltAgent/awesome-design-md  
   Use: study how agent-readable `DESIGN.md` files describe recognizable visual systems.  
   Lucida action: extract a neutral schema and author original style families.

2. **Material Design 3**  
   https://m3.material.io/  
   Use: tokens, color roles, typography, layout, components, accessibility, and adaptive design.  
   Lucida action: use as a reference for semantic token structure and component-state modeling.

3. **GitHub Primer**  
   https://primer.style/  
   Use: primitives, component patterns, product UI, brand separation, and implementation discipline.  
   Lucida action: study how foundations connect to production-ready components.

Additional reference:

- Atlassian Design System — https://atlassian.design/

### 9.2 Motion Library — recommended primary sources

1. **Motion for React**  
   https://motion.dev/docs/react  
   Use: declarative animation, layout animation, gestures, transitions, and orchestration.  
   Lucida action: study reusable parameter models and create frame-safe equivalents where necessary.

2. **Remotion animation documentation**  
   https://www.remotion.dev/docs/animating-properties  
   Use: frame-based interpolation and deterministic rendering.  
   Lucida action: treat this as the primary execution model for video presets.

3. **React Spring**  
   https://www.react-spring.dev/docs/getting-started  
   Use: spring vocabulary and physically intuitive parameterization.  
   Lucida action: convert selected spring behaviors into deterministic, frame-driven Remotion utilities.

Additional reference:

- GSAP documentation — https://gsap.com/docs/v3/

## 10. Source and license policy

Every imported or adapted entry must include `provenance.md` with:

- source name
- source URL
- access date
- source license, when available
- files or concepts reviewed
- what Lucida reused
- what Lucida changed
- whether attribution is required
- restrictions on trademarks, logos, fonts, images, and brand identity

Rules:

1. Prefer learning principles over copying branded implementations.
2. Never distribute third-party logos, fonts, illustrations, or screenshots without permission.
3. Do not claim third-party styles as official integrations.
4. Keep source code licenses separate from trademark and brand-identity rights.
5. Record dependencies and licenses in machine-readable metadata.
6. Reject assets with unclear provenance from the production library.

## 11. Quality gates

A package can move from `experimental` to `stable` only when it has:

- valid metadata
- provenance and license notes
- previews for supported aspect ratios
- text-overflow tests
- reduced-motion behavior
- deterministic render tests
- contrast checks
- at least three representative scene examples
- compatibility records for common transitions
- review by a human designer or designated maintainer

## 12. First implementation targets

The first useful release should contain:

### Visual styles

- technical-editorial
- minimal-education
- cinematic-type
- dashboard-data
- terminal-demo
- paper-notebook

### Motion presets

- fade-rise
- shared-axis-x
- stagger-list
- kinetic-type-impact
- diagram-build
- counter-reveal
- camera-push
- luma-wipe-soft
- code-highlight-walkthrough
- reduced-motion-fade

The objective is not a large library. The objective is a small, reliable vocabulary that the Style Director can combine consistently.
