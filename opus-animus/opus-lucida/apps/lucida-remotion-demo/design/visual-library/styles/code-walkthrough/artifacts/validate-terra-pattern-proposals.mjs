import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.resolve(packageDir, "..", "..", "..", "..");
const artifactPath = path.join(packageDir, "artifacts", "terra-pattern-proposal-p10-validation.json");
const reportPath = path.join(packageDir, "artifacts", "terra-pattern-proposal-p10-validation-report.json");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
const artifact = readJson(artifactPath);
const patterns = readJson(path.resolve(path.dirname(artifactPath), artifact.patternPath));
const variants = readJson(path.join(packageDir, "variants.json"));
const schema = readJson(path.join(appRoot, "design", "schemas", "visual-pattern.schema.json"));
const validatePattern = new Ajv({ allErrors: true, strict: true }).compile(schema);
const errors = [];

const expectedPatternTypes = ["layout", "typography", "palette", "motion", "component", "composition"];
const expectedVariantIds = ["code-focus", "diff-review", "api-sequence", "debugging-trace", "terminal-code-split"];
assert(artifact.schemaVersion === "terra-pattern-proposal-validation/v1", "artifact schemaVersion mismatch");
assert(artifact.proposalId === "terra-pattern-proposal-p10", "artifact proposalId mismatch");
assert(artifact.packageId === "code-walkthrough", "artifact packageId mismatch");
assert(artifact.proposalStatus === "pending-human-approval", "proposal must remain pending human approval");
assert(artifact.compilerEligibility === "ineligible", "proposal must remain compiler-ineligible");
assert(artifact.approvalAction === "none", "validator must not approve proposals");
assert(artifact.canonicalPromotion === "none", "validator must not promote proposals");
assert(equalLists(artifact.expectedVariantIds, expectedVariantIds), "artifact variant distribution mismatch");
assert(equalLists(artifact.expectedPatternTypes, expectedPatternTypes), "artifact pattern type distribution mismatch");
assert(artifact.expectedPatternCount === 30 && artifact.expectedPerVariant === 6, "artifact count contract mismatch");
assert(Array.isArray(patterns), "visual-patterns.json must be an array");

const canonicalSources = loadCanonicalSources(path.join(appRoot, "design", "knowledge", "reference-library"));
const declaredEvidenceIds = new Set(artifact.canonicalEvidenceIds);
const knownVariantIds = new Set(variants.map((variant) => variant.variantId));
const patternIds = new Set();
const recipes = new Set();
const sourceUsage = new Map(artifact.canonicalEvidenceIds.map((id) => [id, 0]));
const perVariant = new Map(expectedVariantIds.map((id) => [id, []]));

if (patterns.length !== artifact.expectedPatternCount) errors.push(`expected ${artifact.expectedPatternCount} patterns, found ${patterns.length}`);
for (const pattern of patterns) {
  if (!validatePattern(pattern)) errors.push(`${pattern.patternId ?? "unknown"}: schema ${JSON.stringify(validatePattern.errors)}`);
  if (patternIds.has(pattern.patternId)) errors.push(`${pattern.patternId}: duplicate patternId`);
  patternIds.add(pattern.patternId);
  if (pattern.packageId !== artifact.packageId) errors.push(`${pattern.patternId}: wrong packageId`);
  if (pattern.reviewStatus !== "proposed") errors.push(`${pattern.patternId}: reviewStatus must remain proposed`);
  if (pattern.variantIds.length !== 1 || !knownVariantIds.has(pattern.variantIds[0]) || !perVariant.has(pattern.variantIds[0])) {
    errors.push(`${pattern.patternId}: must target one expected package variant`);
  } else {
    perVariant.get(pattern.variantIds[0]).push(pattern);
  }

  const recipe = JSON.stringify({ variantIds: pattern.variantIds, patternType: pattern.patternType, layoutTraits: pattern.layoutTraits, componentTraits: pattern.componentTraits, contentCapacity: pattern.contentCapacity });
  if (recipes.has(recipe)) errors.push(`${pattern.patternId}: duplicate renderable recipe`);
  recipes.add(recipe);

  for (const sourceId of pattern.sourceEvidenceIds) {
    if (!declaredEvidenceIds.has(sourceId)) errors.push(`${pattern.patternId}: undeclared sourceEvidenceId ${sourceId}`);
    const source = canonicalSources.get(sourceId);
    if (!source) errors.push(`${pattern.patternId}: unresolved sourceEvidenceId ${sourceId}`);
    else if (source.domain !== "visual-style" || source.approval?.status !== "approved" || source.rights?.status !== "approved") {
      errors.push(`${pattern.patternId}: sourceEvidenceId is not a verified approved visual-style reference ${sourceId}`);
    }
    sourceUsage.set(sourceId, (sourceUsage.get(sourceId) ?? 0) + 1);
  }
}

for (const [variantId, records] of perVariant) {
  if (records.length !== artifact.expectedPerVariant) errors.push(`${variantId}: expected ${artifact.expectedPerVariant} patterns, found ${records.length}`);
  const types = new Set(records.map((record) => record.patternType));
  if (!equalSets(types, new Set(expectedPatternTypes))) errors.push(`${variantId}: must have one of every expected pattern type`);
}
for (const [sourceId, count] of sourceUsage) {
  if (count === 0) errors.push(`${sourceId}: declared evidence is unused`);
  if (count > Math.floor(artifact.expectedPatternCount / 4)) errors.push(`${sourceId}: exceeds 25% source concentration`);
}

const compilerEligible = patterns.some((pattern) => pattern.reviewStatus === "approved") || artifact.approvalAction !== "none" || artifact.canonicalPromotion !== "none";
if (compilerEligible) errors.push("compiler eligibility must remain false until human approval and canonical promotion");

const report = {
  schemaVersion: artifact.schemaVersion,
  proposalId: artifact.proposalId,
  packageId: artifact.packageId,
  scope: {
    patterns: "design/visual-library/styles/code-walkthrough/visual-patterns.json",
    ownership: "package-local only",
    rendererEdited: false,
    globalEdited: false,
    collectionEdited: false,
  },
  checks: {
    schemaValid: !errors.some((error) => error.includes(": schema ")),
    referenceValid: !errors.some((error) => error.includes("sourceEvidenceId") || error.includes("declared evidence")),
    uniquePatternIds: patternIds.size === patterns.length,
    uniqueRenderableRecipes: recipes.size === patterns.length,
    patternCount: patterns.length,
    expectedPatternCount: artifact.expectedPatternCount,
    patternsPerVariant: Object.fromEntries([...perVariant].map(([id, records]) => [id, records.length])),
    expectedPatternsPerVariant: artifact.expectedPerVariant,
    patternTypesPerVariant: Object.fromEntries([...perVariant].map(([id, records]) => [id, records.map((record) => record.patternType).sort()])),
    sourceUsage: Object.fromEntries(sourceUsage),
    allReviewStatusesProposed: patterns.every((pattern) => pattern.reviewStatus === "proposed"),
  },
  compilerEligibility: {
    eligible: false,
    reason: "Patterns are proposed and pending human approval; this validator performs no approval, promotion, renderer registration, or collection update.",
  },
  approvalState: {
    status: "pending-human-review",
    claimedApprovedPatterns: 0,
    claimedPromotedPatterns: 0,
    approvalAction: "none",
  },
  result: errors.length === 0 ? "PASS" : "FAIL",
  errors,
};

writeJson(reportPath, report);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${patterns.length} pending, compiler-ineligible code-walkthrough P10 proposals.`);
}

function loadCanonicalSources(root) {
  const sources = new Map();
  for (const sourcePath of walk(root)) {
    if (path.basename(sourcePath) !== "source.json") continue;
    const source = readJson(sourcePath);
    const alias = source.sourceId?.split(":").at(-1);
    if (typeof alias !== "string" || sources.has(alias)) throw new Error(`duplicate canonical source alias: ${source.sourceId}`);
    sources.set(alias, source);
  }
  return sources;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function equalLists(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function equalSets(actual, expected) {
  return actual.size === expected.size && [...actual].every((value) => expected.has(value));
}
