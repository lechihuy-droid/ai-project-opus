# Video Map Schema

Use this as the contract between content analysis and Remotion rendering.

```ts
type VideoMap = {
  video: {
    title: string;
    subtitle: string;
    format: "vertical_9_16";
    width: 1080;
    height: 1920;
    fps: 30;
    durationSec: number;
    style: string;
    language: "vi" | "en";
    sourceBlocks?: string[];
  };
  theme: {
    name: string;
    accent: string;
    accentSoft: string;
    background: string;
    foreground: string;
    muted: string;
  };
  assets: VisualAsset[];
  scenes: SceneMap[];
};

type SceneMap = {
  id: string;
  intent:
    | "hook"
    | "problem"
    | "comparison"
    | "process"
    | "system_architecture"
    | "list"
    | "use_case"
    | "takeaway"
    | "quote"
    | "code_explanation";
  templateId: string;
  templateRole:
    | "scene"
    | "transition"
    | "background_effect"
    | "accent_effect"
    | "subtitle"
    | "cta";
  durationSec: number;
  headline: string;
  subtitle: {
    text: string;
    segments?: string[];
  };
  content: Record<string, unknown>;
  style: {
    accent?: string;
    density: "low" | "medium" | "high";
    safeArea: "tiktok" | "reels" | "youtube_shorts";
  };
  motion: string[];
  backgroundEffect?: string;
  transitionIn?: string;
  transitionOut?: string;
  subtitleMode?: "bar" | "lower-third" | "none";
  reason: string;
};

type VisualAsset = {
  id: string;
  src: string;
  kind: "image" | "video" | "audio";
  usage: "embed_asset" | "style_reference" | "context_only";
  alt?: string;
};
```

## Content Shapes By Template

```json
{
  "animated-list": {
    "items": [
      { "number": "01", "title": "Phan ra", "body": "Chia viec cho sub-agent." }
    ]
  },
  "progress-steps": {
    "steps": [
      { "label": "Research", "note": "Lay content truth" }
    ]
  },
  "split-screen": {
    "panels": [
      { "title": "Old way", "body": "Doan prompt hay" },
      { "title": "New way", "body": "Hoc product control system" }
    ]
  },
  "diagram": {
    "nodes": [
      { "id": "claude", "label": "Claude Code", "note": "Planner" }
    ],
    "links": [{ "from": 0, "to": 1 }]
  },
  "code-panel": {
    "codeTitle": "workflow.js",
    "lines": [
      "plan = decompose(task)",
      "agents = spawn(plan)"
    ],
    "highlights": [1, 2]
  }
}
```
