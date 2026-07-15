#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  ADAPTER_INDEX_SCHEMA,
  COMPATIBILITY_INDEX_SCHEMA,
  DIRECTOR_INDEX_SCHEMA,
  MANIFEST_SCHEMA,
  TEMPLATE_INDEX_SCHEMA,
  canonicalSourceHashes,
  publishDirectoryAtomically,
  readJson,
  relativePath,
  resolveProjectPath,
  sha256,
  sha256File,
  stableJson,
  writeStableJson,
} from "./index-utils.mjs";
import { compileReferences } from "./compile-references.mjs";

const appRoot = process.cwd();
const templatesDir = path.join(appRoot, "design", "template-library");
const generatedRoot = path.join(appRoot, ".generated");
const outputDir = path.join(generatedRoot, "knowledge");
const validatorPath = path.join(appRoot, "scripts", "knowledge", "validate.mjs");

const validation = spawnSync(process.execPath, [validatorPath], {
  cwd: appRoot,
  encoding: "utf8",
});
if (validation.status !== 0) {
  process.stderr.write(validation.stdout ?? "");
  process.stderr.write(validation.stderr ?? "");
  if (validation.error) process.stderr.write(`Knowledge validation could not run: ${validation.error.message}\n`);
  process.exit(validation.status ?? 1);
}

const referenceIndex = compileReferences({ appRoot });

const templateEntries = fs
  .readdirSync(templatesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const packageDir = path.join(templatesDir, entry.name);
    const template = readJson(path.join(packageDir, "template.json"));
    const component = readJson(path.join(packageDir, template.componentRef));
    const sourceHashes = canonicalSourceHashes(appRoot, packageDir, template);
    const adapterPath = resolveProjectPath(appRoot, template.adapter.path, `template ${template.id} adapter`);
    const familyPath = resolveProjectPath(appRoot, template.familyRef, `template ${template.id} family`);
    const entryWithoutHash = {
      id: template.id,
      logicalId: template.logicalId,
      version: template.version,
      status: template.status,
      label: template.label,
      description: template.description,
      familyId: template.familyId,
      adapterId: template.adapter.name,
      capabilities: template.capabilities,
      paths: {
        package: relativePath(appRoot, packageDir),
        template: relativePath(appRoot, path.join(packageDir, "template.json")),
        component: relativePath(appRoot, path.join(packageDir, template.componentRef)),
        contentSchema: relativePath(appRoot, path.join(packageDir, template.content.schemaRef)),
        slots: relativePath(appRoot, path.join(packageDir, template.slots.schemaRef)),
        provenance: relativePath(appRoot, path.join(packageDir, template.provenanceRef)),
        family: template.familyRef,
        adapter: template.adapter.path,
      },
      sourceHashes: {
        ...sourceHashes,
        [template.adapter.path]: sha256File(adapterPath),
        [template.familyRef]: sha256File(familyPath),
      },
      component: {
        id: component.id,
        logicalId: component.logicalId,
        version: component.version,
      },
    };
    return {
      ...entryWithoutHash,
      contentHash: sha256(stableJson(entryWithoutHash)),
    };
  })
  .sort((left, right) => left.id.localeCompare(right.id, "en"));

const adapterEntries = [...new Map(templateEntries.map((template) => [
  template.adapterId,
  {
    id: template.adapterId,
    path: template.paths.adapter,
    export: template.adapterId,
    sourceHash: template.sourceHashes[template.paths.adapter],
    templateIds: templateEntries
      .filter((candidate) => candidate.adapterId === template.adapterId)
      .map((candidate) => candidate.id)
      .sort((left, right) => left.localeCompare(right, "en")),
  },
])).values()].sort((left, right) => left.id.localeCompare(right.id, "en"));

const templateIndex = {
  schemaVersion: TEMPLATE_INDEX_SCHEMA,
  templates: templateEntries,
};
const adapterIndex = {
  schemaVersion: ADAPTER_INDEX_SCHEMA,
  adapters: adapterEntries,
};
const directorIndex = {
  schemaVersion: DIRECTOR_INDEX_SCHEMA,
  templates: templateEntries.map((template) => ({
    id: template.id,
    familyId: template.familyId,
    status: template.status,
    intents: [...template.capabilities.intents].sort((left, right) => left.localeCompare(right, "en")),
    presets: [...template.capabilities.presets].sort((left, right) => left.localeCompare(right, "en")),
  })),
};
const compatibilityIndex = {
  schemaVersion: COMPATIBILITY_INDEX_SCHEMA,
  templates: templateEntries.map((template) => ({
    id: template.id,
    familyId: template.familyId,
    aspectRatios: [...template.capabilities.aspectRatios].sort((left, right) => left.localeCompare(right, "en")),
    intents: [...template.capabilities.intents].sort((left, right) => left.localeCompare(right, "en")),
    renderable: template.capabilities.renderable,
  })),
};

fs.mkdirSync(generatedRoot, { recursive: true });
const stagingDir = fs.mkdtempSync(path.join(generatedRoot, `.knowledge-staging-${process.pid}-${os.tmpdir().length}-`));
try {
  const artifacts = {
    "template-index.json": templateIndex,
    "adapter-index.json": adapterIndex,
    "director-index.json": directorIndex,
    "compatibility-index.json": compatibilityIndex,
    "reference-index.json": referenceIndex,
  };
  for (const [file, value] of Object.entries(artifacts)) {
    writeStableJson(path.join(stagingDir, file), value);
  }
  const manifestWithoutHash = {
    schemaVersion: MANIFEST_SCHEMA,
    artifactHashes: Object.fromEntries(
      Object.keys(artifacts)
        .sort((left, right) => left.localeCompare(right, "en"))
        .map((file) => [file, sha256File(path.join(stagingDir, file))]),
    ),
    counts: {
      adapters: adapterEntries.length,
      referenceChunks: referenceIndex.chunks.length,
      referenceDocuments: referenceIndex.documents.length,
      referenceSources: referenceIndex.sources.length,
      templates: templateEntries.length,
    },
  };
  writeStableJson(path.join(stagingDir, "manifest.json"), {
    ...manifestWithoutHash,
    manifestHash: sha256(stableJson(manifestWithoutHash)),
  });
  publishDirectoryAtomically(stagingDir, outputDir);
} catch (error) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
  throw error;
}

console.log(`Knowledge compile passed: ${templateEntries.length} template(s), ${adapterEntries.length} adapter(s), ${referenceIndex.sources.length} approved reference source(s).`);
