import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageId = process.argv[2] ?? "code-walkthrough";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.dirname(scriptDir);
const packageDir = path.join(stylesDir, packageId);
const repoRoot = path.resolve(stylesDir, "../../..");
const libraryDir = path.join(repoRoot, "design", "knowledge", "reference-library");
const queuePath = path.join(repoRoot, "design", "reports", "STYLE_RAG_PHASE1_HUMAN_REVIEW_QUEUE.json");
const auditPath = path.join(repoRoot, "design", "reports", "STYLE_RAG_PHASE1_GLOBAL_DATA_LUNA_AUDIT.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});

if (!fs.existsSync(packageDir)) throw new Error(`Unknown style package: ${packageId}`);
const audit = readJson(auditPath);
if (!audit.method?.evidenceRule?.includes("PASS Luna review artifact")) {
  throw new Error("Global Luna audit does not expose the expected evidence rule.");
}

const canonical = new Set();
for (const file of walk(libraryDir).filter((file) => path.basename(file) === "source.json")) {
  const source = readJson(file);
  if (source.domain === "visual-style" && source.approval?.status === "approved" && source.rights?.status === "approved") {
    canonical.add(source.sourceId);
  }
}

const queue = readJson(queuePath);
const lunaEligible = new Set();
for (const source of queue.sourceQueue ?? []) {
  for (const association of source.associations ?? []) {
    if (association.lunaSourceStatus === "LUNA_VERIFIED_REVIEW_ELIGIBLE") lunaEligible.add(association.sourceId);
  }
}

const allowed = new Set([...canonical, ...lunaEligible]);
const variants = readJson(path.join(packageDir, "variants.json"));
const patterns = readJson(path.join(packageDir, "visual-patterns.json"));
const records = [
  ...variants.map((record) => ({ kind: "variant", id: record.variantId, refs: record.sourceEvidenceIds ?? [] })),
  ...patterns.map((record) => ({ kind: "pattern", id: record.patternId, refs: record.sourceEvidenceIds ?? [] }))
];
const failures = records.flatMap((record) => record.refs.filter((id) => !allowed.has(id)).map((id) => ({ ...record, sourceEvidenceId: id })));
const stylePackage = readJson(path.join(packageDir, "style-package.json"));
const sourceReferenceFailures = packageId === "interface-walkthrough"
  ? (stylePackage.sourceReferences ?? []).filter((reference) => !allowed.has(reference.id)).map((reference) => reference.id)
  : [];
const report = {
  schemaVersion: "lucida-er2-evidence-validation/v1",
  packageId,
  lunaRule: audit.method.evidenceRule,
  counts: { variants: variants.length, patterns: patterns.length, evidenceReferences: records.reduce((count, record) => count + record.refs.length, 0) },
  allowedEvidence: { approvedCanonicalCount: canonical.size, lunaReviewEligibleCount: lunaEligible.size },
  checks: {
    allSourceEvidenceIdsResolveUnderLunaRule: failures.length === 0,
    interfaceSourceReferencesResolveUnderLunaRule: sourceReferenceFailures.length === 0,
    allVariantsProposed: variants.every((record) => record.reviewStatus === "proposed"),
    allPatternsProposed: patterns.every((record) => record.reviewStatus === "proposed")
  },
  resolvedRecords: records.map((record) => ({ kind: record.kind, id: record.id, sourceEvidenceIds: record.refs })),
  sourceReferences: packageId === "interface-walkthrough" ? stylePackage.sourceReferences ?? [] : [],
  failures,
  sourceReferenceFailures,
  result: failures.length === 0 && sourceReferenceFailures.length === 0 ? "PASS" : "FAIL"
};

const output = path.join(packageDir, "artifacts", "er2-evidence-validation-report.json");
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`${packageId}: ${report.result} (${report.counts.evidenceReferences} refs)`);
if (report.result !== "PASS") process.exitCode = 1;
