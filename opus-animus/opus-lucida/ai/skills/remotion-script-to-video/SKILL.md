---
name: remotion-script-to-video
description: Use this skill as the orchestrator workflow for turning a long script and optional raw sources into a Remotion vertical video through ingestion/cleaning, template mapping, building, subtitle, and QA stages. Use when the user asks to generate a full video from text, URLs, GitHub repos, PDFs, screenshots, images, improve template matching, reuse Remotion templates, or run the full Lucida script-to-video flow.
---

# Remotion Script To Video

Coordinate the full flow. Use specialized skills/references for each stage.

## Workflow

```text
raw script + optional raw sources
-> source-ingestor-cleaner
-> clean-brief.json
-> script-template-mapper
-> video-map.json
-> remotion-video-builder
-> rendered mp4 + still frames
-> remotion-visual-qa
-> patch/re-render
```

## Required Artifacts

```text
clean-brief.json
video-map.json
src/data.ts
src/Composition.tsx
src/Root.tsx
out/video.mp4
out/check-*.png
out/render-report.json
```

Read when needed:

- `references/orchestrator-prompt.md`: full-flow prompt for Codex/Claude.
- `references/workflow-contract.md`: stage inputs and outputs.
- `references/flow-tracking-draft.md`: draft operational tracking note for this workflow.

## Rules

- Do not jump directly from raw script to React.
- If the user provides URLs, repos, PDFs, screenshots, or images, run `source-ingestor-cleaner` first.
- Do not let one agent decide mapping, implementation, and QA without intermediate artifacts.
- Let `source-ingestor-cleaner` automatically decide whether each source is content truth, style reference, embeddable asset, context-only, or ignored.
- Keep `video-map.json` as the reviewable contract.
- If QA finds wrong visual mapping, fix `video-map.json` first.
- If QA finds layout/render bugs, fix Remotion components.

## Completion Criteria

- Clean brief exists when raw sources were provided.
- Mapping JSON exists and is reviewable.
- Remotion render passes.
- QA still frames are inspected.
- Final report states output path, checks run, and remaining risks.
