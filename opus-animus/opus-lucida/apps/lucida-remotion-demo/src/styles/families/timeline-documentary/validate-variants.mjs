import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/timeline-documentary");
const fixturesDir = path.join(root, "pipeline/fixtures/styles/timeline-documentary");
const variants = JSON.parse(fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true }).compile(schema);

const expectedIds = ["chronology", "milestones", "case-study", "evolution", "roadmap"];
const validSourceEvidenceIds = new Set([
  "w8-timeline-citizen-dj",
  "w8-timeline-loc-pictures",
  "w8-timeline-national-archives",
]);
if (!Array.isArray(variants) || variants.length !== expectedIds.length) {
  throw new Error(`variants.json must contain exactly ${expectedIds.length} proposed variants`);
}

const fixtureIndex = fs.readFileSync(path.join(fixturesDir, "index.ts"), "utf8");
const typeSource = fs.readFileSync(path.join(root, "src/styles/families/timeline-documentary/types.ts"), "utf8");
for (const variant of variants) {
  if (!validate(variant)) throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validate.errors)}`);
  if (variant.packageId !== "timeline-documentary") throw new Error(`${variant.variantId}: packageId must be timeline-documentary`);
  if (variant.reviewStatus !== "proposed") throw new Error(`${variant.variantId}: only proposed local variants are allowed`);
  if (variant.sourceEvidenceIds.length !== 1 || !validSourceEvidenceIds.has(variant.sourceEvidenceIds[0])) throw new Error(`${variant.variantId}: evidence must resolve to a verified package-local source reference`);
  if (!expectedIds.includes(variant.variantId)) throw new Error(`${variant.variantId}: unexpected variant ID`);
  const fixturePath = path.join(fixturesDir, `${variant.variantId}.fixture.ts`);
  if (!fs.existsSync(fixturePath)) throw new Error(`${variant.variantId}: missing fixture ${fixturePath}`);
  const fixtureSource = fs.readFileSync(fixturePath, "utf8");
  if (!fixtureSource.includes(`key: "${variant.variantId}"`)) throw new Error(`${variant.variantId}: fixture key does not match variant ID`);
  if (!fixtureIndex.includes(`"${variant.variantId}":`)) throw new Error(`${variant.variantId}: fixture is not exported by the local harness`);
  if (!typeSource.includes(`"${variant.variantId}"`)) throw new Error(`${variant.variantId}: fixture key is not renderable by the local type mapping`);
}

const actualIds = variants.map((variant) => variant.variantId);
if (new Set(actualIds).size !== expectedIds.length || expectedIds.some((variantId) => !actualIds.includes(variantId))) {
  throw new Error("variants.json must contain the expected unique variant IDs");
}

process.stdout.write(`Validated ${variants.length} timeline-documentary proposed variants and fixtures.\n`);
