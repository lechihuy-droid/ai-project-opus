#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const TYPES_PATH = path.join(PROJECT_ROOT, "src/styles/types.ts");
const INDEX_PATH = path.join(PROJECT_ROOT, "design/visual-library/index.json");
const STYLES_ROOT = path.join(PROJECT_ROOT, "design/visual-library/styles");

const errors = [];
const warnings = [];

const plannedIds = readPlannedStyleFamilyIds(TYPES_PATH);
const plannedIdSet = new Set(plannedIds);
const packageDirs = readPackageDirs(STYLES_ROOT);
const visualIndex = readJson(INDEX_PATH, "visual library index");
const families = Array.isArray(visualIndex?.families) ? visualIndex.families : [];

if (!Array.isArray(visualIndex?.families)) {
  errors.push("design/visual-library/index.json must contain a families array.");
}

compareExactSet("planned style IDs", plannedIds, "package directories", packageDirs);

const familyIds = families.map((family) => family?.id).filter(Boolean);
const duplicateFamilyIds = findDuplicates(familyIds);
for (const id of duplicateFamilyIds) {
  errors.push(`Duplicate visual-library family id: ${id}`);
}

const indexPackageEntries = families.filter((family) => plannedIdSet.has(family.id));
const indexAliasEntries = families.filter((family) => !plannedIdSet.has(family.id));
compareExactSet(
  "planned style IDs",
  plannedIds,
  "package-backed visual-library entries",
  indexPackageEntries.map((family) => family.id),
);

for (const family of indexAliasEntries) {
  validateAliasEntry(family);
}

for (const familyId of plannedIds) {
  const family = indexPackageEntries.find((entry) => entry.id === familyId);
  if (!family) {
    continue;
  }
  validatePackageEntry(familyId, family);
}

if (warnings.length > 0) {
  for (const warning of warnings) {
    console.warn(`WARN: ${warning}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(
  `Style registry validation passed: ${plannedIds.length} package-backed families, ${indexAliasEntries.length} legacy aliases.`,
);

function validateAliasEntry(family) {
  if (family.entryType !== "legacy-alias") {
    errors.push(`Alias ${family.id} must set entryType to "legacy-alias".`);
  }
  if (family.alias !== true) {
    errors.push(`Alias ${family.id} must set alias: true.`);
  }
  if (family.production !== false) {
    errors.push(`Alias ${family.id} must set production: false.`);
  }
  if (family.status !== "alias") {
    errors.push(`Alias ${family.id} must set status to "alias".`);
  }
  if (!Array.isArray(family.aliasTo) || family.aliasTo.length === 0) {
    errors.push(`Alias ${family.id} must list at least one package id in aliasTo.`);
  } else {
    for (const targetId of family.aliasTo) {
      if (!plannedIdSet.has(targetId)) {
        errors.push(`Alias ${family.id} points to unknown package id: ${targetId}`);
      }
    }
  }
  if ("packageRef" in family || "artifactManifestRef" in family) {
    errors.push(`Alias ${family.id} must not expose packageRef or artifactManifestRef.`);
  }
  validateNoMp4Refs(family, `visual-library alias ${family.id}`, PROJECT_ROOT);
}

function validatePackageEntry(familyId, family) {
  const packageDir = path.join(STYLES_ROOT, familyId);
  const packageRef = `design/visual-library/styles/${familyId}/style-package.json`;
  const artifactManifestRef = `design/visual-library/styles/${familyId}/artifact-manifest.json`;
  const packageDirRef = `design/visual-library/styles/${familyId}`;

  if (family.entryType !== "style-package") {
    errors.push(`${familyId} index entry must set entryType to "style-package".`);
  }
  if (family.production !== true) {
    errors.push(`${familyId} index entry must set production: true.`);
  }
  if (family.availability !== "available") {
    errors.push(`${familyId} index entry must set availability to "available".`);
  }
  if (family.support !== "package-backed") {
    errors.push(`${familyId} index entry must set support to "package-backed".`);
  }
  if (family.packageDir !== packageDirRef) {
    errors.push(`${familyId} packageDir must be ${packageDirRef}.`);
  }
  if (family.packageRef !== packageRef) {
    errors.push(`${familyId} packageRef must be ${packageRef}.`);
  }
  if (family.artifactManifestRef !== artifactManifestRef) {
    errors.push(`${familyId} artifactManifestRef must be ${artifactManifestRef}.`);
  }

  const stylePackage = readJson(path.join(packageDir, "style-package.json"), `${familyId} style package`);
  const visual = readJson(path.join(packageDir, "visual.json"), `${familyId} visual spec`);
  const tokens = readJson(path.join(packageDir, "tokens.json"), `${familyId} tokens`);
  const componentMap = readJson(
    path.join(packageDir, "component-map.json"),
    `${familyId} component map`,
  );
  const artifactManifest = readJson(
    path.join(packageDir, "artifact-manifest.json"),
    `${familyId} artifact manifest`,
  );

  validatePackageIds(familyId, {
    stylePackage,
    visual,
    tokens,
    componentMap,
    artifactManifest,
  });
  validateStatusConsistency(familyId, family, stylePackage, visual);
  validatePackageRefs(familyId, packageDir, stylePackage, artifactManifest);
  validateNoMp4Refs(family, `visual-library package entry ${familyId}`, PROJECT_ROOT);
  validateNoMp4Refs(stylePackage, `${familyId} style-package.json`, packageDir);
  validateNoMp4Refs(artifactManifest, `${familyId} artifact-manifest.json`, packageDir);
}

function validatePackageIds(
  familyId,
  {stylePackage, visual, tokens, componentMap, artifactManifest},
) {
  if (stylePackage?.id !== familyId) {
    errors.push(`${familyId} style-package.json id must match package directory.`);
  }
  if (visual?.id !== familyId) {
    errors.push(`${familyId} visual.json id must match package directory.`);
  }
  if (tokens?.id !== familyId) {
    errors.push(`${familyId} tokens.json id must match package directory.`);
  }
  if (componentMap?.id !== familyId) {
    errors.push(`${familyId} component-map.json id must match package directory.`);
  }
  if (artifactManifest?.packageId !== familyId) {
    errors.push(`${familyId} artifact-manifest.json packageId must match package directory.`);
  }
}

function validateStatusConsistency(familyId, indexEntry, stylePackage, visual) {
  const statuses = [
    ["index", indexEntry?.status],
    ["style-package", stylePackage?.status],
    ["visual", visual?.status],
  ];
  for (const [label, status] of statuses) {
    if (status !== "experimental") {
      errors.push(`${familyId} ${label} status must be "experimental", got ${JSON.stringify(status)}.`);
    }
  }
  if (stylePackage?.validationArtifacts?.videoBinaryRegistered !== false) {
    errors.push(`${familyId} validationArtifacts.videoBinaryRegistered must be false.`);
  }
}

function validatePackageRefs(familyId, packageDir, stylePackage, artifactManifest) {
  const expectedFiles = {
    visual: "./visual.json",
    tokens: "./tokens.json",
    componentMap: "./component-map.json",
    provenance: "./provenance.md",
    artifactManifest: "./artifact-manifest.json",
  };

  for (const [key, expectedRef] of Object.entries(expectedFiles)) {
    if (stylePackage?.files?.[key] !== expectedRef) {
      errors.push(`${familyId} style-package files.${key} must be ${expectedRef}.`);
    }
    const resolved = resolvePackageRef(packageDir, expectedRef);
    if (!fs.existsSync(resolved)) {
      errors.push(`${familyId} missing companion file ${expectedRef}.`);
    }
  }

  const artifactPaths = Array.isArray(artifactManifest?.artifacts)
    ? artifactManifest.artifacts
        .map((artifact) => artifact.path)
        .filter((ref) => typeof ref === "string")
        .map((ref) => resolveManifestRef(packageDir, ref))
    : [];
  for (const requiredRef of Object.values(expectedFiles)) {
    const requiredPath = resolvePackageRef(packageDir, requiredRef);
    if (!artifactPaths.includes(requiredPath)) {
      errors.push(`${familyId} artifact-manifest.json must register ${requiredRef}.`);
    }
  }
}

function validateNoMp4Refs(value, label, baseDir) {
  for (const ref of collectPathRefs(value)) {
    if (!isMp4Path(ref)) {
      continue;
    }
    const resolved = ref.startsWith("./") || ref.startsWith("../")
      ? path.resolve(baseDir, ref)
      : path.resolve(PROJECT_ROOT, ref);
    errors.push(`${label} registers an MP4 path: ${toProjectRelative(resolved)}`);
  }
}

function collectPathRefs(value) {
  const refs = [];

  const walk = (currentValue, key = "") => {
    if (typeof currentValue === "string") {
      if (looksLikePathRef(currentValue, key)) {
        refs.push(currentValue);
      }
      return;
    }
    if (Array.isArray(currentValue)) {
      currentValue.forEach((item, index) => walk(item, `${key}[${index}]`));
      return;
    }
    if (isPlainObject(currentValue)) {
      for (const [childKey, childValue] of Object.entries(currentValue)) {
        walk(childValue, childKey);
      }
    }
  };

  walk(value);
  return refs;
}

function looksLikePathRef(value, key) {
  return (
    key.toLowerCase().includes("path") ||
    key.toLowerCase().includes("ref") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("design/") ||
    value.startsWith("pipeline/") ||
    value.startsWith("src/") ||
    value.startsWith("output/")
  );
}

function isMp4Path(ref) {
  return ref.toLowerCase().split(/[?#]/)[0].endsWith(".mp4");
}

function readPlannedStyleFamilyIds(typesPath) {
  const text = fs.readFileSync(typesPath, "utf8");
  const match = text.match(/plannedStyleFamilyIds\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!match) {
    errors.push("Could not find plannedStyleFamilyIds in src/styles/types.ts.");
    return [];
  }
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((idMatch) => idMatch[1]);
  if (ids.length === 0) {
    errors.push("plannedStyleFamilyIds must contain at least one id.");
  }
  for (const id of findDuplicates(ids)) {
    errors.push(`Duplicate plannedStyleFamilyIds entry: ${id}`);
  }
  return ids;
}

function readPackageDirs(stylesRoot) {
  if (!fs.existsSync(stylesRoot)) {
    errors.push(`Missing styles root: ${toProjectRelative(stylesRoot)}`);
    return [];
  }
  return fs
    .readdirSync(stylesRoot, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function compareExactSet(leftLabel, leftValues, rightLabel, rightValues) {
  const left = new Set(leftValues);
  const right = new Set(rightValues);

  for (const value of left) {
    if (!right.has(value)) {
      errors.push(`${rightLabel} missing ${value} from ${leftLabel}.`);
    }
  }
  for (const value of right) {
    if (!left.has(value)) {
      errors.push(`${rightLabel} contains unplanned id ${value}.`);
    }
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates].sort();
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${label} parse failed at ${toProjectRelative(filePath)}: ${error.message}`);
    return null;
  }
}

function resolvePackageRef(packageDir, ref) {
  return path.resolve(packageDir, ref);
}

function resolveManifestRef(packageDir, ref) {
  if (ref.startsWith("./") || ref.startsWith("../")) {
    return path.resolve(packageDir, ref);
  }
  return path.resolve(PROJECT_ROOT, ref);
}

function toProjectRelative(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
