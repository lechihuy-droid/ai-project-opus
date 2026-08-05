#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(packageDir, '..', '..', '..', '..');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const walk = (dir) => fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const stylePackage = readJson(path.join(packageDir, 'style-package.json'));
const variants = readJson(path.join(packageDir, 'variants.json'));
const patterns = readJson(path.join(packageDir, 'visual-patterns.json'));
const canonical = new Map();
for (const file of walk(path.join(projectRoot, 'design', 'knowledge', 'reference-library')).filter((file) => file.endsWith(`${path.sep}source.json`))) {
  const source = readJson(file);
  if (source.domain === 'visual-style' && source.approval?.status === 'approved' && source.rights?.status === 'approved') {
    canonical.set(source.sourceId, 'canonical-approved');
    canonical.set(path.basename(path.dirname(file)), 'canonical-approved');
  }
}
const reviewQueue = readJson(path.join(projectRoot, 'design', 'reports', 'STYLE_RAG_PHASE1_HUMAN_REVIEW_QUEUE.json'));
const reviewEligible = new Set(reviewQueue.sourceQueue
  .filter((source) => source.lunaSourceStatuses?.includes('LUNA_VERIFIED_REVIEW_ELIGIBLE'))
  .map((source) => source.sourceId));
const failures = [];
const records = [];
const resolve = (id, recordType, recordId) => {
  const resolvedBy = canonical.get(id) ?? (reviewEligible.has(id) ? 'luna-review-eligible' : null);
  records.push({recordType, recordId, sourceEvidenceId: id, resolvedBy});
  if (!resolvedBy) failures.push(`${recordType}:${recordId}:${id} does not resolve under Luna's evidence rule.`);
};
for (const source of stylePackage.sourceReferences) resolve(source.id, 'sourceReference', source.id);
for (const variant of variants) {
  if (variant.reviewStatus !== 'proposed' || !variant.sourceEvidenceIds?.length) failures.push(`variant:${variant.variantId} must remain proposed with evidence.`);
  for (const id of variant.sourceEvidenceIds ?? []) resolve(id, 'variant', variant.variantId);
}
for (const pattern of patterns) {
  if (pattern.reviewStatus !== 'proposed' || !pattern.sourceEvidenceIds?.length) failures.push(`pattern:${pattern.patternId} must remain proposed with evidence.`);
  for (const id of pattern.sourceEvidenceIds ?? []) resolve(id, 'pattern', pattern.patternId);
}
if (variants.length !== 5) failures.push(`Expected 5 variants; found ${variants.length}.`);
if (patterns.length !== 30) failures.push(`Expected 30 patterns; found ${patterns.length}.`);
const report = {
  schemaVersion: 'terra-er1-package-evidence-validation/v1', packageId: stylePackage.id,
  lunaEvidenceRule: 'canonical visual-style source with approved approval and rights, or exact LUNA_VERIFIED_REVIEW_ELIGIBLE queue source ID.',
  status: failures.length ? 'FAIL' : 'PASS', variantCount: variants.length, patternCount: patterns.length,
  proposedVariantCount: variants.filter((record) => record.reviewStatus === 'proposed').length,
  proposedPatternCount: patterns.filter((record) => record.reviewStatus === 'proposed').length,
  records, failures,
  approvalOrPromotionPerformed: false, compilerEligibility: false,
};
fs.writeFileSync(path.join(packageDir, 'artifacts', 'terra-er1-evidence-validation.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`${stylePackage.id}: ${records.length} evidence references resolve under Luna's rule.`);
