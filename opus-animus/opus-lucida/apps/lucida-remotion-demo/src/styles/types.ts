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

export const styleRagPackageIds = [
  ...plannedStyleFamilyIds,
  "system-architecture",
  "code-walkthrough",
  "news-rundown",
  "claim-evidence",
  "interface-walkthrough",
] as const;

export type StyleRagPackageId = (typeof styleRagPackageIds)[number];

/** Package IDs with an implementation in the renderer registry. */
export const rendererBackedStyleRagPackageIds = plannedStyleFamilyIds;

/** Style RAG IDs that remain evidence/retrieval-only until a renderer is registered. */
export const ragOnlyStylePackageIds = [
  "system-architecture",
  "code-walkthrough",
  "news-rundown",
  "claim-evidence",
  "interface-walkthrough",
] as const;

export type RendererBackedStyleRagPackageId = (typeof rendererBackedStyleRagPackageIds)[number];

export const isRendererBackedStyleRagPackageId = (
  packageId: StyleRagPackageId,
): packageId is RendererBackedStyleRagPackageId =>
  (rendererBackedStyleRagPackageIds as readonly string[]).includes(packageId);

export const stylePackageStatuses = [
  "draft",
  "experimental",
  "stable",
  "deprecated",
  "prototype-created",
] as const;

export type StylePackageStatus = (typeof stylePackageStatuses)[number];

export type StyleRegistryAvailability = "available" | "unavailable";

export type StyleRegistrySupport = "package-backed" | "migrated" | "planned";

export type StyleAspectRatio = "9:16" | "16:9" | "1:1";

export type StyleRenderCost = "low" | "medium" | "high";

export type StylePackageDensity = Density | "sparse" | "balanced" | "dense";

export const stylePatternTypes = [
  "layout",
  "typography",
  "palette",
  "motion",
  "component",
  "composition",
  "content-density",
  "use-case",
  "anti-pattern",
] as const;

export type StylePatternType = (typeof stylePatternTypes)[number];

export type StyleRagContentDensity = "sparse" | "balanced" | "dense";

export type StyleReviewStatus = "proposed" | "approved" | "rejected";

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

export type StyleRagContentCapacity = StyleContentCapacity;

export type StylePackageContentCapacity = StyleContentCapacity & {
  headlineChars: number;
  bodyChars: number;
};

export type StyleRagTraits = string[];

export type StyleVariant = {
  schemaVersion: "lucida-style-variant/v1";
  variantId: string;
  packageId: StyleRagPackageId;
  label: string;
  description: string;
  intentTags: string[];
  beatRoles: string[];
  contentDensity: StyleRagContentDensity;
  aspectRatios: StyleAspectRatio[];
  layoutTraits: StyleRagTraits;
  typographyTraits: StyleRagTraits;
  paletteTraits: StyleRagTraits;
  motionTraits: StyleRagTraits;
  componentTraits: StyleRagTraits;
  contentCapacity: StyleRagContentCapacity;
  positiveUseCases: string[];
  antiPatterns: string[];
  sourceEvidenceIds: string[];
  classificationReasons: string[];
  classifierVersion: string;
  reviewStatus: StyleReviewStatus;
};

export type VisualPattern = Omit<StyleVariant, "schemaVersion" | "variantId"> & {
  schemaVersion: "lucida-visual-pattern/v1";
  patternId: string;
  variantIds: string[];
  patternType: StylePatternType;
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
  sourceReviewReport: string;
};

export type StyleValidationArtifacts = {
  demoVideoMap?: string;
  renderProps?: string;
  previewFrames: string[];
  renderReport: string;
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
  knownLimitations?: string[];
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
  contentCapacity: StylePackageContentCapacity;
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
  contentCapacity: StylePackageContentCapacity;
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
  /** Optional until existing package manifests are migrated to the Style RAG contracts. */
  variantRefs?: string[];
  /** Optional until existing package manifests are migrated to the Style RAG contracts. */
  visualPatternRefs?: string[];
  /** Optional until source associations are represented by canonical evidence records. */
  sourceAssociationIds?: string[];
};

export type PatternSourceEvidenceValidation = {
  valid: boolean;
  missingSourceEvidenceIds: string[];
};

/** JSON Schema validates documents independently; this checks the cross-artifact evidence key. */
export const validatePatternSourceEvidenceIds = (
  pattern: Pick<VisualPattern, "sourceEvidenceIds">,
  pkg: Pick<StylePackageManifest, "sourceReferences">,
): PatternSourceEvidenceValidation => {
  const packageSourceIds = new Set(pkg.sourceReferences.map((reference) => reference.id));
  const missingSourceEvidenceIds = [...new Set(
    pattern.sourceEvidenceIds.filter((sourceEvidenceId) => !packageSourceIds.has(sourceEvidenceId)),
  )];

  return {valid: missingSourceEvidenceIds.length === 0, missingSourceEvidenceIds};
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
