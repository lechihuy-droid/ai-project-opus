#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";
import {
  foldSearchText,
  normalizeSearchText,
  readJson,
  relativePath,
  sha256,
  sha256File,
  stableJson,
} from "./index-utils.mjs";

export const REFERENCE_INDEX_SCHEMA = "lucida-reference-index/v1";
export const CHUNKER_VERSION = "structural-v1";

const MAX_CHUNK_GRAPHEMES = 1600;
const TARGET_CHUNK_GRAPHEMES = 1200;
const APPROVAL_ARTIFACT_ROOT = ["design", "knowledge", "reference-approvals"];
const COLLECTOR_SOURCE_TYPES = new Map([
  ["repository", "repository"],
  ["web", "web_reference"],
  ["image", "image_reference"],
  ["theme", "theme_reference"],
]);
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

const graphemes = (value) => [...segmenter.segment(value)].map((part) => part.segment);
const graphemeLength = (value) => graphemes(value).length;
const validationErrors = (label, validate) => (validate.errors ?? [])
  .map((error) => `${label}${error.instancePath || "/"} ${error.message}`)
  .join("; ");

const sameJson = (left, right) => stableJson(left) === stableJson(right);
const normalizedChecksum = (value) => String(value ?? "").replace(/^sha256:/, "").toLowerCase();
const isChecksum = (value) => /^[a-f0-9]{64}$/.test(normalizedChecksum(value));
const isInside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};

const approvalArtifactPath = (appRoot, packageDir, source) => path.join(
  appRoot,
  ...APPROVAL_ARTIFACT_ROOT,
  source.sourceType,
  `${path.basename(packageDir)}.sanitized-approved.json`,
);

const validateApprovalArtifact = ({ appRoot, packageDir, label, source, errors }) => {
  const expectedPath = approvalArtifactPath(appRoot, packageDir, source);
  const expectedReference = relativePath(appRoot, expectedPath);
  const collectorArtifact = source.provenance?.collectorArtifact;
  if (collectorArtifact !== expectedReference) {
    errors.push(`${label}/source.json: collectorArtifact must be ${expectedReference}.`);
    return null;
  }
  if (!isInside(appRoot, expectedPath) || !fs.existsSync(expectedPath) || !fs.statSync(expectedPath).isFile()) {
    errors.push(`${label}/source.json: collectorArtifact is not an existing file inside the app root.`);
    return null;
  }

  const realAppRoot = fs.realpathSync.native(appRoot);
  const realApprovalRoot = fs.realpathSync.native(path.join(appRoot, ...APPROVAL_ARTIFACT_ROOT));
  const realArtifactPath = fs.realpathSync.native(expectedPath);
  if (!isInside(realAppRoot, realArtifactPath) || !isInside(realApprovalRoot, realArtifactPath)) {
    errors.push(`${label}/source.json: collectorArtifact escapes the project-owned approval directory.`);
    return null;
  }
  if (source.provenance?.sanitizedArtifactChecksum !== sha256File(realArtifactPath)) {
    errors.push(`${label}/source.json: sanitizedArtifactChecksum does not match collectorArtifact.`);
  }

  let artifact;
  try {
    artifact = readJson(realArtifactPath);
  } catch (error) {
    errors.push(`${label}/source.json: collectorArtifact is not valid JSON: ${error.message}`);
    return null;
  }
  if (artifact.schemaVersion !== "sanitized-visual-input/v1") {
    errors.push(`${label}/source.json: collectorArtifact must use sanitized-visual-input/v1.`);
  }
  if (artifact.sanitization?.status !== "passed") {
    errors.push(`${label}/source.json: collectorArtifact sanitization must have passed.`);
  }
  if (artifact.approval?.status !== "approved") {
    errors.push(`${label}/source.json: collectorArtifact approval must be approved.`);
  }
  if (!sameJson(artifact.approval, source.approval)) {
    errors.push(`${label}/source.json: collectorArtifact approval does not match canonical approval.`);
  }
  if (!Array.isArray(artifact.sources) || artifact.sources.length !== 1) {
    errors.push(`${label}/source.json: collectorArtifact must contain exactly one source.`);
    return null;
  }

  const artifactSource = artifact.sources[0];
  if (artifactSource.sourceId !== source.sourceId) {
    errors.push(`${label}/source.json: collectorArtifact sourceId does not match canonical sourceId.`);
  }
  if (artifactSource.sourceType !== COLLECTOR_SOURCE_TYPES.get(source.sourceType)) {
    errors.push(`${label}/source.json: collectorArtifact sourceType does not match canonical sourceType.`);
  }
  if (artifactSource.collectorVersion !== source.collectorVersion) {
    errors.push(`${label}/source.json: collectorArtifact collectorVersion does not match canonical source.`);
  }
  if (artifactSource.sourceRevision !== source.sourceRevision) {
    errors.push(`${label}/source.json: collectorArtifact sourceRevision does not match canonical source.`);
  }
  if (!isChecksum(artifactSource.checksum) || normalizedChecksum(artifactSource.checksum) !== source.snapshotChecksum) {
    errors.push(`${label}/source.json: collectorArtifact checksum does not match canonical snapshotChecksum.`);
  }
  if (!sameJson(artifactSource.rights, source.rights)) {
    errors.push(`${label}/source.json: collectorArtifact rights do not match canonical rights.`);
  }
  if (artifactSource.metadata?.url !== source.sourceRef) {
    errors.push(`${label}/source.json: collectorArtifact sourceRef does not match canonical sourceRef.`);
  }
  if (!Array.isArray(artifactSource.records) || artifactSource.records.length === 0) {
    errors.push(`${label}/source.json: collectorArtifact has no source records.`);
    return null;
  }
  return artifactSource;
};

const validateDocumentProvenance = ({ artifactSource, document, documentLabel, source, errors }) => {
  if (!artifactSource) return;
  const record = artifactSource.records.find((candidate) => candidate?.provenance?.sourceRef === document.sourceRef);
  if (!record) {
    errors.push(`${documentLabel}: collectorArtifact has no matching source record.`);
    return;
  }
  if (record.text !== document.rawText) {
    errors.push(`${documentLabel}: collectorArtifact record text does not match canonical document.`);
  }
  if (record.provenance?.collectorVersion !== source.collectorVersion) {
    errors.push(`${documentLabel}: collectorArtifact record collectorVersion does not match canonical source.`);
  }
  if (
    !isChecksum(record.provenance?.sourceChecksum)
    || normalizedChecksum(record.provenance.sourceChecksum) !== source.snapshotChecksum
  ) {
    errors.push(`${documentLabel}: collectorArtifact record checksum does not match canonical snapshotChecksum.`);
  }
  if (!document.observations.some((observation) => observation.kind === record.kind && observation.reviewStatus === "approved")) {
    errors.push(`${documentLabel}: collectorArtifact record kind is not approved by the canonical document.`);
  }
};

const splitAtHardCap = (value) => {
  const units = graphemes(value);
  const chunks = [];
  let offset = 0;
  while (offset < units.length) {
    const remaining = units.length - offset;
    if (remaining <= MAX_CHUNK_GRAPHEMES) {
      chunks.push(units.slice(offset).join(""));
      break;
    }
    const limit = offset + MAX_CHUNK_GRAPHEMES;
    let boundary = -1;
    for (let index = limit; index > offset; index -= 1) {
      if (units[index - 1] === "\n") {
        boundary = index;
        break;
      }
    }
    if (boundary === -1) {
      for (let index = limit; index > offset; index -= 1) {
        if (/\s/u.test(units[index - 1])) {
          boundary = index;
          break;
        }
      }
    }
    chunks.push(units.slice(offset, boundary === -1 ? limit : boundary).join(""));
    offset = boundary === -1 ? limit : boundary;
  }
  return chunks.filter((chunk) => chunk.length > 0);
};

const structuralBlocks = (rawText) => {
  const lines = rawText.split("\n");
  const blocks = [];
  let heading = "";
  let paragraph = [];
  const flush = () => {
    const text = paragraph.join("\n").trim();
    if (text) blocks.push(heading ? `${heading}\n\n${text}` : text);
    paragraph = [];
  };
  for (const line of lines) {
    if (/^#{1,6}\s+/u.test(line)) {
      flush();
      heading = line.trim();
    } else if (line.trim() === "") {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks.length > 0 ? blocks : [rawText];
};

export const chunkStructuralV1 = (rawText) => {
  const blocks = structuralBlocks(rawText.normalize("NFC"));
  const chunks = [];
  let current = "";
  const flush = () => {
    if (current) chunks.push(...splitAtHardCap(current));
    current = "";
  };
  for (const block of blocks) {
    const safeBlocks = splitAtHardCap(block);
    for (const safeBlock of safeBlocks) {
      const separator = current ? "\n\n" : "";
      if (graphemeLength(`${current}${separator}${safeBlock}`) > TARGET_CHUNK_GRAPHEMES && current) {
        flush();
      }
      current = current ? `${current}\n\n${safeBlock}` : safeBlock;
      if (graphemeLength(current) >= TARGET_CHUNK_GRAPHEMES) flush();
    }
  }
  flush();
  return chunks;
};

const packageDirectories = (referenceRoot) => {
  if (!fs.existsSync(referenceRoot)) return [];
  return fs.readdirSync(referenceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((type) => fs.readdirSync(path.join(referenceRoot, type.name), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(referenceRoot, type.name, entry.name)))
    .sort((left, right) => left.localeCompare(right, "en"));
};

const documentFiles = (packageDir) => {
  const documentsDir = path.join(packageDir, "documents");
  if (!fs.existsSync(documentsDir)) return [];
  return fs.readdirSync(documentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(documentsDir, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
};

const sourceSnapshotId = (source) => `snapshot:${source.sourceId}:${source.snapshotChecksum.slice(0, 16)}`;
const documentId = (snapshotChecksum, sourceRef) =>
  `doc:${snapshotChecksum.slice(0, 16)}:${sha256(sourceRef).slice(0, 16)}`;
const chunkId = (document, ordinal, contentHash) =>
  `chunk:${sha256(document.documentId).slice(0, 16)}:${String(ordinal).padStart(4, "0")}:${contentHash.slice(0, 12)}`;

export const compileReferences = ({ appRoot = process.cwd() } = {}) => {
  const schemasDir = path.join(appRoot, "design", "schemas");
  const referenceRoot = path.join(appRoot, "design", "knowledge", "reference-library");
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validateSource = ajv.compile(readJson(path.join(schemasDir, "reference-source.schema.json")));
  const validateDocument = ajv.compile(readJson(path.join(schemasDir, "reference-document.schema.json")));
  const errors = [];
  const sources = [];
  const documents = [];
  const chunks = [];
  const sourceIds = new Set();
  const documentIds = new Set();
  const chunkIds = new Set();

  for (const packageDir of packageDirectories(referenceRoot)) {
    const sourcePath = path.join(packageDir, "source.json");
    const label = relativePath(appRoot, packageDir);
    if (!fs.existsSync(sourcePath)) {
      errors.push(`${label}: missing source.json`);
      continue;
    }
    let source;
    try {
      source = readJson(sourcePath);
    } catch (error) {
      errors.push(`${label}: invalid source.json: ${error.message}`);
      continue;
    }
    if (!validateSource(source)) errors.push(validationErrors(`${label}/source.json`, validateSource));
    if (source.sourceType !== path.basename(path.dirname(packageDir))) {
      errors.push(`${label}: sourceType must match its library directory`);
    }
    if (sourceIds.has(source.sourceId)) errors.push(`${label}: duplicate sourceId ${source.sourceId}`);
    sourceIds.add(source.sourceId);

    const artifactSource = validateApprovalArtifact({ appRoot, packageDir, label, source, errors });

    const snapshotId = sourceSnapshotId(source);
    const packageDocuments = [];
    for (const filePath of documentFiles(packageDir)) {
      let document;
      const documentLabel = relativePath(appRoot, filePath);
      try {
        document = readJson(filePath);
      } catch (error) {
        errors.push(`${documentLabel}: invalid JSON: ${error.message}`);
        continue;
      }
      if (!validateDocument(document)) errors.push(validationErrors(documentLabel, validateDocument));
      if (document.mediaType !== source.sourceType) errors.push(`${documentLabel}: mediaType must equal sourceType`);
      if (document.rawText !== document.rawText.normalize("NFC")) errors.push(`${documentLabel}: rawText must be NFC`);
      if (sha256(document.rawText.normalize("NFC")) !== document.contentChecksum) {
        errors.push(`${documentLabel}: contentChecksum does not match rawText`);
      }
      validateDocumentProvenance({ artifactSource, document, documentLabel, source, errors });
      const id = documentId(source.snapshotChecksum, document.sourceRef);
      if (documentIds.has(id)) errors.push(`${documentLabel}: duplicate stable document ID ${id}`);
      documentIds.add(id);
      const compiledDocument = {
        documentId: id,
        snapshotId,
        sourceRef: document.sourceRef,
        mediaType: document.mediaType,
        title: document.title.normalize("NFC"),
        tags: [...document.tags].sort((left, right) => left.localeCompare(right, "en")),
        contentHash: document.contentChecksum,
        packagePath: relativePath(appRoot, filePath),
        observations: document.observations,
      };
      packageDocuments.push(compiledDocument);
      for (const [ordinal, rawText] of chunkStructuralV1(document.rawText).entries()) {
        const normalizedRaw = rawText.normalize("NFC");
        const contentHash = sha256(normalizedRaw);
        const idForChunk = chunkId(compiledDocument, ordinal, contentHash);
        if (chunkIds.has(idForChunk)) errors.push(`${documentLabel}: duplicate stable chunk ID ${idForChunk}`);
        chunkIds.add(idForChunk);
        chunks.push({
          chunkId: idForChunk,
          documentId: compiledDocument.documentId,
          ordinal,
          rawText: normalizedRaw,
          searchText: normalizeSearchText(normalizedRaw),
          searchFolded: foldSearchText(normalizedRaw),
          contentHash,
          title: compiledDocument.title,
          tags: compiledDocument.tags,
          observations: ordinal === 0 ? compiledDocument.observations : [],
        });
      }
    }
    if (packageDocuments.length === 0) errors.push(`${label}: package has no reference documents`);
    const packageChecksum = sha256(stableJson({ source, documents: packageDocuments }));
    sources.push({
      ...source,
      snapshotId,
      packagePath: relativePath(appRoot, packageDir),
      packageChecksum,
    });
    documents.push(...packageDocuments);
  }

  if (errors.length > 0) throw new Error(`Reference library validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  sources.sort((left, right) => left.sourceId.localeCompare(right.sourceId, "en"));
  documents.sort((left, right) => left.documentId.localeCompare(right.documentId, "en"));
  chunks.sort((left, right) => left.chunkId.localeCompare(right.chunkId, "en"));
  return {
    schemaVersion: REFERENCE_INDEX_SCHEMA,
    chunkerVersion: CHUNKER_VERSION,
    sources,
    documents,
    chunks,
    counts: { sources: sources.length, documents: documents.length, chunks: chunks.length },
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const compiler = fileURLToPath(new URL("./compile.mjs", import.meta.url));
  const result = (await import("node:child_process")).spawnSync(process.execPath, [compiler], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  process.exitCode = result.status ?? 1;
}
