#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";
import {
  foldSearchText,
  normalizeSearchText,
  readJson,
  relativePath,
  sha256,
  sha256File,
  stableJson,
} from "./index-utils.mjs";
import { assertEvidenceDomain, domainCounts } from "./evidence-domain.mjs";

export const REFERENCE_INDEX_SCHEMA = "lucida-reference-index/v1";
export const CHUNKER_VERSION = "structural-v1";
export const STYLE_PATTERN_INDEX_SCHEMA = "lucida-style-pattern-index/v1";

const MAX_CHUNK_GRAPHEMES = 1600;
const TARGET_CHUNK_GRAPHEMES = 1200;
const APPROVAL_ARTIFACT_ROOT = ["design", "knowledge", "reference-approvals"];
const COLLECTOR_SOURCE_TYPES = new Map([
  ["repository", "repository"],
  ["web", "web_reference"],
  ["image", "image_reference"],
  ["theme", "theme_reference"],
]);
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

const graphemes = (value) => [...segmenter.segment(value)].map((part) => part.segment);
const graphemeLength = (value) => graphemes(value).length;
const validationErrors = (label, validate) => (validate.errors ?? [])
  .map((error) => `${label}${error.instancePath || "/"} ${error.message}`)
  .join("; ");

const sameJson = (left, right) => stableJson(left) === stableJson(right);
const normalizedChecksum = (value) => String(value ?? "").replace(/^sha256:/, "").toLowerCase();
const isChecksum = (value) => /^[a-f0-9]{64}$/.test(normalizedChecksum(value));
const isInside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};
const isInsideOrEqual = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

const realPathInside = (root, candidate, label) => {
  const realRoot = fs.realpathSync.native(root);
  const realCandidate = fs.realpathSync.native(candidate);
  if (!isInsideOrEqual(realRoot, realCandidate)) {
    throw new Error(`${label} escapes its owned directory via a symlink or junction.`);
  }
  return realCandidate;
};

const approvalArtifactPath = (appRoot, packageDir, source) => path.join(
  appRoot,
  ...APPROVAL_ARTIFACT_ROOT,
  source.sourceType,
  `${path.basename(packageDir)}.sanitized-approved.json`,
);

const validateApprovalArtifact = ({ appRoot, packageDir, label, source, errors }) => {
  const expectedPath = approvalArtifactPath(appRoot, packageDir, source);
  const expectedReference = relativePath(appRoot, expectedPath);
  const collectorArtifact = source.provenance?.collectorArtifact;
  if (collectorArtifact !== expectedReference) {
    errors.push(`${label}/source.json: collectorArtifact must be ${expectedReference}.`);
    return null;
  }
  if (!isInside(appRoot, expectedPath) || !fs.existsSync(expectedPath) || !fs.statSync(expectedPath).isFile()) {
    errors.push(`${label}/source.json: collectorArtifact is not an existing file inside the app root.`);
    return null;
  }

  const realAppRoot = fs.realpathSync.native(appRoot);
  const realApprovalRoot = fs.realpathSync.native(path.join(appRoot, ...APPROVAL_ARTIFACT_ROOT));
  const realArtifactPath = fs.realpathSync.native(expectedPath);
  if (!isInside(realAppRoot, realArtifactPath) || !isInside(realApprovalRoot, realArtifactPath)) {
    errors.push(`${label}/source.json: collectorArtifact escapes the project-owned approval directory.`);
    return null;
  }
  if (source.provenance?.sanitizedArtifactChecksum !== sha256File(realArtifactPath)) {
    errors.push(`${label}/source.json: sanitizedArtifactChecksum does not match collectorArtifact.`);
  }

  let artifact;
  try {
    artifact = readJson(realArtifactPath);
  } catch (error) {
    errors.push(`${label}/source.json: collectorArtifact is not valid JSON: ${error.message}`);
    return null;
  }
  if (artifact.schemaVersion !== "sanitized-visual-input/v1") {
    errors.push(`${label}/source.json: collectorArtifact must use sanitized-visual-input/v1.`);
  }
  if (artifact.sanitization?.status !== "passed") {
    errors.push(`${label}/source.json: collectorArtifact sanitization must have passed.`);
  }
  if (artifact.approval?.status !== "approved") {
    errors.push(`${label}/source.json: collectorArtifact approval must be approved.`);
  }
  if (!sameJson(artifact.approval, source.approval)) {
    errors.push(`${label}/source.json: collectorArtifact approval does not match canonical approval.`);
  }
  if (!Array.isArray(artifact.sources) || artifact.sources.length !== 1) {
    errors.push(`${label}/source.json: collectorArtifact must contain exactly one source.`);
    return null;
  }

  const artifactSource = artifact.sources[0];
  if (artifactSource.sourceId !== source.sourceId) {
    errors.push(`${label}/source.json: collectorArtifact sourceId does not match canonical sourceId.`);
  }
  if (artifactSource.sourceType !== COLLECTOR_SOURCE_TYPES.get(source.sourceType)) {
    errors.push(`${label}/source.json: collectorArtifact sourceType does not match canonical sourceType.`);
  }
  if (artifactSource.collectorVersion !== source.collectorVersion) {
    errors.push(`${label}/source.json: collectorArtifact collectorVersion does not match canonical source.`);
  }
  if (artifactSource.sourceRevision !== source.sourceRevision) {
    errors.push(`${label}/source.json: collectorArtifact sourceRevision does not match canonical source.`);
  }
  if (!isChecksum(artifactSource.checksum) || normalizedChecksum(artifactSource.checksum) !== source.snapshotChecksum) {
    errors.push(`${label}/source.json: collectorArtifact checksum does not match canonical snapshotChecksum.`);
  }
  if (!sameJson(artifactSource.rights, source.rights)) {
    errors.push(`${label}/source.json: collectorArtifact rights do not match canonical rights.`);
  }
  if (artifactSource.metadata?.url !== source.sourceRef) {
    errors.push(`${label}/source.json: collectorArtifact sourceRef does not match canonical sourceRef.`);
  }
  if (!Array.isArray(artifactSource.records) || artifactSource.records.length === 0) {
    errors.push(`${label}/source.json: collectorArtifact has no source records.`);
    return null;
  }
  return artifactSource;
};

const validateDocumentProvenance = ({ artifactSource, document, documentLabel, source, errors }) => {
  if (!artifactSource) return;
  const record = artifactSource.records.find((candidate) => candidate?.provenance?.sourceRef === document.sourceRef);
  if (!record) {
    errors.push(`${documentLabel}: collectorArtifact has no matching source record.`);
    return;
  }
  if (record.text !== document.rawText) {
    errors.push(`${documentLabel}: collectorArtifact record text does not match canonical document.`);
  }
  if (record.provenance?.collectorVersion !== source.collectorVersion) {
    errors.push(`${documentLabel}: collectorArtifact record collectorVersion does not match canonical source.`);
  }
  if (
    !isChecksum(record.provenance?.sourceChecksum)
    || normalizedChecksum(record.provenance.sourceChecksum) !== source.snapshotChecksum
  ) {
    errors.push(`${documentLabel}: collectorArtifact record checksum does not match canonical snapshotChecksum.`);
  }
  if (!document.observations.some((observation) => observation.kind === record.kind && observation.reviewStatus === "approved")) {
    errors.push(`${documentLabel}: collectorArtifact record kind is not approved by the canonical document.`);
  }
};

const splitAtHardCap = (value) => {
  const units = graphemes(value);
  const chunks = [];
  let offset = 0;
  while (offset < units.length) {
    const remaining = units.length - offset;
    if (remaining <= MAX_CHUNK_GRAPHEMES) {
      chunks.push(units.slice(offset).join(""));
      break;
    }
    const limit = offset + MAX_CHUNK_GRAPHEMES;
    let boundary = -1;
    for (let index = limit; index > offset; index -= 1) {
      if (units[index - 1] === "\n") {
        boundary = index;
        break;
      }
    }
    if (boundary === -1) {
      for (let index = limit; index > offset; index -= 1) {
        if (/\s/u.test(units[index - 1])) {
          boundary = index;
          break;
        }
      }
    }
    chunks.push(units.slice(offset, boundary === -1 ? limit : boundary).join(""));
    offset = boundary === -1 ? limit : boundary;
  }
  return chunks.filter((chunk) => chunk.length > 0);
};

const structuralBlocks = (rawText) => {
  const lines = rawText.split("\n");
  const blocks = [];
  let heading = "";
  let paragraph = [];
  const flush = () => {
    const text = paragraph.join("\n").trim();
    if (text) blocks.push(heading ? `${heading}\n\n${text}` : text);
    paragraph = [];
  };
  for (const line of lines) {
    if (/^#{1,6}\s+/u.test(line)) {
      flush();
      heading = line.trim();
    } else if (line.trim() === "") {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks.length > 0 ? blocks : [rawText];
};

export const chunkStructuralV1 = (rawText) => {
  const blocks = structuralBlocks(rawText.normalize("NFC"));
  const chunks = [];
  let current = "";
  const flush = () => {
    if (current) chunks.push(...splitAtHardCap(current));
    current = "";
  };
  for (const block of blocks) {
    const safeBlocks = splitAtHardCap(block);
    for (const safeBlock of safeBlocks) {
      const separator = current ? "\n\n" : "";
      if (graphemeLength(`${current}${separator}${safeBlock}`) > TARGET_CHUNK_GRAPHEMES && current) {
        flush();
      }
      current = current ? `${current}\n\n${safeBlock}` : safeBlock;
      if (graphemeLength(current) >= TARGET_CHUNK_GRAPHEMES) flush();
    }
  }
  flush();
  return chunks;
};

const packageDirectories = (referenceRoot) => {
  if (!fs.existsSync(referenceRoot)) return [];
  return fs.readdirSync(referenceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((type) => fs.readdirSync(path.join(referenceRoot, type.name), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(referenceRoot, type.name, entry.name)))
    .sort((left, right) => left.localeCompare(right, "en"));
};

const stylePackageDirectories = (stylesRoot) => {
  if (!fs.existsSync(stylesRoot)) return [];
  return fs.readdirSync(stylesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => path.join(stylesRoot, entry.name))
    .filter((packageDir) => fs.existsSync(path.join(packageDir, "style-package.json")))
    .map((packageDir) => {
      realPathInside(stylesRoot, packageDir, `Style package directory ${packageDir}`);
      realPathInside(stylesRoot, path.join(packageDir, "style-package.json"), `Style package file ${packageDir}/style-package.json`);
      return packageDir;
    })
    .sort((left, right) => left.localeCompare(right, "en"));
};

const styleCollection = (filePath, key) => {
  const value = readJson(filePath);
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value[key])) return value[key];
  if (key === "patterns" && value && typeof value === "object" && Array.isArray(value.visualPatterns)) {
    return value.visualPatterns;
  }
  throw new Error(`${filePath} must be an array or an object with a ${key} array.`);
};

const canonicalVisualSources = (referenceRoot) => {
  const sourceById = new Map();
  for (const packageDir of packageDirectories(referenceRoot)) {
    const sourcePath = path.join(packageDir, "source.json");
    if (!fs.existsSync(sourcePath)) continue;
    let source;
    try {
      source = readJson(sourcePath);
    } catch {
      continue;
    }
    if (
      source.domain !== "visual-style"
      || source.approval?.status !== "approved"
      || source.rights?.status !== "approved"
      || typeof source.sourceId !== "string"
    ) {
      continue;
    }
    for (const id of [source.sourceId, source.sourceId.split(":").at(-1)]) {
      sourceById.set(id, source);
    }
  }
  return sourceById;
};

const tokenizeTypeScript = (source) => {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    if (/\s/u.test(current)) {
      index += 1;
      continue;
    }
    if (current === "/" && next === "/") {
      index = source.indexOf("\n", index + 2);
      if (index === -1) break;
      continue;
    }
    if (current === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end === -1) break;
      index = end + 2;
      continue;
    }
    if (current === "\"" || current === "'" || current === "`") {
      const quote = current;
      let value = "";
      index += 1;
      while (index < source.length) {
        if (source[index] === "\\") {
          value += source[index + 1] ?? "";
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        value += source[index];
        index += 1;
      }
      tokens.push({ type: "string", value });
      continue;
    }
    if (/[A-Za-z_$]/u.test(current)) {
      let end = index + 1;
      while (end < source.length && /[\w$]/u.test(source[end])) end += 1;
      tokens.push({ type: "identifier", value: source.slice(index, end) });
      index = end;
      continue;
    }
    tokens.push({ type: "punctuation", value: current });
    index += 1;
  }
  return tokens;
};

const runtimeRendererPackageIds = (appRoot) => {
  const registryPath = path.join(appRoot, "src", "styles", "runtime", "packages.ts");
  if (!fs.existsSync(registryPath)) return new Set();
  const tokens = tokenizeTypeScript(fs.readFileSync(registryPath, "utf8"));
  const importedVisuals = new Map();
  const stylesRoot = path.join(appRoot, "design", "visual-library", "styles");
  for (let index = 0; index < tokens.length - 3; index += 1) {
    const [keyword, binding, from, specifier] = tokens.slice(index, index + 4);
    if (
      keyword.value !== "import"
      || binding.type !== "identifier"
      || from.value !== "from"
      || specifier.type !== "string"
    ) continue;
    const importedPath = path.resolve(path.dirname(registryPath), specifier.value);
    if (path.basename(importedPath) !== "visual.json" || !isInside(stylesRoot, importedPath)) continue;
    importedVisuals.set(binding.value, path.basename(path.dirname(importedPath)));
  }

  const registeredBindings = new Set();
  for (let index = 0; index < tokens.length - 2; index += 1) {
    const [callee, openParen, binding] = tokens.slice(index, index + 3);
    const previous = tokens[index - 1];
    if (
      callee.value === "definePackage"
      && openParen.value === "("
      && binding.type === "identifier"
      && previous?.value !== "."
      && previous?.value !== "function"
    ) {
      registeredBindings.add(binding.value);
    }
  }
  return new Set(
    [...registeredBindings]
      .map((binding) => importedVisuals.get(binding))
      .filter((packageId) => typeof packageId === "string"),
  );
};

const resolveStyleRagRecordPath = ({ appRoot, packageDir, ref, label }) => {
  if (typeof ref !== "string" || ref.trim().length === 0) {
    throw new Error(`${label} must be a non-empty relative path.`);
  }
  if (ref.includes("\\") || path.isAbsolute(ref)) {
    throw new Error(`${label} must be a relative path using forward slashes.`);
  }
  const baseDir = ref.startsWith("./") || ref.startsWith("../") ? packageDir : appRoot;
  const resolvedPath = path.resolve(baseDir, ref);
  if (!isInsideOrEqual(appRoot, resolvedPath) || !isInside(packageDir, resolvedPath)) {
    throw new Error(`${label} must remain inside its style package directory.`);
  }
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`${label} does not exist.`);
  }
  const realPath = realPathInside(packageDir, resolvedPath, label);
  if (!fs.statSync(realPath).isFile()) {
    throw new Error(`${label} must resolve to a file.`);
  }
  return realPath;
};

const loadStyleRagRecords = ({
  appRoot,
  packageDir,
  pkg,
  property,
  defaultName,
  collectionKey,
  label,
}) => {
  const hasRefs = Object.hasOwn(pkg, property);
  if (!hasRefs) {
    const defaultPath = path.join(packageDir, defaultName);
    if (!fs.existsSync(defaultPath)) return { records: [], paths: [] };
    const realPath = realPathInside(packageDir, defaultPath, `${label} ${relativePath(appRoot, defaultPath)}`);
    if (!fs.statSync(realPath).isFile()) {
      throw new Error(`${label} ${relativePath(appRoot, defaultPath)} must resolve to a file.`);
    }
    return {
      records: styleCollection(realPath, collectionKey),
      paths: [realPath],
    };
  }

  const refs = pkg[property];
  if (!Array.isArray(refs)) {
    throw new Error(`${relativePath(appRoot, packageDir)}/style-package.json ${property} must be an array.`);
  }
  const paths = refs.map((ref, index) => resolveStyleRagRecordPath({
    appRoot,
    packageDir,
    ref,
    label: `${label} ref ${property}[${index}]`,
  }));
  return {
    records: paths.map((recordPath) => {
      const record = readJson(recordPath);
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error(`${label} ref ${relativePath(appRoot, recordPath)} must contain a JSON object.`);
      }
      return record;
    }),
    paths,
  };
};

const sortBy = (key) => (left, right) => left[key].localeCompare(right[key], "en");

const assertUniqueStyleIds = (records, key, packageId, globalIds = null) => {
  const packageIds = new Set();
  for (const record of records) {
    const id = record?.[key];
    if (typeof id !== "string") continue;
    if (packageIds.has(id)) {
      throw new Error(`Duplicate ${key} in style package ${packageId}: ${id}.`);
    }
    packageIds.add(id);
    const previousPackageId = globalIds?.get(id);
    if (previousPackageId) {
      throw new Error(`Duplicate ${key} across style packages ${previousPackageId} and ${packageId}: ${id}.`);
    }
    globalIds?.set(id, packageId);
  }
};

const assertStyleRagSchema = (records, validate, label) => {
  records.forEach((record, index) => {
    if (validate(record)) return;
    throw new Error(
      `${label}[${index}] does not satisfy its schema: ${validationErrors(label, validate)}.`,
    );
  });
};

const projectVariant = (variant, sourceHashes) => ({
  variantId: variant.variantId,
  packageId: variant.packageId,
  label: variant.label,
  description: variant.description,
  intentTags: variant.intentTags,
  beatRoles: variant.beatRoles,
  contentDensity: variant.contentDensity,
  aspectRatios: variant.aspectRatios,
  layoutTraits: variant.layoutTraits,
  typographyTraits: variant.typographyTraits,
  paletteTraits: variant.paletteTraits,
  motionTraits: variant.motionTraits,
  componentTraits: variant.componentTraits,
  contentCapacity: variant.contentCapacity,
  positiveUseCases: variant.positiveUseCases,
  antiPatterns: variant.antiPatterns,
  sourceHashes,
});

const projectPattern = (pattern, sourceHashes) => ({
  patternId: pattern.patternId,
  packageId: pattern.packageId,
  variantIds: pattern.variantIds,
  patternType: pattern.patternType,
  intentTags: pattern.intentTags,
  beatRoles: pattern.beatRoles,
  contentDensity: pattern.contentDensity,
  aspectRatios: pattern.aspectRatios,
  layoutTraits: pattern.layoutTraits,
  typographyTraits: pattern.typographyTraits,
  paletteTraits: pattern.paletteTraits,
  motionTraits: pattern.motionTraits,
  componentTraits: pattern.componentTraits,
  contentCapacity: pattern.contentCapacity,
  positiveUseCases: pattern.positiveUseCases,
  antiPatterns: pattern.antiPatterns,
  sourceHashes,
});

// This mirrors the current visual-package validator's eligibility boundary while
// keeping the compiler read-only: records that are not eligible are not projected.
export const compileStylePatterns = ({ appRoot = process.cwd() } = {}) => {
  const stylesRoot = path.join(appRoot, "design", "visual-library", "styles");
  const schemasDir = path.join(appRoot, "design", "schemas");
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validatePackage = ajv.compile(readJson(path.join(schemasDir, "visual-package.schema.json")));
  const validateVariant = ajv.compile(readJson(path.join(schemasDir, "style-variant.schema.json")));
  const validatePattern = ajv.compile(readJson(path.join(schemasDir, "visual-pattern.schema.json")));
  const approvedSources = canonicalVisualSources(
    path.join(appRoot, "design", "knowledge", "reference-library"),
  );
  const packages = [];
  const variants = [];
  const patterns = [];
  const variantIds = new Set();
  const globalPatternIds = new Map();
  const runtimePackageIds = runtimeRendererPackageIds(appRoot);

  for (const packageDir of stylePackageDirectories(stylesRoot)) {
    const pkg = readJson(path.join(packageDir, "style-package.json"));
    const packageId = pkg?.id;
    if (typeof packageId !== "string" || packageId !== path.basename(packageDir)) {
      throw new Error(`${relativePath(appRoot, packageDir)}/style-package.json has an invalid package id.`);
    }
    if (!validatePackage(pkg)) {
      if (Object.hasOwn(pkg, "variantRefs") || Object.hasOwn(pkg, "visualPatternRefs")) {
        throw new Error(
          `${relativePath(appRoot, packageDir)}/style-package.json does not satisfy its schema: ${validationErrors("style package", validatePackage)}.`,
        );
      }
      continue;
    }
    const variantRecords = loadStyleRagRecords({
      appRoot,
      packageDir,
      pkg,
      property: "variantRefs",
      defaultName: "variants.json",
      collectionKey: "variants",
      label: "Style variants file",
    });
    const patternRecords = loadStyleRagRecords({
      appRoot,
      packageDir,
      pkg,
      property: "visualPatternRefs",
      defaultName: "visual-patterns.json",
      collectionKey: "patterns",
      label: "Style patterns file",
    });
    // Variants are retrieval metadata for visual patterns. A draft package may
    // define variants before it has any patterns, but it must not enter the
    // canonical retrieval index until patterns exist.
    if (patternRecords.records.length === 0) continue;
    const allPackageVariants = variantRecords.records;
    const allPackagePatterns = patternRecords.records;
    assertUniqueStyleIds(allPackageVariants, "variantId", packageId);
    assertUniqueStyleIds(allPackagePatterns, "patternId", packageId, globalPatternIds);
    // Proposed and rejected catalog records are intentionally outside the
    // canonical retrieval boundary. Validate every approved candidate before it
    // can be projected, while still checking IDs and filesystem ownership for
    // the complete package catalog above.
    const approvedVariants = allPackageVariants.filter((variant) => variant?.reviewStatus === "approved");
    const approvedPatterns = allPackagePatterns.filter((pattern) => pattern?.reviewStatus === "approved");
    assertStyleRagSchema(approvedVariants, validateVariant, `Approved style variants in ${packageId}`);
    assertStyleRagSchema(approvedPatterns, validatePattern, `Approved style patterns in ${packageId}`);
    const packageEvidenceIds = new Set((pkg.sourceReferences ?? []).map((reference) => reference?.id));
    const evidenceEligible = (ids) => Array.isArray(ids)
      && ids.every((id) => packageEvidenceIds.has(id) && approvedSources.has(id));
    const rendererSupported = runtimePackageIds.has(packageId);
    const packageVariants = approvedVariants
      .filter((variant) => variant.packageId === packageId)
      .filter((variant) => evidenceEligible(variant.sourceEvidenceIds));
    const eligibleVariants = packageVariants;
    const eligibleVariantIds = new Set(eligibleVariants.map((variant) => variant.variantId));
    const packagePatterns = approvedPatterns
      .filter((pattern) => pattern.packageId === packageId)
      .filter(() => rendererSupported)
      .filter((pattern) => evidenceEligible(pattern.sourceEvidenceIds))
      .filter((pattern) => pattern.variantIds.every((variantId) => eligibleVariantIds.has(variantId)));
    const eligiblePatterns = packagePatterns;

    const sourcePaths = [...new Set([...variantRecords.paths, ...patternRecords.paths])];
    const sourceHashes = Object.fromEntries(
      sourcePaths.map((recordPath) => [relativePath(appRoot, recordPath), sha256File(recordPath)]),
    );
    packages.push({
      id: packageId,
      paths: {
        package: relativePath(appRoot, packageDir),
        variants: variantRecords.paths.map((recordPath) => relativePath(appRoot, recordPath)),
        visualPatterns: patternRecords.paths.map((recordPath) => relativePath(appRoot, recordPath)),
      },
      sourceHashes,
    });
    for (const variant of eligibleVariants) {
      variants.push(projectVariant(variant, sourceHashes));
      variantIds.add(variant.variantId);
    }
    for (const pattern of eligiblePatterns) {
      patterns.push(projectPattern(pattern, sourceHashes));
    }
  }

  packages.sort(sortBy("id"));
  variants.sort(sortBy("variantId"));
  patterns.sort(sortBy("patternId"));
  return {
    schemaVersion: STYLE_PATTERN_INDEX_SCHEMA,
    packages,
    variants,
    patterns,
    counts: { packages: packages.length, variants: variants.length, patterns: patterns.length },
  };
};

const documentFiles = (packageDir) => {
  const documentsDir = path.join(packageDir, "documents");
  if (!fs.existsSync(documentsDir)) return [];
  return fs.readdirSync(documentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(documentsDir, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
};

const sourceSnapshotId = (source) => `snapshot:${source.sourceId}:${source.snapshotChecksum.slice(0, 16)}`;
const documentId = (snapshotChecksum, sourceRef) =>
  `doc:${snapshotChecksum.slice(0, 16)}:${sha256(sourceRef).slice(0, 16)}`;
const chunkId = (document, ordinal, contentHash) =>
  `chunk:${sha256(document.documentId).slice(0, 16)}:${String(ordinal).padStart(4, "0")}:${contentHash.slice(0, 12)}`;

export const compileReferences = ({ appRoot = process.cwd() } = {}) => {
  const schemasDir = path.join(appRoot, "design", "schemas");
  const referenceRoot = path.join(appRoot, "design", "knowledge", "reference-library");
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validateSource = ajv.compile(readJson(path.join(schemasDir, "reference-source.schema.json")));
  const validateDocument = ajv.compile(readJson(path.join(schemasDir, "reference-document.schema.json")));
  const errors = [];
  const sources = [];
  const documents = [];
  const chunks = [];
  const sourceIds = new Set();
  const documentIds = new Set();
  const chunkIds = new Set();

  for (const packageDir of packageDirectories(referenceRoot)) {
    const sourcePath = path.join(packageDir, "source.json");
    const label = relativePath(appRoot, packageDir);
    if (!fs.existsSync(sourcePath)) {
      errors.push(`${label}: missing source.json`);
      continue;
    }
    let source;
    try {
      source = readJson(sourcePath);
    } catch (error) {
      errors.push(`${label}: invalid source.json: ${error.message}`);
      continue;
    }
    if (!validateSource(source)) errors.push(validationErrors(`${label}/source.json`, validateSource));
    try { assertEvidenceDomain(source.domain, `${label}/source.json domain`); } catch (error) { errors.push(error.message); }
    if (source.sourceType !== path.basename(path.dirname(packageDir))) {
      errors.push(`${label}: sourceType must match its library directory`);
    }
    if (sourceIds.has(source.sourceId)) errors.push(`${label}: duplicate sourceId ${source.sourceId}`);
    sourceIds.add(source.sourceId);

    const artifactSource = validateApprovalArtifact({ appRoot, packageDir, label, source, errors });

    const snapshotId = sourceSnapshotId(source);
    const packageDocuments = [];
    for (const filePath of documentFiles(packageDir)) {
      let document;
      const documentLabel = relativePath(appRoot, filePath);
      try {
        document = readJson(filePath);
      } catch (error) {
        errors.push(`${documentLabel}: invalid JSON: ${error.message}`);
        continue;
      }
      if (!validateDocument(document)) errors.push(validationErrors(documentLabel, validateDocument));
      try { assertEvidenceDomain(document.domain, `${documentLabel} domain`); } catch (error) { errors.push(error.message); }
      if (document.domain !== source.domain) errors.push(`${documentLabel}: domain must equal source domain`);
      if (document.mediaType !== source.sourceType) errors.push(`${documentLabel}: mediaType must equal sourceType`);
      if (document.rawText !== document.rawText.normalize("NFC")) errors.push(`${documentLabel}: rawText must be NFC`);
      if (sha256(document.rawText.normalize("NFC")) !== document.contentChecksum) {
        errors.push(`${documentLabel}: contentChecksum does not match rawText`);
      }
      validateDocumentProvenance({ artifactSource, document, documentLabel, source, errors });
      const id = documentId(source.snapshotChecksum, document.sourceRef);
      if (documentIds.has(id)) errors.push(`${documentLabel}: duplicate stable document ID ${id}`);
      documentIds.add(id);
      const compiledDocument = {
        documentId: id,
        snapshotId,
        sourceRef: document.sourceRef,
        mediaType: document.mediaType,
        domain: document.domain,
        title: document.title.normalize("NFC"),
        tags: [...document.tags].sort((left, right) => left.localeCompare(right, "en")),
        contentHash: document.contentChecksum,
        packagePath: relativePath(appRoot, filePath),
        observations: document.observations,
      };
      packageDocuments.push(compiledDocument);
      for (const [ordinal, rawText] of chunkStructuralV1(document.rawText).entries()) {
        const normalizedRaw = rawText.normalize("NFC");
        const contentHash = sha256(normalizedRaw);
        const idForChunk = chunkId(compiledDocument, ordinal, contentHash);
        if (chunkIds.has(idForChunk)) errors.push(`${documentLabel}: duplicate stable chunk ID ${idForChunk}`);
        chunkIds.add(idForChunk);
        chunks.push({
          chunkId: idForChunk,
          documentId: compiledDocument.documentId,
          domain: compiledDocument.domain,
          ordinal,
          rawText: normalizedRaw,
          searchText: normalizeSearchText(normalizedRaw),
          searchFolded: foldSearchText(normalizedRaw),
          contentHash,
          title: compiledDocument.title,
          tags: compiledDocument.tags,
          observations: ordinal === 0 ? compiledDocument.observations : [],
        });
      }
    }
    if (packageDocuments.length === 0) errors.push(`${label}: package has no reference documents`);
    const packageChecksum = sha256(stableJson({ source, documents: packageDocuments }));
    sources.push({
      ...source,
      snapshotId,
      packagePath: relativePath(appRoot, packageDir),
      packageChecksum,
    });
    documents.push(...packageDocuments);
  }

  if (errors.length > 0) throw new Error(`Reference library validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  sources.sort((left, right) => left.sourceId.localeCompare(right.sourceId, "en"));
  documents.sort((left, right) => left.documentId.localeCompare(right.documentId, "en"));
  chunks.sort((left, right) => left.chunkId.localeCompare(right.chunkId, "en"));
  return {
    schemaVersion: REFERENCE_INDEX_SCHEMA,
    chunkerVersion: CHUNKER_VERSION,
    sources,
    documents,
    chunks,
    counts: { sources: sources.length, documents: documents.length, chunks: chunks.length },
    domainCounts: {
      sources: domainCounts(sources, "reference source"),
      documents: domainCounts(documents, "reference document"),
      chunks: domainCounts(chunks, "reference chunk"),
    },
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const compiler = fileURLToPath(new URL("./compile.mjs", import.meta.url));
  const result = (await import("node:child_process")).spawnSync(process.execPath, [compiler], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  process.exitCode = result.status ?? 1;
}
