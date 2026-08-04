import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import Ajv from "ajv";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(packageDir, "../../../../");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const patterns = readJson(path.join(packageDir, "visual-patterns.json"));
const variants = readJson(path.join(packageDir, "variants.json"));
const schema = readJson(path.join(appRoot, "design/schemas/visual-pattern.schema.json"));
const validator = new Ajv({allErrors: true, strict: true}).compile(schema);
const failures = [];

if (!Array.isArray(patterns) || patterns.length !== 30) failures.push("Expected exactly 30 patterns.");

const variantIds = new Set(variants.map((variant) => variant.variantId));
if (variantIds.size !== 5) failures.push("Expected exactly five package variants.");

const approvedEvidenceIds = new Set();
for (const sourcePath of fs.readdirSync(path.join(appRoot, "design/knowledge/reference-library"), {recursive: true})
  .filter((entry) => entry.endsWith("source.json"))) {
  const source = readJson(path.join(appRoot, "design/knowledge/reference-library", sourcePath));
  if (source.domain === "visual-style" && source.approval?.status === "approved" && source.rights?.status === "approved") {
    approvedEvidenceIds.add(source.sourceId);
    approvedEvidenceIds.add(source.sourceId.split(":").at(-1));
  }
}

const patternIds = new Set();
const recipes = new Set();
const perVariant = new Map([...variantIds].map((id) => [id, []]));
for (const pattern of patterns) {
  if (!validator(pattern)) failures.push(`${pattern.patternId ?? "unknown"}: schema ${JSON.stringify(validator.errors)}`);
  if (patternIds.has(pattern.patternId)) failures.push(`Duplicate patternId: ${pattern.patternId}`);
  patternIds.add(pattern.patternId);
  if (pattern.packageId !== "paper-notebook") failures.push(`${pattern.patternId}: wrong packageId.`);
  if (pattern.variantIds.length !== 1 || !variantIds.has(pattern.variantIds[0])) failures.push(`${pattern.patternId}: must target one known variant.`);
  else perVariant.get(pattern.variantIds[0]).push(pattern);
  if (pattern.reviewStatus !== "proposed") failures.push(`${pattern.patternId}: reviewStatus must remain proposed.`);
  if (pattern.reviewStatus === "approved") failures.push(`${pattern.patternId}: compiler eligibility must remain false.`);
  for (const sourceId of pattern.sourceEvidenceIds) {
    if (!approvedEvidenceIds.has(sourceId)) failures.push(`${pattern.patternId}: unverified sourceEvidenceId ${sourceId}.`);
  }
  const recipe = JSON.stringify({variantIds: pattern.variantIds, patternType: pattern.patternType, layoutTraits: pattern.layoutTraits, componentTraits: pattern.componentTraits, contentCapacity: pattern.contentCapacity});
  if (recipes.has(recipe)) failures.push(`${pattern.patternId}: duplicate renderable recipe.`);
  recipes.add(recipe);
}

for (const [variantId, records] of perVariant) {
  if (records.length !== 6) failures.push(`${variantId}: expected 6 patterns, received ${records.length}.`);
  if (new Set(records.map((record) => record.patternType)).size !== 6) failures.push(`${variantId}: pattern types must be distinct.`);
}

if (failures.length) {
  console.error(JSON.stringify({status: "failed", failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  packageId: "paper-notebook",
  proposalCount: patterns.length,
  distribution: Object.fromEntries([...perVariant].map(([id, records]) => [id, records.length])),
  schemaValid: true,
  uniquePatternIds: patternIds.size,
  uniqueRecipes: recipes.size,
  verifiedEvidenceOnly: true,
  reviewStatus: "proposed",
  humanReview: "pending",
  compilerEligibleCount: 0,
}, null, 2));
