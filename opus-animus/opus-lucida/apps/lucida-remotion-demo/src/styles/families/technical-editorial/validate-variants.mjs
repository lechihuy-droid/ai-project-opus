import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/technical-editorial");
const fixturesDir = path.join(root, "pipeline/fixtures/styles/technical-editorial");
const variants = JSON.parse(
  fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"),
);
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"),
);
const validate = new Ajv({ allErrors: true }).compile(schema);
const expectedVariantIds = [
  "technical-brief",
  "annotated-explainer",
  "data-essay",
  "research-digest",
  "evidence-grid",
];
const allowedEvidenceIds = new Set([
  "p1-03-repo-revealjs",
  "p1-03-repo-observable-plot",
]);

if (!Array.isArray(variants) || variants.length !== 5) {
  throw new Error("variants.json must contain exactly five draft variants");
}
if (variants.map((variant) => variant.variantId).join(",") !== expectedVariantIds.join(",")) {
  throw new Error("variant IDs must match the technical-editorial package contract");
}

const variantIds = new Set();
for (const variant of variants) {
  if (!validate(variant)) {
    throw new Error(
      `${variant.variantId ?? "unknown"}: ${JSON.stringify(validate.errors)}`,
    );
  }
  if (variant.packageId !== "technical-editorial") {
    throw new Error(`${variant.variantId}: packageId must be technical-editorial`);
  }
  if (variant.reviewStatus !== "proposed") {
    throw new Error(`${variant.variantId}: only proposed local variants are allowed`);
  }
  if (
    variant.sourceEvidenceIds.length !== 1 ||
    !allowedEvidenceIds.has(variant.sourceEvidenceIds[0])
  ) {
    throw new Error(`${variant.variantId}: exactly one package evidence reference is required`);
  }
  if (variantIds.has(variant.variantId)) {
    throw new Error(`${variant.variantId}: variant IDs must be unique`);
  }
  variantIds.add(variant.variantId);

  const fixturePath = path.join(fixturesDir, `${variant.variantId}.fixture.ts`);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`${variant.variantId}: missing fixture ${fixturePath}`);
  }
  const fixtureSource = fs.readFileSync(fixturePath, "utf8");
  if (!fixtureSource.includes(`key: \"${variant.variantId}\"`)) {
    throw new Error(`${variant.variantId}: fixture key does not match variant ID`);
  }
}

const fixtureIndex = fs.readFileSync(path.join(fixturesDir, "index.ts"), "utf8");
for (const variantId of variantIds) {
  if (!fixtureIndex.includes(`\"${variantId}\":`)) {
    throw new Error(`${variantId}: fixture is not exported by the local harness`);
  }
}

process.stdout.write(
  `Validated ${variants.length} technical-editorial draft variants and fixtures.\n`,
);
