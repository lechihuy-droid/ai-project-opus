import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/cinematic-type");
const artifactPath = path.join(packageDir, "artifacts/terra-pattern-proposal-p6-validation.json");
const patternPath = path.join(packageDir, "visual-patterns.json");
const schemaPath = path.join(root, "design/schemas/visual-pattern.schema.json");

const artifact = readJson(artifactPath);
const patterns = readJson(patternPath);
const patternSchema = readJson(schemaPath);
const validatePattern = new Ajv({ allErrors: true }).compile(patternSchema);

const expectedVariants = [
  "kinetic-hook",
  "quote",
  "chapter-reset",
  "manifesto",
  "outro",
];
const expectedTypes = ["layout", "typography", "motion", "component", "content-density", "composition"];
const expectedAliasPrefix = "source:reference:";

assert(artifact.schemaVersion === "terra-pattern-proposal-validation/v1", "validation artifact schemaVersion mismatch");
assert(artifact.proposalId === "terra-pattern-proposal-p6", "validation artifact proposalId mismatch");
assert(artifact.packageId === "cinematic-type", "validation artifact packageId mismatch");
assert(artifact.proposalStatus === "pending-human-approval", "proposal must remain pending human approval");
assert(artifact.compilerEligibility === "ineligible", "proposal must remain compiler-ineligible");
assert(artifact.approvalAction === "none", "validator must not approve or promote proposals");
assert(artifact.expectedPatternCount === 30, "validation artifact must expect exactly 30 patterns");
assert(artifact.expectedPerVariant === 6, "validation artifact must expect six patterns per variant");
assert(equalLists(artifact.expectedVariantIds, expectedVariants), "validation artifact variant distribution mismatch");
assert(equalLists(artifact.expectedPatternTypes, expectedTypes), "validation artifact pattern type distribution mismatch");
assert(Array.isArray(patterns) && patterns.length === artifact.expectedPatternCount, "visual-patterns.json must contain exactly 30 patterns");

const canonicalSources = loadCanonicalSources(path.join(root, "design/knowledge/reference-library"));
const patternIds = new Set();
const countsByVariant = new Map(expectedVariants.map((variantId) => [variantId, 0]));
const typesByVariant = new Map(expectedVariants.map((variantId) => [variantId, new Set()]));
const usedAliases = new Set();

for (const pattern of patterns) {
  assert(validatePattern(pattern), `${pattern.patternId ?? "unknown"}: ${JSON.stringify(validatePattern.errors)}`);
  assert(pattern.packageId === artifact.packageId, `${pattern.patternId}: wrong packageId`);
  assert(pattern.reviewStatus === "proposed", `${pattern.patternId}: proposal must not be approved`);
  assert(pattern.classifierVersion === "terra-pattern-proposal-p6/1.0", `${pattern.patternId}: unexpected classifierVersion`);
  assert(!patternIds.has(pattern.patternId), `${pattern.patternId}: duplicate patternId`);
  patternIds.add(pattern.patternId);
  assert(pattern.variantIds.length === 1, `${pattern.patternId}: each recipe must target exactly one variant`);

  const [variantId] = pattern.variantIds;
  assert(countsByVariant.has(variantId), `${pattern.patternId}: unknown variantId ${variantId}`);
  countsByVariant.set(variantId, countsByVariant.get(variantId) + 1);
  assert(!typesByVariant.get(variantId).has(pattern.patternType), `${pattern.patternId}: duplicate ${pattern.patternType} recipe for ${variantId}`);
  typesByVariant.get(variantId).add(pattern.patternType);

  for (const alias of pattern.sourceEvidenceIds) {
    assert(artifact.canonicalEvidenceAliases.includes(alias), `${pattern.patternId}: source ${alias} is not declared by the artifact`);
    const source = canonicalSources.get(alias);
    assert(source, `${pattern.patternId}: source ${alias} is not a canonical reference source`);
    assert(source.sourceId === `${expectedAliasPrefix}${alias}`, `${pattern.patternId}: source ${alias} does not resolve to its canonical source ID`);
    assert(source.domain === "visual-style", `${pattern.patternId}: source ${alias} is not visual-style evidence`);
    assert(source.approval?.status === "approved", `${pattern.patternId}: source ${alias} is not source-approved`);
    assert(source.rights?.status === "approved", `${pattern.patternId}: source ${alias} has unapproved rights`);
    usedAliases.add(alias);
  }
}

for (const variantId of expectedVariants) {
  assert(countsByVariant.get(variantId) === artifact.expectedPerVariant, `${variantId}: expected six recipes, got ${countsByVariant.get(variantId)}`);
  assert(equalSets(typesByVariant.get(variantId), new Set(expectedTypes)), `${variantId}: must contain one recipe of every expected pattern type`);
}
assert(equalSets(usedAliases, new Set(artifact.canonicalEvidenceAliases)), "every declared canonical evidence alias must be used");

process.stdout.write(`Validated ${patterns.length} pending, compiler-ineligible cinematic-type P6 proposals.\n`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadCanonicalSources(referenceRoot) {
  const sources = new Map();
  for (const sourcePath of walk(referenceRoot)) {
    if (path.basename(sourcePath) !== "source.json") continue;
    const source = readJson(sourcePath);
    const alias = source.sourceId?.split(":").at(-1);
    if (typeof alias !== "string" || sources.has(alias)) {
      throw new Error(`Canonical source alias must be unique: ${source.sourceId ?? sourcePath}`);
    }
    sources.set(alias, source);
  }
  return sources;
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function equalLists(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function equalSets(actual, expected) {
  return actual.size === expected.size && [...actual].every((value) => expected.has(value));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
