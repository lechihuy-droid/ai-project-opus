# Workflow Contract

## Stage Contracts

| Stage | Input | Output |
|---|---|---|
| `source-ingestor-cleaner` | raw script, URLs, repos, PDFs, images, screenshots | `clean-brief.json` |
| `script-template-mapper` | `clean-brief.json` or raw script, target duration, style | `video-map.json` |
| `remotion-video-builder` | `video-map.json`, app path | Remotion source + MP4 |
| `remotion-visual-qa` | `video-map.json`, still frames, MP4 | QA report + patch list |

## Failure Routing

```text
Bad source classification -> source-ingestor-cleaner
Useful image not embedded -> source-ingestor-cleaner
Third-party image copied too directly -> source-ingestor-cleaner, then builder
Wrong scene/template mapping -> script-template-mapper
Wrong content inside card -> script-template-mapper or scene-planner content
Overlap/layout bug -> remotion-video-builder
Arrow endpoint bug -> remotion-video-builder
Subtitle timing/readability bug -> remotion-video-builder
Scene visually too dense -> script-template-mapper, then builder
Render failure -> remotion-video-builder
```

## Minimal Report

```json
{
  "outputPath": "apps/lucida-remotion-demo/out/video.mp4",
  "durationSec": 0,
  "commands": ["npm run lint", "npm run render"],
  "qa": {
    "framesChecked": [],
    "status": "pass"
  },
  "risks": []
}
```
