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
const reportPath = path.join(packageDir, 'artifacts', 'terra-pattern-proposal-p12-validation.json');
const expectedPatternTypes = ['layout', 'typography', 'palette', 'motion', 'component', 'content-density'];
const sourceEvidence = {
  'w8-dashboard-primer-docs': {
    path: 'design/knowledge/reference-library/web/w8-dashboard-primer-docs/source.json',
    sourceId: 'source:reference:w8-dashboard-primer-docs',
    sourceRef: 'https://primer.style/',
  },
  'w8-dashboard-remotion-animation': {
    path: 'design/knowledge/reference-library/web/w8-dashboard-remotion-animation/source.json',
    sourceId: 'source:reference:w8-dashboard-remotion-animation',
    sourceRef: 'https://www.remotion.dev/docs/animating-properties',
  },
  'w8-minimal-nng-aesthetic': {
    path: 'design/knowledge/reference-library/web/w8-minimal-nng-aesthetic/source.json',
    sourceId: 'source:reference:w8-minimal-nng-aesthetic',
    sourceRef: 'https://www.nngroup.com/articles/aesthetic-minimalist-design/',
  },
  'w8-minimal-nng-hierarchy': {
    path: 'design/knowledge/reference-library/web/w8-minimal-nng-hierarchy/source.json',
    sourceId: 'source:reference:w8-minimal-nng-hierarchy',
    sourceRef: 'https://www.nngroup.com/articles/visual-hierarchy-ux-definition/',
  },
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const patterns = readJson(patternPath);
const variants = readJson(path.join(packageDir, 'variants.json'));
const expectedVariantIds = variants.map((variant) => variant.variantId).sort();
const ajv = new Ajv({allErrors: true});
const validatePattern = ajv.compile(readJson(path.join(projectRoot, 'design', 'schemas', 'visual-pattern.schema.json')));
const validateSource = ajv.compile(readJson(path.join(projectRoot, 'design', 'schemas', 'reference-source.schema.json')));

expect(Array.isArray(patterns), 'visual-patterns.json must be an array.');
expect(patterns.length === 30, `Expected exactly 30 patterns; found ${patterns.length}.`);
expect(expectedVariantIds.length === 5, `Expected five variants; found ${expectedVariantIds.length}.`);

const localPatternIds = new Set();
const patternsPerVariant = Object.fromEntries(expectedVariantIds.map((variantId) => [variantId, 0]));
const patternTypesPerVariant = Object.fromEntries(expectedVariantIds.map((variantId) => [variantId, new Set()]));
const usedEvidenceIds = new Set();
for (const [index, pattern] of patterns.entries()) {
  expect(validatePattern(pattern), `Pattern ${index} fails schema: ${JSON.stringify(validatePattern.errors)}.`);
  expect(pattern.packageId === 'news-rundown', `${pattern.patternId}: packageId must be news-rundown.`);
  expect(pattern.classifierVersion === 'terra-pattern-proposal-p12/1.0', `${pattern.patternId}: unexpected classifierVersion.`);
  expect(!localPatternIds.has(pattern.patternId), `Duplicate local patternId: ${pattern.patternId}.`);
  localPatternIds.add(pattern.patternId);
  expect(pattern.variantIds.length === 1, `${pattern.patternId}: must target exactly one package variant.`);
  expect(pattern.reviewStatus === 'proposed', `${pattern.patternId}: reviewStatus must remain proposed.`);
  for (const variantId of pattern.variantIds) {
    expect(Object.hasOwn(patternsPerVariant, variantId), `${pattern.patternId}: unknown variant ${variantId}.`);
    if (Object.hasOwn(patternsPerVariant, variantId)) {
      patternsPerVariant[variantId] += 1;
      patternTypesPerVariant[variantId].add(pattern.patternType);
    }
  }
  for (const evidenceId of pattern.sourceEvidenceIds) {
    expect(Object.hasOwn(sourceEvidence, evidenceId), `${pattern.patternId}: unknown verified source evidence ${evidenceId}.`);
    usedEvidenceIds.add(evidenceId);
  }
}

for (const [variantId, count] of Object.entries(patternsPerVariant)) {
  expect(count === 6, `${variantId}: expected 6 patterns; found ${count}.`);
  expect(patternTypesPerVariant[variantId].size === expectedPatternTypes.length, `${variantId}: expected 6 distinct recipe types; found ${patternTypesPerVariant[variantId].size}.`);
  for (const patternType of expectedPatternTypes) expect(patternTypesPerVariant[variantId].has(patternType), `${variantId}: missing ${patternType} recipe.`);
}

const externalPatternIds = new Set();
for (const entry of fs.readdirSync(path.join(projectRoot, 'design', 'visual-library', 'styles'), {withFileTypes: true})) {
  const siblingPatternPath = path.join(projectRoot, 'design', 'visual-library', 'styles', entry.name, 'visual-patterns.json');
  if (!entry.isDirectory() || siblingPatternPath === patternPath || !fs.existsSync(siblingPatternPath)) continue;
  for (const siblingPattern of readJson(siblingPatternPath)) externalPatternIds.add(siblingPattern.patternId);
}
for (const patternId of localPatternIds) expect(!externalPatternIds.has(patternId), `patternId duplicates another package proposal: ${patternId}.`);

const evidenceChecks = Object.entries(sourceEvidence).map(([evidenceId, definition]) => {
  const sourcePath = path.join(projectRoot, definition.path);
  expect(fs.existsSync(sourcePath), `${evidenceId}: source artifact is missing: ${definition.path}.`);
  if (!fs.existsSync(sourcePath)) return {evidenceId, ...definition, approved: false, schemaValid: false};
  const source = readJson(sourcePath);
  const schemaValid = validateSource(source);
  expect(schemaValid, `${evidenceId}: source artifact fails schema: ${JSON.stringify(validateSource.errors)}.`);
  expect(source.sourceId === definition.sourceId, `${evidenceId}: unexpected sourceId ${source.sourceId}.`);
  expect(source.sourceRef === definition.sourceRef, `${evidenceId}: unexpected sourceRef ${source.sourceRef}.`);
  expect(source.domain === 'visual-style', `${evidenceId}: source domain must be visual-style.`);
  expect(source.approval?.status === 'approved', `${evidenceId}: source evidence is not approved.`);
  expect(source.rights?.status === 'approved', `${evidenceId}: source rights are not approved.`);
  return {evidenceId, artifact: definition.path, sourceId: source.sourceId, sourceRef: source.sourceRef, approved: source.approval?.status === 'approved' && source.rights?.status === 'approved', schemaValid};
});

expect(usedEvidenceIds.size === Object.keys(sourceEvidence).length, 'Every declared verified source must support at least one proposal.');
const report = {
  schemaVersion: 'terra-pattern-proposal-p12-validation/v1',
  proposalId: 'terra-pattern-proposal-p12',
  packageId: 'news-rundown',
  proposalStatus: 'pending-human-approval',
  humanPatternReview: 'pending',
  compilerEligibility: 'ineligible',
  canonicalPromotion: false,
  approvalAction: 'none',
  scope: {
    patterns: 'design/visual-library/styles/news-rundown/visual-patterns.json',
    validator: 'design/visual-library/styles/news-rundown/validate-terra-pattern-proposals.mjs',
    ownership: 'package-local only',
    collectionEdited: false,
    rendererEdited: false,
    globalEdited: false,
  },
  checks: {
    schemaValid: failures.every((failure) => !failure.includes('fails schema')),
    referencesValid: failures.every((failure) => !failure.includes('source artifact') && !failure.includes('unknown verified source') && !failure.includes('sourceId') && !failure.includes('sourceRef') && !failure.includes('source domain') && !failure.includes('not approved')),
    exactPatternCount: patterns.length === 30,
    uniquePatternIds: localPatternIds.size === patterns.length && !failures.some((failure) => failure.includes('Duplicate') || failure.includes('duplicates another package')),
    patternsPerVariant,
    sixPatternsPerVariant: Object.values(patternsPerVariant).every((count) => count === 6),
    distinctRecipeTypesPerVariant: Object.fromEntries(Object.entries(patternTypesPerVariant).map(([variantId, types]) => [variantId, [...types].sort()])),
    allReviewStatusesProposed: patterns.every((pattern) => pattern.reviewStatus === 'proposed'),
    verifiedEvidence: evidenceChecks,
  },
  result: failures.length === 0 ? 'PASS' : 'FAIL',
  errors: failures,
};
writeJson(reportPath, report);
if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exitCode = 1;
} else {
  console.log('News Rundown P12 validation passed: 30 proposed patterns, 6 per variant, compiler ineligible.');
}
