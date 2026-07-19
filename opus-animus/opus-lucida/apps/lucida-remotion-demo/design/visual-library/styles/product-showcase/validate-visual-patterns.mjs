#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const packageDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(packageDir, '..', '..', '..', '..');
const patternsPath = path.join(packageDir, 'visual-patterns.json');
const reportPath = path.join(packageDir, 'artifacts', 'terra-p7-validation.json');
const evidenceReportPath = path.join(packageDir, 'artifacts', 'er2-evidence-validation-report.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const patterns = readJson(patternsPath);
const variants = readJson(path.join(packageDir, 'variants.json'));
const stylePackage = readJson(path.join(packageDir, 'style-package.json'));
const evidenceReport = readJson(evidenceReportPath);
const patternSchema = readJson(path.join(projectRoot, 'design', 'schemas', 'visual-pattern.schema.json'));
const validatePattern = new Ajv({allErrors: true}).compile(patternSchema);
const variantIds = new Set(variants.map((variant) => variant.variantId));
const verifiedEvidenceIds = new Set(evidenceReport.resolvedRecords.flatMap((record) => record.sourceEvidenceIds));

expect(Array.isArray(patterns), 'visual-patterns.json must be an array.');
expect(patterns.length === 30, `Expected exactly 30 patterns; found ${patterns.length}.`);
expect(variantIds.size * 6 === 30, `Expected five package variants with six patterns each; found ${variantIds.size} variants.`);
expect(evidenceReport.checks?.allSourceEvidenceIdsResolveUnderLunaRule === true, 'ER2 evidence report must confirm Luna-resolved evidence.');

const patternIds = new Set();
const patternsPerVariant = Object.fromEntries([...variantIds].map((variantId) => [variantId, 0]));
for (const [index, pattern] of patterns.entries()) {
  expect(validatePattern(pattern), `Pattern ${index} fails schema: ${JSON.stringify(validatePattern.errors)}.`);
  expect(pattern?.packageId === 'product-showcase', `Pattern ${pattern?.patternId ?? index} has an invalid packageId.`);
  expect(!patternIds.has(pattern?.patternId), `Pattern ID is duplicated: ${pattern?.patternId}.`);
  patternIds.add(pattern?.patternId);
  expect(pattern?.reviewStatus === 'proposed', `Pattern ${pattern?.patternId ?? index} must remain proposed.`);
  expect(pattern?.variantIds?.length === 1, `Pattern ${pattern?.patternId ?? index} must target exactly one variant.`);

  const [variantId] = pattern?.variantIds ?? [];
  expect(variantIds.has(variantId), `Pattern ${pattern?.patternId ?? index} references unknown variant ${variantId}.`);
  if (variantIds.has(variantId)) patternsPerVariant[variantId] += 1;

  expect(pattern?.sourceEvidenceIds?.length > 0, `Pattern ${pattern?.patternId ?? index} must cite verified evidence.`);
  for (const evidenceId of pattern?.sourceEvidenceIds ?? []) {
    expect(verifiedEvidenceIds.has(evidenceId), `Pattern ${pattern?.patternId ?? index} references evidence absent from the ER2 Luna validation report: ${evidenceId}.`);
  }
}

for (const [variantId, count] of Object.entries(patternsPerVariant)) {
  expect(count === 6, `Variant ${variantId} must have exactly six patterns; found ${count}.`);
}

const referencedEvidenceIds = [...new Set(patterns.flatMap((pattern) => pattern.sourceEvidenceIds))].sort();
const verifiedEvidence = referencedEvidenceIds.map((evidenceId) => ({
  evidenceId,
  artifact: 'design/visual-library/styles/product-showcase/artifacts/er2-evidence-validation-report.json',
  lunaResolved: verifiedEvidenceIds.has(evidenceId),
}));

const compilerEligible = patterns.some((pattern) => pattern.reviewStatus === 'approved');
expect(!compilerEligible, 'Patterns are compiler-ineligible until separate human approval.');

const report = {
  schemaVersion: 'terra-pattern-proposal-p7-validation/v1',
  packageId: 'product-showcase',
  proposalStatus: 'proposed',
  humanPatternReview: 'pending',
  compilerEligibility: false,
  canonicalEligibility: false,
  patternCount: patterns.length,
  uniquePatternIdCount: patternIds.size,
  patternStatuses: {proposed: patterns.filter((pattern) => pattern.reviewStatus === 'proposed').length},
  patternsPerVariant,
  referencedSourceEvidenceIds: referencedEvidenceIds,
  verifiedEvidence,
  scope: {
    patterns: 'design/visual-library/styles/product-showcase/visual-patterns.json',
    validator: 'design/visual-library/styles/product-showcase/validate-visual-patterns.mjs',
    collectionEdited: false,
    rendererEdited: false,
    globalEdited: false,
  },
  validation: {
    schemaValid: failures.every((failure) => !failure.includes('fails schema')),
    referencesValid: failures.every((failure) => !failure.includes('references') && !failure.includes('not approved')),
    idsUnique: patternIds.size === patterns.length,
    sixPatternsPerVariant: Object.values(patternsPerVariant).every((count) => count === 6),
    compilerEligible: false,
    passed: failures.length === 0,
    failures,
  },
  notes: [
    'This artifact records a non-canonical P7 Terra proposal set only.',
    'No approval, promotion, renderer, global registry, or collection action is performed by this validator.',
  ],
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error(`Product Showcase P7 visual-pattern validation failed: ${failures.join(' ')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${patterns.length} proposed Product Showcase P7 patterns across ${variantIds.size} variants.`);
}
