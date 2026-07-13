import type {
  Density,
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

export type StyleRegistrySupport = "package-backed" | "migrated" | "planned";

export type StyleAspectRatio = "9:16" | "16:9" | "1:1";

export type StyleRenderCost = "low" | "medium" | "high";

export type StylePackageDensity = Density | "sparse" | "balanced" | "dense";

export type StyleContentCapacity = {
  headlineChars?: number;
  bodyChars?: number;
  bulletsMaxItems?: number;
  maxDataSeries?: number;
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

export type StylePackageRenderCostSpec = {
  tier: StyleRenderCost;
  estimatedSceneComplexity?: number;
  notes: string;
};

export type StylePackageReducedMotionSpec = {
  strategy: "static" | "fade" | "simplified-motion" | "reduced-motion-fade";
  notes: string;
};

export type StylePackageAccessibilitySpec = {
  contrast: "AA" | "AAA" | "review-required";
  notes: string;
};

export type StyleDirectorCompatibilitySpec = {
  selectionReason: string;
  preferredNeighborFamilies?: string[];
  bridgeFamilies?: string[];
  hardBlocks?: string[];
};

export type StylePackageFileRefs = {
  visual: string;
  tokens: string;
  componentMap: string;
  provenance: string;
  artifactManifest: string;
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
  recommendedIntents: string[];
  avoidFor: string[];
  supportedSceneTypes: string[];
  supportedTemplateRoles: TemplateRole[];
  aspectRatios: StyleAspectRatio[];
  density: StylePackageDensity;
  renderCost: StyleRenderCost;
  contentCapacity: StyleContentCapacity;
  preferredLayouts: string[];
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
  role: string;
  notes: string;
};

export type StyleTemplateBinding = {
  templateId: string;
  supportedLayouts: string[];
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

export type StylePackageManifest = {
  schemaVersion: "lucida-style-package/v1";
  id: StyleFamilyId;
  label: string;
  version: string;
  status: StylePackageStatus;
  visualFamily: string;
  description: string;
  tags?: string[];
  supportedIntents: string[];
  recommendedIntents?: string[];
  avoidFor: string[];
  aspectRatios: StyleAspectRatio[];
  contentCapacity: StyleContentCapacity;
  renderCost: StylePackageRenderCostSpec;
  reducedMotion: StylePackageReducedMotionSpec;
  accessibility: StylePackageAccessibilitySpec;
  directorCompatibility: StyleDirectorCompatibilitySpec;
  files: StylePackageFileRefs;
  sourcePolicy: StyleSourcePolicy;
  tokens?: unknown;
  layoutGrammar?: string[];
  componentPrimitives?: StyleComponentPrimitive[];
  templateBindings?: {
    preferredTemplates?: string[];
    layouts?: string[];
    backgroundEffects?: string[];
    motionPreset?: string;
  };
  sourceArtifacts: StyleSourceArtifacts;
  validationArtifacts: StyleValidationArtifacts;
  sourceReferences: StyleSourceReference[];
  qualityGate: StyleQualityGate;
};

export type LegacyStylePackageManifest = StylePackageManifest;

export type StylePackageDefinition = {
  id: StyleFamilyId;
  label: string;
  status: StylePackageStatus;
  visualFamily: string;
  manifest: StylePackageManifest;
  visual: StylePackageVisualSpec;
  tokens: StylePackageTokensSpec;
  componentMap: StylePackageComponentMapSpec;
  sourcePolicy: StyleSourcePolicy;
  sourceArtifacts: StyleSourceArtifacts;
  validationArtifacts: StyleValidationArtifacts;
  sourceReferences: StyleSourceReference[];
  qualityGate: StyleQualityGate;
  packagePath: string;
  provenancePath: string;
  artifactManifestPath: string;
  legacyPackagePath?: string;
};

export type StyleAvailableFamilyDescriptor = {
  id: StyleFamilyId;
  label: string;
  availability: "available";
  support: "package-backed" | "migrated";
  status: StylePackageStatus;
  packageRef: string;
  artifactManifestRef: string;
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
  recommendedIntents: string[];
  reason: string;
};

export type StyleFamilyDescriptor =
  | StyleAvailableFamilyDescriptor
  | StyleUnavailableFamilyDescriptor;

export type StyleRegistryRecord = Record<StyleFamilyId, StyleFamilyDescriptor>;
