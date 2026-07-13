# GPT-5.6 Work Video Workflow

This log records the repeatable workflow used to turn a text brief into a HyperFrames video.

## 1. Input

Source brief:

- Main claim: GPT-5.6 is the model family; ChatGPT Work is an agent mode that uses the model.
- Core metaphor: GPT-5.6 is the brain; ChatGPT Work is the AI employee.
- Supporting sections: model stack, Work capabilities, desktop vs web/mobile, Work vs Codex, AI video workflow.

## 2. Editorial Compression

The long brief was compressed into a short explainer:

1. Hook: GPT-5.6 and ChatGPT Work are not competitors.
2. Model stack: Sol, Terra, Luna.
3. Work vs Codex: knowledge operator vs production engineer.
4. AI video workflow: Work creates brief/script/storyboard; Codex and HyperFrames render production artifacts.

## 3. Scene JSON

Created:

- `scene-schema/examples/gpt56-work-ai-video-workflow.json`

Design choices:

- 1280x720, 30fps, 16 seconds.
- Four scenes, four seconds each.
- Mostly text, shapes, terminal panels, browser panels, and timeline layers.
- ASCII text in the video to avoid font fallback issues during smoke render.

## 4. Compile

Command:

```powershell
node .\renderer\scene-json-to-hyperframes.mjs `
  --input .\scene-schema\examples\gpt56-work-ai-video-workflow.json `
  --output .\generated\gpt56-work-ai-video-workflow
```

Result:

- `generated/gpt56-work-ai-video-workflow/index.html`
- `generated/gpt56-work-ai-video-workflow/meta.json`

## 5. Render

Command:

```powershell
node .\renderer\render-project.mjs `
  --project .\generated\gpt56-work-ai-video-workflow `
  --output .\output\gpt56-work-ai-video-workflow.mp4 `
  --quality draft `
  --workers 1
```

Note:

- On this machine, the render command must be allowed to spawn Chrome Headless Shell and FFmpeg.

Output:

- `output/gpt56-work-ai-video-workflow.mp4`
- Duration: `16.000000`
- Size: about `325 KB`

## 6. QA

Checks:

- Verify script syntax with `node --check`.
- Verify MP4 with FFprobe.
- Extract representative frames from the video.
- Inspect frames for blank output, text overflow, and scene timing issues.

QA frames:

- `output/gpt56-work-ai-video-workflow-01.png`
- `output/gpt56-work-ai-video-workflow-05.png`
- `output/gpt56-work-ai-video-workflow-09.png`
- `output/gpt56-work-ai-video-workflow-13.png`

Iteration notes:

- First render succeeded, but the model-stack scene had rough line wrapping.
- Browser panel text in the Work/Codex scene collapsed newlines.
- Fixed by reducing model-card font size and adding `white-space: pre-line` to `.browser-content` in `renderer/scene-json-to-hyperframes.mjs`.
- Recompiled and rendered again.

Animation update:

- Added layer-level `enter` motion presets to `renderer/scene-json-to-hyperframes.mjs`.
- Added `enter` fields to the Scene JSON so layers reveal with staggered motion instead of appearing as static slides.
- Important timing rule: `enter.delay` is local to the scene/layer clip. Do not add `scene.start` manually.
- Rendered animated version:
  - `generated/gpt56-work-ai-video-workflow-animated/`
  - `output/gpt56-work-ai-video-workflow-animated.mp4`

## 7. Reusable Pattern

For future videos:

1. Paste source brief.
2. Extract one-sentence thesis.
3. Compress into 3-6 scenes.
4. Write Scene JSON.
5. Compile to HyperFrames project.
6. Render MP4.
7. Extract frames for QA.
8. Iterate on layout and timing.
