#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.resolve(packageDir, "..", "..", "..", "..");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
const patternPath = path.join(packageDir, "visual-patterns.json");
const variantsPath = path.join(packageDir, "variants.json");
const schemaPath = path.join(appRoot, "design", "schemas", "visual-pattern.schema.json");
const proposalPath = path.join(appRoot, "pipeline", "runs", "p1-03", "03-terra-classification-proposal.json");
const verificationPath = path.join(appRoot, "pipeline", "runs", "p1-03", "06-luna-verification.json");
const reportPath = path.join(packageDir, "artifacts", "visual-pattern-validation-report.json");

const patterns = readJson(patternPath);
const variants = readJson(variantsPath);
const proposal = readJson(proposalPath);
const verification = readJson(verificationPath);
const ajv = new Ajv({ allErrors: true, strict: true });
const validatePattern = ajv.compile(readJson(schemaPath));
const errors = [];
const schemaErrors = [];

if (!Array.isArray(patterns)) errors.push("visual-patterns.json must be an array");
const expectedVariantIds = variants.map((variant) => variant.variantId).sort();
const associationByEvidenceId = new Map(
  (proposal.sourceAssociations ?? []).flatMap((association) => [
    [association.sourceEvidenceId, association],
    [association.sourceId, association],
  ]),
);
const eligibleEvidenceIds = new Set(
  [...associationByEvidenceId.values()]
    .filter((association) => association.reviewEligibility === "eligible-pending-human-rights-and-visual-review")
    .flatMap((association) => [association.sourceEvidenceId, association.sourceId]),
);

const patternIds = new Set();
const variantCounts = Object.fromEntries(expectedVariantIds.map((variantId) => [variantId, 0]));
for (const pattern of patterns) {
  if (!validatePattern(pattern)) {
    const error = `${pattern.patternId ?? "unknown"}: ${ajv.errorsText(validatePattern.errors)}`;
    schemaErrors.push(error);
    errors.push(error);
  }
  if (patternIds.has(pattern.patternId)) errors.push(`duplicate patternId: ${pattern.patternId}`);
  patternIds.add(pattern.patternId);
  if (pattern.packageId !== "technical-editorial") errors.push(`${pattern.patternId}: packageId must be technical-editorial`);
  if (pattern.variantIds.length !== 1 || !Object.hasOwn(variantCounts, pattern.variantIds[0])) {
    errors.push(`${pattern.patternId}: must target exactly one existing technical-editorial variant`);
  } else {
    variantCounts[pattern.variantIds[0]] += 1;
  }
  if (pattern.reviewStatus !== "proposed") errors.push(`${pattern.patternId}: reviewStatus must remain proposed`);
  for (const evidenceId of pattern.sourceEvidenceIds) {
    if (!associationByEvidenceId.has(evidenceId)) errors.push(`${pattern.patternId}: unknown sourceEvidenceId ${evidenceId}`);
    if (!eligibleEvidenceIds.has(evidenceId)) errors.push(`${pattern.patternId}: sourceEvidenceId is not P1-03 review-eligible ${evidenceId}`);
  }
}

if (patterns.length !== 30) errors.push(`expected exactly 30 patterns, found ${patterns.length}`);
for (const [variantId, count] of Object.entries(variantCounts)) {
  if (count !== 6) errors.push(`${variantId}: expected 6 patterns, found ${count}`);
}

const sourceStates = [...eligibleEvidenceIds].sort().map((sourceEvidenceId) => {
  const association = associationByEvidenceId.get(sourceEvidenceId);
  return {
    sourceEvidenceId,
    sourceId: association.sourceId,
    reviewStatus: association.reviewStatus,
    reviewEligibility: association.reviewEligibility,
    canonicalEligibility: association.canonicalEligibility,
    rendererAvailability: association.rendererAvailability,
  };
});
const compilerEligible = sourceStates.every((source) => (
  source.reviewStatus === "approved" && source.canonicalEligibility === true && source.rendererAvailability === true
));
if (compilerEligible) errors.push("compiler eligibility must remain false without human approval, canonical promotion, and renderer availability");
if (verification.eligibilityDecision !== "BLOCKED_NONCANONICAL") {
  errors.push("P1-03 verification must remain BLOCKED_NONCANICAL for this proposal batch");
}

const report = {
  schemaVersion: "terra-pattern-proposal-validation/v1",
  packageId: "technical-editorial",
  proposalBatch: "terra-pattern-proposal-p2",
  inputs: {
    patternFile: "../visual-patterns.json",
    variantFile: "../variants.json",
    patternSchema: "../../../../schemas/visual-pattern.schema.json",
    verifiedReviewProposal: "../../../../../pipeline/runs/p1-03/03-terra-classification-proposal.json",
    verifiedReviewReport: "../../../../../pipeline/runs/p1-03/06-luna-verification.json",
  },
  checks: {
    schemaValid: schemaErrors.length === 0,
    patternCount: patterns.length,
    expectedPatternCount: 30,
    uniquePatternIds: patternIds.size === patterns.length,
    variantIds: expectedVariantIds,
    patternsPerVariant: variantCounts,
    expectedPatternsPerVariant: 6,
    allReviewStatusesProposed: patterns.every((pattern) => pattern.reviewStatus === "proposed"),
    sourceEvidenceIds: sourceStates,
    referencesResolveToRealReviewArtifacts: errors.filter((error) => error.includes("sourceEvidenceId")).length === 0,
  },
  compilerEligibility: {
    eligible: compilerEligible,
    reason: "false: all linked P1-03 sources are review-eligible only; human approval, canonical promotion, and renderer availability are absent.",
  },
  approvalState: {
    claimedApprovedSources: 0,
    claimedApprovedPatterns: 0,
    claimedPromotedPatterns: 0,
    status: "pending-human-review",
  },
  result: errors.length === 0 ? "PASS" : "FAIL",
  errors,
};

writeJson(reportPath, report);
if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("Technical-editorial visual-pattern proposal validation passed: 30 proposed patterns, 6 per variant, compiler ineligible.");
}
