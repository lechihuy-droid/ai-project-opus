#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertSupportedNodeVersion } from "../check-node-version.mjs";
import { readJson, sha256, stableJson, validateGeneratedIndex } from "./index-utils.mjs";
import { migrateDatabase } from "./migrate.mjs";
import {
  SQLITE_SCHEMA_VERSION,
  assertDatabaseIntegrity,
  databasePath,
  foldSearchText,
  knowledgeDirectory,
  openDatabase,
  projectionRowCounts,
  rebuildSearchFts,
  withTransaction,
} from "./sqlite-client.mjs";

const requireArray = (value, label) => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
};

const readProjectionInput = (appRoot) => {
  const directory = knowledgeDirectory(appRoot);
  const validation = validateGeneratedIndex({ appRoot, knowledgeDir: directory });
  if (validation.errors.length > 0) {
    throw new Error(`Generated knowledge index is invalid:\n${validation.errors.map((error) => `- ${error}`).join("\n")}`);
  }

  const manifest = readJson(path.join(directory, "manifest.json"));
  return {
    manifest,
    templates: requireArray(readJson(path.join(directory, "template-index.json")).templates, "template-index.templates"),
    adapters: requireArray(readJson(path.join(directory, "adapter-index.json")).adapters, "adapter-index.adapters"),
    references: readJson(path.join(directory, "reference-index.json")),
  };
};

const adapterEntity = (adapter) => ({
  entityId: `adapter:${adapter.id}@source-${adapter.sourceHash.slice(0, 12)}`,
  entityType: "adapter",
  logicalId: `adapter:${adapter.id}`,
  version: `source-${adapter.sourceHash.slice(0, 12)}`,
  packagePath: adapter.path,
  contentHash: adapter.sourceHash,
  definitionJson: stableJson(adapter),
});

const templateEntity = (template) => ({
  entityId: `${template.logicalId}@${template.version}`,
  entityType: "template",
  logicalId: template.logicalId,
  version: template.version,
  packagePath: template.paths.package,
  contentHash: template.contentHash,
  definitionJson: stableJson(template),
});

const insertReferenceProjection = (database, references) => {
  const insertSource = database.prepare(
    "INSERT INTO sources(source_id, source_type, rights_policy) VALUES (?, ?, ?)",
  );
  const insertSnapshot = database.prepare(
    "INSERT INTO source_snapshots(snapshot_id, source_id, revision, checksum, collector_version) VALUES (?, ?, ?, ?, ?)",
  );
  const insertDocument = database.prepare(
    "INSERT INTO documents(document_id, snapshot_id, source_ref, media_type) VALUES (?, ?, ?, ?)",
  );
  const insertChunk = database.prepare(
    `INSERT INTO chunks(chunk_id, document_id, ordinal, raw_text, search_text, search_folded, content_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertObservation = database.prepare(
    "INSERT INTO observations(observation_id, chunk_id, kind, review_status, definition_json) VALUES (?, ?, ?, ?, ?)",
  );
  const insertSearchDocument = database.prepare(
    `INSERT INTO search_documents(
      owner_type, owner_id, chunk_id, title, body, tags, provenance, search_text, search_folded
    ) VALUES ('chunk', ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const sourcesBySnapshot = new Map(references.sources.map((source) => [source.snapshotId, source]));
  const documentsById = new Map(references.documents.map((document) => [document.documentId, document]));

  for (const source of references.sources) {
    insertSource.run(source.sourceId, source.sourceType, source.rights.policy);
    insertSnapshot.run(
      source.snapshotId,
      source.sourceId,
      source.sourceRevision,
      source.snapshotChecksum,
      source.collectorVersion,
    );
  }
  for (const document of references.documents) {
    insertDocument.run(document.documentId, document.snapshotId, document.sourceRef, document.mediaType);
  }
  for (const chunk of references.chunks) {
    const document = documentsById.get(chunk.documentId);
    const source = sourcesBySnapshot.get(document.snapshotId);
    insertChunk.run(
      chunk.chunkId,
      chunk.documentId,
      chunk.ordinal,
      chunk.rawText,
      chunk.searchText,
      chunk.searchFolded,
      chunk.contentHash,
    );
    for (const [index, observation] of chunk.observations.entries()) {
      insertObservation.run(
        `observation:${chunk.chunkId}:${String(index).padStart(4, "0")}`,
        chunk.chunkId,
        observation.kind,
        observation.reviewStatus,
        stableJson(observation.definition),
      );
    }
    const tags = [...chunk.tags, source.sourceType].sort((left, right) => left.localeCompare(right, "en")).join(" ");
    const provenance = [source.sourceRef, document.sourceRef, source.packagePath, source.collectorVersion].join(" ");
    insertSearchDocument.run(
      chunk.chunkId,
      chunk.chunkId,
      chunk.title,
      chunk.rawText,
      tags,
      provenance,
      chunk.searchText,
      chunk.searchFolded,
    );
  }
};

const insertProjection = (database, input) => {
  const buildId = `build:${input.manifest.manifestHash}`;
  const insertBuild = database.prepare(
    "INSERT INTO projection_builds(build_id, schema_version, manifest_hash, status) VALUES (?, ?, ?, 'published')",
  );
  const insertEntity = database.prepare(
    `INSERT INTO canonical_entities(
      entity_id, entity_type, logical_id, version, package_path, content_hash, definition_json, build_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertCapability = database.prepare(
    "INSERT INTO entity_capabilities(entity_id, capability_type, capability_value) VALUES (?, ?, ?)",
  );
  const insertRelation = database.prepare(
    "INSERT INTO entity_relations(source_id, target_id, relation, score, rule_json) VALUES (?, ?, ?, ?, ?)",
  );
  const insertArtifact = database.prepare(
    `INSERT INTO validation_artifacts(entity_id, check_type, status, artifact_uri, content_hash)
     VALUES (?, 'generated-index', 'passed', ?, ?)`,
  );
  const insertSource = database.prepare(
    "INSERT INTO sources(source_id, source_type, rights_policy) VALUES (?, 'canonical-package', 'canonical-review-required')",
  );
  const insertSnapshot = database.prepare(
    "INSERT INTO source_snapshots(snapshot_id, source_id, revision, checksum, collector_version) VALUES (?, ?, ?, ?, 'compiler-v1')",
  );
  const insertProvenance = database.prepare(
    `INSERT INTO provenance_records(
      entity_id, source_id, snapshot_id, source_path, license_status, review_status
    ) VALUES (?, ?, ?, ?, 'recorded', 'validated')`,
  );
  const insertSearchDocument = database.prepare(
    `INSERT INTO search_documents(
      owner_type, owner_id, entity_id, title, body, tags, provenance, search_text, search_folded
    ) VALUES ('entity', ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  insertBuild.run(buildId, SQLITE_SCHEMA_VERSION, input.manifest.manifestHash);

  const adaptersById = new Map();
  for (const adapter of [...input.adapters].sort((left, right) => left.id.localeCompare(right.id, "en"))) {
    const entity = adapterEntity(adapter);
    adaptersById.set(adapter.id, entity);
    insertEntity.run(
      entity.entityId,
      entity.entityType,
      entity.logicalId,
      entity.version,
      entity.packagePath,
      entity.contentHash,
      entity.definitionJson,
      buildId,
    );
  }

  for (const template of [...input.templates].sort((left, right) => left.id.localeCompare(right.id, "en"))) {
    const entity = templateEntity(template);
    const adapter = adaptersById.get(template.adapterId);
    if (!adapter) {
      throw new Error(`Template ${template.id} references missing adapter ${template.adapterId}.`);
    }
    insertEntity.run(
      entity.entityId,
      entity.entityType,
      entity.logicalId,
      entity.version,
      entity.packagePath,
      entity.contentHash,
      entity.definitionJson,
      buildId,
    );

    const capabilities = [
      ...template.capabilities.intents.map((value) => ["intent", value]),
      ...template.capabilities.presets.map((value) => ["preset", value]),
      ...template.capabilities.aspectRatios.map((value) => ["aspect_ratio", value]),
      ["renderable", String(template.capabilities.renderable)],
      ["family", template.familyId],
      ["status", template.status],
    ].sort(([leftType, leftValue], [rightType, rightValue]) => {
      const typeOrder = leftType.localeCompare(rightType, "en");
      return typeOrder === 0 ? leftValue.localeCompare(rightValue, "en") : typeOrder;
    });
    for (const [capabilityType, capabilityValue] of capabilities) {
      insertCapability.run(entity.entityId, capabilityType, capabilityValue);
    }
    insertRelation.run(
      entity.entityId,
      adapter.entityId,
      "adapter",
      null,
      stableJson({ source: "adapter-index", adapterId: template.adapterId }),
    );
    insertArtifact.run(entity.entityId, template.paths.template, entity.contentHash);

    const sourceId = `source:template:${template.id}`;
    const snapshotId = `snapshot:${sourceId}:${entity.contentHash.slice(0, 16)}`;
    insertSource.run(sourceId);
    insertSnapshot.run(snapshotId, sourceId, template.version, entity.contentHash);
    insertProvenance.run(entity.entityId, sourceId, snapshotId, template.paths.provenance);

    const title = template.label;
    const body = `${template.description} Template ${template.id} belongs to ${template.familyId}.`;
    const tags = [
      "template",
      template.id,
      template.familyId,
      template.status,
      ...template.capabilities.intents,
      ...template.capabilities.presets,
      ...template.capabilities.aspectRatios,
      String(template.capabilities.renderable),
    ].join(" ");
    const provenance = `${template.paths.package} ${template.paths.provenance}`;
    const searchText = [title, body, tags, provenance].join(" ").normalize("NFC").toLowerCase();
    insertSearchDocument.run(
      entity.entityId,
      entity.entityId,
      title,
      body,
      tags,
      provenance,
      searchText,
      foldSearchText(searchText),
    );
  }
};

const publishDatabase = (temporaryPath, finalPath) => {
  const backupPath = `${finalPath}.previous`;
  fs.rmSync(backupPath, { force: true });
  const hadFinal = fs.existsSync(finalPath);
  if (hadFinal) {
    fs.renameSync(finalPath, backupPath);
  }
  try {
    fs.renameSync(temporaryPath, finalPath);
    if (hadFinal) {
      fs.rmSync(backupPath, { force: true });
    }
  } catch (error) {
    if (hadFinal && fs.existsSync(backupPath) && !fs.existsSync(finalPath)) {
      fs.renameSync(backupPath, finalPath);
    }
    throw error;
  }
};

export const buildSqliteProjection = ({ appRoot = process.cwd() } = {}) => {
  assertSupportedNodeVersion(process.version);
  const input = readProjectionInput(appRoot);
  const finalPath = databasePath(appRoot);
  const temporaryPath = path.join(
    path.dirname(finalPath),
    `.${path.basename(finalPath)}.${process.pid}.${Date.now()}.tmp`,
  );
  fs.mkdirSync(path.dirname(finalPath), { recursive: true });
  fs.rmSync(temporaryPath, { force: true });

  try {
    migrateDatabase({ appRoot, dbPath: temporaryPath });
    const database = openDatabase(temporaryPath);
    let counts;
    try {
      withTransaction(database, () => {
        insertProjection(database, input);
        insertReferenceProjection(database, input.references);
        rebuildSearchFts(database);
        assertDatabaseIntegrity(database);
      });
      counts = projectionRowCounts(database);
    } finally {
      database.close();
    }
    publishDatabase(temporaryPath, finalPath);
    return { database: finalPath, counts, manifestHash: input.manifest.manifestHash };
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    throw error;
  }
};

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    const result = buildSqliteProjection();
    console.log(`SQLite projection built: ${result.database}`);
    console.log(`Manifest: ${result.manifestHash}`);
    console.log(`Rows: ${JSON.stringify(result.counts)}`);
    console.log("SQLite foreign key, integrity, and FTS5 integrity checks passed.");
  } catch (error) {
    console.error(`SQLite projection build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
