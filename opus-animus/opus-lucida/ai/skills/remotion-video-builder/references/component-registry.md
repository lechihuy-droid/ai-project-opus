# Component Registry

Use a registry so adding templates does not require rewriting the whole composition.

```ts
type SceneTemplate =
  | "cinematic-title-intro"
  | "code-panel"
  | "split-screen"
  | "animated-list"
  | "progress-steps"
  | "quote-card"
  | "image-carousel"
  | "stat-counter"
  | "end-card"
  | "diagram";

type SceneComponent = React.FC<{
  scene: VideoScene;
  localFrame: number;
  durationFrames: number;
  theme: Theme;
  assets: VisualAsset[];
}>;

const templateRegistry: Record<SceneTemplate, SceneComponent> = {
  "cinematic-title-intro": HeroTitleAdapter,
  "code-panel": CodePanelAdapter,
  "split-screen": SplitScreenAdapter,
  "animated-list": AnimatedListAdapter,
  "progress-steps": ProgressStepsAdapter,
  "quote-card": QuoteCardAdapter,
  "image-carousel": ImageCarouselAdapter,
  "stat-counter": StatCounterAdapter,
  "end-card": EndCardAdapter,
  "diagram": DiagramAdapter
};
```

## Layout Zones

```text
top: 120-430    headline and short context
mid: 460-1320   visual/template stage
bottom: 1380-1780 subtitle and progress
```

Never let cards/nodes enter the bottom subtitle zone. Unsupported templates should render an explicit unsupported-template scene or fail validation, not silently fall back to diagram.
