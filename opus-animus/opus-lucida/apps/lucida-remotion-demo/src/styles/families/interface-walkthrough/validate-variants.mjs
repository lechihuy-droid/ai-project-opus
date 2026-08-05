import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/interface-walkthrough");
const variants = JSON.parse(fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true }).compile(schema);
const expectedIds = new Set(["annotated-screen", "step-flow", "feature-tour", "before-after-ui", "state-transition"]);

if (!Array.isArray(variants) || variants.length !== 5) throw new Error("variants.json must contain exactly five variants");
for (const variant of variants) {
  if (!validate(variant)) throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validate.errors)}`);
  if (variant.packageId !== "interface-walkthrough" || variant.reviewStatus !== "proposed" || !expectedIds.delete(variant.variantId)) throw new Error(`${variant.variantId}: draft package mismatch`);
}
if (expectedIds.size) throw new Error(`Missing variants: ${[...expectedIds].join(", ")}`);
process.stdout.write("Validated 5 interface-walkthrough draft variants.\n");
