# renderer

Notes for the local render workflow and future automation.

## Current path

- Use the HyperFrames CLI from `hyperframes/packages/cli/dist/cli.js`
- Keep render outputs in `output/`

## Scene JSON compiler

The local compiler turns declarative Scene JSON into a HyperFrames project:

```powershell
node renderer/scene-json-to-hyperframes.mjs `
  --input scene-schema/examples/ai-engine-intro.json `
  --output generated/ai-engine-intro
```

The generated directory contains `index.html` and `meta.json`, so it can be previewed or rendered with the same HyperFrames commands used by the hand-written examples.

Supported first-pass layer kinds:

- `text`
- `shape`
- `media`
- `terminal`
- `timeline`
- `code`
- `browser`
- `chart`

This compiler intentionally has no third-party dependency. It performs structural validation itself, then emits deterministic HTML/CSS suitable for smoke renders.

Layer-level motion presets are supported with `enter` and `emphasis`:

```json
{
  "id": "title",
  "kind": "text",
  "text": "Animated title",
  "x": 100,
  "y": 100,
  "enter": { "preset": "fade-up", "delay": 0.2, "duration": 0.7 }
}
```

Available presets:

- `fade`
- `fade-up`
- `fade-down`
- `slide-left`
- `slide-right`
- `scale-in`
- `draw-x`
- `pulse`

The delay is local to the layer/scene clip, not absolute video time.

## Generic render launcher

Render any HyperFrames project directory:

```powershell
node renderer/render-project.mjs `
  --project generated/ai-engine-intro `
  --output output/ai-engine-intro.mp4 `
  --quality draft `
  --workers 1
```

