export type VisualSourceType =
  | "script"
  | "repository"
  | "command"
  | "asciicast"
  | "theme_reference"
  | "web_reference"
  | "image_reference";
export type VisualFamily =
  | "terminal"
  | "dashboard"
  | "editorial"
  | "infographic"
  | "code"
  | "data_visualization"
  | "product_demo"
  | "cinematic_typography";

export type VisualFlowSource = {
  id: string;
  type: VisualSourceType;
  required?: boolean;
  artifactId?: string;
  path?: string;
  url?: string;
  urls?: string[];
  name?: string;
  note?: string;
  notes?: string[];
  family?: VisualFamily;
  tags?: string[];
  include?: string[];
  exclude?: string[];
  maxFiles?: number;
  maxBytes?: number;
  command?: string;
  args?: string[];
  timeoutSeconds?: number;
  workingDirectory?: string;
  captureInputEvents?: boolean;
  idleTimeLimitSeconds?: number;
};

export type VisualFlowConfig = {
  schemaVersion: "visual-flow/v1";
  projectId: string;
  fps: number;
  themeId: string;
  sources: VisualFlowSource[];
  normalization?: {
    idleTimeLimitSeconds?: number;
  };
  mapping: {
    allowedFamilies: VisualFamily[];
    allowedPresets: string[];
    defaultFamily: VisualFamily;
    defaultPreset: string;
    minSceneSeconds: number;
    maxSceneSeconds: number;
    maxItemsPerScene: number;
  };
};

export type SourceProvenance = {
  sourceId: string;
  sourceRef: string;
  sourceChecksum: string;
  collectorVersion: string;
};

export type NormalizedVisualEvent = {
  id: string;
  sourceId: string;
  sourceRef: string;
  kind:
    | "narrative"
    | "command"
    | "output"
    | "log"
    | "code"
    | "tree"
    | "metric"
    | "marker"
    | "resize"
    | "design_token"
    | "layout_reference"
    | "motion_reference";
  timeSeconds?: number;
  frame?: number;
  text?: string;
  level?: "info" | "success" | "warning" | "error";
  data?: Record<string, unknown>;
  provenance: SourceProvenance;
};

export type VisualSceneRequirement = {
  sceneId: string;
  visualFamily: VisualFamily;
  preset: string;
  themeId: string;
  durationInFrames: number;
  title?: string;
  blocks: Array<{
    kind:
      | "narrative"
      | "command"
      | "output"
      | "log"
      | "code"
      | "tree"
      | "progress"
      | "metric"
      | "text"
      | "media";
    at: number;
    text?: string;
    data?: Record<string, unknown>;
    sourceEventIds: string[];
  }>;
};
