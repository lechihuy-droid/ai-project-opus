# HyperFrames Workspace

Workspace for building an AI Video Engine on top of HyperFrames.

## Installed stack

- Node.js `24.15.0`
- npm `11.12.1`
- Git `2.53.0.windows.3`
- Git LFS `3.7.1`
- Bun `1.3.14`
- FFmpeg and FFprobe installed locally
- Chrome Headless Shell cached by HyperFrames

## Repositories

- `hyperframes/`
- `hyperframes-launches/`
- `website-to-hyperframes-demo/`

## Workspace layout

```text
hyperframes-workspace/
  hyperframes/
  hyperframes-launches/
  website-to-hyperframes-demo/
  examples/
    hello-world/
    typography/
    timeline/
    terminal/
  templates/
    subtitle/
    terminal/
    architecture/
    dashboard/
    browser/
    timeline/
  assets/
    fonts/
    music/
    sfx/
    icons/
  prompts/
  scene-schema/
  renderer/
  output/
```

## Preview

Run a local preview server from any composition folder:

```powershell
cd C:\Users\HUY\workspace\ai-project-opus\hyperframes-workspace\examples\hello-world
node ..\..\hyperframes\packages\cli\dist\cli.js preview . --no-open --port 3002
```

Validated local preview URL:

- `http://127.0.0.1:3002/`

## Render

### Direct CLI render

Use the CLI when enough free disk is available:

```powershell
cd C:\Users\HUY\workspace\ai-project-opus\hyperframes-workspace\examples\hello-world
node ..\..\hyperframes\packages\cli\dist\cli.js render . --output ..\..\output\hello-world.mp4
```

### Batch render launcher

This workspace includes a direct producer launcher for local smoke tests:

```powershell
cd C:\Users\HUY\workspace\ai-project-opus\hyperframes-workspace
node .\renderer\render-samples.mjs
node .\renderer\render-samples.mjs timeline terminal
```

The launcher calls `@hyperframes/producer` directly and writes outputs into `output/`.

## Add a new scene

1. Copy one of the folders under `examples/` or `templates/`.
2. Update `index.html`.
3. Update `meta.json` with `id`, `title`, `width`, `height`, `duration`, and `fps`.
4. Preview locally.
5. Render to `output/`.

## Add assets

- Fonts: `assets/fonts/`
- Music: `assets/music/`
- SFX: `assets/sfx/`
- Icons: `assets/icons/`

For composition-local assets, keep them next to the composition when the asset is tightly coupled to one scene.

## Scene schema

Scene JSON schema lives at:

- `scene-schema/hyperframes.scene.schema.json`

Target workflow:

1. LLM generates scene JSON.
2. A future converter in `renderer/` maps JSON to HyperFrames HTML composition files.
3. Preview and render run on the generated composition.

## Development workflow

1. Read `ARCHITECTURE_SUMMARY.md`.
2. Study the reference repos:
   - `hyperframes-launches/`
   - `website-to-hyperframes-demo/`
3. Start from an `examples/` or `templates/` folder.
4. Keep assets local or register them in `assets/`.
5. Validate timing in preview.
6. Render through the CLI or `renderer/render-samples.mjs`.
7. Store deliverables in `output/`.
