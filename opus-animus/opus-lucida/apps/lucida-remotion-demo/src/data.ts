import videoMapJson from "../video-map.json";

export type TemplateRole =
  | "scene"
  | "transition"
  | "background_effect"
  | "accent_effect"
  | "subtitle"
  | "cta";

export type SceneIntent =
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

export type Tone = "warm" | "cool" | "danger" | "neutral";

export type Density = "low" | "medium" | "high";

export type SafeArea = "tiktok" | "reels" | "youtube_shorts";

export type SceneContentItem = {
  label?: string;
  title?: string;
  body?: string;
  note?: string;
  number?: string;
  tone?: Tone;
  value?: number;
  unit?: string;
};

export type ScenePanel = {
  title: string;
  body?: string;
  tone?: Tone;
};

export type SceneMetric = {
  label: string;
  value: number;
  unit?: string;
  delta?: string;
};

export type DiagramNode = {
  id?: string;
  label: string;
  note?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  tone?: Tone;
};

export type DiagramLink = {
  from: number;
  to: number;
  label?: string;
};

export type SceneContent = {
  kicker?: string;
  title?: string;
  subtitle?: string;
  footer?: string;
  items?: SceneContentItem[];
  steps?: SceneContentItem[];
  panels?: ScenePanel[];
  metrics?: SceneMetric[];
  codeTitle?: string;
  lines?: string[];
  highlights?: number[];
  quote?: string;
  attribution?: string;
  cta?: {
    label: string;
    detail?: string;
  };
  nodes?: DiagramNode[];
  links?: DiagramLink[];
};

export type SceneStyle = {
  accent?: string;
  density: Density;
  safeArea: SafeArea;
  variant?: string;
};

export type SubtitleSpec = {
  text: string;
  segments?: string[];
  groups?: CaptionGroup[];
};

export type CaptionGroup = {
  text: string;
  lines: string[][];
  weight?: "normal" | "compact";
};

export type VideoMapScene = {
  id: string;
  intent: SceneIntent;
  templateId: string;
  templateRole: TemplateRole;
  durationSec: number;
  headline: string;
  subtitle: SubtitleSpec;
  content: SceneContent;
  style: SceneStyle;
  motion: string[];
  backgroundEffect?: string;
  transitionIn?: string;
  transitionOut?: string;
  subtitleMode?: "bar" | "lower-third" | "none";
  reason: string;
};

export type VideoMap = {
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
  scenes: VideoMapScene[];
};

export type VisualAsset = {
  id: string;
  src: string;
  kind: "image" | "video" | "audio";
  usage: "embed_asset" | "style_reference" | "context_only";
  alt?: string;
};

export type VideoScene = VideoMapScene & {
  kicker: string;
  title: string;
  narration: string[];
  captionGroups: CaptionGroup[];
  footer: string;
  accent: string;
  bullets: string[];
  nodes: DiagramNode[];
  links: DiagramLink[];
  durationFrames: number;
};

export type VideoInput = {
  title: string;
  subtitle: string;
  sourceBlocks: string[];
  theme: VideoMap["theme"];
  assets: VisualAsset[];
  scenes: VideoScene[];
};

const rawVideoMap = videoMapJson as VideoMap;

const getNarration = (subtitle: SubtitleSpec): string[] => {
  if (subtitle.groups && subtitle.groups.length > 0) {
    return subtitle.groups.map((group) => group.text);
  }

  if (subtitle.segments && subtitle.segments.length > 0) {
    return subtitle.segments;
  }

  return subtitle.text ? [subtitle.text] : [];
};

const getBullets = (content: SceneContent): string[] => {
  if (content.items && content.items.length > 0) {
    return content.items
      .map((item) => item.label ?? item.title ?? item.body ?? "")
      .filter(Boolean);
  }

  if (content.steps && content.steps.length > 0) {
    return content.steps
      .map((step) => step.label ?? step.title ?? step.body ?? "")
      .filter(Boolean);
  }

  if (content.panels && content.panels.length > 0) {
    return content.panels.map((panel) => panel.title).filter(Boolean);
  }

  return [];
};

const normalizeScene = (scene: VideoMapScene): VideoScene => ({
  ...scene,
  kicker: scene.content.kicker ?? scene.intent,
  title: scene.content.title ?? scene.headline,
  narration: getNarration(scene.subtitle),
  captionGroups: scene.subtitle.groups ?? getNarration(scene.subtitle).map((text) => ({
    text,
    lines: [text.split(/\s+/).filter(Boolean)],
  })),
  footer: scene.content.footer ?? "",
  accent: scene.style.accent ?? rawVideoMap.theme.accent,
  bullets: getBullets(scene.content),
  nodes: scene.content.nodes ?? [],
  links: scene.content.links ?? [],
  durationFrames: Math.round(scene.durationSec * rawVideoMap.video.fps),
});

export const videoInput: VideoInput = {
  title: rawVideoMap.video.title,
  subtitle: rawVideoMap.video.subtitle,
  sourceBlocks: rawVideoMap.video.sourceBlocks ?? [],
  theme: rawVideoMap.theme,
  assets: rawVideoMap.assets,
  scenes: rawVideoMap.scenes.map(normalizeScene),
};
