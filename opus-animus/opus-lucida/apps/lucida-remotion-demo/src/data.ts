import videoMapJson from "../video-map.json";
import type {
  ContextChipProps,
  DiffHighlightProps,
  MechanismWindowProps,
  MechanismWindowVariant,
  TimerMorphProps,
} from "./mechanism";

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

export type ProductionVisualFamily =
  | "terminal-command-center"
  | "technical-editorial"
  | "minimal-education"
  | "cinematic-type"
  | "dashboard-data"
  | "paper-notebook"
  | "product-showcase"
  | "editorial-collage"
  | "timeline-documentary";

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
  kicker?: string;
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
  keywords?: string[];
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

export type SceneLayout =
  | "top-title"
  | "center-stage"
  | "oversized-type"
  | "bottom-statement"
  | "full-bleed-visual";

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

export type TimedCaptionWord = {
  text: string;
  startMs: number | null;
  endMs: number | null;
};

export type TimedCaptionPhrase = {
  phraseId: string;
  sentenceId: string;
  text: string;
  startMs: number;
  endMs: number;
  words: TimedCaptionWord[];
};

export type AudioTrack = {
  src: string;
  durationMs: number;
  checksum: string;
};

export type TimedCaptions = {
  voiceChecksum: string;
  phrases: TimedCaptionPhrase[];
};

export type VideoMapSceneBase = {
  id: string;
  intent: SceneIntent;
  /** Optional package-backed production renderer family. Absent preserves legacy templateId dispatch. */
  visualFamily?: ProductionVisualFamily | (string & {});
  durationSec: number;
  segmentIds?: string[];
  startMs?: number;
  endMs?: number;
  headline: string;
  subtitle: SubtitleSpec;
  content: SceneContent;
  style: SceneStyle;
  motion: string[];
  backgroundEffect?: string;
  transitionIn?: string;
  transitionOut?: string;
  subtitleMode?: "bar" | "lower-third" | "none";
  /** Macro scene layout. Absent means "top-title" (legacy header + stage). */
  layout?: SceneLayout;
  reason: string;
};

export type VideoMapSlideScene = VideoMapSceneBase & {
  templateId: string;
  templateRole: TemplateRole;
  transitions?: never;
};

export type ContinuousEnvironment = {
  component: "MechanismWindow";
  variant: MechanismWindowVariant;
  props: Omit<MechanismWindowProps, "variant"> & WindowTransformProps;
};

export type WindowPosition = {
  left: number;
  top: number;
};

export type WindowTransformProps = {
  position?: WindowPosition;
  scale?: number;
};

export type AddableMechanism =
  | ({ component: "ContextChip" } & ContextChipProps)
  | ({ component: "TimerMorph" } & TimerMorphProps)
  | ({ component: "DiffHighlight" } & DiffHighlightProps)
  | ({ component: "MechanismWindow" } & MechanismWindowProps & {
      position: WindowPosition;
      scale?: number;
    });

export type MechanismTransition = (
  | {
      target: "environment";
      action: "update";
      props: Partial<Omit<MechanismWindowProps, "variant">>;
    }
  | {
      target: string;
      action: "add";
      props: AddableMechanism;
    }
  | {
      target: string;
      action: "update";
      props: Partial<AddableMechanism>;
    }
  | {
      target: string;
      action: "remove";
    }
) & {
  /** Delay from the containing scene's start. Defaults to 0. */
  offsetSec?: number;
};

export type VideoMapContinuousScene = VideoMapSceneBase & {
  templateId?: never;
  templateRole?: never;
  transitions: MechanismTransition[];
};

type VideoMapBase = {
  actors?: {
    id: string;
    target: string;
  }[];
  debug?: {
    showTechnicalLabels?: boolean;
  };
  audio?: AudioTrack;
  timedCaptions?: TimedCaptions;
  brand?: Record<string, unknown>;
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
    skin?: "premium-gold" | "modern-terminal";
  };
  assets: VisualAsset[];
};

export type SlidesVideoMap = VideoMapBase & {
  mode?: "slides";
  environment?: never;
  scenes: VideoMapSlideScene[];
};

export type ContinuousVideoMap = VideoMapBase & {
  mode: "continuous";
  environment: ContinuousEnvironment;
  scenes: VideoMapContinuousScene[];
};

export type VideoMap = SlidesVideoMap | ContinuousVideoMap;
export type VideoMapScene = VideoMapSlideScene | VideoMapContinuousScene;

export type VisualAsset = {
  id: string;
  src: string;
  kind: "image" | "video" | "audio";
  usage: "embed_asset" | "style_reference" | "context_only";
  alt?: string;
};

export type VideoScene = VideoMapSceneBase & {
  templateId: string;
  templateRole: TemplateRole;
  transitions?: MechanismTransition[];
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

export const defaultVideoMap = videoMapJson as unknown as VideoMap;

export const videoMeta = {
  fps: defaultVideoMap.video.fps,
  width: defaultVideoMap.video.width,
  height: defaultVideoMap.video.height,
};

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

const normalizeScene = (
  scene: VideoMapScene,
  videoMap: VideoMap,
): VideoScene => ({
  ...scene,
  templateId: scene.templateId ?? "continuous-environment",
  templateRole: scene.templateRole ?? "scene",
  kicker: scene.content.kicker ?? scene.intent,
  title: scene.content.title ?? scene.headline,
  narration: getNarration(scene.subtitle),
  captionGroups:
    scene.subtitle.groups ??
    getNarration(scene.subtitle).map((text) => ({
      text,
      lines: [text.split(/\s+/).filter(Boolean)],
    })),
  footer: scene.content.footer ?? "",
  accent: scene.style.accent ?? videoMap.theme.accent,
  bullets: getBullets(scene.content),
  nodes: scene.content.nodes ?? [],
  links: scene.content.links ?? [],
  // Explicit passthrough: SceneShell resolves `layout ?? "top-title"`.
  layout: scene.layout,
  durationFrames: Math.round(scene.durationSec * videoMap.video.fps),
});

export const createVideoInput = (videoMap: VideoMap): VideoInput => ({
  title: videoMap.video.title,
  subtitle: videoMap.video.subtitle,
  sourceBlocks: videoMap.video.sourceBlocks ?? [],
  theme: videoMap.theme,
  assets: videoMap.assets,
  scenes: videoMap.scenes.map((scene) => normalizeScene(scene, videoMap)),
});

export const videoInput = createVideoInput(defaultVideoMap);
