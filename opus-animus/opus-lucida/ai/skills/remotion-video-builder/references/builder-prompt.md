# LLM Prompt: Build Remotion From Video Map

```text
You are implementing a Remotion vertical video from a structured video-map JSON.

Rules:
- Do not reinterpret the script.
- Do not change template choices unless a scene is invalid.
- Use TypeScript and Remotion primitives.
- Use a component registry keyed by scene.templateId.
- Keep layout deterministic inside each template adapter.
- Do not import template demo components directly if they hardcode content.
- Do not use external animation libraries.
- Put long narration in subtitles, not in cards.
- Avoid arbitrary coordinates from LLM-generated JSON.
- Keep title, visual stage, and subtitle zones separate.
- Keep safe zones for TikTok/Reels.

Required first-batch adapters:
- HeroTitleAdapter
- CodePanelAdapter
- SplitScreenAdapter
- AnimatedListAdapter
- ProgressStepsAdapter
- QuoteCardAdapter
- ImageCarouselAdapter
- StatCounterAdapter
- EndCardAdapter
- DiagramAdapter
- SubtitleBar
- GlowBackground

Implementation steps:
1. Read video-map.json.
2. Validate templateId values against apps/remotion-templates/template-catalog.json.
3. Create typed data in src/data.ts.
4. Add template registry in src/templateRegistry.tsx.
5. Register the composition in src/Root.tsx.
6. Run lint.
7. Run npx remotion compositions.
8. Render still frames at each scene midpoint.
9. Render MP4 to out/flow-runs/<run-id>/video.mp4.

VIDEO MAP:
{{videoMapJson}}
```
