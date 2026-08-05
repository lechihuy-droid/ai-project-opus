import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageId = "minimal-education";
const packageDir = path.join(root, "design/visual-library/styles", packageId);
const fixtureDir = path.join(root, "pipeline/fixtures/styles", packageId);
const expectedVariants = [
  ["single-concept", "definition"],
  ["step-sequence", "steps"],
  ["comparison-cards", "comparison"],
  ["checklist", "steps"],
  ["takeaway", "definition"],
];
const variants = JSON.parse(
  fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"),
);
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"),
);
const validate = new Ajv({ allErrors: true }).compile(schema);

if (!Array.isArray(variants) || variants.length !== expectedVariants.length) {
  throw new Error(`variants.json must contain exactly ${expectedVariants.length} draft variants`);
}

if (
  variants.map((variant) => variant.variantId).join(",") !==
  expectedVariants.map(([variantId]) => variantId).join(",")
) {
  throw new Error("variant IDs must match the local fixture order");
}

const fixtureIndex = fs.readFileSync(
  path.join(fixtureDir, "variant-fixtures.ts"),
  "utf8",
);

for (const [variantId, expectedSceneType] of expectedVariants) {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (!validate(variant)) {
    throw new Error(`${variantId}: ${JSON.stringify(validate.errors)}`);
  }
  if (variant.packageId !== packageId || variant.reviewStatus !== "proposed") {
    throw new Error(`${variantId}: draft package metadata must remain local`);
  }
  if (variant.sourceEvidenceIds.length !== 1) {
    throw new Error(`${variantId}: exactly one package evidence reference is required`);
  }
  if (!fixtureIndex.includes(`"${variantId}":`)) {
    throw new Error(`${variantId}: missing local fixture mapping`);
  }

  const fixturePath = path.join(fixtureDir, `${variantId}.scene.json`);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`${variantId}: missing render fixture`);
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  if (fixture.sceneId !== `${variantId}-scene`) {
    throw new Error(`${variantId}: fixture sceneId must be ${variantId}-scene`);
  }
  if (fixture.sceneType !== expectedSceneType) {
    throw new Error(`${variantId}: fixture must use the ${expectedSceneType} renderer`);
  }
  if (!Number.isInteger(fixture.durationInFrames) || fixture.durationInFrames < 90) {
    throw new Error(`${variantId}: fixture needs a renderable duration`);
  }

  if (fixture.sceneType === "definition" && fixture.definition?.keyPoints?.length !== 3) {
    throw new Error(`${variantId}: definition fixture must contain three teaching cues`);
  }
  if (fixture.sceneType === "steps" && fixture.steps?.items?.length !== 3) {
    throw new Error(`${variantId}: steps fixture must contain three action rows`);
  }
  if (fixture.sceneType === "comparison" && fixture.comparison?.criteria?.length !== 4) {
    throw new Error(`${variantId}: comparison fixture must contain four aligned criteria`);
  }
}

for (const file of ["renderer.tsx", "render-root.tsx", "render-entry.tsx", "tokens.ts", "types.ts"]) {
  if (!fs.existsSync(path.join(root, "src/styles/families", packageId, file))) {
    throw new Error(`missing render harness file: ${file}`);
  }
}

process.stdout.write(
  `Validated ${variants.length} minimal-education draft variants, fixtures, and render mappings.\n`,
);
