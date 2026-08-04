import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = process.cwd();
const packageId = "terminal-command-center";
const packageDir = path.join(root, "design/visual-library/styles", packageId);
const fixtureDir = path.join(root, "pipeline/fixtures/styles", packageId);
const expectedIds = ["clean-cli", "agent-runtime", "system-monitor", "cyberdeck", "retro-crt"];
const expectedEvidenceIds = {
  "clean-cli": "repo-microsoft-terminal",
  "agent-runtime": "web-zellij",
  "system-monitor": "web-wezterm",
  "cyberdeck": "repo-charmbracelet-vhs",
  "retro-crt": "repo-charmbracelet-vhs",
};
const variants = JSON.parse(fs.readFileSync(path.join(packageDir, "variants.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root, "design/schemas/style-variant.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true }).compile(schema);

if (!Array.isArray(variants) || variants.length !== expectedIds.length) {
  throw new Error(`variants.json must contain exactly ${expectedIds.length} draft variants`);
}
if (variants.map((variant) => variant.variantId).join(",") !== expectedIds.join(",")) {
  throw new Error(`variant IDs must be ordered as ${expectedIds.join(", ")}`);
}
for (const variant of variants) {
  if (!validate(variant)) throw new Error(`${variant.variantId ?? "unknown"}: ${JSON.stringify(validate.errors)}`);
  if (variant.packageId !== packageId || variant.reviewStatus !== "proposed") throw new Error(`${variant.variantId}: draft package mismatch`);
  if (variant.sourceEvidenceIds.length !== 1 || variant.sourceEvidenceIds[0] !== expectedEvidenceIds[variant.variantId]) {
    throw new Error(`${variant.variantId}: source evidence mismatch`);
  }
  if (!fs.existsSync(path.join(fixtureDir, `${variant.variantId}.fixture.ts`))) throw new Error(`${variant.variantId}: missing deterministic fixture`);
}
for (const file of ["TerminalCommandCenterScene.tsx", "TerminalCommandCenterPreview.tsx", "renderRoot.tsx", "types.ts", "tokens.ts"]) {
  if (!fs.existsSync(path.join(root, "src/styles/families", packageId, file))) throw new Error(`missing render harness file: ${file}`);
}
process.stdout.write(`Validated ${variants.length} terminal-command-center draft variants and fixtures.\n`);
