#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { relativePath, sha256, sha256File, stableJson, writeStableJson } from "./index-utils.mjs";
import { assertEvidenceDomain } from "./evidence-domain.mjs";

const usage = "Usage: npm run knowledge:promote -- --input <sanitized-approved.json> --source <source-id> --package <canonical-id>";
const supportedTypes = new Map([
  ["repository", "repository"],
  ["web_reference", "web"],
  ["image_reference", "image"],
  ["theme_reference", "theme"],
]);

const option = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
};
const normalizedChecksum = (value, label) => {
  const checksum = String(value ?? "").replace(/^sha256:/, "");
  if (!/^[a-f0-9]{64}$/i.test(checksum)) throw new Error(`${label} must be a SHA-256 checksum.`);
  return checksum.toLowerCase();
};
const canonicalId = (value) => {
  if (!/^[a-z0-9-]+$/.test(value ?? "")) throw new Error("--package must use lowercase letters, digits, and hyphens.");
  return value;
};

export const promoteReference = ({ appRoot = process.cwd(), inputPath, sourceId, packageId } = {}) => {
  if (!inputPath || !sourceId || !packageId) throw new Error(usage);
  const absoluteInput = path.resolve(appRoot, inputPath);
  const raw = JSON.parse(fs.readFileSync(absoluteInput, "utf8"));
  if (raw.schemaVersion !== "sanitized-visual-input/v1" || raw.sanitization?.status !== "passed") {
    throw new Error("Promotion only accepts a sanitized-visual-input/v1 artifact with sanitization.status=passed.");
  }
  const approval = raw.approval;
  if (approval?.status !== "approved" || !approval.approvedBy || !approval.approvedAt) {
    throw new Error("Promotion requires explicit root approval with status, approvedBy, and approvedAt.");
  }
  const source = raw.sources?.find((candidate) => candidate.sourceId === sourceId);
  if (!source) throw new Error(`Source ${sourceId} was not found in the sanitized artifact.`);
  const domain = assertEvidenceDomain(source.domain, `Source ${sourceId} domain`);
  const sourceType = supportedTypes.get(source.sourceType);
  if (!sourceType) throw new Error(`Source ${sourceId} is not a repository, web, image, or theme collector artifact.`);
  const rights = source.rights ?? raw.rights;
  if (rights?.status !== "approved" || !rights.policy || !rights.evidence) {
    throw new Error("Promotion requires approved rights with policy and evidence.");
  }
  if (!source.collectorVersion) throw new Error("Promotion requires source.collectorVersion.");
  const snapshotChecksum = normalizedChecksum(source.checksum, "source.checksum");
  if (!source.sourceRevision) throw new Error("Promotion requires immutable source.sourceRevision.");
  if (!Array.isArray(source.records) || source.records.length === 0) throw new Error("Promotion requires at least one reviewed source record.");
  for (const [index, record] of source.records.entries()) {
    if (!record.provenance?.sourceChecksum || !record.provenance?.collectorVersion) {
      throw new Error(`Record ${index} is missing provenance checksum or collector version.`);
    }
    normalizedChecksum(record.provenance.sourceChecksum, `records[${index}].provenance.sourceChecksum`);
    if (record.provenance.collectorVersion !== source.collectorVersion) {
      throw new Error(`Record ${index} collector version does not match source.collectorVersion.`);
    }
    if (typeof record.text !== "string" || record.text.trim() === "") throw new Error(`Record ${index} has no reviewable text.`);
  }

  const packageRoot = path.join(appRoot, "design", "knowledge", "reference-library", sourceType, canonicalId(packageId));
  if (fs.existsSync(packageRoot)) throw new Error(`Canonical package already exists and is immutable: ${relativePath(appRoot, packageRoot)}`);
  const approvalArtifactPath = path.join(
    appRoot,
    "design",
    "knowledge",
    "reference-approvals",
    sourceType,
    `${packageId}.sanitized-approved.json`,
  );
  if (fs.existsSync(approvalArtifactPath)) {
    throw new Error(`Approval artifact already exists and is immutable: ${relativePath(appRoot, approvalArtifactPath)}`);
  }
  const sourceRef = source.metadata?.url ?? source.records[0].provenance.sourceRef;
  const canonicalSourceId = `source:reference:${packageId}`;
  const canonicalApproval = {
    ...approval,
    approvedAt: String(approval.approvedAt).slice(0, 10),
  };
  const approvalArtifact = {
    ...raw,
    approval: canonicalApproval,
    sources: [{
      ...source,
      sourceId: canonicalSourceId,
      rights,
      metadata: { ...source.metadata, url: sourceRef },
    }],
  };
  const sourceDefinition = {
    schemaVersion: "lucida-reference-source/v1",
    sourceId: canonicalSourceId,
    sourceType,
    domain,
    sourceRef,
    sourceRevision: source.sourceRevision,
    snapshotChecksum,
    collectorVersion: source.collectorVersion,
    rights,
    approval: canonicalApproval,
    provenance: {
      sanitizedArtifactChecksum: null,
      collectorArtifact: relativePath(appRoot, approvalArtifactPath),
    },
  };
  fs.mkdirSync(path.dirname(approvalArtifactPath), { recursive: true });
  writeStableJson(approvalArtifactPath, approvalArtifact);
  sourceDefinition.provenance.sanitizedArtifactChecksum = sha256File(approvalArtifactPath);
  fs.mkdirSync(path.join(packageRoot, "documents"), { recursive: true });
  writeStableJson(path.join(packageRoot, "source.json"), sourceDefinition);
  for (const [index, record] of source.records.entries()) {
    const rawText = record.text.normalize("NFC");
    const document = {
      schemaVersion: "lucida-reference-document/v1",
      sourceRef: record.provenance.sourceRef,
      title: `${sourceId} record ${String(index + 1).padStart(4, "0")}`,
      mediaType: sourceType,
      domain,
      rawText,
      contentChecksum: sha256(rawText),
      tags: [...new Set([sourceType, ...(record.data?.tags ?? [])])].sort((left, right) => left.localeCompare(right, "en")),
      observations: [{
        kind: record.kind ?? "reference",
        reviewStatus: "approved",
        definition: record.data && typeof record.data === "object" ? record.data : { sourceId },
      }],
    };
    writeStableJson(path.join(packageRoot, "documents", `${String(index + 1).padStart(4, "0")}.json`), document);
  }
  return { packagePath: relativePath(appRoot, packageRoot), sourceId: sourceDefinition.sourceId, documents: source.records.length };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = promoteReference({ inputPath: option("--input"), sourceId: option("--source"), packageId: option("--package") });
    console.log(`Promoted approved reference package: ${result.packagePath} (${result.documents} document(s)).`);
  } catch (error) {
    console.error(`Reference promotion failed: ${error.message}`);
    process.exitCode = 1;
  }
}
