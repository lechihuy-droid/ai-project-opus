#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const packageDir = path.resolve(import.meta.dirname);
const projectRoot = path.resolve(packageDir, '../../../../');
const patternsPath = path.join(packageDir, 'visual-patterns.json');
const reportPath = path.join(packageDir, 'artifacts', 'visual-patterns-validation.json');
const evidenceArtifacts = {
  'w8-dashboard-primer-docs': 'design/knowledge/reference-library/web/w8-dashboard-primer-docs/source.json',
  'w8-dashboard-primer-react': 'design/knowledge/reference-library/repository/w8-dashboard-primer-react/source.json',
  'w8-dashboard-remotion-animation': 'design/knowledge/reference-library/web/w8-dashboard-remotion-animation/source.json',
};
const expectedVariantIds = [
  'benchmark-grid',
  'operations-monitor',
  'comparison-dashboard',
  'trend-panel',
  'scorecard',
];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const fail = (message) => { throw new Error(message); };

function main() {
  const writeReport = process.argv.includes('--write-report');
  const pkg = readJson(path.join(packageDir, 'style-package.json'));
  const variants = readJson(path.join(packageDir, 'variants.json'));
  const patterns = readJson(patternsPath);
  const schema = readJson(path.join(projectRoot, 'design', 'schemas', 'visual-pattern.schema.json'));
  const validate = new Ajv({allErrors: true}).compile(schema);
  const errors = [];
  const actualVariantIds = variants.map((variant) => variant.variantId);
  if (actualVariantIds.join(',') !== expectedVariantIds.join(',')) {
    errors.push('Variant IDs must be ordered as ' + expectedVariantIds.join(', ') + '.');
  }
  const variantIds = new Set(expectedVariantIds);
  const packageEvidenceIds = new Set((pkg.sourceReferences ?? []).map((reference) => reference.id));
  const patternIds = new Set();
  const perVariant = Object.fromEntries([...variantIds].map((id) => [id, 0]));

  if (!Array.isArray(patterns) || patterns.length !== 30) errors.push(`Expected exactly 30 patterns, found ${patterns?.length ?? 'non-array'}.`);
  for (const pattern of patterns) {
    if (!validate(pattern)) errors.push(`${pattern?.patternId ?? '<unknown>'}: ${JSON.stringify(validate.errors)}`);
    if (patternIds.has(pattern.patternId)) errors.push(`Duplicate patternId: ${pattern.patternId}`);
    patternIds.add(pattern.patternId);
    if (pattern.packageId !== 'dashboard-data') errors.push(`${pattern.patternId}: packageId must be dashboard-data.`);
    if (pattern.reviewStatus !== 'proposed') errors.push(`${pattern.patternId}: reviewStatus must remain proposed.`);
    if (pattern.variantIds?.length !== 1 || !variantIds.has(pattern.variantIds[0])) errors.push(`${pattern.patternId}: must target exactly one known variant.`);
    else perVariant[pattern.variantIds[0]] += 1;
    for (const evidenceId of pattern.sourceEvidenceIds ?? []) {
      if (!packageEvidenceIds.has(evidenceId)) errors.push(`${pattern.patternId}: unknown package evidence ${evidenceId}.`);
      if (!Object.hasOwn(evidenceArtifacts, evidenceId)) errors.push(`${pattern.patternId}: evidence ${evidenceId} has no verified local artifact mapping.`);
    }
  }
  for (const [variantId, count] of Object.entries(perVariant)) if (count !== 6) errors.push(`${variantId}: expected 6 patterns, found ${count}.`);

  const verifiedEvidence = Object.entries(evidenceArtifacts).map(([evidenceId, relativePath]) => {
    const source = readJson(path.join(projectRoot, relativePath));
    const approved = source.approval?.status === 'approved' && source.rights?.status === 'approved';
    if (!approved) errors.push(`${evidenceId}: source artifact is not approved for evidence use.`);
    return {evidenceId, artifact: relativePath, sourceId: source.sourceId, approved};
  });
  const compilerEligible = patterns.some((pattern) => pattern.reviewStatus === 'approved');
  if (compilerEligible) errors.push('At least one pattern became compiler-eligible without human approval.');

  const report = {
    schemaVersion: 'terra-pattern-proposal-p4-validation/v1', packageId: 'dashboard-data', status: errors.length === 0 ? 'passed' : 'failed', generatedAt: new Date().toISOString(),
    scope: {patterns: 'design/visual-library/styles/dashboard-data/visual-patterns.json', ownership: 'package-local only', collectionEdited: false, rendererEdited: false, globalEdited: false},
    checks: {schemaValid: errors.length === 0, exactPatternCount: patterns.length, uniquePatternIds: patternIds.size, perVariant, allReviewStatusProposed: !compilerEligible, compilerEligible: false, humanApprovalRequired: true, verifiedEvidence}, errors,
  };
  if (writeReport) fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
