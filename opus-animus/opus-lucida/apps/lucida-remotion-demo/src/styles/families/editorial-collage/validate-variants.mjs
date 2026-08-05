import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/editorial-collage");
const fixturesDir = path.join(root, "pipeline/fixtures/styles/editorial-collage");
const expectedIds = ["source-montage", "culture-recap", "visual-essay", "quote-collage", "multi-source-evidence"];
const expectedSourceEvidenceId = "w8-dashboard-remotion-animation";
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const ajv = new Ajv({ allErrors: true });
const validatePackage = ajv.compile(readJson(path.join(root, "design/schemas/visual-package.schema.json")));
const validateVariant = ajv.compile(readJson(path.join(root, "design/schemas/style-variant.schema.json")));
const stylePackage = readJson(path.join(packageDir, "style-package.json"));
const variants = readJson(path.join(packageDir, "variants.json"));
const artifactManifest = readJson(path.join(packageDir, "artifact-manifest.json"));
const fixtureIndex = fs.readFileSync(path.join(fixturesDir, "index.ts"), "utf8");
const renderRoot = fs.readFileSync(path.join(root, "src/styles/families/editorial-collage/render-root.tsx"), "utf8");

if (!validatePackage(stylePackage)) throw new Error(`style-package.json: ${JSON.stringify(validatePackage.errors)}`);
if (stylePackage.id !== "editorial-collage" || stylePackage.status !== "experimental") throw new Error("production package identity must remain editorial-collage experimental");
if (stylePackage.qualityGate.validated !== true) throw new Error("production quality gate must remain validated");
if (stylePackage.sourcePolicy.copyStatus !== "original" || stylePackage.sourcePolicy.registeredMedia !== "embed_asset only") throw new Error("production source policy must remain original embed_asset only");
if (!renderRoot.includes('defaultProps={{ sceneKey: "source-montage" }}')) throw new Error("production default must remain source-montage");
if (!Array.isArray(variants) || variants.length !== expectedIds.length) throw new Error("variants.json must contain exactly five variants");
if (JSON.stringify(variants.map((variant) => variant.variantId)) !== JSON.stringify(expectedIds)) throw new Error("variant IDs must match the local fixture contract order");
if (new Set(variants.map((variant) => variant.variantId)).size !== expectedIds.length) throw new Error("variant IDs must be unique");

const manifestFixturePaths = new Set(
  artifactManifest.artifacts.filter((artifact) => artifact.kind === "fixture").map((artifact) => artifact.path),
);
for (const variant of variants) {
  if (!validateVariant(variant)) throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validateVariant.errors)}`);
  if (variant.packageId !== "editorial-collage" || variant.reviewStatus !== "proposed") throw new Error(`${variant.variantId}: package or review status mismatch`);
  if (variant.sourceEvidenceIds.length !== 1 || variant.sourceEvidenceIds[0] !== expectedSourceEvidenceId) throw new Error(`${variant.variantId}: evidence must resolve to the package-local verified source reference`);
  const fixturePath = path.join(fixturesDir, `${variant.variantId}.fixture.ts`);
  if (!fs.existsSync(fixturePath)) throw new Error(`${variant.variantId}: missing fixture`);
  if (!fs.readFileSync(fixturePath, "utf8").includes(`key: "${variant.variantId}"`)) throw new Error(`${variant.variantId}: fixture key does not match variant ID`);
  if (!fixtureIndex.includes(`"${variant.variantId}":`)) throw new Error(`${variant.variantId}: fixture is absent from the local harness`);
  const manifestPath = `pipeline/fixtures/styles/editorial-collage/${variant.variantId}.fixture.ts`;
  if (!manifestFixturePaths.has(manifestPath)) throw new Error(`${variant.variantId}: fixture is absent from the package manifest`);
}

process.stdout.write("Validated editorial-collage production package and five proposed local variants.\n");
