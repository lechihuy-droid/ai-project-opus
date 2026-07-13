import type { ProductionVisualFamily, TemplateRole } from "../../data";

export type RuntimeRendererKind = "family-renderer" | "template-adapter";

export type RuntimeContentCapacity = {
  headlineChars?: number;
  bodyChars?: number;
  maxItems?: number;
  maxPanels?: number;
  maxCodeLines?: number;
  maxMetrics?: number;
  maxEvents?: number;
};

export type RuntimePackageDescriptor = {
  id: ProductionVisualFamily;
  label: string;
  status: string;
  visualFamily: string;
  supportedTemplateRoles: TemplateRole[];
  preferredTemplates: string[];
  packageTemplateIds: string[];
  contentCapacity: RuntimeContentCapacity;
  requiresEmbeddableAsset: boolean;
  requiresNumericData: boolean;
  rendererKind: RuntimeRendererKind;
  rendererId: string;
};

export type RuntimeFamilyResolution = {
  requestedFamily?: string;
  resolvedFamily: ProductionVisualFamily | null;
  reason?: string;
};

export type StyleRuntimeGuardSummary = {
  hasEmbeddableAsset: boolean;
  embeddableAssetIds: string[];
  hasNumericData: boolean;
  numericDataPoints: string[];
};

export type StyleRuntimeRejection = {
  family: string;
  codes: string[];
  reasons: string[];
};

export type StyleRuntimeChoice = {
  requestedFamily?: string;
  selectedFamily: ProductionVisualFamily | null;
  packageLabel?: string;
  packageStatus?: string;
  rendererKind: RuntimeRendererKind;
  rendererId: string;
  templateId: string;
  familySceneKey?: string;
  guards: StyleRuntimeGuardSummary;
  reasons: string[];
  rejected: StyleRuntimeRejection[];
};
