#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertEvidenceDomain } from "./evidence-domain.mjs";
import { sha256, stableJson } from "./index-utils.mjs";

const VISUAL_DOMAIN = "visual-style";
const KNOWN_VISUAL_TARGETS = new Set([
  "design/knowledge/reference-library/image/technical-editorial-frame/source.json",
  "design/knowledge/reference-library/image/technical-editorial-frame/documents/frame-note.json",
  "design/knowledge/reference-library/repository/fixture-terminal-repo/source.json",
  "design/knowledge/reference-library/repository/fixture-terminal-repo/documents/overview.json",
  "design/knowledge/reference-library/theme/local-reference-theme/source.json",
  "design/knowledge/reference-library/theme/local-reference-theme/documents/tokens-note.json",
  "design/knowledge/reference-library/web/terminalcss-catalog-link/source.json",
  "design/knowledge/reference-library/web/terminalcss-catalog-link/documents/review-note.json",
  ...[
    "cinematic-type", "dashboard-data", "editorial-collage", "minimal-education",
    "paper-notebook", "product-showcase", "technical-editorial",
    "terminal-command-center", "timeline-documentary",
  ].map((id) => `design/visual-library/styles/${id}/artifact-manifest.json`),
]);

const toPosix = (appRoot, filePath) => path.relative(appRoot, filePath).replaceAll("\\", "/");
const filesRecursively = (root, name) => !fs.existsSync(root) ? [] : fs.readdirSync(root, { withFileTypes: true })
  .flatMap((entry) => {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) return filesRecursively(filePath, name);
    return entry.isFile() && (name.startsWith(".") ? entry.name.endsWith(name) : entry.name === name) ? [filePath] : [];
  })
  .sort((left, right) => left.localeCompare(right, "en"));

const planRecord = ({ appRoot, filePath }) => {
  const relativePath = toPosix(appRoot, filePath);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const knownVisual = KNOWN_VISUAL_TARGETS.has(relativePath);
  if (value.domain === undefined) {
    if (!knownVisual) {
      throw new Error(`Unknown corpus file is missing an explicit evidence domain: ${relativePath}`);
    }
    return { filePath, relativePath, original: fs.readFileSync(filePath), value: { ...value, domain: VISUAL_DOMAIN }, changed: true };
  }
  assertEvidenceDomain(value.domain, `${relativePath} domain`);
  if (knownVisual && value.domain !== VISUAL_DOMAIN) {
    throw new Error(`Known visual corpus file has non-visual-style domain: ${relativePath}`);
  }
  return { filePath, relativePath, original: fs.readFileSync(filePath), value, changed: false };
};

const commitWriteSet = (writeSet) => {
  const token = `${process.pid}-${crypto.randomUUID()}`;
  const staged = [];
  const committed = [];
  try {
    for (const entry of writeSet) {
      fs.mkdirSync(path.dirname(entry.filePath), { recursive: true });
      const temporaryPath = `${entry.filePath}.domain-migration-stage-${token}`;
      fs.writeFileSync(temporaryPath, entry.bytes, { flag: "wx" });
      staged.push({ ...entry, temporaryPath, backupPath: `${entry.filePath}.domain-migration-backup-${token}` });
    }
    for (const entry of staged) {
      const hadOriginal = fs.existsSync(entry.filePath);
      if (hadOriginal) fs.renameSync(entry.filePath, entry.backupPath);
      try {
        fs.renameSync(entry.temporaryPath, entry.filePath);
      } catch (error) {
        if (hadOriginal && fs.existsSync(entry.backupPath)) fs.renameSync(entry.backupPath, entry.filePath);
        throw error;
      }
      committed.push({ ...entry, hadOriginal });
    }
    for (const entry of committed) fs.rmSync(entry.backupPath, { force: true });
  } catch (error) {
    for (const entry of [...committed].reverse()) {
      fs.rmSync(entry.filePath, { force: true });
      if (entry.hadOriginal && fs.existsSync(entry.backupPath)) fs.renameSync(entry.backupPath, entry.filePath);
    }
    throw error;
  } finally {
    for (const entry of staged) {
      fs.rmSync(entry.temporaryPath, { force: true });
      fs.rmSync(entry.backupPath, { force: true });
    }
  }
};

export const migrateEvidenceDomains = ({ appRoot = process.cwd(), check = false, reportPath } = {}) => {
  const referenceRoot = path.join(appRoot, "design", "knowledge", "reference-library");
  const stylesRoot = path.join(appRoot, "design", "visual-library", "styles");
  const sourceFiles = filesRecursively(referenceRoot, "source.json");
  const documentFiles = filesRecursively(referenceRoot, ".json")
    .filter((filePath) => path.basename(path.dirname(filePath)) === "documents");
  const manifestFiles = filesRecursively(stylesRoot, "artifact-manifest.json");

  // Build and validate the complete plan before touching any corpus byte.
  const planned = [...sourceFiles, ...documentFiles, ...manifestFiles].map((filePath) => planRecord({ appRoot, filePath }));
  const changes = planned.filter((entry) => entry.changed);
  const records = planned.map((entry) => entry.value);
  const report = {
    schemaVersion: "lucida-evidence-domain-migration/v1",
    domain: VISUAL_DOMAIN,
    check,
    changed: changes.map((entry) => entry.relativePath),
    counts: { sources: sourceFiles.length, documents: documentFiles.length, stylePackages: manifestFiles.length },
    corpusHash: sha256(stableJson(records.map((record) => ({
      id: record.sourceId ?? record.packageId ?? record.sourceRef,
      domain: record.domain,
    })).sort((left, right) => String(left.id).localeCompare(String(right.id), "en")))),
  };
  const resolvedReportPath = reportPath ?? path.join(appRoot, "design", "knowledge", "reports", "evidence-domain-migration.json");
  if (!check) {
    commitWriteSet([
      ...changes.map((entry) => ({ filePath: entry.filePath, bytes: stableJson(entry.value) })),
      { filePath: resolvedReportPath, bytes: stableJson(report) },
    ]);
  }
  return { reportPath: resolvedReportPath, report };
};

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  try {
    const check = process.argv.includes("--check");
    const result = migrateEvidenceDomains({ check });
    console.log(`Evidence-domain migration ${check ? "check" : "completed"}: ${result.report.changed.length} change(s), ${result.reportPath}`);
  } catch (error) {
    console.error(`Evidence-domain migration failed: ${error.message}`);
    process.exitCode = 1;
  }
}
