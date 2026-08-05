import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assertEvidenceDomain, domainCounts } from "./evidence-domain.mjs";

export const TEMPLATE_INDEX_SCHEMA = "lucida-template-index/v1";
export const ADAPTER_INDEX_SCHEMA = "lucida-adapter-index/v1";
export const DIRECTOR_INDEX_SCHEMA = "lucida-director-index/v1";
export const COMPATIBILITY_INDEX_SCHEMA = "lucida-compatibility-index/v1";
export const MANIFEST_SCHEMA = "lucida-knowledge-manifest/v1";

export const toPosix = (value) => value.split(path.sep).join("/");
export const relativePath = (appRoot, filePath) => toPosix(path.relative(appRoot, filePath));
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
export const sha256File = (filePath) => sha256(fs.readFileSync(filePath));
export const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
export const normalizeSearchText = (value) => String(value ?? "").normalize("NFC").toLowerCase();
export const foldSearchText = (value) => normalizeSearchText(value)
  .normalize("NFD")
  .replace(/\p{M}/gu, "")
  .replace(/đ/g, "d")
  .replace(/[\p{P}\p{S}]+/gu, " ")
  .replace(/\s+/gu, " ")
  .trim();

const normalizeValue = (value) => {
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right, "en"))
        .map((key) => [key, normalizeValue(value[key])]),
    );
  }
  return value;
};

export const stableJson = (value) => `${JSON.stringify(normalizeValue(value), null, 2)}\n`;
export const writeStableJson = (filePath, value) => fs.writeFileSync(filePath, stableJson(value), "utf8");

const isInside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};

export const resolveProjectPath = (appRoot, reference, label) => {
  if (typeof reference !== "string" || reference.length === 0 || path.isAbsolute(reference)) {
    throw new Error(`${label}: invalid project path`);
  }
  const resolved = path.resolve(appRoot, reference);
  if (!isInside(appRoot, resolved) || !fs.existsSync(resolved)) {
    throw new Error(`${label}: missing project path: ${reference}`);
  }
  return resolved;
};

export const resolvePackagePath = (packageDir, reference, label) => {
  if (typeof reference !== "string" || reference.length === 0) {
    throw new Error(`${label}: invalid package path`);
  }
  const resolved = path.resolve(packageDir, reference);
  if (resolved !== packageDir && !isInside(packageDir, resolved)) {
    throw new Error(`${label}: package path escapes package directory: ${reference}`);
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`${label}: missing package path: ${reference}`);
  }
  return resolved;
};

export const canonicalSourceHashes = (appRoot, packageDir, template) => {
  const references = new Set([
    template.componentRef,
    template.content?.schemaRef,
    template.slots?.schemaRef,
    template.provenanceRef,
    ...Object.values(template.files ?? {}),
  ]);
  const sourceHashes = {};

  for (const reference of [...references].sort((left, right) => left.localeCompare(right, "en"))) {
    const sourcePath = resolvePackagePath(packageDir, reference, `template ${template.id}`);
    sourceHashes[relativePath(appRoot, sourcePath)] = sha256File(sourcePath);
  }

  return sourceHashes;
};

const ensureObject = (value, label, errors) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label} must be an object.`);
    return false;
  }
  return true;
};

const compareObjectHash = (label, value, expectedHash, errors) => {
  const actualHash = sha256(stableJson(value));
  if (actualHash !== expectedHash) {
    errors.push(`${label} hash mismatch.`);
  }
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const validateGeneratedIndex = ({ appRoot, knowledgeDir }) => {
  const errors = [];
  const requiredFiles = [
    "template-index.json",
    "adapter-index.json",
    "director-index.json",
    "compatibility-index.json",
    "reference-index.json",
    "manifest.json",
  ];
  const indexes = {};

  for (const file of requiredFiles) {
    const filePath = path.join(knowledgeDir, file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing generated index: .generated/knowledge/${file}`);
      continue;
    }
    try {
      indexes[file] = readJson(filePath);
    } catch (error) {
      errors.push(`Cannot parse generated index ${file}: ${error.message}`);
    }
  }

  const templates = indexes["template-index.json"];
  const adapters = indexes["adapter-index.json"];
  const director = indexes["director-index.json"];
  const compatibility = indexes["compatibility-index.json"];
  const references = indexes["reference-index.json"];
  const manifest = indexes["manifest.json"];

  if (ensureObject(templates, "template-index.json", errors)) {
    if (templates.schemaVersion !== TEMPLATE_INDEX_SCHEMA || !Array.isArray(templates.templates)) {
      errors.push("template-index.json has an invalid schema.");
    }
  }
  if (ensureObject(adapters, "adapter-index.json", errors)) {
    if (adapters.schemaVersion !== ADAPTER_INDEX_SCHEMA || !Array.isArray(adapters.adapters)) {
      errors.push("adapter-index.json has an invalid schema.");
    }
  }
  if (ensureObject(director, "director-index.json", errors)) {
    if (director.schemaVersion !== DIRECTOR_INDEX_SCHEMA || !Array.isArray(director.templates)) {
      errors.push("director-index.json has an invalid schema.");
    }
  }
  if (ensureObject(compatibility, "compatibility-index.json", errors)) {
    if (compatibility.schemaVersion !== COMPATIBILITY_INDEX_SCHEMA || !Array.isArray(compatibility.templates)) {
      errors.push("compatibility-index.json has an invalid schema.");
    }
  }
  if (ensureObject(references, "reference-index.json", errors)) {
    if (
      references.schemaVersion !== "lucida-reference-index/v1" ||
      references.chunkerVersion !== "structural-v1" ||
      !Array.isArray(references.sources) ||
      !Array.isArray(references.documents) ||
      !Array.isArray(references.chunks)
    ) {
      errors.push("reference-index.json has an invalid schema.");
    } else {
      const sourceIds = new Set();
      const documentIds = new Set();
      const chunkIds = new Set();
      for (const source of references.sources) {
        if (!ensureObject(source, "reference source entry", errors)) continue;
        if (typeof source.sourceId !== "string" || sourceIds.has(source.sourceId)) {
          errors.push(`Invalid or duplicate reference source id: ${String(source.sourceId)}.`);
        }
        sourceIds.add(source.sourceId);
        if (source.approval?.status !== "approved" || source.rights?.status !== "approved") {
          errors.push(`Reference source ${source.sourceId} is not approved with approved rights.`);
        }
        if (!/^[a-f0-9]{64}$/.test(source.snapshotChecksum ?? "") || !source.collectorVersion || !source.sourceRevision) {
          errors.push(`Reference source ${source.sourceId} is missing immutable snapshot metadata.`);
        }
        try {
          const packagePath = resolveProjectPath(appRoot, source.packagePath, `reference source ${source.sourceId}`);
          const canonicalSource = readJson(path.join(packagePath, "source.json"));
          if (canonicalSource.snapshotChecksum !== source.snapshotChecksum || canonicalSource.sourceId !== source.sourceId) {
            errors.push(`Reference source hash mismatch: ${source.sourceId}.`);
          }
        } catch (error) {
          errors.push(error.message);
        }
      }
      for (const document of references.documents) {
        if (!ensureObject(document, "reference document entry", errors)) continue;
        if (typeof document.documentId !== "string" || documentIds.has(document.documentId)) {
          errors.push(`Invalid or duplicate reference document id: ${String(document.documentId)}.`);
        }
        documentIds.add(document.documentId);
        if (!references.sources.some((source) => source.snapshotId === document.snapshotId)) {
          errors.push(`Reference document ${document.documentId} has an unknown snapshot.`);
        }
      }
      for (const chunk of references.chunks) {
        if (!ensureObject(chunk, "reference chunk entry", errors)) continue;
        if (typeof chunk.chunkId !== "string" || chunkIds.has(chunk.chunkId)) {
          errors.push(`Invalid or duplicate reference chunk id: ${String(chunk.chunkId)}.`);
        }
        chunkIds.add(chunk.chunkId);
        if (!documentIds.has(chunk.documentId)) errors.push(`Reference chunk ${chunk.chunkId} has an unknown document.`);
        if (chunk.rawText !== String(chunk.rawText ?? "").normalize("NFC") || sha256(chunk.rawText) !== chunk.contentHash) {
          errors.push(`Reference chunk ${chunk.chunkId} has invalid text or checksum.`);
        }
        if (chunk.searchText !== normalizeSearchText(chunk.rawText) || chunk.searchFolded !== foldSearchText(chunk.rawText)) {
          errors.push(`Reference chunk ${chunk.chunkId} has invalid search normalization.`);
        }
      }
      if (
        references.counts?.sources !== references.sources.length ||
        references.counts?.documents !== references.documents.length ||
        references.counts?.chunks !== references.chunks.length
      ) {
        errors.push("reference-index.json counts do not match entries.");
      }
      try {
        const expectedDomainCounts = {
          sources: domainCounts(references.sources, "reference source"),
          documents: domainCounts(references.documents, "reference document"),
          chunks: domainCounts(references.chunks, "reference chunk"),
        };
        if (stableJson(references.domainCounts) !== stableJson(expectedDomainCounts)) errors.push("reference-index.json domain counts do not match entries.");
        for (const document of references.documents) assertEvidenceDomain(document.domain, `Reference document ${document.documentId} domain`);
        for (const chunk of references.chunks) assertEvidenceDomain(chunk.domain, `Reference chunk ${chunk.chunkId} domain`);
      } catch (error) { errors.push(error.message); }
    }
  }

  if (ensureObject(manifest, "manifest.json", errors)) {
    if (manifest.schemaVersion !== MANIFEST_SCHEMA || !ensureObject(manifest.artifactHashes, "manifest.artifactHashes", errors)) {
      errors.push("manifest.json has an invalid schema.");
    } else {
      const { manifestHash, ...manifestWithoutHash } = manifest;
      compareObjectHash("manifest", manifestWithoutHash, manifestHash, errors);
      for (const file of requiredFiles.filter((name) => name !== "manifest.json")) {
        const expectedHash = manifest.artifactHashes[file];
        if (typeof expectedHash !== "string") {
          errors.push(`manifest.json is missing hash for ${file}.`);
          continue;
        }
        const filePath = path.join(knowledgeDir, file);
        if (fs.existsSync(filePath) && sha256File(filePath) !== expectedHash) {
          errors.push(`Manifest hash mismatch for ${file}.`);
        }
      }
    }
  }

  const adapterIds = new Set();
  for (const adapter of adapters?.adapters ?? []) {
    if (!ensureObject(adapter, "adapter entry", errors)) {
      continue;
    }
    if (typeof adapter.id !== "string" || adapterIds.has(adapter.id)) {
      errors.push(`Invalid or duplicate adapter id: ${String(adapter.id)}.`);
    }
    adapterIds.add(adapter.id);
    if (typeof adapter.path !== "string" || typeof adapter.sourceHash !== "string") {
      errors.push(`Adapter ${adapter.id} is missing path or sourceHash.`);
      continue;
    }
    try {
      const adapterPath = resolveProjectPath(appRoot, adapter.path, `adapter ${adapter.id}`);
      if (sha256File(adapterPath) !== adapter.sourceHash) {
        errors.push(`Adapter source hash mismatch: ${adapter.id}.`);
      }
      if (!new RegExp(`export\\s+(?:const|function|class)\\s+${adapter.export}`).test(fs.readFileSync(adapterPath, "utf8"))) {
        errors.push(`Adapter export is missing: ${adapter.id}.${adapter.export}.`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  const runtimeRegistryPath = path.join(appRoot, "src", "templateRegistry.tsx");
  if (!fs.existsSync(runtimeRegistryPath)) {
    errors.push("Missing runtime template registry: src/templateRegistry.tsx.");
  } else {
    const runtimeSource = fs.readFileSync(runtimeRegistryPath, "utf8");
    const adapterBlock = runtimeSource.match(
      /const adapterComponents = \{([\s\S]*?)\}\s+satisfies Record<string, TemplateAdapter>/,
    )?.[1];
    if (!adapterBlock) {
      errors.push("Runtime template registry has no adapterComponents registry.");
    } else {
      for (const adapter of adapters?.adapters ?? []) {
        if (!new RegExp(`\\b${escapeRegExp(adapter.id)}\\b`).test(adapterBlock)) {
          errors.push(`Generated adapter is unsupported by runtime registry: ${adapter.id}.`);
        }
      }
    }
  }

  const templateIds = new Set();
  for (const template of templates?.templates ?? []) {
    if (!ensureObject(template, "template entry", errors)) {
      continue;
    }
    if (typeof template.id !== "string" || templateIds.has(template.id)) {
      errors.push(`Invalid or duplicate template id: ${String(template.id)}.`);
    }
    templateIds.add(template.id);
    if (!adapterIds.has(template.adapterId)) {
      errors.push(`Template ${template.id} references unknown adapter: ${template.adapterId}.`);
    }
    if (!template.capabilities || !template.paths || !template.sourceHashes || typeof template.contentHash !== "string") {
      errors.push(`Template ${template.id} is missing generated capabilities, paths, source hashes, or content hash.`);
      continue;
    }
    const { contentHash, ...templateWithoutHash } = template;
    compareObjectHash(`Template ${template.id} content`, templateWithoutHash, contentHash, errors);
    for (const [sourcePath, expectedHash] of Object.entries(template.sourceHashes)) {
      try {
        const source = resolveProjectPath(appRoot, sourcePath, `template ${template.id} source`);
        if (sha256File(source) !== expectedHash) {
          errors.push(`Template source hash mismatch: ${template.id}:${sourcePath}.`);
        }
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  const canonicalGlitch = (templates?.templates ?? []).find((template) => template.id === "glitch-text");
  if (!canonicalGlitch) {
    errors.push("Generated template index is missing canonical glitch-text.");
  } else {
    if (canonicalGlitch.adapterId !== "GlitchTextAdapter") {
      errors.push("Canonical glitch-text must use GlitchTextAdapter.");
    }
    if (canonicalGlitch.familyId !== "cinematic-type" || canonicalGlitch.status !== "experimental") {
      errors.push("Canonical glitch-text family/status invariant failed.");
    }
    if (!canonicalGlitch.capabilities?.presets?.includes("rgb-tear-medium")) {
      errors.push("Canonical glitch-text preset invariant failed.");
    }
  }

  const manualMapPath = path.join(appRoot, "src", "template-registry-map.json");
  try {
    const manualMap = readJson(manualMapPath);
    if (Object.prototype.hasOwnProperty.call(manualMap, "glitch-text")) {
      errors.push("glitch-text must not be present in src/template-registry-map.json.");
    }
    for (const id of Object.keys(manualMap)) {
      if (templateIds.has(id)) {
        errors.push(`Manual template map duplicates canonical template: ${id}.`);
      }
    }
  } catch (error) {
    errors.push(`Cannot validate src/template-registry-map.json: ${error.message}`);
  }

  const counts = manifest?.counts;
  if (
    counts?.templates !== templateIds.size ||
    counts?.adapters !== adapterIds.size ||
    counts?.referenceSources !== (references?.sources?.length ?? 0) ||
    counts?.referenceDocuments !== (references?.documents?.length ?? 0) ||
    counts?.referenceChunks !== (references?.chunks?.length ?? 0)
  ) {
    errors.push("Manifest entry counts do not match generated indexes.");
  }
  try {
    const expectedTemplateDomains = domainCounts(templates?.templates ?? [], "template");
    const expectedReferenceDomains = {
      referenceSources: domainCounts(references?.sources ?? [], "reference source"),
      referenceDocuments: domainCounts(references?.documents ?? [], "reference document"),
      referenceChunks: domainCounts(references?.chunks ?? [], "reference chunk"),
    };
    if (stableJson(manifest?.domainCounts?.templates) !== stableJson(expectedTemplateDomains)) errors.push("Manifest template domain counts do not match entries.");
    for (const [name, expected] of Object.entries(expectedReferenceDomains)) {
      if (stableJson(manifest?.domainCounts?.[name]) !== stableJson(expected)) {
        errors.push(`Manifest ${name} domain counts do not match entries.`);
      }
    }
    const expectedDomainHashes = {
      templates: sha256(stableJson((templates?.templates ?? []).map(({ id, domain }) => ({ id, domain })))),
      referenceSources: sha256(stableJson((references?.sources ?? []).map(({ sourceId, domain }) => ({ id: sourceId, domain })))),
      referenceDocuments: sha256(stableJson((references?.documents ?? []).map(({ documentId, domain }) => ({ id: documentId, domain })))),
      referenceChunks: sha256(stableJson((references?.chunks ?? []).map(({ chunkId, domain }) => ({ id: chunkId, domain })))),
    };
    if (stableJson(manifest?.domainHashes) !== stableJson(expectedDomainHashes)) {
      errors.push("Manifest domain hashes do not match generated indexes.");
    }
    for (const template of templates?.templates ?? []) assertEvidenceDomain(template.domain, `Template ${template.id} domain`);
  } catch (error) { errors.push(error.message); }

  return { errors, templates: templateIds.size, adapters: adapterIds.size, references: references?.sources?.length ?? 0 };
};

export const publishDirectoryAtomically = (stagingDir, outputDir) => {
  const backupDir = `${outputDir}.previous`;
  fs.rmSync(backupDir, { recursive: true, force: true });
  const hadOutput = fs.existsSync(outputDir);
  if (hadOutput) {
    fs.renameSync(outputDir, backupDir);
  }

  try {
    fs.renameSync(stagingDir, outputDir);
    fs.rmSync(backupDir, { recursive: true, force: true });
  } catch (error) {
    if (hadOutput && fs.existsSync(backupDir) && !fs.existsSync(outputDir)) {
      fs.renameSync(backupDir, outputDir);
    }
    throw error;
  }
};
