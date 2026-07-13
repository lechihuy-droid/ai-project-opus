# Project Structure

```text
hyperframes-workspace/
  README.md
  INSTALLATION_REPORT.md
  ARCHITECTURE_SUMMARY.md
  PROJECT_STRUCTURE.md
  TODO.md
  assets/
    fonts/
    music/
    sfx/
    icons/
  examples/
    README.md
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
  prompts/
  scene-schema/
    hyperframes.scene.schema.json
  renderer/
    render-samples.mjs
  output/
    hello-world.mp4
    typography.mp4
    timeline.mp4
    terminal.mp4
  hyperframes/
  hyperframes-launches/
  website-to-hyperframes-demo/
```

## Intended ownership

- `hyperframes/`: upstream framework source
- `hyperframes-launches/`: production reference videos
- `website-to-hyperframes-demo/`: structured website-to-video reference
- `examples/`: local smoke-test compositions
- `templates/`: starting points for future generated scenes
- `scene-schema/`: LLM-facing JSON contract
- `renderer/`: local orchestration utilities and future JSON-to-HTML conversion
- `output/`: rendered deliverables
