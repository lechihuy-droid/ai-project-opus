import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test, { mock } from "node:test";

import { buildSqliteProjection } from "../../scripts/knowledge/build-sqlite.mjs";
import {
  assertDatabaseIntegrity,
  databasePath,
  foldSearchText,
  normalizeSearchText,
  openDatabase,
  rebuildSearchFts,
} from "../../scripts/knowledge/sqlite-client.mjs";
import { migrateDatabase } from "../../scripts/knowledge/migrate.mjs";
import { sha256, stableJson } from "../../scripts/knowledge/index-utils.mjs";
import { domainCounts } from "../../scripts/knowledge/evidence-domain.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const KNOWLEDGE_FILES = [
  "adapter-index.json",
  "compatibility-index.json",
  "director-index.json",
  "template-index.json",
  "reference-index.json",
  "manifest.json",
];
const PROJECTION_TABLES = [
  "projection_builds",
  "canonical_entities",
  "entity_capabilities",
  "entity_relations",
  "validation_artifacts",
  "sources",
  "source_snapshots",
  "provenance_records",
  "documents",
  "chunks",
  "observations",
  "search_documents",
  "search_fts",
];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, stableJson(value), "utf8");
const run = (database, sql, ...parameters) => database.prepare(sql).run(...parameters);
const all = (database, sql, ...parameters) => database.prepare(sql).all(...parameters)
  .map((row) => ({ ...row }));
const one = (database, sql, ...parameters) => database.prepare(sql).get(...parameters);

const copy = (source, destination) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

const createRoot = ({ generated = false } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-rag-wave3-"));
  copy(path.join(APP_ROOT, "design/storage/migrations"), path.join(root, "design/storage/migrations"));
  if (generated) {
    copy(path.join(APP_ROOT, ".generated/knowledge"), path.join(root, ".generated/knowledge"));
    copy(path.join(APP_ROOT, "design/template-library"), path.join(root, "design/template-library"));
    copy(
      path.join(APP_ROOT, "design/knowledge/reference-library"),
      path.join(root, "design/knowledge/reference-library"),
    );
    copy(
      path.join(APP_ROOT, "design/knowledge/reference-approvals"),
      path.join(root, "design/knowledge/reference-approvals"),
    );
    copy(
      path.join(APP_ROOT, "design/visual-library/styles/cinematic-type"),
      path.join(root, "design/visual-library/styles/cinematic-type"),
    );
    copy(path.join(APP_ROOT, "src/templates"), path.join(root, "src/templates"));
    copy(path.join(APP_ROOT, "src/templateRegistry.tsx"), path.join(root, "src/templateRegistry.tsx"));
    copy(path.join(APP_ROOT, "src/template-registry-map.json"), path.join(root, "src/template-registry-map.json"));
  }
  return root;
};

const withRoot = (options, callback) => {
  const root = createRoot(options);
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

const withMigratedDatabase = (callback) => withRoot({}, (root) => {
  const dbPath = databasePath(root);
  migrateDatabase({ appRoot: root, dbPath });
  const database = openDatabase(dbPath);
  try {
    return callback(database, root);
  } finally {
    database.close();
  }
});

const refreshManifest = (root) => {
  const knowledgeDir = path.join(root, ".generated/knowledge");
  const references = readJson(path.join(knowledgeDir, "reference-index.json"));
  const templates = readJson(path.join(knowledgeDir, "template-index.json")).templates;
  const manifest = readJson(path.join(knowledgeDir, "manifest.json"));
  const manifestWithoutHash = { ...manifest };
  delete manifestWithoutHash.manifestHash;
  manifestWithoutHash.artifactHashes = Object.fromEntries(
    KNOWLEDGE_FILES
      .filter((file) => file !== "manifest.json")
      .map((file) => [file, sha256(fs.readFileSync(path.join(knowledgeDir, file)))]),
  );
  manifestWithoutHash.counts = {
    ...manifestWithoutHash.counts,
    templates: templates.length,
    referenceSources: references.sources.length,
    referenceDocuments: references.documents.length,
    referenceChunks: references.chunks.length,
  };
  manifestWithoutHash.domainCounts = {
    templates: domainCounts(templates, "template"),
    referenceSources: domainCounts(references.sources, "reference source"),
    referenceDocuments: domainCounts(references.documents, "reference document"),
    referenceChunks: domainCounts(references.chunks, "reference chunk"),
  };
  manifestWithoutHash.domainHashes = {
    templates: sha256(stableJson(templates.map(({ id, domain }) => ({ id, domain })))),
    referenceSources: sha256(stableJson(references.sources.map(({ sourceId, domain }) => ({ id: sourceId, domain })))),
    referenceDocuments: sha256(stableJson(references.documents.map(({ documentId, domain }) => ({ id: documentId, domain })))),
    referenceChunks: sha256(stableJson(references.chunks.map(({ chunkId, domain }) => ({ id: chunkId, domain })))),
  };
  writeJson(path.join(knowledgeDir, "manifest.json"), {
    ...manifestWithoutHash,
    manifestHash: sha256(stableJson(manifestWithoutHash)),
  });
};

const mutateTemplateIndex = (root, mutate) => {
  const filePath = path.join(root, ".generated/knowledge/template-index.json");
  const index = readJson(filePath);
  mutate(index);
  writeJson(filePath, index);
  refreshManifest(root);
};

const entityFixture = (database, {
  buildId = "build:test",
  entityId,
  entityType = "template",
  logicalId = entityId,
  version = "1.0.0",
  packagePath = "fixture/package",
  contentHash = "a".repeat(64),
  domain = "visual-style",
} = {}) => {
  run(
    database,
    `INSERT INTO canonical_entities(
       entity_id, entity_type, logical_id, version, package_path, content_hash, definition_json, build_id, domain
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entityId,
    entityType,
    logicalId,
    version,
    packagePath,
    contentHash,
    stableJson({ entityId, entityType, logicalId, version }),
    buildId,
    domain,
  );
};

const addBuild = (database, buildId = "build:test") => run(
  database,
  "INSERT INTO projection_builds(build_id, schema_version, manifest_hash, status) VALUES (?, ?, ?, 'published')",
  buildId,
  "lucida-knowledge-sqlite/v1",
  "b".repeat(64),
);

const addSearchDocument = (database, entityId, {
  title = "Fixture title",
  body = "Fixture body",
  tags = "fixture",
  provenance = "fixture/provenance.json",
  searchText = `${title} ${body} ${tags} ${provenance}`,
} = {}) => run(
  database,
  `INSERT INTO search_documents(
     owner_type, owner_id, entity_id, title, body, tags, provenance, search_text, search_folded, domain
   ) VALUES ('entity', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  entityId,
  entityId,
  title,
  body,
  tags,
  provenance,
  normalizeSearchText(searchText),
    foldSearchText(searchText),
    "visual-style",
);

const projectionSnapshot = (database) => Object.fromEntries(PROJECTION_TABLES.map((table) => {
  const rows = all(database, `SELECT * FROM ${table}`)
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right), "en"));
  return [table, rows];
}));

const listResidue = (root) => fs.readdirSync(path.join(root, ".generated/knowledge"))
  .filter((name) => name === "lucida-knowledge.db.previous" || name.includes("lucida-knowledge.db.") && name.endsWith(".tmp"));

test("migration upgrades, is idempotent, rolls back failed SQL, and rejects checksum drift", () => {
  withRoot({}, (root) => {
    const dbPath = databasePath(root);
    const first = migrateDatabase({ appRoot: root, dbPath });
    const second = migrateDatabase({ appRoot: root, dbPath });
    assert.equal(first.applied, 2);
    assert.equal(second.applied, 2);

    const database = openDatabase(dbPath);
    try {
      assert.deepEqual(all(database, "SELECT version, checksum FROM schema_migrations"), [{
        version: "001-initial.sql",
        checksum: sha256(fs.readFileSync(path.join(root, "design/storage/migrations/001-initial.sql"))),
      }, {
        version: "002-evidence-domains.sql",
        checksum: sha256(fs.readFileSync(path.join(root, "design/storage/migrations/002-evidence-domains.sql"))),
      }]);
    } finally {
      database.close();
    }

    fs.writeFileSync(
      path.join(root, "design/storage/migrations/002-failing.sql"),
      "CREATE TABLE migration_should_rollback (id INTEGER PRIMARY KEY) STRICT;\nINSERT INTO missing_table VALUES (1);\n",
      "utf8",
    );
    assert.throws(
      () => migrateDatabase({ appRoot: root, dbPath }),
      /missing_table|no such table/i,
    );
    const afterFailure = openDatabase(dbPath);
    try {
      assert.equal(one(afterFailure, "SELECT name FROM sqlite_master WHERE name = 'migration_should_rollback'"), undefined);
      assert.deepEqual(all(afterFailure, "SELECT version FROM schema_migrations"), [{ version: "001-initial.sql" }, { version: "002-evidence-domains.sql" }]);
    } finally {
      afterFailure.close();
    }

    fs.writeFileSync(
      path.join(root, "design/storage/migrations/001-initial.sql"),
      `${fs.readFileSync(path.join(APP_ROOT, "design/storage/migrations/001-initial.sql"), "utf8")}\n-- checksum drift\n`,
      "utf8",
    );
    assert.throws(
      () => migrateDatabase({ appRoot: root, dbPath }),
      /Migration checksum mismatch: 001-initial\.sql\./,
    );
  });
});

test("schema enforces foreign keys, STRICT types, CHECKs, UNIQUEs, and delete behavior", () => {
  withMigratedDatabase((database) => {
    addBuild(database);
    entityFixture(database, { entityId: "adapter:fixture", entityType: "adapter" });
    entityFixture(database, { entityId: "template:fixture" });
    entityFixture(database, { entityId: "entity:strict-2" });

    assert.throws(() => run(database, "INSERT INTO entity_capabilities VALUES ('missing', 'intent', 'hook')"));
    assert.throws(() => run(
      database,
      "INSERT INTO search_documents(rowid, owner_type, owner_id, entity_id, title, body, tags, provenance, search_text, search_folded, domain) VALUES ('bad', 'entity', 'entity:strict-2', 'entity:strict-2', 'title', 'body', 'tags', 'provenance', 'text', 'text', 'visual-style')",
    ));
    assert.throws(() => run(database, "INSERT INTO projection_builds VALUES ('build:invalid', 'schema', ?, 'invalid')", "d".repeat(64)));
    assert.throws(() => run(database, "INSERT INTO canonical_entities VALUES ('bad', 'invalid', 'bad', '1', 'path', ?, '{}', 'build:test', 'visual-style')", "e".repeat(64)));

    assert.throws(() => run(
      database,
      "INSERT INTO canonical_entities VALUES ('template:duplicate', 'template', 'template:fixture', '1.0.0', 'path', ?, '{}', 'build:test', 'visual-style')",
      "f".repeat(64),
    ));
    run(database, "INSERT INTO entity_relations VALUES ('template:fixture', 'adapter:fixture', 'adapter', NULL, '{}')");
    assert.throws(() => run(database, "DELETE FROM canonical_entities WHERE entity_id = 'adapter:fixture'"));

    run(database, "INSERT INTO entity_capabilities VALUES ('template:fixture', 'intent', 'hook')");
    run(database, "INSERT INTO validation_artifacts VALUES ('template:fixture', 'fixture', 'passed', 'fixture.json', ?)", "1".repeat(64));
    run(database, "DELETE FROM entity_relations WHERE source_id = 'template:fixture'");
    run(database, "DELETE FROM canonical_entities WHERE entity_id = 'template:fixture'");
    assert.equal(one(database, "SELECT count(*) AS count FROM entity_capabilities").count, 0);
    assert.equal(one(database, "SELECT count(*) AS count FROM validation_artifacts").count, 0);
    assert.equal(one(database, "SELECT count(*) AS count FROM search_documents").count, 0);

    run(database, "DELETE FROM search_documents WHERE owner_id = 'entity:strict-2'");
    run(database, "DELETE FROM canonical_entities WHERE entity_id = 'entity:strict-2'");
    run(database, "DELETE FROM canonical_entities WHERE entity_id = 'adapter:fixture'");
    assert.equal(one(database, "SELECT count(*) AS count FROM canonical_entities").count, 0);
  });
});

test("FTS external-content triggers handle insert, update, delete, rebuild, and integrity", () => {
  withMigratedDatabase((database) => {
    addBuild(database);
    entityFixture(database, { entityId: "entity:fts" });
    addSearchDocument(database, "entity:fts", {
      title: "Old title",
      body: "alpha body",
      searchText: "Old title alpha body",
    });
    assert.equal(all(database, "SELECT rowid FROM search_fts WHERE search_fts MATCH 'alpha'").length, 1);

    run(
      database,
      "UPDATE search_documents SET title = 'New title', body = 'beta body', search_text = 'new title beta body', search_folded = 'new title beta body' WHERE owner_id = 'entity:fts'",
    );
    assert.equal(all(database, "SELECT rowid FROM search_fts WHERE search_fts MATCH 'alpha'").length, 0);
    assert.equal(all(database, "SELECT rowid FROM search_fts WHERE search_fts MATCH 'beta'").length, 1);

    run(database, "DELETE FROM search_documents WHERE owner_id = 'entity:fts'");
    assert.equal(all(database, "SELECT rowid FROM search_fts WHERE search_fts MATCH 'beta'").length, 0);
    entityFixture(database, { entityId: "entity:fts-2" });
    addSearchDocument(database, "entity:fts-2", { title: "rebuild marker", searchText: "rebuild marker" });
    rebuildSearchFts(database);
    assert.equal(all(database, "SELECT rowid FROM search_fts WHERE search_fts MATCH 'marker'").length, 1);
    assertDatabaseIntegrity(database);
  });
});

test("Vietnamese normalization is NFC lowercase and folding removes accents, đ/Đ, and punctuation", () => {
  assert.equal(normalizeSearchText("ĐIỆN\u0301, BÀN"), "điệń, bàn");
  assert.equal(foldSearchText("Đặng, ĐIỆN! Trí - CỐNG"), "dang dien tri cong");
  assert.equal(foldSearchText("đ/Đ: dấu… và (ngoặc)"), "d d dau va ngoac");
});

test("build cleanly projects exact generated entities, capabilities, relations, and provenance", () => {
  withRoot({ generated: true }, (root) => {
    const result = buildSqliteProjection({ appRoot: root });
    assert.equal(result.database, databasePath(root));
    const generatedTemplates = readJson(path.join(root, ".generated/knowledge/template-index.json")).templates;
    const generatedAdapters = readJson(path.join(root, ".generated/knowledge/adapter-index.json")).adapters;
    const generatedReferences = readJson(path.join(root, ".generated/knowledge/reference-index.json"));
    const database = openDatabase(result.database);
    try {
      const expectedEntities = [
        ...generatedAdapters.map((adapter) => ({
          entity_id: `adapter:${adapter.id}@source-${adapter.sourceHash.slice(0, 12)}`,
          entity_type: "adapter",
          logical_id: `adapter:${adapter.id}`,
          version: `source-${adapter.sourceHash.slice(0, 12)}`,
          package_path: adapter.path,
          content_hash: adapter.sourceHash,
        })),
        ...generatedTemplates.map((template) => ({
          entity_id: `${template.logicalId}@${template.version}`,
          entity_type: "template",
          logical_id: template.logicalId,
          version: template.version,
          package_path: template.paths.package,
          content_hash: template.contentHash,
        })),
      ].sort((left, right) => left.entity_id.localeCompare(right.entity_id, "en"));
      const actualEntities = all(
        database,
        "SELECT entity_id, entity_type, logical_id, version, package_path, content_hash FROM canonical_entities ORDER BY entity_id",
      );
      assert.deepEqual(actualEntities, expectedEntities);

      const template = generatedTemplates[0];
      const templateEntityId = `${template.logicalId}@${template.version}`;
      const expectedCapabilities = [
        ...template.capabilities.intents.map((value) => ["intent", value]),
        ...template.capabilities.presets.map((value) => ["preset", value]),
        ...template.capabilities.aspectRatios.map((value) => ["aspect_ratio", value]),
        ["renderable", String(template.capabilities.renderable)],
        ["family", template.familyId],
        ["status", template.status],
      ].map(([capability_type, capability_value]) => ({ entity_id: templateEntityId, capability_type, capability_value }))
        .sort((left, right) => `${left.capability_type}:${left.capability_value}`.localeCompare(`${right.capability_type}:${right.capability_value}`, "en"));
      assert.deepEqual(
        all(database, "SELECT entity_id, capability_type, capability_value FROM entity_capabilities ORDER BY capability_type, capability_value"),
        expectedCapabilities,
      );
      assert.deepEqual(
        all(database, "SELECT source_id, target_id, relation, score, rule_json FROM entity_relations"),
        [{
          source_id: templateEntityId,
          target_id: `adapter:${template.adapterId}@source-${generatedAdapters[0].sourceHash.slice(0, 12)}`,
          relation: "adapter",
          score: null,
          rule_json: stableJson({ source: "adapter-index", adapterId: template.adapterId }),
        }],
      );
      assert.equal(one(database, "SELECT count(*) AS count FROM provenance_records").count, generatedTemplates.length);

      const referenceSources = generatedReferences.sources
        .map((source) => ({ source_id: source.sourceId, source_type: source.sourceType, rights_policy: source.rights.policy }))
        .sort((left, right) => left.source_id.localeCompare(right.source_id, "en"));
      assert.deepEqual(
        all(database, "SELECT source_id, source_type, rights_policy FROM sources WHERE source_type != 'canonical-package' ORDER BY source_id"),
        referenceSources,
      );
      assert.deepEqual(
        all(database, "SELECT snapshot_id, source_id, revision, checksum, collector_version FROM source_snapshots WHERE source_id IN (SELECT source_id FROM sources WHERE source_type != 'canonical-package') ORDER BY snapshot_id"),
        generatedReferences.sources.map((source) => ({
          snapshot_id: source.snapshotId,
          source_id: source.sourceId,
          revision: source.sourceRevision,
          checksum: source.snapshotChecksum,
          collector_version: source.collectorVersion,
        })).sort((left, right) => left.snapshot_id.localeCompare(right.snapshot_id, "en")),
      );
      assert.deepEqual(
        all(database, "SELECT document_id, snapshot_id, source_ref, media_type FROM documents ORDER BY document_id"),
        generatedReferences.documents.map((document) => ({
          document_id: document.documentId,
          snapshot_id: document.snapshotId,
          source_ref: document.sourceRef,
          media_type: document.mediaType,
        })).sort((left, right) => left.document_id.localeCompare(right.document_id, "en")),
      );
      assert.deepEqual(
        all(database, "SELECT chunk_id, document_id, ordinal, content_hash FROM chunks ORDER BY chunk_id"),
        generatedReferences.chunks.map((chunk) => ({
          chunk_id: chunk.chunkId,
          document_id: chunk.documentId,
          ordinal: chunk.ordinal,
          content_hash: chunk.contentHash,
        })).sort((left, right) => left.chunk_id.localeCompare(right.chunk_id, "en")),
      );
      assert.equal(one(database, "SELECT count(*) AS count FROM sources WHERE source_type != 'canonical-package'").count, generatedReferences.counts.sources);
      assert.equal(one(database, "SELECT count(*) AS count FROM documents").count, generatedReferences.counts.documents);
      assert.equal(one(database, "SELECT count(*) AS count FROM chunks").count, generatedReferences.counts.chunks);
      assert.equal(one(database, "SELECT count(*) AS count FROM observations WHERE review_status = 'approved'").count, generatedReferences.chunks.reduce((sum, chunk) => sum + chunk.observations.length, 0));
      assert.equal(one(database, "SELECT count(*) AS count FROM observations WHERE review_status != 'approved'").count, 0);
      assert.equal(one(database, "SELECT count(*) AS count FROM search_documents").count, generatedTemplates.length + generatedReferences.counts.chunks);
      assert.equal(one(database, "SELECT count(*) AS count FROM search_fts").count, generatedTemplates.length + generatedReferences.counts.chunks);
      assert.ok(all(database, "SELECT rowid FROM search_fts WHERE search_fts MATCH 'terminal'").length > 0);
      assertDatabaseIntegrity(database);
    } finally {
      database.close();
    }
  });
});

test("build is a clean deterministic rebuild and removes stale/deleted generated sources", () => {
  withRoot({ generated: true }, (root) => {
    const first = buildSqliteProjection({ appRoot: root });
    const firstDatabase = openDatabase(first.database);
    const firstSnapshot = projectionSnapshot(firstDatabase);
    firstDatabase.close();

    const second = buildSqliteProjection({ appRoot: root });
    const secondDatabase = openDatabase(second.database);
    assert.deepEqual(projectionSnapshot(secondDatabase), firstSnapshot);
    secondDatabase.close();

    fs.rmSync(databasePath(root));
    buildSqliteProjection({ appRoot: root });
    const cleanDatabase = openDatabase(databasePath(root));
    try {
      assert.deepEqual(projectionSnapshot(cleanDatabase), firstSnapshot);
    } finally {
      cleanDatabase.close();
    }
  });

  withRoot({ generated: true }, (root) => {
    mutateTemplateIndex(root, (index) => {
      const template = { ...index.templates[0], id: "stale-template", logicalId: "template:stale-template", label: "Stale Template" };
      const withoutHash = { ...template };
      delete withoutHash.contentHash;
      index.templates = [
        { ...withoutHash, contentHash: sha256(stableJson(withoutHash)) },
        index.templates[0],
      ];
    });
    const expandedManifest = readJson(path.join(root, ".generated/knowledge/manifest.json"));
    expandedManifest.counts.templates = 2;
    expandedManifest.domainCounts.templates["visual-style"] = 2;
    writeJson(path.join(root, ".generated/knowledge/manifest.json"), expandedManifest);
    refreshManifest(root);
    buildSqliteProjection({ appRoot: root });
    let database = openDatabase(databasePath(root));
    try {
      assert.equal(one(database, "SELECT count(*) AS count FROM canonical_entities WHERE logical_id = 'template:stale-template'").count, 1);
      assert.equal(one(database, "SELECT count(*) AS count FROM sources WHERE source_id = 'source:template:stale-template'").count, 1);
    } finally {
      database.close();
    }

    mutateTemplateIndex(root, (index) => {
      index.templates = index.templates.filter((template) => template.id !== "stale-template");
    });
    const manifestPath = path.join(root, ".generated/knowledge/manifest.json");
    const manifest = readJson(manifestPath);
    manifest.counts.templates = 1;
    manifest.domainCounts.templates["visual-style"] = 1;
    writeJson(manifestPath, manifest);
    refreshManifest(root);
    buildSqliteProjection({ appRoot: root });
    database = openDatabase(databasePath(root));
    try {
      assert.equal(one(database, "SELECT count(*) AS count FROM canonical_entities WHERE logical_id = 'template:stale-template'").count, 0);
      assert.equal(one(database, "SELECT count(*) AS count FROM sources WHERE source_id = 'source:template:stale-template'").count, 0);
      assert.equal(one(database, "SELECT count(*) AS count FROM source_snapshots WHERE snapshot_id LIKE 'snapshot:source:template:stale-template:%'").count, 0);
      assert.equal(one(database, "SELECT count(*) AS count FROM provenance_records WHERE entity_id LIKE 'template:stale-template@%'").count, 0);
      assert.equal(one(database, "SELECT count(*) AS count FROM search_documents WHERE owner_id LIKE 'template:stale-template@%'").count, 0);
    } finally {
      database.close();
    }
  });
});

test("failed projection and publish keep the last-good DB and clean build residue", () => {
  withRoot({ generated: true }, (root) => {
    const finalPath = databasePath(root);
    buildSqliteProjection({ appRoot: root });
    const lastGood = fs.readFileSync(finalPath);
    mutateTemplateIndex(root, (index) => {
      const duplicateWithoutHash = { ...index.templates[0], id: "duplicate-id", label: "Duplicate Entity" };
      const duplicateBase = { ...duplicateWithoutHash };
      delete duplicateBase.contentHash;
      const duplicate = { ...duplicateBase, contentHash: sha256(stableJson(duplicateBase)) };
      index.templates = [...index.templates, duplicate];
    });
    const duplicateManifest = readJson(path.join(root, ".generated/knowledge/manifest.json"));
    duplicateManifest.counts.templates = 2;
    duplicateManifest.domainCounts.templates["visual-style"] = 2;
    writeJson(path.join(root, ".generated/knowledge/manifest.json"), duplicateManifest);
    refreshManifest(root);
    assert.throws(() => buildSqliteProjection({ appRoot: root }), /UNIQUE constraint failed: canonical_entities/);
    assert.deepEqual(fs.readFileSync(finalPath), lastGood);
    assert.deepEqual(listResidue(root), []);
  });

  withRoot({ generated: true }, (root) => {
    const finalPath = databasePath(root);
    buildSqliteProjection({ appRoot: root });
    const lastGood = fs.readFileSync(finalPath);
    const originalRename = fs.renameSync.bind(fs);
    const renameMock = mock.method(fs, "renameSync", (source, destination) => {
      if (source.endsWith(".tmp")) {
        throw new Error("simulated publish failure");
      }
      return originalRename(source, destination);
    });
    try {
      assert.throws(() => buildSqliteProjection({ appRoot: root }), /simulated publish failure/);
    } finally {
      renameMock.mock.restore();
    }
    assert.deepEqual(fs.readFileSync(finalPath), lastGood);
    assert.deepEqual(listResidue(root), []);
  });
});

test("database path is gitignored and renderer source has no SQLite import", () => {
  assert.match(fs.readFileSync(path.join(APP_ROOT, ".gitignore"), "utf8"), /\.generated\/knowledge\//);
  assert.equal(databasePath(APP_ROOT), path.join(APP_ROOT, ".generated/knowledge/lucida-knowledge.db"));
  const rendererSource = fs.readdirSync(path.join(APP_ROOT, "src"), { recursive: true })
    .filter((file) => /\.(?:js|jsx|ts|tsx|mjs)$/.test(file))
    .map((file) => fs.readFileSync(path.join(APP_ROOT, "src", file), "utf8"))
    .join("\n");
  assert.doesNotMatch(rendererSource, /node:sqlite|DatabaseSync|lucida-knowledge\.db/);
});
