import type {
  Density,
  SceneIntent,
  SceneLayout,
  TemplateRole,
} from "../data";

export const plannedStyleFamilyIds = [
  "terminal-command-center",
  "technical-editorial",
  "minimal-education",
  "cinematic-type",
  "dashboard-data",
  "paper-notebook",
  "product-showcase",
  "editorial-collage",
  "timeline-documentary",
] as const;

export type StyleFamilyId = (typeof plannedStyleFamilyIds)[number];

export const stylePackageStatuses = [
  "draft",
  "experimental",
  "stable",
  "prototype-created",
] as const;

export type StylePackageStatus = (typeof stylePackageStatuses)[number];

export type StyleRegistryAvailability = "available" | "unavailable";

export type StyleRegistrySupport = "migrated" | "planned";

export type StyleAspectRatio = "9:16" | "16:9" | "1:1";

export type StyleRenderCost = "low" | "medium" | "high";

export type StyleContentCapacity = {
  headlineChars?: number;
  bodyChars?: number;
  maxItems?: number;
  maxPanels?: number;
  maxCodeLines?: number;
  maxMetrics?: number;
  maxEvents?: number;
};

export type StyleSourcePolicy = {
  copyStatus: string;
  registeredMedia: string;
  notes: string;
};

export type StyleSourceArtifacts = {
  ingestConfig?: string;
  rawInput?: string;
  sanitizedInput?: string;
  normalizedInput?: string;
  mappedScenes?: string;
  compiledVideoMap?: string;
  sourceReviewReport?: string;
};

export type StyleValidationArtifacts = {
  demoVideoMap?: string;
  renderProps?: string;
  previewFrames?: string[];
  renderReport?: string;
  videoBinaryRegistered?: boolean;
};

export type StyleSourceReference = {
  id: string;
  url: string;
  selectedConcepts: string[];
};

export type StyleQualityGate = {
  validated: boolean;
  checks: string[];
  knownLimitations: string[];
};

export type StylePackageVisualSpec = {
  schemaVersion: "lucida-visual-package/v1";
  id: StyleFamilyId;
  label: string;
  status: StylePackageStatus;
  visualFamily: string;
  summary: string;
  description: string;
  tags: string[];
  recommendedIntents: SceneIntent[];
  avoidFor: string[];
  supportedSceneTypes: string[];
  supportedTemplateRoles: TemplateRole[];
  aspectRatios: StyleAspectRatio[];
  density: Density;
  renderCost: StyleRenderCost;
  contentCapacity: StyleContentCapacity;
  preferredLayouts: SceneLayout[];
  preferredTemplates: string[];
  backgroundEffects: string[];
  motionPreset?: string;
  layoutGrammar: string[];
  sourcePolicy: StyleSourcePolicy;
  notes?: string[];
};

export type StylePackageTokensSpec = {
  schemaVersion: "lucida-style-tokens/v1";
  id: StyleFamilyId;
  color: {
    background: string;
    panel: string;
    panelElevated: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    warning: string;
    success: string;
    danger: string;
  };
  typography: {
    display: string;
    body: string;
    metadata: string;
    letterSpacing: number;
  };
  surface: {
    radius: number;
    border: string;
    shadow: string;
    scanlineOpacity: string;
  };
};

export type StyleComponentPrimitive = {
  id: string;
  role: "surface" | "content" | "process";
  notes: string;
};

export type StyleTemplateBinding = {
  templateId: string;
  supportedLayouts: SceneLayout[];
  backgroundEffects: string[];
  motionPreset?: string;
  primitives: string[];
  notes: string;
};

export type StylePackageComponentMapSpec = {
  schemaVersion: "lucida-component-map/v1";
  id: StyleFamilyId;
  primitives: StyleComponentPrimitive[];
  templates: StyleTemplateBinding[];
};

export type LegacyStylePackageManifest = {
  schemaVersion: "lucida-style-package/v1";
  id: StyleFamilyId;
  label: string;
  status: StylePackageStatus;
  visualFamily: string;
  description: string;
  sourcePolicy: StyleSourcePolicy;
  tokens?: Omit<StylePackageTokensSpec, "schemaVersion" | "id">;
  layoutGrammar?: string[];
  componentPrimitives?: StyleComponentPrimitive[];
  templateBindings?: {
    preferredTemplates?: string[];
    layouts?: SceneLayout[];
    backgroundEffects?: string[];
    motionPreset?: string;
  };
  sourceArtifacts?: StyleSourceArtifacts;
  validationArtifacts?: StyleValidationArtifacts;
  sourceReferences?: StyleSourceReference[];
  qualityGate?: StyleQualityGate;
};

export type StylePackageDefinition = {
  id: StyleFamilyId;
  label: string;
  status: StylePackageStatus;
  visualFamily: string;
  visual: StylePackageVisualSpec;
  tokens: StylePackageTokensSpec;
  componentMap: StylePackageComponentMapSpec;
  sourcePolicy: StyleSourcePolicy;
  sourceArtifacts?: StyleSourceArtifacts;
  validationArtifacts?: StyleValidationArtifacts;
  sourceReferences?: StyleSourceReference[];
  qualityGate?: StyleQualityGate;
  provenancePath: string;
  legacyPackagePath?: string;
};

export type StyleAvailableFamilyDescriptor = {
  id: StyleFamilyId;
  label: string;
  availability: "available";
  support: "migrated";
  package: StylePackageDefinition;
};

export type StyleUnavailableFamilyDescriptor = {
  id: StyleFamilyId;
  label: string;
  availability: "unavailable";
  support: "planned";
  status: "draft";
  primaryUse: string;
  visualGrammar: string;
  requiredSceneTypes: string[];
  recommendedIntents: SceneIntent[];
  reason: string;
};

export type StyleFamilyDescriptor =
  | StyleAvailableFamilyDescriptor
  | StyleUnavailableFamilyDescriptor;

export type StyleRegistryRecord = Record<StyleFamilyId, StyleFamilyDescriptor>;
