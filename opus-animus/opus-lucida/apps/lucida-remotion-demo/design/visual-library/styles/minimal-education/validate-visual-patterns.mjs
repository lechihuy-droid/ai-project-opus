#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const packageDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(packageDir, '..', '..', '..', '..');
const patternPath = path.join(packageDir, 'visual-patterns.json');
const reportPath = path.join(packageDir, 'artifacts', 'terra-p3-validation.json');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const patterns = readJson(patternPath);
const variants = readJson(path.join(packageDir, 'variants.json'));
const stylePackage = readJson(path.join(packageDir, 'style-package.json'));
const patternSchema = readJson(path.join(projectRoot, 'design', 'schemas', 'visual-pattern.schema.json'));
const validatePattern = new Ajv({allErrors: true}).compile(patternSchema);
const variantIds = new Set(variants.map((variant) => variant.variantId));
const sourceEvidenceIds = new Set(stylePackage.sourceReferences.map((source) => source.id));
const expectedVariants = [
  'single-concept',
  'step-sequence',
  'comparison-cards',
  'checklist',
  'takeaway',
];

expect(Array.isArray(patterns), 'visual-patterns.json must be an array.');
expect(patterns.length === 30, `Expected 30 patterns; found ${patterns.length}.`);
const patternIds = new Set();
for (const [index, pattern] of patterns.entries()) {
  expect(validatePattern(pattern), `Pattern ${index} fails schema: ${JSON.stringify(validatePattern.errors)}.`);
  expect(pattern.packageId === 'minimal-education', `Pattern ${pattern.patternId} has an invalid packageId.`);
  expect(!patternIds.has(pattern.patternId), `Pattern ID is duplicated: ${pattern.patternId}.`);
  patternIds.add(pattern.patternId);
  expect(pattern.reviewStatus === 'proposed', `Pattern ${pattern.patternId} must remain proposed.`);
  for (const variantId of pattern.variantIds) {
    expect(variantIds.has(variantId), `Pattern ${pattern.patternId} references unknown variant ${variantId}.`);
  }
  for (const sourceEvidenceId of pattern.sourceEvidenceIds) {
    expect(sourceEvidenceIds.has(sourceEvidenceId), `Pattern ${pattern.patternId} references non-package source evidence ${sourceEvidenceId}.`);
  }
}

const patternsPerVariant = Object.fromEntries(expectedVariants.map((variantId) => [
  variantId,
  patterns.filter((pattern) => pattern.variantIds.includes(variantId)).length,
]));
for (const variantId of expectedVariants) {
  expect(patternsPerVariant[variantId] === 6, `Variant ${variantId} must have exactly 6 patterns; found ${patternsPerVariant[variantId]}.`);
}
expect(Object.keys(patternsPerVariant).length === variants.length, 'Validator targets must cover every package variant.');

const report = {
  schemaVersion: 'terra-pattern-proposal-p3-validation/v1',
  packageId: 'minimal-education',
  proposalStatus: 'proposed',
  humanPatternReview: 'pending',
  compilerEligibility: false,
  canonicalEligibility: false,
  patternCount: patterns.length,
  uniquePatternIdCount: patternIds.size,
  patternStatuses: Object.fromEntries(['proposed'].map((status) => [status, patterns.filter((pattern) => pattern.reviewStatus === status).length])),
  patternsPerVariant,
  referencedSourceEvidenceIds: [...new Set(patterns.flatMap((pattern) => pattern.sourceEvidenceIds))].sort(),
  validation: {
    schemaValid: failures.every((failure) => !failure.includes('fails schema')),
    referencesValid: failures.every((failure) => !failure.includes('references')),
    idsUnique: patternIds.size === patterns.length,
    sixPatternsPerVariant: expectedVariants.every((variantId) => patternsPerVariant[variantId] === 6),
    passed: failures.length === 0,
    failures,
  },
  notes: [
    'This report records a non-canonical Terra proposal set only.',
    'Compiler eligibility remains false until the separate human review and promotion workflow completes.',
  ],
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error(`Minimal Education visual-pattern validation failed: ${failures.join(' ')}`);
  process.exit(1);
}
console.log(`Validated ${patterns.length} proposed Minimal Education patterns across ${expectedVariants.length} variants.`);
