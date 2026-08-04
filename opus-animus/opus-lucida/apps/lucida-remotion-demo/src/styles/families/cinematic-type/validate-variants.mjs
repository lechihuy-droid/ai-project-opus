import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageId = "cinematic-type";
const packageDir = path.join(root, "design/visual-library/styles", packageId);
const fixtureDir = path.join(root, "pipeline/fixtures/styles", packageId);
const expectedIds = [
  "kinetic-hook",
  "quote",
  "chapter-reset",
  "manifesto",
  "outro",
];
const variants = JSON.parse(
  fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"),
);
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"),
);
const validate = new Ajv({ allErrors: true }).compile(schema);

if (!Array.isArray(variants) || variants.length !== expectedIds.length) {
  throw new Error(`variants.json must contain exactly ${expectedIds.length} draft variants`);
}
if (variants.map((variant) => variant.variantId).join(",") !== expectedIds.join(",")) {
  throw new Error(`variant IDs must be ordered as ${expectedIds.join(", ")}`);
}

const fixtureFiles = fs
  .readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".fixture.ts"))
  .map((file) => file.replace(".fixture.ts", ""))
  .sort();
if (fixtureFiles.join(",") !== [...expectedIds].sort().join(",")) {
  throw new Error(`fixture files must match ${expectedIds.join(", ")}`);
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
    throw new Error(`${variant.variantId}: draft package mismatch`);
  }
  if (
    variant.sourceEvidenceIds.length !== 1 ||
    !variant.sourceEvidenceIds[0].startsWith("w8-")
  ) {
    throw new Error(
      variant.variantId + ": must retain one canonical source alias",
    );
  }
  const fixtureMapping = new RegExp(
    '(?:["\\x27]' + variant.variantId + '["\\x27]|' + variant.variantId + "):",
  );
  if (!fixtureMapping.test(fixtureIndex)) {
    throw new Error(`${variant.variantId}: missing fixture mapping`);
  }
  if (!fixtureTypes.includes(`"${variant.variantId}"`)) {
    throw new Error(`${variant.variantId}: missing renderable fixture key`);
  }
}

for (const file of [
  "CinematicTypeScene.tsx",
  "CinematicTypePreview.tsx",
  "renderRoot.tsx",
  "types.ts",
  "tokens.ts",
]) {
  if (!fs.existsSync(path.join(root, "src/styles/families", packageId, file))) {
    throw new Error(`missing render harness file: ${file}`);
  }
}

process.stdout.write(
  `Validated ${variants.length} cinematic-type draft variants and fixtures.\n`,
);
