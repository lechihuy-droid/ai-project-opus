export type VisualSourceType =
  | "script"
  | "content_brief"
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

export type ProductionStylePackageId =
  | "terminal-command-center"
  | "technical-editorial"
  | "minimal-education"
  | "cinematic-type"
  | "dashboard-data"
  | "paper-notebook"
  | "product-showcase"
  | "editorial-collage"
  | "timeline-documentary";

export type StyleReference = VisualFamily | ProductionStylePackageId;

export type ContentBriefBeatRole =
  | "hook"
  | "context"
  | "problem"
  | "insight"
  | "explanation"
  | "evidence"
  | "process"
  | "comparison"
  | "example"
  | "turning-point"
  | "takeaway"
  | "call-to-action"
  | "transition";

export type ContentBriefVisualConstraints = {
  requiredPackages?: ProductionStylePackageId[];
  forbiddenPackages?: ProductionStylePackageId[];
  requiredFamilies?: VisualFamily[];
  forbiddenFamilies?: VisualFamily[];
  assets?: {
    requiredClassifications?: string[];
    allowedClassifications?: string[];
    forbiddenClassifications?: string[];
  };
  density?: { preferred?: "low" | "medium" | "high"; minimum?: "low" | "medium" | "high"; maximum?: "low" | "medium" | "high" };
  layout?: { required?: string[]; forbidden?: string[]; minDistinct?: number; maxConsecutive?: number };
};

export type ContentBriefBeat = {
  id: string;
  title: string;
  body: string;
  intent?: string;
  role: ContentBriefBeatRole;
  actors: string[];
  factRefs: string[];
};

export type ContentBrief = {
  schemaVersion: "lucida-content-brief/v1";
  title: string;
  audience: string;
  intent: string;
  beats: ContentBriefBeat[];
  factualSourceIds: string[];
  visualConstraints: ContentBriefVisualConstraints;
  styleMode: StyleMode;
};

export type RunLane = "production" | "rapid-visual-pilot";
export type StyleMode = "auto" | "locked";
export type PublicationStatus =
  | "non_publishable"
  | "promotion_pending"
  | "publishable";

export type LockedStyle = {
  family: StyleReference;
  lockedBy: string;
  reason: string;
};

type RunEnvelopeBase = {
  schemaVersion: "lucida-run/v1";
  runId: string;
  lane: RunLane;
  publicationStatus: PublicationStatus;
  approvalRefs: string[];
};

export type AutoRunEnvelope = RunEnvelopeBase & {
  styleMode: "auto";
  lockedStyle?: never;
};

export type LockedRunEnvelope = RunEnvelopeBase & {
  styleMode: "locked";
  lockedStyle: LockedStyle;
};

export type RunEnvelope = AutoRunEnvelope | LockedRunEnvelope;

export type ApprovalKind =
  | "visual-treatment"
  | "video-map"
  | "final-video"
  | "promotion";
export type ApprovalStatus = "approved" | "rejected";

export type ApprovalRecord = {
  schemaVersion: "lucida-approval/v1";
  approvalId: string;
  runId: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  artifactHash: string;
  approvedBy: string;
  approvedAt: string;
};

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

export type VisualFlowV1Config = {
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

export type VisualFlowV2AutoSource = Omit<VisualFlowSource, "family"> & {
  family?: never;
};

export type VisualFlowV2BaseConfig = Omit<
  VisualFlowV1Config,
  "schemaVersion" | "sources" | "mapping"
> & {
  schemaVersion: "visual-flow/v2";
};

export type VisualFlowV2AutoConfig = VisualFlowV2BaseConfig & {
  run: AutoRunEnvelope;
  sources: VisualFlowV2AutoSource[];
  mapping: Omit<VisualFlowV1Config["mapping"], "defaultFamily"> & {
    defaultFamily?: never;
  };
};

export type VisualFlowV2LockedConfig = VisualFlowV2BaseConfig & {
  run: LockedRunEnvelope;
  sources: VisualFlowSource[];
  mapping: Omit<VisualFlowV1Config["mapping"], "defaultFamily"> & {
    defaultFamily?: VisualFamily;
  };
};

export type VisualFlowV2Config =
  | VisualFlowV2AutoConfig
  | VisualFlowV2LockedConfig;

export type VisualFlowConfig = VisualFlowV2Config;

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
  beatId?: string;
  title?: string;
  body?: string;
  intent?: string;
  beatRole?: ContentBriefBeatRole;
  actors?: string[];
  factRefs?: string[];
  factualSourceIds?: string[];
  visualConstraints?: ContentBriefVisualConstraints;
  level?: "info" | "success" | "warning" | "error";
  data?: Record<string, unknown>;
  provenance: SourceProvenance;
};

export type VisualSceneRequirement = {
  sceneId: string;
  visualFamily: VisualFamily;
  packageId?: ProductionStylePackageId;
  legacyFamily?: VisualFamily;
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
