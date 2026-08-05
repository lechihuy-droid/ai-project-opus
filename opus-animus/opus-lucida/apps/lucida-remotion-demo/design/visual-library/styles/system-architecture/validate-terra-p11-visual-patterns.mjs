import {createRequire} from "node:module";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const packageDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(packageDir, "../../../../");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const equalLists = (actual, expected) => Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
const equalSets = (actual, expected) => actual.size === expected.size && [...actual].every((value) => expected.has(value));
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const artifact = readJson(path.join(packageDir, "artifacts", "terra-pattern-proposal-p11-validation.json"));
const patterns = readJson(path.join(packageDir, "visual-patterns.json"));
const variants = readJson(path.join(packageDir, "variants.json"));
const schema = readJson(path.join(appRoot, "design", "schemas", "visual-pattern.schema.json"));
const validate = new Ajv({allErrors: true, strict: true}).compile(schema);
const expectedVariants = ["layered-stack", "request-flow", "agent-graph", "data-pipeline", "dependency-map"];
const expectedTypes = ["layout", "typography", "palette", "motion", "component", "composition"];

expect(artifact.schemaVersion === "terra-pattern-proposal-validation/v1", "validation artifact schemaVersion mismatch");
expect(artifact.proposalId === "terra-pattern-proposal-p11", "validation artifact proposalId mismatch");
expect(artifact.packageId === "system-architecture", "validation artifact packageId mismatch");
expect(artifact.proposalStatus === "pending-human-approval", "proposal must remain pending human approval");
expect(artifact.compilerEligibility === "ineligible", "proposal must remain compiler-ineligible");
expect(artifact.approvalAction === "none", "validator must not approve or promote proposals");
expect(artifact.expectedPatternCount === 30, "validation artifact must expect exactly 30 patterns");
expect(artifact.expectedPerVariant === 6, "validation artifact must expect six patterns per variant");
expect(equalLists(artifact.expectedVariantIds, expectedVariants), "validation artifact variant distribution mismatch");
expect(equalLists(artifact.expectedPatternTypes, expectedTypes), "validation artifact pattern type distribution mismatch");
expect(Array.isArray(patterns) && patterns.length === artifact.expectedPatternCount, "visual-patterns.json must contain exactly 30 patterns");

const packageVariantIds = new Set(variants.map((variant) => variant.variantId));
expect(equalSets(packageVariantIds, new Set(expectedVariants)), "package variants do not match P11 distribution");

const sourcePaths = {
  "w8-technical-primer-foundations": "design/knowledge/reference-library/web/w8-technical-primer-foundations/source.json",
  "w8-technical-primer-primitives": "design/knowledge/reference-library/repository/w8-technical-primer-primitives/source.json",
  "w8-technical-reveal-code": "design/knowledge/reference-library/web/w8-technical-reveal-code/source.json",
  "w8-dashboard-remotion-animation": "design/knowledge/reference-library/web/w8-dashboard-remotion-animation/source.json",
};
const verifiedSources = new Map();
for (const [alias, relativePath] of Object.entries(sourcePaths)) {
  const source = readJson(path.join(appRoot, relativePath));
  expect(artifact.canonicalEvidenceAliases.includes(alias), `${alias}: missing from validation artifact`);
  expect(source.sourceId === `source:reference:${alias}`, `${alias}: source ID does not resolve to canonical alias`);
  expect(source.domain === "visual-style", `${alias}: source is not visual-style evidence`);
  expect(source.approval?.status === "approved", `${alias}: source approval is not approved`);
  expect(source.rights?.status === "approved", `${alias}: source rights are not approved`);
  verifiedSources.set(alias, source);
}
expect(equalSets(new Set(artifact.canonicalEvidenceAliases), new Set(Object.keys(sourcePaths))), "validation artifact source aliases mismatch");

const patternIds = new Set();
const recipes = new Set();
const countsByVariant = new Map(expectedVariants.map((variantId) => [variantId, 0]));
const typesByVariant = new Map(expectedVariants.map((variantId) => [variantId, new Set()]));
const usedAliases = new Set();

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

  expect(pattern?.sourceEvidenceIds?.length > 0, `${pattern?.patternId ?? index}: missing verified source reference`);
  for (const alias of pattern?.sourceEvidenceIds ?? []) {
    expect(verifiedSources.has(alias), `${pattern?.patternId ?? index}: unverified source reference ${alias}`);
    usedAliases.add(alias);
  }

  const recipe = JSON.stringify({variantIds: pattern?.variantIds, patternType: pattern?.patternType, layoutTraits: pattern?.layoutTraits, componentTraits: pattern?.componentTraits, contentCapacity: pattern?.contentCapacity});
  expect(!recipes.has(recipe), `${pattern?.patternId ?? index}: duplicate renderable recipe`);
  recipes.add(recipe);
}

for (const variantId of expectedVariants) {
  expect(countsByVariant.get(variantId) === artifact.expectedPerVariant, `${variantId}: expected six recipes, got ${countsByVariant.get(variantId)}`);
  expect(equalSets(typesByVariant.get(variantId), new Set(expectedTypes)), `${variantId}: must contain one recipe of every expected pattern type`);
}
expect(equalSets(usedAliases, new Set(artifact.canonicalEvidenceAliases)), "every declared verified source alias must be used");
expect(patterns.every((pattern) => pattern.reviewStatus !== "approved"), "approved proposals are compiler-eligible only after human approval");

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
    schemaValid: true,
    verifiedSourceReferencesOnly: true,
    proposalCount: patterns.length,
    uniquePatternIds: patternIds.size,
    uniqueRenderableRecipes: recipes.size,
    distribution: Object.fromEntries(countsByVariant),
    patternTypesPerVariant: Object.fromEntries([...typesByVariant].map(([variantId, types]) => [variantId, [...types].sort()])),
  }, null, 2));
}
