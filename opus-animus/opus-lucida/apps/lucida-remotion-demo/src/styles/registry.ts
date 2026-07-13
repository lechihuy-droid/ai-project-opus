import terminalComponentMapJson from "../../design/visual-library/styles/terminal-command-center/component-map.json";
import terminalVisualJson from "../../design/visual-library/styles/terminal-command-center/visual.json";
import terminalStylePackageJson from "../../design/visual-library/styles/terminal-command-center/style-package.json";
import terminalTokensJson from "../../design/visual-library/styles/terminal-command-center/tokens.json";
import type {
  LegacyStylePackageManifest,
  StyleAvailableFamilyDescriptor,
  StyleFamilyDescriptor,
  StyleFamilyId,
  StylePackageComponentMapSpec,
  StylePackageDefinition,
  StylePackageTokensSpec,
  StylePackageVisualSpec,
  StyleRegistryRecord,
  StyleUnavailableFamilyDescriptor,
} from "./types";
import { plannedStyleFamilyIds } from "./types";

const TERMINAL_PROVENANCE_PATH =
  "design/visual-library/styles/terminal-command-center/provenance.md";

const TERMINAL_LEGACY_PACKAGE_PATH =
  "design/visual-library/styles/terminal-command-center/style-package.json";

const terminalVisual =
  terminalVisualJson as StylePackageVisualSpec;

const terminalTokens =
  terminalTokensJson as StylePackageTokensSpec;

const terminalComponentMap =
  terminalComponentMapJson as StylePackageComponentMapSpec;

const terminalLegacyManifest =
  terminalStylePackageJson as LegacyStylePackageManifest;

type LegacyAdapterInput = {
  legacyManifest: LegacyStylePackageManifest;
  visual: StylePackageVisualSpec;
  tokens: StylePackageTokensSpec;
  componentMap: StylePackageComponentMapSpec;
  provenancePath: string;
  legacyPackagePath?: string;
};

export const adaptLegacyStylePackage = ({
  legacyManifest,
  visual,
  tokens,
  componentMap,
  provenancePath,
  legacyPackagePath,
}: LegacyAdapterInput): StylePackageDefinition => ({
  id: visual.id,
  label: visual.label,
  status: visual.status,
  visualFamily: visual.visualFamily,
  visual,
  tokens,
  componentMap,
  sourcePolicy: visual.sourcePolicy ?? legacyManifest.sourcePolicy,
  sourceArtifacts: legacyManifest.sourceArtifacts,
  validationArtifacts: legacyManifest.validationArtifacts,
  sourceReferences: legacyManifest.sourceReferences,
  qualityGate: legacyManifest.qualityGate,
  provenancePath,
  legacyPackagePath,
});

const createUnavailableFamily = (
  descriptor: Omit<StyleUnavailableFamilyDescriptor, "availability" | "support" | "status">,
): StyleUnavailableFamilyDescriptor => ({
  ...descriptor,
  availability: "unavailable",
  support: "planned",
  status: "draft",
});

const terminalStylePackage = adaptLegacyStylePackage({
  legacyManifest: terminalLegacyManifest,
  visual: terminalVisual,
  tokens: terminalTokens,
  componentMap: terminalComponentMap,
  provenancePath: TERMINAL_PROVENANCE_PATH,
  legacyPackagePath: TERMINAL_LEGACY_PACKAGE_PATH,
});

export const styleFamilyRegistry: StyleRegistryRecord = {
  "terminal-command-center": {
    id: "terminal-command-center",
    label: terminalStylePackage.label,
    availability: "available",
    support: "migrated",
    package: terminalStylePackage,
  },
  "technical-editorial": createUnavailableFamily({
    id: "technical-editorial",
    label: "Technical Editorial",
    primaryUse: "architecture, concepts, and research explainers",
    visualGrammar: "strict grid, rules, annotations, and code/data callouts",
    requiredSceneTypes: ["explainer", "diagram", "summary"],
    recommendedIntents: ["system_architecture", "code_explanation", "comparison", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
  "minimal-education": createUnavailableFamily({
    id: "minimal-education",
    label: "Minimal Education",
    primaryUse: "teaching, definitions, and concise step-by-step scenes",
    visualGrammar: "generous whitespace, clear hierarchy, and restrained accent",
    requiredSceneTypes: ["definition", "steps", "comparison"],
    recommendedIntents: ["list", "process", "comparison", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
  "cinematic-type": createUnavailableFamily({
    id: "cinematic-type",
    label: "Cinematic Type",
    primaryUse: "hooks, chapter resets, and claim-driven scenes",
    visualGrammar: "large type, image or texture field, and low density composition",
    requiredSceneTypes: ["hook", "quote", "transition"],
    recommendedIntents: ["hook", "quote", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
  "dashboard-data": createUnavailableFamily({
    id: "dashboard-data",
    label: "Dashboard Data",
    primaryUse: "metrics, status, monitoring, and operational reporting",
    visualGrammar: "dense panels, chart or table hierarchy, and semantic state colors",
    requiredSceneTypes: ["KPI", "chart", "operations"],
    recommendedIntents: ["comparison", "list", "system_architecture", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
  "paper-notebook": createUnavailableFamily({
    id: "paper-notebook",
    label: "Paper Notebook",
    primaryUse: "reasoning, study notes, and process walkthroughs",
    visualGrammar: "paper field, ink hierarchy, marks, and annotations",
    requiredSceneTypes: ["notes", "derivation", "checklist"],
    recommendedIntents: ["process", "list", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
  "product-showcase": createUnavailableFamily({
    id: "product-showcase",
    label: "Product Showcase",
    primaryUse: "UI and product walkthrough scenes",
    visualGrammar: "product-first media, feature focus, and clean staged layouts",
    requiredSceneTypes: ["reveal", "feature", "before/after"],
    recommendedIntents: ["use_case", "comparison", "process", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
  "editorial-collage": createUnavailableFamily({
    id: "editorial-collage",
    label: "Editorial Collage",
    primaryUse: "culture, multi-source narrative, and evidence-driven montage",
    visualGrammar: "modular crops, captions, and layered composition",
    requiredSceneTypes: ["montage", "evidence", "recap"],
    recommendedIntents: ["hook", "use_case", "quote", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
  "timeline-documentary": createUnavailableFamily({
    id: "timeline-documentary",
    label: "Timeline Documentary",
    primaryUse: "history, chronology, and case-study storytelling",
    visualGrammar: "dated spine, archival framing, and source labels",
    requiredSceneTypes: ["milestone", "era change", "conclusion"],
    recommendedIntents: ["process", "use_case", "quote", "takeaway"],
    reason: "Wave 0 registry placeholder only. Package metadata and renderer are not implemented yet.",
  }),
};

const plannedStyleFamilyIdSet = new Set<string>(plannedStyleFamilyIds);

export const isStyleFamilyId = (value: string): value is StyleFamilyId =>
  plannedStyleFamilyIdSet.has(value);

export const resolveStyleFamily = (familyId: StyleFamilyId): StyleFamilyDescriptor =>
  styleFamilyRegistry[familyId];

export const isAvailableStyleFamily = (
  descriptor: StyleFamilyDescriptor,
): descriptor is StyleAvailableFamilyDescriptor =>
  descriptor.availability === "available";

export const plannedStyleFamilies = plannedStyleFamilyIds.map((familyId) =>
  resolveStyleFamily(familyId),
);

export const availableStyleFamilies = plannedStyleFamilies.filter(isAvailableStyleFamily);

export const unavailableStyleFamilies = plannedStyleFamilies.filter(
  (descriptor): descriptor is StyleUnavailableFamilyDescriptor =>
    descriptor.availability === "unavailable",
);

export const resolveAvailableStylePackage = (
  familyId: StyleFamilyId,
): StylePackageDefinition | null => {
  const descriptor = resolveStyleFamily(familyId);

  return descriptor.availability === "available" ? descriptor.package : null;
};
