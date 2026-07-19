import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/dashboard-data");
const fixturesDir = path.join(root, "pipeline/fixtures/styles/dashboard-data");
const expectedIds = [
  "benchmark-grid",
  "operations-monitor",
  "comparison-dashboard",
  "trend-panel",
  "scorecard",
];
const variants = JSON.parse(
  fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"),
);
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"),
);
const validate = new Ajv({ allErrors: true }).compile(schema);

if (!Array.isArray(variants) || variants.length !== 5) {
  throw new Error("variants.json must contain exactly five draft variants");
}
if (variants.map((variant) => variant.variantId).join(",") !== expectedIds.join(",")) {
  throw new Error("variant IDs must be ordered as " + expectedIds.join(", "));
}

const variantIds = new Set();
for (const variant of variants) {
  if (!validate(variant)) {
    throw new Error(
      `${variant.variantId ?? "unknown"}: ${JSON.stringify(validate.errors)}`,
    );
  }
  if (variant.packageId !== "dashboard-data") {
    throw new Error(`${variant.variantId}: packageId must be dashboard-data`);
  }
  if (variant.reviewStatus !== "proposed") {
    throw new Error(`${variant.variantId}: only proposed local variants are allowed`);
  }
  if (
    variant.sourceEvidenceIds.length !== 1 ||
    !variant.sourceEvidenceIds[0].startsWith("w8-dashboard-")
  ) {
    throw new Error(
      variant.variantId + ": must retain one verified local source reference",
    );
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
  if (!fixtureSource.includes(`key: "${variant.variantId}"`)) {
    throw new Error(`${variant.variantId}: fixture key does not match variant ID`);
  }
}

const fixtureIndex = fs.readFileSync(path.join(fixturesDir, "index.ts"), "utf8");
for (const variantId of variantIds) {
  const fixtureMapping = new RegExp(
    '(?:["\\x27]' + variantId + '["\\x27]|' + variantId + "):",
  );
  if (!fixtureMapping.test(fixtureIndex)) {
    throw new Error(variantId + ": fixture is not exported by the local harness");
  }
  const fixtureTypes = fs.readFileSync(
    path.join(root, "src/styles/families/dashboard-data/types.ts"),
    "utf8",
  );
  if (!fixtureTypes.includes('"' + variantId + '"')) {
    throw new Error(variantId + ": missing renderable fixture key");
  }
}

process.stdout.write(
  `Validated ${variants.length} dashboard-data draft variants and fixtures.\n`,
);
