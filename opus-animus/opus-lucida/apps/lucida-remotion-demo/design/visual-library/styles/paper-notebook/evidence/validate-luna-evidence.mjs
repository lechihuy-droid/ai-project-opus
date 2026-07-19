import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../../..');
const packageIds = ['paper-notebook'];
const queue = JSON.parse(await readFile(join(repo, 'design/reports/STYLE_RAG_PHASE1_HUMAN_REVIEW_QUEUE.json')));

async function canonicalEvidenceIds(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const ids = new Set();
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const id of await canonicalEvidenceIds(path)) ids.add(id);
    } else if (entry.name === 'source.json') {
      const source = JSON.parse(await readFile(path));
      if (source.domain === 'visual-style' && source.approval?.status === 'approved' && source.rights?.status === 'approved') {
        ids.add(source.sourceId);
        ids.add(source.sourceId.replace(/^source:reference:/, ''));
      }
    }
  }
  return ids;
}

const canonicalIds = await canonicalEvidenceIds(join(repo, 'design/knowledge/reference-library'));
const reviewEligibleIds = new Set(queue.sourceQueue
  .filter((source) => source.lunaSourceStatuses?.includes('LUNA_VERIFIED_REVIEW_ELIGIBLE'))
  .map((source) => source.sourceId));

const resolves = (id) => canonicalIds.has(id) || reviewEligibleIds.has(id);
const reports = [];

for (const packageId of packageIds) {
  const directory = join(repo, 'design/visual-library/styles', packageId);
  const variants = JSON.parse(await readFile(join(directory, 'variants.json')));
  const patterns = JSON.parse(await readFile(join(directory, 'visual-patterns.json')));
  const records = [...variants, ...patterns];
  const invalid = records.flatMap((record) => (record.sourceEvidenceIds ?? [])
    .filter((id) => !resolves(id))
    .map((sourceEvidenceId) => ({ recordId: record.variantId ?? record.patternId, sourceEvidenceId })));
  const statusErrors = records
    .filter((record) => record.reviewStatus !== 'proposed')
    .map((record) => ({ recordId: record.variantId ?? record.patternId, reviewStatus: record.reviewStatus }));
  const report = {
    schemaVersion: 'lucida-package-evidence-validation/v1',
    validator: 'paper-notebook/evidence/validate-luna-evidence.mjs',
    validatedAt: '2026-07-18',
    packageId,
    lunaRule: 'canonical visual-style source with approved approval and rights, or an exact human-review-queue sourceId with LUNA_VERIFIED_REVIEW_ELIGIBLE',
    counts: { variants: variants.length, patterns: patterns.length, records: records.length },
    resolvedRecordIds: records.map((record) => record.variantId ?? record.patternId),
    invalidSourceEvidence: invalid,
    invalidReviewStatuses: statusErrors,
    status: variants.length === 5 && patterns.length === 30 && invalid.length === 0 && statusErrors.length === 0 ? 'PASS' : 'FAIL'
  };
  await mkdir(join(directory, 'evidence'), { recursive: true });
  await writeFile(join(directory, 'evidence/luna-evidence-validation.json'), `${JSON.stringify(report, null, 2)}\n`);
  reports.push(report);
}

if (reports.some((report) => report.status !== 'PASS')) process.exitCode = 1;
console.log(JSON.stringify({ status: process.exitCode ? 'FAIL' : 'PASS', packages: reports.map(({ packageId, status, counts }) => ({ packageId, status, counts })) }, null, 2));
