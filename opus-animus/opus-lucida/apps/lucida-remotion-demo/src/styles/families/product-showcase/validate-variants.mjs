import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageId = "product-showcase";
const variantIds = [
  "product-hero",
  "feature-reveal",
  "before-after",
  "capability-grid",
  "launch-summary",
];
const packageDir = path.join(root, "design/visual-library/styles", packageId);
const fixtureDir = path.join(root, "pipeline/fixtures/styles", packageId);
const variants = JSON.parse(
  fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"),
);
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"),
);
const packageDefinition = JSON.parse(
  fs.readFileSync(path.join(packageDir, "style-package.json"), "utf8"),
);
const validate = new Ajv({ allErrors: true }).compile(schema);

if (!Array.isArray(variants) || variants.length !== variantIds.length) {
  throw new Error(`variants.json must contain exactly ${variantIds.length} draft variants`);
}
if (variants.map((variant) => variant.variantId).join(",") !== variantIds.join(",")) {
  throw new Error(`variant IDs must be ordered as ${variantIds.join(", ")}`);
}
if (
  packageDefinition.sourcePolicy.copyStatus !== "original" ||
  packageDefinition.sourcePolicy.registeredMedia !== "fixture-only-original-svg-data-uri"
) {
  throw new Error("product-showcase source provenance must remain fixture-only original media");
}

const fixtureIndex = fs.readFileSync(path.join(fixtureDir, "index.ts"), "utf8");
const fixtureTypes = fs.readFileSync(
  path.join(root, "src/styles/families", packageId, "types.ts"),
  "utf8",
);
for (const variant of variants) {
  if (!validate(variant)) {
    throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validate.errors)}`);
  }
  if (variant.packageId !== packageId || variant.reviewStatus !== "proposed") {
    throw new Error(`${variant.variantId}: only proposed local product variants are allowed`);
  }
  if (
    variant.sourceEvidenceIds.length !== 1 ||
    !packageDefinition.sourceReferences.some(
      (source) => source.id === variant.sourceEvidenceIds[0],
    )
  ) {
    throw new Error(`${variant.variantId}: must cite one package-declared evidence source`);
  }

  const fixturePath = path.join(fixtureDir, `${variant.variantId}.fixture.ts`);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`${variant.variantId}: missing fixture`);
  }
  const fixtureSource = fs.readFileSync(fixturePath, "utf8");
  if (!fixtureSource.includes(`key: "${variant.variantId}"`)) {
    throw new Error(`${variant.variantId}: fixture key does not match variant ID`);
  }
  if (!fixtureSource.includes('usage: "embed_asset"') && !fixtureSource.includes("createProductShowcaseMockup")) {
    throw new Error(`${variant.variantId}: fixture must contain renderable embed_asset media`);
  }
  if (!fixtureIndex.includes(`"${variant.variantId}":`)) {
    throw new Error(`${variant.variantId}: fixture is not exported by the local harness`);
  }
  if (!fixtureTypes.includes(`"${variant.variantId}"`)) {
    throw new Error(`${variant.variantId}: fixture key is not renderable by the family type`);
  }
}

for (const defaultKey of ["normal", "dense", "edge"]) {
  if (!fixtureIndex.includes(`${defaultKey}:`) || !fixtureTypes.includes(`"${defaultKey}"`)) {
    throw new Error(`${defaultKey}: default fixture behavior must remain available`);
  }
}

process.stdout.write(
  `Validated ${variants.length} product-showcase draft variants and fixtures.\n`,
);
