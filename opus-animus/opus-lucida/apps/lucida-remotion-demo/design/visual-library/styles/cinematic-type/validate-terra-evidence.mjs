import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(packageRoot, "../../../..");
const packageIds = ["cinematic-type"];
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

const canonical = new Map();
for (const file of walk(path.join(appRoot, "design", "knowledge", "reference-library"))) {
  if (path.basename(file) !== "source.json") continue;
  const source = readJson(file);
  for (const id of [source.sourceId, source.sourceId?.split(":").at(-1)]) {
    if (id) canonical.set(id, source);
  }
}

const lunaEligible = new Set();
for (const runId of ["style-rag-p1-05", "style-rag-p1-06"]) {
  const audit = readJson(path.join(appRoot, "pipeline", "runs", runId, "06-luna-verification.json"));
  if (audit.status !== "PASS" || !String(audit.recomputedChecks?.domainIsolation).startsWith("PASS")) {
    throw new Error(`${runId} is not a PASS visual-style Luna audit.`);
  }
  for (const sourceId of audit.eligibleRightsEvidence?.sourceIds ?? []) lunaEligible.add(sourceId);
}

function resolve(sourceId) {
  const source = canonical.get(sourceId);
  if (source) {
    const valid = source.domain === "visual-style" && source.approval?.status === "approved" && source.rights?.status === "approved";
    return {sourceId, resolution: "CANONICAL_APPROVED_VISUAL_STYLE", valid, canonicalSourceId: source.sourceId};
  }
  return {sourceId, resolution: lunaEligible.has(sourceId) ? "LUNA_PASS_REVIEW_ELIGIBLE" : "UNRESOLVED", valid: lunaEligible.has(sourceId)};
}

let invalidCount = 0;
for (const packageId of packageIds) {
  const dir = path.join(appRoot, "design", "visual-library", "styles", packageId);
  const stylePackage = readJson(path.join(dir, "style-package.json"));
  const variants = readJson(path.join(dir, "variants.json"));
  const patterns = readJson(path.join(dir, "visual-patterns.json"));
  const records = [
    ...variants.map((record) => ({kind: "variant", recordId: record.variantId, sourceEvidenceIds: record.sourceEvidenceIds})),
    ...patterns.map((record) => ({kind: "pattern", recordId: record.patternId, sourceEvidenceIds: record.sourceEvidenceIds})),
    ...(stylePackage.sourceReferences ?? []).map((reference) => ({kind: "sourceReference", recordId: reference.id, sourceEvidenceIds: [reference.id]})),
  ];
  const resolutions = records.flatMap((record) => (record.sourceEvidenceIds ?? []).map((sourceId) => ({
    kind: record.kind,
    recordId: record.recordId,
    ...resolve(sourceId),
  })));
  const invalid = resolutions.filter((entry) => !entry.valid);
  invalidCount += invalid.length;
  const report = {
    schemaVersion: "terra-evidence-validation/v1",
    packageId,
    rule: "Every sourceEvidenceId and sourceReferences id must resolve to an approved canonical visual-style source or an exact source ID from a PASS Luna visual-style audit.",
    status: invalid.length === 0 ? "PASS" : "FAIL",
    counts: {variants: variants.length, patterns: patterns.length, sourceReferences: stylePackage.sourceReferences?.length ?? 0, referencesChecked: resolutions.length, invalid: invalid.length},
    resolutions,
    invalid,
  };
  fs.writeFileSync(path.join(dir, "artifacts", "terra-evidence-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${packageId}: ${report.status} (${report.counts.referencesChecked} refs)`);
}

if (invalidCount > 0) process.exitCode = 1;
