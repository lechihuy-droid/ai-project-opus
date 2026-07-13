#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.resolve(appRoot, relativePath), "utf8"));
const readOptionalJson = (relativePath, fallback) => {
  const absolutePath = path.resolve(appRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
};
const readJsonAbsolute = (absolutePath) =>
  JSON.parse(fs.readFileSync(absolutePath, "utf8"));
const toProjectRelative = (absolutePath) =>
  path.relative(appRoot, absolutePath).split(path.sep).join("/");

const visualLibrary = readOptionalJson("design/visual-library/index.json", {families: []});
const hasLegacyVisualIndex = (visualLibrary.families ?? []).length > 0;
const motionLibrary = readJson("design/motion-library/index.json");
const selectionRules = readJson("design/directors/selection-rules.json");
const catalog = readJson("../remotion-templates/template-catalog.json");

const errors = [];
const catalogIds = new Set([
  ...(catalog.templates ?? []).map((template) => template.id),
  ...(catalog.localAdapters ?? []).map((template) => template.id),
]);
const legacyFamilyIds = new Set((visualLibrary.families ?? []).map((family) => family.id));
const motionIds = new Set((motionLibrary.presets ?? []).map((preset) => preset.id));

for (const family of visualLibrary.families ?? []) {
  for (const templateId of family.preferredTemplates ?? []) {
    if (!catalogIds.has(templateId)) {
      errors.push(`Visual family ${family.id} references unknown templateId: ${templateId}`);
    }
  }
}

for (const preset of motionLibrary.presets ?? []) {
  for (const familyId of preset.bestFor ?? []) {
    if (hasLegacyVisualIndex && !legacyFamilyIds.has(familyId)) {
      errors.push(`Motion preset ${preset.id} references unknown visual family: ${familyId}`);
    }
  }
  if (!motionIds.has(preset.id)) {
    errors.push(`Motion preset missing from motion id set: ${preset.id}`);
  }
}

const productionStyleIds = validateProductionStyleIds();
const packageById = validatePackageCandidates(productionStyleIds);
validateIntentMappings(productionStyleIds);
validateCandidateReasons(productionStyleIds, packageById);
validateContentFitFilters(productionStyleIds);
validateContinuityRules(productionStyleIds);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(
  `Design director validation passed: ${productionStyleIds.size} package-backed style candidates, ${motionIds.size} motion presets, ${catalogIds.size} catalog entries.`,
);

function validateProductionStyleIds() {
  if (!Array.isArray(selectionRules.productionStyleIds)) {
    errors.push("selection-rules.json must define productionStyleIds[].");
    return new Set();
  }

  const ids = new Set();
  for (const id of selectionRules.productionStyleIds) {
    if (typeof id !== "string" || id.length === 0) {
      errors.push("productionStyleIds entries must be non-empty strings.");
      continue;
    }
    if (ids.has(id)) {
      errors.push(`productionStyleIds contains duplicate id: ${id}`);
    }
    ids.add(id);
  }

  if (ids.size !== 9) {
    errors.push(`Wave 4 Director must register exactly 9 production style IDs; found ${ids.size}.`);
  }

  const packageRoot = getPackageRoot();
  if (!fs.existsSync(packageRoot)) {
    errors.push(`Package root does not exist: ${toProjectRelative(packageRoot)}`);
    return ids;
  }

  const discoveredIds = fs
    .readdirSync(packageRoot, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(packageRoot, entry.name, "style-package.json")))
    .map((entry) => entry.name)
    .sort();

  for (const id of discoveredIds) {
    if (!ids.has(id)) {
      errors.push(`Package-backed style ${id} is missing from productionStyleIds.`);
    }
  }
  for (const id of ids) {
    if (!discoveredIds.includes(id)) {
      errors.push(`productionStyleIds references missing package directory: ${id}`);
    }
  }

  return ids;
}

function validatePackageCandidates(productionStyleIds) {
  const candidates = selectionRules.productionCandidates;
  const packageById = new Map();

  if (!Array.isArray(candidates)) {
    errors.push("selection-rules.json must define productionCandidates[].");
    return packageById;
  }

  const candidateIds = new Set();
  for (const candidate of candidates) {
    if (!isPlainObject(candidate)) {
      errors.push("Each productionCandidates entry must be an object.");
      continue;
    }

    const {id, packageRef} = candidate;
    if (!productionStyleIds.has(id)) {
      errors.push(`productionCandidates references non-production style id: ${id}`);
      continue;
    }
    if (candidateIds.has(id)) {
      errors.push(`productionCandidates contains duplicate id: ${id}`);
    }
    candidateIds.add(id);

    const packagePath = resolveProjectPath(packageRef);
    if (!packagePath) {
      errors.push(`Candidate ${id} has invalid packageRef: ${packageRef}`);
      continue;
    }
    if (!fs.existsSync(packagePath)) {
      errors.push(`Candidate ${id} packageRef does not exist: ${packageRef}`);
      continue;
    }
    if (path.basename(packagePath) !== "style-package.json") {
      errors.push(`Candidate ${id} packageRef must point to style-package.json.`);
      continue;
    }

    let pkg;
    try {
      pkg = readJsonAbsolute(packagePath);
    } catch (error) {
      errors.push(`Candidate ${id} packageRef cannot be parsed: ${error.message}`);
      continue;
    }
    if (pkg.id !== id) {
      errors.push(`Candidate ${id} packageRef points to package id ${pkg.id}.`);
    }
    if (pkg.schemaVersion !== "lucida-style-package/v1") {
      errors.push(`Candidate ${id} is not backed by a production style package.`);
    }
    if (!isPlainObject(pkg.contentCapacity)) {
      errors.push(`Candidate ${id} package is missing contentCapacity.`);
    }
    if (!isPlainObject(pkg.directorCompatibility)) {
      errors.push(`Candidate ${id} package is missing directorCompatibility.`);
    }
    packageById.set(id, pkg);
  }

  for (const id of productionStyleIds) {
    if (!candidateIds.has(id)) {
      errors.push(`productionStyleIds entry ${id} has no productionCandidates record.`);
    }
  }

  return packageById;
}

function validateIntentMappings(productionStyleIds) {
  if (!isPlainObject(selectionRules.intentToFamily)) {
    errors.push("selection-rules.json must define intentToFamily object.");
    return;
  }

  const referencedIds = new Set();
  for (const [intent, families] of Object.entries(selectionRules.intentToFamily)) {
    if (!Array.isArray(families) || families.length === 0) {
      errors.push(`Intent ${intent} has no package-backed family candidates.`);
      continue;
    }
    const seen = new Set();
    for (const familyId of families) {
      if (!productionStyleIds.has(familyId)) {
        errors.push(`Intent ${intent} references non-package production style: ${familyId}`);
      }
      if (seen.has(familyId)) {
        errors.push(`Intent ${intent} repeats candidate ${familyId}.`);
      }
      seen.add(familyId);
      referencedIds.add(familyId);
    }
  }

  for (const id of productionStyleIds) {
    if (!referencedIds.has(id)) {
      errors.push(`Production style ${id} is not reachable from intentToFamily.`);
    }
  }

  if (!isPlainObject(selectionRules.intentReasonTemplate)) {
    errors.push("selection-rules.json must define intentReasonTemplate.");
  } else {
    for (const key of ["selected", "rejected"]) {
      const value = selectionRules.intentReasonTemplate[key];
      if (typeof value !== "string" || !value.includes("{intent}") || !value.includes("{familyId}")) {
        errors.push(`intentReasonTemplate.${key} must include {intent} and {familyId}.`);
      }
    }
  }
}

function validateCandidateReasons(productionStyleIds, packageById) {
  for (const candidate of selectionRules.productionCandidates ?? []) {
    if (!isPlainObject(candidate) || !productionStyleIds.has(candidate.id)) {
      continue;
    }
    if (typeof candidate.selectedReason !== "string" || candidate.selectedReason.length < 12) {
      errors.push(`Candidate ${candidate.id} must include a selectedReason.`);
    }
    if (!Array.isArray(candidate.rejectedReasons) || candidate.rejectedReasons.length === 0) {
      errors.push(`Candidate ${candidate.id} must include rejectedReasons[].`);
    }
    if (!Array.isArray(candidate.traits) || candidate.traits.length === 0) {
      errors.push(`Candidate ${candidate.id} must include traits[].`);
    }

    const pkg = packageById.get(candidate.id);
    const selectionReason = pkg?.directorCompatibility?.selectionReason;
    if (typeof selectionReason !== "string" || selectionReason.length < 12) {
      errors.push(`Package ${candidate.id} must expose directorCompatibility.selectionReason.`);
    }
  }
}

function validateContentFitFilters(productionStyleIds) {
  const filters = selectionRules.contentFitFilters;
  if (!Array.isArray(filters) || filters.length === 0) {
    errors.push("selection-rules.json must define contentFitFilters[].");
    return;
  }

  const requiredFilterIds = new Set([
    "text-density-capacity",
    "code-line-capacity",
    "data-series-capacity",
    "dashboard-requires-structured-numeric-data",
    "asset-led-requires-embed-asset",
    "timeline-dated-events",
  ]);
  const seenFilterIds = new Set();

  for (const filter of filters) {
    if (!isPlainObject(filter)) {
      errors.push("Each contentFitFilters entry must be an object.");
      continue;
    }
    if (typeof filter.id !== "string" || filter.id.length === 0) {
      errors.push("Each contentFitFilters entry must include id.");
      continue;
    }
    seenFilterIds.add(filter.id);

    if (typeof filter.selectedReason !== "string" || filter.selectedReason.length < 12) {
      errors.push(`Content-fit filter ${filter.id} must include selectedReason.`);
    }
    if (typeof filter.rejectedReason !== "string" || filter.rejectedReason.length < 12) {
      errors.push(`Content-fit filter ${filter.id} must include rejectedReason.`);
    }

    if (filter.families !== "all") {
      if (!Array.isArray(filter.families) || filter.families.length === 0) {
        errors.push(`Content-fit filter ${filter.id} must define families as "all" or a non-empty array.`);
      } else {
        for (const familyId of filter.families) {
          if (!productionStyleIds.has(familyId)) {
            errors.push(`Content-fit filter ${filter.id} references non-production style ${familyId}.`);
          }
        }
      }
    }
  }

  for (const id of requiredFilterIds) {
    if (!seenFilterIds.has(id)) {
      errors.push(`Missing required Wave 4 content-fit filter: ${id}`);
    }
  }

  const assetFilter = filters.find((filter) => filter.id === "asset-led-requires-embed-asset");
  const assetFamilies = new Set(assetFilter?.families ?? []);
  for (const id of ["product-showcase", "editorial-collage"]) {
    if (!assetFamilies.has(id)) {
      errors.push(`asset-led-requires-embed-asset must apply to ${id}.`);
    }
  }
  if (!(assetFilter?.requiresAnyAssetClassification ?? []).includes("embed_asset")) {
    errors.push("asset-led-requires-embed-asset must require embed_asset.");
  }

  const dashboardFilter = filters.find((filter) => filter.id === "dashboard-requires-structured-numeric-data");
  if (!Array.isArray(dashboardFilter?.families) || !dashboardFilter.families.includes("dashboard-data")) {
    errors.push("dashboard-requires-structured-numeric-data must apply to dashboard-data.");
  }
  if (dashboardFilter?.requires?.hasStructuredNumericData !== true) {
    errors.push("dashboard-requires-structured-numeric-data must require hasStructuredNumericData=true.");
  }
}

function validateContinuityRules(productionStyleIds) {
  const continuity = selectionRules.continuityRules;
  if (!isPlainObject(continuity)) {
    errors.push("selection-rules.json must define continuityRules.");
    return;
  }
  if (continuity.dominantFamilyMinimumShare < 0.5) {
    errors.push("continuityRules.dominantFamilyMinimumShare must be >= 0.5.");
  }
  if (continuity.maxVisualFamiliesForShort > 4) {
    errors.push("continuityRules.maxVisualFamiliesForShort must be <= 4.");
  }
  if (continuity.returnToDominantFamilyForOutro !== true) {
    errors.push("continuityRules.returnToDominantFamilyForOutro must be true.");
  }

  const matrix = continuity.compatibilityMatrix;
  if (!isPlainObject(matrix)) {
    errors.push("continuityRules.compatibilityMatrix is required.");
    return;
  }

  const allowedStates = new Set(["native", "compatible", "bridge", "avoid", "block"]);
  for (const fromId of productionStyleIds) {
    const row = matrix[fromId];
    if (!isPlainObject(row)) {
      errors.push(`compatibilityMatrix missing row for ${fromId}.`);
      continue;
    }
    for (const toId of productionStyleIds) {
      const value = row[toId];
      if (!allowedStates.has(value)) {
        errors.push(`compatibilityMatrix ${fromId} -> ${toId} has invalid value: ${value}`);
      }
    }
    for (const toId of Object.keys(row)) {
      if (!productionStyleIds.has(toId)) {
        errors.push(`compatibilityMatrix ${fromId} references non-production style ${toId}.`);
      }
    }
  }

  if (!Array.isArray(continuity.bridgeTransitions) || continuity.bridgeTransitions.length === 0) {
    errors.push("continuityRules.bridgeTransitions[] is required.");
    return;
  }
  for (const transition of continuity.bridgeTransitions) {
    for (const key of ["from", "to", "via"]) {
      if (!productionStyleIds.has(transition[key])) {
        errors.push(`bridgeTransitions entry references non-production ${key}: ${transition[key]}`);
      }
    }
    if (typeof transition.reason !== "string" || transition.reason.length < 12) {
      errors.push("bridgeTransitions entries must include a reason.");
    }
  }
}

function getPackageRoot() {
  const configured = selectionRules.packageRoot ?? "design/visual-library/styles";
  return path.resolve(appRoot, configured);
}

function resolveProjectPath(value) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value) || value.includes("\\")) {
    return null;
  }
  const resolved = path.resolve(appRoot, value);
  const relative = path.relative(appRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
