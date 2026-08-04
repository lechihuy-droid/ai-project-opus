import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/claim-evidence");
const expectedIds = ["claim-proof", "pro-con", "benchmark-audit", "myth-reality", "source-triangulation"];
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(packageDir, relativePath), "utf8"));
const ajv = new Ajv({ allErrors: true });
const packageSchema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/visual-package.schema.json"), "utf8"));
const variantSchema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"));
const validatePackage = ajv.compile(packageSchema);
const validateVariant = ajv.compile(variantSchema);
const stylePackage = readJson("style-package.json");
const variants = readJson("variants.json");
const sourceReview = readJson("artifacts/source-review-report.json");
const demo = readJson("artifacts/demo-video-map.json");

if (!validatePackage(stylePackage)) throw new Error(`style-package.json: ${JSON.stringify(validatePackage.errors)}`);
if (stylePackage.id !== "claim-evidence" || stylePackage.status !== "draft") throw new Error("style package must remain the claim-evidence draft");
if (stylePackage.qualityGate.validated !== false) throw new Error("draft quality gate must remain false");
if (!Array.isArray(variants) || variants.length !== expectedIds.length) throw new Error("variants.json must contain exactly five draft variants");
if (new Set(variants.map((variant) => variant.variantId)).size !== expectedIds.length) throw new Error("variant IDs must be unique");
for (const variant of variants) {
  if (!validateVariant(variant)) throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validateVariant.errors)}`);
  if (variant.packageId !== "claim-evidence" || variant.reviewStatus !== "proposed") throw new Error(`${variant.variantId}: draft package mismatch`);
}
if (JSON.stringify(variants.map((variant) => variant.variantId)) !== JSON.stringify(expectedIds)) throw new Error("variant IDs must match the package contract order");
if (sourceReview.approvedSourceCount !== 0 || sourceReview.approvedPatternCount !== 0) throw new Error("draft must not claim approved sources or patterns");
if (!Array.isArray(demo.scenes) || demo.scenes.length !== expectedIds.length || demo.width !== 1080 || demo.height !== 1920) throw new Error("demo map must declare five 1080x1920 scenes");
if (JSON.stringify(demo.scenes.map((scene) => scene.sceneKey)) !== JSON.stringify(expectedIds)) throw new Error("demo scenes must cover each contract variant once");

process.stdout.write("Validated claim-evidence draft package and five schema-valid variants.\n");
