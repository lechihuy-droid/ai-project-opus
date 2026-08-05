import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/code-walkthrough");
const variants = JSON.parse(fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true }).compile(schema);

if (!Array.isArray(variants) || variants.length !== 5) {
  throw new Error("variants.json must contain exactly five draft variants");
}
for (const variant of variants) {
  if (!validate(variant)) throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validate.errors)}`);
  if (variant.packageId !== "code-walkthrough" || variant.reviewStatus !== "proposed") throw new Error(`${variant.variantId}: draft package mismatch`);
}
process.stdout.write(`Validated ${variants.length} code-walkthrough draft variants.\n`);
