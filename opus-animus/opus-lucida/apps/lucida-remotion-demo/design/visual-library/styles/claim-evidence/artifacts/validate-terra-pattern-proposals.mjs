import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/claim-evidence");
const patternsPath = path.join(packageDir, "visual-patterns.json");
const artifactPath = path.join(packageDir, "artifacts/terra-pattern-proposal-p13-validation.json");
const variantsPath = path.join(packageDir, "variants.json");
const sourceRoot = path.join(root, "design/knowledge/reference-library");
const patternSchema = readJson(path.join(root, "design/schemas/visual-pattern.schema.json"));
const sourceSchema = readJson(path.join(root, "design/schemas/reference-source.schema.json"));
const validatePattern = new Ajv({ allErrors: true }).compile(patternSchema);
const validateSource = new Ajv({ allErrors: true }).compile(sourceSchema);
const expectedTypes = ["layout", "typography", "palette", "motion", "component", "composition"];
const expectedVariants = readJson(variantsPath).map(({ variantId }) => variantId).sort();
const allowedEvidence = new Set(["w8-minimal-nng-hierarchy", "w8-dashboard-remotion-animation", "openai-gpt-5-6-official"]);
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const patterns = readJson(patternsPath);
const knownSources = loadSources(sourceRoot);

expect(Array.isArray(patterns), "visual-patterns.json must be an array");
expect(patterns.length === 30, `expected exactly 30 patterns; received ${patterns.length}`);
const ids = new Set();
const perVariant = Object.fromEntries(expectedVariants.map((variantId) => [variantId, 0]));
const typesPerVariant = Object.fromEntries(expectedVariants.map((variantId) => [variantId, new Set()]));
for (const pattern of patterns) {
  expect(validatePattern(pattern), `${pattern.patternId ?? "unknown"}: schema invalid: ${JSON.stringify(validatePattern.errors)}`);
  expect(pattern.packageId === "claim-evidence", `${pattern.patternId}: wrong package`);
  expect(pattern.reviewStatus === "proposed", `${pattern.patternId}: must remain proposed`);
  expect(pattern.classifierVersion === "terra-pattern-proposal-p13/1.0", `${pattern.patternId}: wrong classifier version`);
  expect(!ids.has(pattern.patternId), `${pattern.patternId}: duplicate local pattern ID`);
  ids.add(pattern.patternId);
  expect(pattern.variantIds.length === 1, `${pattern.patternId}: recipe must target one variant`);
  const [variantId] = pattern.variantIds;
  expect(Object.hasOwn(perVariant, variantId), `${pattern.patternId}: unknown variant ${variantId}`);
  if (Object.hasOwn(perVariant, variantId)) {
    perVariant[variantId] += 1;
    expect(!typesPerVariant[variantId].has(pattern.patternType), `${pattern.patternId}: duplicate ${pattern.patternType} recipe for ${variantId}`);
    typesPerVariant[variantId].add(pattern.patternType);
  }
  expect(pattern.classificationReasons.some((reason) => reason.includes("Renderable recipe:") && reason.includes("claim '") && reason.includes("source label") && reason.includes("confidence ") && reason.includes("verdict '")), `${pattern.patternId}: recipe must include concrete claim, source, confidence, and verdict`);
  for (const evidenceId of pattern.sourceEvidenceIds) {
    expect(allowedEvidence.has(evidenceId), `${pattern.patternId}: unapproved or undeclared evidence alias ${evidenceId}`);
    const source = knownSources.get(evidenceId);
    expect(source, `${pattern.patternId}: evidence ${evidenceId} has no canonical source artifact`);
    if (source) {
      expect(validateSource(source), `${pattern.patternId}: source ${evidenceId} violates reference schema`);
      expect(source.sourceId === `source:reference:${evidenceId}`, `${pattern.patternId}: source ${evidenceId} has unexpected sourceId`);
      expect(/^https:\/\//.test(source.sourceRef), `${pattern.patternId}: source ${evidenceId} has no verified HTTPS reference`);
      expect(source.approval?.status === "approved", `${pattern.patternId}: source ${evidenceId} lacks approval`);
      expect(source.rights?.status === "approved", `${pattern.patternId}: source ${evidenceId} lacks approved rights`);
    }
  }
}
for (const variantId of expectedVariants) {
  expect(perVariant[variantId] === 6, `${variantId}: expected 6 proposals; received ${perVariant[variantId]}`);
  expect(equalSets(typesPerVariant[variantId], new Set(expectedTypes)), `${variantId}: must have exactly one of each recipe type`);
}
for (const patternId of ids) expect(!externalPatternIds(root, patternsPath).has(patternId), `${patternId}: duplicates a pattern ID outside this package`);

const artifact = {
  schemaVersion: "terra-pattern-proposal-p13-validation/v1",
  proposalId: "terra-pattern-proposal-p13",
  packageId: "claim-evidence",
  proposalStatus: "pending-human-approval",
  humanPatternReview: "pending",
  compilerEligibility: { eligible: false, reason: "All patterns are proposed and require human approval; this validator cannot approve or promote them." },
  canonicalPromotion: false,
  approvalAction: "none",
  scope: { patterns: "design/visual-library/styles/claim-evidence/visual-patterns.json", ownership: "package-local only", collectionEdited: false, rendererEdited: false, globalEdited: false },
  checks: {
    schemaValid: !failures.some((failure) => failure.includes("schema invalid")),
    referencesValid: !failures.some((failure) => /unapproved or undeclared evidence alias|has no canonical source artifact|source .* violates reference schema|unexpected sourceId|no verified HTTPS reference|lacks approval|lacks approved rights/.test(failure)),
    exactPatternCount: patterns.length === 30,
    uniquePatternIds: ids.size === patterns.length && !failures.some((failure) => failure.includes("duplicate")),
    patternsPerVariant: perVariant,
    sixPatternsPerVariant: Object.values(perVariant).every((count) => count === 6),
    distinctRecipeTypesPerVariant: Object.fromEntries(Object.entries(typesPerVariant).map(([variantId, types]) => [variantId, [...types].sort()])),
    allReviewStatusesProposed: patterns.every((pattern) => pattern.reviewStatus === "proposed"),
    concreteRecipes: !failures.some((failure) => failure.includes("concrete claim")),
    verifiedEvidenceAliases: [...allowedEvidence].sort()
  },
  result: failures.length === 0 ? "PASS" : "FAIL",
  errors: failures
};
fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Claim Evidence P13 validation passed: 30 proposed patterns, 6 per variant, compiler ineligible.");
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function equalSets(actual, expected) { return actual.size === expected.size && [...actual].every((value) => expected.has(value)); }
function loadSources(directory) {
  const result = new Map();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) for (const [alias, source] of loadSources(entryPath)) result.set(alias, source);
    if (entry.isFile() && entry.name === "source.json") {
      const source = readJson(entryPath);
      result.set(source.sourceId.split(":").at(-1), source);
    }
  }
  return result;
}
function externalPatternIds(projectRoot, localPatternsPath) {
  const result = new Set();
  const stylesRoot = path.join(projectRoot, "design/visual-library/styles");
  for (const entry of fs.readdirSync(stylesRoot, { withFileTypes: true })) {
    const candidate = path.join(stylesRoot, entry.name, "visual-patterns.json");
    if (!entry.isDirectory() || candidate === localPatternsPath || !fs.existsSync(candidate)) continue;
    for (const pattern of readJson(candidate)) result.add(pattern.patternId);
  }
  return result;
}
