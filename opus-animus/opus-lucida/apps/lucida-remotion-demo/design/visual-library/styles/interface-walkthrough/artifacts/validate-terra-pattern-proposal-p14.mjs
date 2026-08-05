import {createRequire} from "node:module";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const artifactsDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(artifactsDir, "..");
const appRoot = path.resolve(packageDir, "..", "..", "..", "..");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const equalLists = (actual, expected) => Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
const equalSets = (actual, expected) => actual.size === expected.size && [...actual].every((value) => expected.has(value));
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const artifact = readJson(path.join(artifactsDir, "terra-pattern-proposal-p14-validation.json"));
const patterns = readJson(path.resolve(artifactsDir, artifact.patternPath));
const variants = readJson(path.join(packageDir, "variants.json"));
const schema = readJson(path.join(appRoot, "design", "schemas", "visual-pattern.schema.json"));
const validate = new Ajv({allErrors: true, strict: true}).compile(schema);
const expectedVariants = ["annotated-screen", "step-flow", "feature-tour", "before-after-ui", "state-transition"];
const expectedTypes = ["layout", "typography", "palette", "motion", "component", "composition"];

expect(artifact.schemaVersion === "terra-pattern-proposal-validation/v1", "validation artifact schemaVersion mismatch");
expect(artifact.proposalId === "terra-pattern-proposal-p14", "validation artifact proposalId mismatch");
expect(artifact.packageId === "interface-walkthrough", "validation artifact packageId mismatch");
expect(artifact.proposalStatus === "pending-human-approval", "proposal must remain pending human approval");
expect(artifact.compilerEligibility === "ineligible", "proposal must remain compiler-ineligible");
expect(artifact.approvalAction === "none", "validator must not approve proposals");
expect(artifact.canonicalPromotion === "none", "validator must not promote proposals");
expect(artifact.expectedPatternCount === 30, "validation artifact must expect exactly 30 patterns");
expect(artifact.expectedPerVariant === 6, "validation artifact must expect six patterns per variant");
expect(equalLists(artifact.expectedVariantIds, expectedVariants), "validation artifact variant distribution mismatch");
expect(equalLists(artifact.expectedPatternTypes, expectedTypes), "validation artifact pattern type distribution mismatch");
expect(Array.isArray(patterns) && patterns.length === artifact.expectedPatternCount, "visual-patterns.json must contain exactly 30 patterns");

const packageVariantIds = new Set(variants.map((variant) => variant.variantId));
expect(equalSets(packageVariantIds, new Set(expectedVariants)), "package variants do not match P14 distribution");

const verifiedSources = new Map();
for (const alias of artifact.canonicalEvidenceIds) {
  const sourcePath = path.join(appRoot, "design", "knowledge", "reference-library", ...sourcePathParts(alias));
  expect(fs.existsSync(sourcePath), `${alias}: canonical source record is missing`);
  if (!fs.existsSync(sourcePath)) continue;
  const source = readJson(sourcePath);
  expect(source.sourceId === `source:reference:${alias}`, `${alias}: source ID does not resolve to canonical alias`);
  expect(source.domain === "visual-style", `${alias}: source is not visual-style evidence`);
  expect(["web", "repository"].includes(source.sourceType), `${alias}: source is not a real web or repository reference`);
  expect(typeof source.sourceRef === "string" && /^https:\/\//.test(source.sourceRef), `${alias}: sourceRef is not a verified HTTPS reference`);
  expect(source.approval?.status === "approved", `${alias}: source approval is not approved`);
  expect(source.rights?.status === "approved", `${alias}: source rights are not approved`);
  verifiedSources.set(alias, source);
}
expect(equalSets(new Set(artifact.canonicalEvidenceIds), new Set(verifiedSources.keys())), "not every declared source is verified");

const patternIds = new Set();
const recipes = new Set();
const countsByVariant = new Map(expectedVariants.map((variantId) => [variantId, 0]));
const typesByVariant = new Map(expectedVariants.map((variantId) => [variantId, new Set()]));
const sourceUsage = new Map(artifact.canonicalEvidenceIds.map((alias) => [alias, 0]));

for (const [index, pattern] of patterns.entries()) {
  expect(validate(pattern), `${pattern?.patternId ?? index}: schema ${JSON.stringify(validate.errors)}`);
  expect(pattern?.packageId === artifact.packageId, `${pattern?.patternId ?? index}: wrong packageId`);
  expect(!patternIds.has(pattern?.patternId), `${pattern?.patternId ?? index}: duplicate patternId`);
  patternIds.add(pattern?.patternId);
  expect(pattern?.reviewStatus === "proposed", `${pattern?.patternId ?? index}: proposal must remain proposed`);
  expect(pattern?.variantIds?.length === 1, `${pattern?.patternId ?? index}: recipe must target exactly one variant`);

  const [variantId] = pattern?.variantIds ?? [];
  expect(countsByVariant.has(variantId), `${pattern?.patternId ?? index}: unknown variant ${variantId}`);
  if (countsByVariant.has(variantId)) {
    countsByVariant.set(variantId, countsByVariant.get(variantId) + 1);
    expect(!typesByVariant.get(variantId).has(pattern.patternType), `${pattern.patternId}: duplicate ${pattern.patternType} recipe for ${variantId}`);
    typesByVariant.get(variantId).add(pattern.patternType);
  }

  const recipe = JSON.stringify({variantIds: pattern?.variantIds, patternType: pattern?.patternType, layoutTraits: pattern?.layoutTraits, componentTraits: pattern?.componentTraits, contentCapacity: pattern?.contentCapacity});
  expect(!recipes.has(recipe), `${pattern?.patternId ?? index}: duplicate renderable recipe`);
  recipes.add(recipe);

  expect(pattern?.sourceEvidenceIds?.length > 0, `${pattern?.patternId ?? index}: missing verified source reference`);
  for (const alias of pattern?.sourceEvidenceIds ?? []) {
    expect(verifiedSources.has(alias), `${pattern?.patternId ?? index}: unverified source reference ${alias}`);
    if (sourceUsage.has(alias)) sourceUsage.set(alias, sourceUsage.get(alias) + 1);
  }
}

for (const variantId of expectedVariants) {
  expect(countsByVariant.get(variantId) === artifact.expectedPerVariant, `${variantId}: expected six recipes, got ${countsByVariant.get(variantId)}`);
  expect(equalSets(typesByVariant.get(variantId), new Set(expectedTypes)), `${variantId}: must contain one recipe of every expected pattern type`);
}
for (const [alias, count] of sourceUsage) {
  expect(count > 0, `${alias}: declared verified source is unused`);
  expect(count <= 6, `${alias}: source concentration exceeds six proposals`);
}
expect(patterns.every((pattern) => pattern.reviewStatus !== "approved"), "approved patterns are compiler-eligible only after human approval");
expect(artifact.compilerEligibility !== "eligible", "artifact cannot declare compiler eligibility");

if (failures.length) {
  console.error(JSON.stringify({status: "failed", proposalId: artifact.proposalId, failures}, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "ok",
    proposalId: artifact.proposalId,
    proposalStatus: artifact.proposalStatus,
    compilerEligibility: artifact.compilerEligibility,
    approvalAction: artifact.approvalAction,
    canonicalPromotion: artifact.canonicalPromotion,
    schemaValid: true,
    verifiedSourceReferencesOnly: true,
    proposalCount: patterns.length,
    uniquePatternIds: patternIds.size,
    uniqueRenderableRecipes: recipes.size,
    distribution: Object.fromEntries(countsByVariant),
    patternTypesPerVariant: Object.fromEntries([...typesByVariant].map(([variantId, types]) => [variantId, [...types].sort()])),
    sourceUsage: Object.fromEntries(sourceUsage),
  }, null, 2));
}

function sourcePathParts(alias) {
  const sourceTypes = {
    "w8-dashboard-primer-react": "repository",
    "w8-dashboard-primer-docs": "web",
    "w8-dashboard-remotion-animation": "web",
    "w8-minimal-nng-aesthetic": "web",
    "w8-minimal-nng-hierarchy": "web",
    "w8-technical-primer-primitives": "repository",
  };
  return [sourceTypes[alias], alias, "source.json"];
}
