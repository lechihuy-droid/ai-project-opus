#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import {fileURLToPath} from "node:url";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(artifactDir, "..");
const appRoot = path.resolve(packageDir, "..", "..", "..", "..");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);

const patterns = readJson(path.join(packageDir, "visual-patterns.json"));
const variants = readJson(path.join(packageDir, "variants.json"));
const stylePackage = readJson(path.join(packageDir, "style-package.json"));
const sourceReview = readJson(path.join(packageDir, "artifacts", "source-review-report.json"));
const patternSchema = readJson(path.join(appRoot, "design", "schemas", "visual-pattern.schema.json"));
const reportPath = path.join(artifactDir, "visual-patterns-validation.json");
const validatePattern = new Ajv({allErrors: true, strict: true}).compile(patternSchema);
const errors = [];
const schemaErrors = [];
const verifiedSourceUrl = "https://www.remotion.dev/docs/animating-properties";
const expectedVariantIds = variants.map((variant) => variant.variantId).sort();
const variantCounts = Object.fromEntries(expectedVariantIds.map((variantId) => [variantId, 0]));
const packageReferences = new Map((stylePackage.sourceReferences ?? []).map((reference) => [reference.id, reference]));
const patternIds = new Set();

if (!Array.isArray(patterns)) errors.push("visual-patterns.json must be an array");
for (const pattern of patterns) {
  if (!validatePattern(pattern)) {
    const error = `${pattern.patternId ?? "unknown"}: ${JSON.stringify(validatePattern.errors)}`;
    schemaErrors.push(error);
    errors.push(error);
  }
  if (patternIds.has(pattern.patternId)) errors.push(`duplicate patternId: ${pattern.patternId}`);
  patternIds.add(pattern.patternId);
  if (pattern.packageId !== "editorial-collage") errors.push(`${pattern.patternId}: packageId must be editorial-collage`);
  if (pattern.variantIds?.length !== 1 || !Object.hasOwn(variantCounts, pattern.variantIds[0])) {
    errors.push(`${pattern.patternId}: must target exactly one known editorial-collage variant`);
  } else {
    variantCounts[pattern.variantIds[0]] += 1;
  }
  if (pattern.reviewStatus !== "proposed") errors.push(`${pattern.patternId}: reviewStatus must remain proposed`);
  for (const sourceEvidenceId of pattern.sourceEvidenceIds ?? []) {
    const reference = packageReferences.get(sourceEvidenceId);
    if (!reference) errors.push(`${pattern.patternId}: unknown package source reference ${sourceEvidenceId}`);
    if (reference?.url !== verifiedSourceUrl) errors.push(`${pattern.patternId}: source reference ${sourceEvidenceId} must resolve to the verified Remotion URL`);
  }
}

if (patterns.length !== 30) errors.push(`expected exactly 30 patterns, found ${patterns.length}`);
for (const [variantId, count] of Object.entries(variantCounts)) {
  if (count !== 6) errors.push(`${variantId}: expected 6 patterns, found ${count}`);
}
if (!sourceReview.externalReferences?.includes(verifiedSourceUrl)) {
  errors.push("source-review-report.json does not contain the verified Remotion URL");
}

const allProposed = patterns.every((pattern) => pattern.reviewStatus === "proposed");
const compilerEligible = !allProposed;
if (compilerEligible) errors.push("compiler eligibility must remain false until human approval and promotion");

const report = {
  schemaVersion: "terra-pattern-proposal-p9-validation/v1",
  packageId: "editorial-collage",
  proposalBatch: "terra-pattern-proposal-p9",
  status: errors.length === 0 ? "passed" : "failed",
  scope: {
    patterns: "design/visual-library/styles/editorial-collage/visual-patterns.json",
    validationScript: "design/visual-library/styles/editorial-collage/artifacts/validate-visual-patterns.mjs",
    collectionEdited: false,
    rendererEdited: false,
    globalEdited: false,
  },
  checks: {
    schemaValid: schemaErrors.length === 0,
    exactPatternCount: patterns.length,
    uniquePatternIds: patternIds.size === patterns.length,
    variants: expectedVariantIds,
    patternsPerVariant: variantCounts,
    expectedPatternsPerVariant: 6,
    allReviewStatusesProposed: allProposed,
    sourceReferencesResolve: errors.filter((error) => error.includes("source reference") || error.includes("source-review-report")).length === 0,
    verifiedSourceReferences: [{
      id: "w8-dashboard-remotion-animation",
      url: verifiedSourceUrl,
      declaredInStylePackage: packageReferences.get("w8-dashboard-remotion-animation")?.url === verifiedSourceUrl,
      declaredInSourceReview: sourceReview.externalReferences?.includes(verifiedSourceUrl) ?? false,
    }],
  },
  approvalState: {
    patternStatus: "proposed",
    sourceReviewStatus: "pending-human-review",
    approvedPatterns: 0,
    promotedPatterns: 0,
  },
  compilerEligibility: {
    eligible: false,
    reason: "All records remain proposed; human approval and promotion are required before compiler eligibility.",
  },
  errors,
};

writeJson(reportPath, report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (errors.length > 0) process.exitCode = 1;
