import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/paper-notebook");
const fixturesDir = path.join(root, "pipeline/fixtures/styles/paper-notebook");
const expectedIds = ["research-notes", "derivation", "annotated-paper", "checklist", "lab-log"];
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(packageDir, relativePath), "utf8"));
const ajv = new Ajv({ allErrors: true });
const variantSchema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"));
const validateVariant = ajv.compile(variantSchema);
const variants = readJson("variants.json");
const packageEvidenceIds = new Set(
  readJson("style-package.json").sourceReferences.map((source) => source.id),
);

if (!Array.isArray(variants) || variants.length !== expectedIds.length) {
  throw new Error("variants.json must contain exactly five proposed variants");
}
if (JSON.stringify(variants.map((variant) => variant.variantId)) !== JSON.stringify(expectedIds)) {
  throw new Error("variant IDs must match the paper-notebook local fixture contract order");
}

const fixtureIndex = fs.readFileSync(path.join(fixturesDir, "index.ts"), "utf8");
for (const variant of variants) {
  if (!validateVariant(variant)) {
    throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validateVariant.errors)}`);
  }
  if (variant.packageId !== "paper-notebook" || variant.reviewStatus !== "proposed") {
    throw new Error(`${variant.variantId}: package or review status mismatch`);
  }
  if (variant.sourceEvidenceIds.length !== 1 || !packageEvidenceIds.has(variant.sourceEvidenceIds[0])) {
    throw new Error(`${variant.variantId}: must cite one package-declared evidence source`);
  }
  const fixturePath = path.join(fixturesDir, `${variant.variantId}.fixture.ts`);
  if (!fs.existsSync(fixturePath)) throw new Error(`${variant.variantId}: missing fixture`);
  if (!fs.readFileSync(fixturePath, "utf8").includes(`key: "${variant.variantId}"`)) {
    throw new Error(`${variant.variantId}: fixture key does not match variant ID`);
  }
  if (!fixtureIndex.includes(`"${variant.variantId}":`)) {
    throw new Error(`${variant.variantId}: fixture is absent from the local harness`);
  }
}

process.stdout.write("Validated five paper-notebook proposed variants and local fixture mappings.\n");
