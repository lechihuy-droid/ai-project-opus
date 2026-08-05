import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/news-rundown");
const variants = JSON.parse(fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"));
const packageMetadata = JSON.parse(fs.readFileSync(path.join(packageDir, "style-package.json"), "utf8"));
const packageSchema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/visual-package.schema.json"), "utf8"));
const variantSchema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"));
const ajv = new Ajv({ allErrors: true });
const validatePackage = ajv.compile(packageSchema);
const validateVariant = ajv.compile(variantSchema);

if (!validatePackage(packageMetadata)) throw new Error(`style-package.json: ${JSON.stringify(validatePackage.errors)}`);
if (!Array.isArray(variants) || variants.length !== 5) throw new Error("variants.json must contain exactly five draft variants");
for (const variant of variants) {
  if (!validateVariant(variant)) throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validateVariant.errors)}`);
  if (variant.packageId !== "news-rundown" || variant.reviewStatus !== "proposed") throw new Error(`${variant.variantId}: draft package mismatch`);
}
if (packageMetadata.status !== "draft" || packageMetadata.qualityGate.validated !== false) throw new Error("package must remain an unvalidated draft");
process.stdout.write(`Validated ${variants.length} news-rundown draft variants and package metadata.\n`);
