import cinematicTypeComponentMapJson from "../../design/visual-library/styles/cinematic-type/component-map.json";
import cinematicTypeStylePackageJson from "../../design/visual-library/styles/cinematic-type/style-package.json";
import cinematicTypeTokensJson from "../../design/visual-library/styles/cinematic-type/tokens.json";
import cinematicTypeVisualJson from "../../design/visual-library/styles/cinematic-type/visual.json";
import dashboardDataComponentMapJson from "../../design/visual-library/styles/dashboard-data/component-map.json";
import dashboardDataStylePackageJson from "../../design/visual-library/styles/dashboard-data/style-package.json";
import dashboardDataTokensJson from "../../design/visual-library/styles/dashboard-data/tokens.json";
import dashboardDataVisualJson from "../../design/visual-library/styles/dashboard-data/visual.json";
import editorialCollageComponentMapJson from "../../design/visual-library/styles/editorial-collage/component-map.json";
import editorialCollageStylePackageJson from "../../design/visual-library/styles/editorial-collage/style-package.json";
import editorialCollageTokensJson from "../../design/visual-library/styles/editorial-collage/tokens.json";
import editorialCollageVisualJson from "../../design/visual-library/styles/editorial-collage/visual.json";
import minimalEducationComponentMapJson from "../../design/visual-library/styles/minimal-education/component-map.json";
import minimalEducationStylePackageJson from "../../design/visual-library/styles/minimal-education/style-package.json";
import minimalEducationTokensJson from "../../design/visual-library/styles/minimal-education/tokens.json";
import minimalEducationVisualJson from "../../design/visual-library/styles/minimal-education/visual.json";
import paperNotebookComponentMapJson from "../../design/visual-library/styles/paper-notebook/component-map.json";
import paperNotebookStylePackageJson from "../../design/visual-library/styles/paper-notebook/style-package.json";
import paperNotebookTokensJson from "../../design/visual-library/styles/paper-notebook/tokens.json";
import paperNotebookVisualJson from "../../design/visual-library/styles/paper-notebook/visual.json";
import productShowcaseComponentMapJson from "../../design/visual-library/styles/product-showcase/component-map.json";
import productShowcaseStylePackageJson from "../../design/visual-library/styles/product-showcase/style-package.json";
import productShowcaseTokensJson from "../../design/visual-library/styles/product-showcase/tokens.json";
import productShowcaseVisualJson from "../../design/visual-library/styles/product-showcase/visual.json";
import technicalEditorialComponentMapJson from "../../design/visual-library/styles/technical-editorial/component-map.json";
import technicalEditorialStylePackageJson from "../../design/visual-library/styles/technical-editorial/style-package.json";
import technicalEditorialTokensJson from "../../design/visual-library/styles/technical-editorial/tokens.json";
import technicalEditorialVisualJson from "../../design/visual-library/styles/technical-editorial/visual.json";
import terminalCommandCenterComponentMapJson from "../../design/visual-library/styles/terminal-command-center/component-map.json";
import terminalCommandCenterStylePackageJson from "../../design/visual-library/styles/terminal-command-center/style-package.json";
import terminalCommandCenterTokensJson from "../../design/visual-library/styles/terminal-command-center/tokens.json";
import terminalCommandCenterVisualJson from "../../design/visual-library/styles/terminal-command-center/visual.json";
import timelineDocumentaryComponentMapJson from "../../design/visual-library/styles/timeline-documentary/component-map.json";
import timelineDocumentaryStylePackageJson from "../../design/visual-library/styles/timeline-documentary/style-package.json";
import timelineDocumentaryTokensJson from "../../design/visual-library/styles/timeline-documentary/tokens.json";
import timelineDocumentaryVisualJson from "../../design/visual-library/styles/timeline-documentary/visual.json";
import type {
  LegacyStylePackageManifest,
  StyleAvailableFamilyDescriptor,
  StyleFamilyDescriptor,
  StyleFamilyId,
  StylePackageComponentMapSpec,
  StylePackageDefinition,
  StylePackageManifest,
  StylePackageTokensSpec,
  StylePackageVisualSpec,
  StyleRegistryRecord,
  StyleUnavailableFamilyDescriptor,
} from "./types";
import { plannedStyleFamilyIds } from "./types";

type StylePackageAdapterInput = {
  manifest: StylePackageManifest;
  visual: StylePackageVisualSpec;
  tokens: StylePackageTokensSpec;
  componentMap: StylePackageComponentMapSpec;
  packagePath: string;
  provenancePath: string;
  artifactManifestPath: string;
  legacyPackagePath?: string;
};

type LegacyAdapterInput = Omit<
  StylePackageAdapterInput,
  "manifest" | "packagePath" | "artifactManifestPath"
> & {
  legacyManifest: LegacyStylePackageManifest;
  legacyPackagePath?: string;
  artifactManifestPath?: string;
};

const packagePathFor = (familyId: StyleFamilyId): string =>
  `design/visual-library/styles/${familyId}/style-package.json`;

const provenancePathFor = (familyId: StyleFamilyId): string =>
  `design/visual-library/styles/${familyId}/provenance.md`;

const artifactManifestPathFor = (familyId: StyleFamilyId): string =>
  `design/visual-library/styles/${familyId}/artifact-manifest.json`;

export const adaptStylePackage = ({
  manifest,
  visual,
  tokens,
  componentMap,
  packagePath,
  provenancePath,
  artifactManifestPath,
  legacyPackagePath,
}: StylePackageAdapterInput): StylePackageDefinition => ({
  id: manifest.id,
  label: manifest.label,
  status: manifest.status,
  visualFamily: manifest.visualFamily,
  manifest,
  visual,
  tokens,
  componentMap,
  sourcePolicy: manifest.sourcePolicy ?? visual.sourcePolicy,
  sourceArtifacts: manifest.sourceArtifacts,
  validationArtifacts: manifest.validationArtifacts,
  sourceReferences: manifest.sourceReferences,
  qualityGate: manifest.qualityGate,
  packagePath,
  provenancePath,
  artifactManifestPath,
  legacyPackagePath,
});

export const adaptLegacyStylePackage = ({
  legacyManifest,
  visual,
  tokens,
  componentMap,
  provenancePath,
  legacyPackagePath,
  artifactManifestPath,
}: LegacyAdapterInput): StylePackageDefinition =>
  adaptStylePackage({
    manifest: legacyManifest,
    visual,
    tokens,
    componentMap,
    packagePath: legacyPackagePath ?? packagePathFor(legacyManifest.id),
    provenancePath,
    artifactManifestPath:
      artifactManifestPath ?? artifactManifestPathFor(legacyManifest.id),
    legacyPackagePath,
  });

const createStylePackage = (
  familyId: StyleFamilyId,
  manifestJson: unknown,
  visualJson: unknown,
  tokensJson: unknown,
  componentMapJson: unknown,
): StylePackageDefinition =>
  adaptStylePackage({
    manifest: manifestJson as StylePackageManifest,
    visual: visualJson as StylePackageVisualSpec,
    tokens: tokensJson as StylePackageTokensSpec,
    componentMap: componentMapJson as StylePackageComponentMapSpec,
    packagePath: packagePathFor(familyId),
    provenancePath: provenancePathFor(familyId),
    artifactManifestPath: artifactManifestPathFor(familyId),
  });

export const stylePackageRegistry = {
  "terminal-command-center": createStylePackage(
    "terminal-command-center",
    terminalCommandCenterStylePackageJson,
    terminalCommandCenterVisualJson,
    terminalCommandCenterTokensJson,
    terminalCommandCenterComponentMapJson,
  ),
  "technical-editorial": createStylePackage(
    "technical-editorial",
    technicalEditorialStylePackageJson,
    technicalEditorialVisualJson,
    technicalEditorialTokensJson,
    technicalEditorialComponentMapJson,
  ),
  "minimal-education": createStylePackage(
    "minimal-education",
    minimalEducationStylePackageJson,
    minimalEducationVisualJson,
    minimalEducationTokensJson,
    minimalEducationComponentMapJson,
  ),
  "cinematic-type": createStylePackage(
    "cinematic-type",
    cinematicTypeStylePackageJson,
    cinematicTypeVisualJson,
    cinematicTypeTokensJson,
    cinematicTypeComponentMapJson,
  ),
  "dashboard-data": createStylePackage(
    "dashboard-data",
    dashboardDataStylePackageJson,
    dashboardDataVisualJson,
    dashboardDataTokensJson,
    dashboardDataComponentMapJson,
  ),
  "paper-notebook": createStylePackage(
    "paper-notebook",
    paperNotebookStylePackageJson,
    paperNotebookVisualJson,
    paperNotebookTokensJson,
    paperNotebookComponentMapJson,
  ),
  "product-showcase": createStylePackage(
    "product-showcase",
    productShowcaseStylePackageJson,
    productShowcaseVisualJson,
    productShowcaseTokensJson,
    productShowcaseComponentMapJson,
  ),
  "editorial-collage": createStylePackage(
    "editorial-collage",
    editorialCollageStylePackageJson,
    editorialCollageVisualJson,
    editorialCollageTokensJson,
    editorialCollageComponentMapJson,
  ),
  "timeline-documentary": createStylePackage(
    "timeline-documentary",
    timelineDocumentaryStylePackageJson,
    timelineDocumentaryVisualJson,
    timelineDocumentaryTokensJson,
    timelineDocumentaryComponentMapJson,
  ),
} satisfies Record<StyleFamilyId, StylePackageDefinition>;

const createAvailableFamily = (
  stylePackage: StylePackageDefinition,
): StyleAvailableFamilyDescriptor => ({
  id: stylePackage.id,
  label: stylePackage.label,
  availability: "available",
  support: "package-backed",
  status: stylePackage.status,
  packageRef: stylePackage.packagePath,
  artifactManifestRef: stylePackage.artifactManifestPath,
  package: stylePackage,
});

export const styleFamilyRegistry: StyleRegistryRecord = {
  "terminal-command-center": createAvailableFamily(
    stylePackageRegistry["terminal-command-center"],
  ),
  "technical-editorial": createAvailableFamily(
    stylePackageRegistry["technical-editorial"],
  ),
  "minimal-education": createAvailableFamily(
    stylePackageRegistry["minimal-education"],
  ),
  "cinematic-type": createAvailableFamily(stylePackageRegistry["cinematic-type"]),
  "dashboard-data": createAvailableFamily(stylePackageRegistry["dashboard-data"]),
  "paper-notebook": createAvailableFamily(stylePackageRegistry["paper-notebook"]),
  "product-showcase": createAvailableFamily(
    stylePackageRegistry["product-showcase"],
  ),
  "editorial-collage": createAvailableFamily(
    stylePackageRegistry["editorial-collage"],
  ),
  "timeline-documentary": createAvailableFamily(
    stylePackageRegistry["timeline-documentary"],
  ),
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
