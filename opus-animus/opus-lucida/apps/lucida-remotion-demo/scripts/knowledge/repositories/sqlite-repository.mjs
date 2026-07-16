import fs from "node:fs";
import path from "node:path";
import { databasePath, openDatabase } from "../sqlite-client.mjs";
import {
  applyHardFilters,
  createReferenceRecord,
  createTemplateRecord,
  normalizeQuery,
  rankEligible,
  queryTokens,
} from "./query-core.mjs";

const parseJson = (value, label) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`SQLite projection contains invalid ${label}: ${error.message}`);
  }
};

const ftsExpression = (tokens) => tokens.map((token) => `search_folded : ${token}`).join(" OR ");

const readRecords = (database) => {
  const templateRows = database.prepare(`
    SELECT ce.definition_json, ce.domain, pr.source_id, pr.snapshot_id, pr.source_path, pr.review_status,
           ss.revision AS source_revision, ss.collector_version
    FROM canonical_entities ce
    JOIN provenance_records pr ON pr.entity_id = ce.entity_id
    JOIN source_snapshots ss ON ss.snapshot_id = pr.snapshot_id
    WHERE ce.entity_type = 'template'
    ORDER BY ce.entity_id
  `).all();
  const templates = templateRows.map((row) => createTemplateRecord({ ...parseJson(row.definition_json, "template definition"), domain: row.domain }, {
    sourceId: row.source_id,
    snapshotId: row.snapshot_id,
    sourcePath: row.source_path,
    sourceRevision: row.source_revision,
    collectorVersion: row.collector_version,
    reviewStatus: row.review_status,
  }));

  const observations = new Map();
  for (const row of database.prepare("SELECT chunk_id, kind, review_status, definition_json FROM observations ORDER BY observation_id").all()) {
    const entries = observations.get(row.chunk_id) ?? [];
    entries.push({ kind: row.kind, reviewStatus: row.review_status, definition: parseJson(row.definition_json, "observation definition") });
    observations.set(row.chunk_id, entries);
  }
  const referenceRows = database.prepare(`
    SELECT c.chunk_id, c.ordinal, c.raw_text, c.search_text, c.search_folded, c.content_hash,
           d.document_id, d.source_ref, d.media_type, d.domain AS document_domain,
           ss.snapshot_id, ss.revision AS source_revision, ss.collector_version,
           s.source_id, s.source_type, s.rights_policy, s.domain AS source_domain,
           c.domain AS chunk_domain,
           sd.title, sd.tags
    FROM chunks c
    JOIN documents d ON d.document_id = c.document_id
    JOIN source_snapshots ss ON ss.snapshot_id = d.snapshot_id
    JOIN sources s ON s.source_id = ss.source_id
    JOIN search_documents sd ON sd.chunk_id = c.chunk_id
    ORDER BY c.chunk_id
  `).all();
  const references = referenceRows.map((row) => createReferenceRecord({
    source: {
      sourceId: row.source_id,
      snapshotId: row.snapshot_id,
      sourceType: row.source_type,
      domain: row.source_domain,
      sourceRevision: row.source_revision,
      collectorVersion: row.collector_version,
      // Only approved references are eligible to enter the SQLite projection.
      rights: { policy: row.rights_policy, status: "approved" },
      approval: { status: "approved" },
    },
    document: { documentId: row.document_id, sourceRef: row.source_ref, mediaType: row.media_type, domain: row.document_domain },
    chunk: {
      chunkId: row.chunk_id,
      domain: row.chunk_domain,
      ordinal: row.ordinal,
      rawText: row.raw_text,
      searchText: row.search_text,
      searchFolded: row.search_folded,
      contentHash: row.content_hash,
      title: row.title,
      tags: row.tags.split(" ").filter(Boolean).filter((tag) => tag !== row.source_type),
    },
    observations: observations.get(row.chunk_id) ?? [],
  }));
  return [...templates, ...references];
};

const retrieveFtsIds = (database, tokens) => {
  if (tokens.length === 0) return new Set();
  const rows = database.prepare(`
    SELECT sd.owner_id
    FROM search_fts
    JOIN search_documents sd ON sd.rowid = search_fts.rowid
    WHERE search_fts MATCH ?
    ORDER BY bm25(search_fts), sd.owner_id
  `).all(ftsExpression(tokens));
  return new Set(rows.map((row) => row.owner_id));
};

const assertFreshProjection = ({ database, appRoot }) => {
  const manifestPath = path.join(appRoot, ".generated", "knowledge", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("SQLite projection freshness cannot be verified: generated manifest is absent. Run npm run knowledge:compile first.");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const builds = database.prepare(
    "SELECT manifest_hash FROM projection_builds WHERE status = 'published' ORDER BY build_id",
  ).all();
  if (builds.length !== 1 || builds[0].manifest_hash !== manifest.manifestHash) {
    throw new Error("SQLite projection is stale for the current generated manifest. Run npm run knowledge:build first.");
  }
};

export class SqliteKnowledgeRepository {
  constructor({ appRoot = process.cwd(), dbPath = databasePath(appRoot) } = {}) {
    this.appRoot = appRoot;
    this.dbPath = dbPath;
  }

  query(input = {}) {
    const query = normalizeQuery(input);
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`SQLite repository requested but projection is absent: ${this.dbPath}. Run npm run knowledge:build first.`);
    }
    const database = openDatabase(this.dbPath);
    try {
      assertFreshProjection({ database, appRoot: this.appRoot });
      const records = readRecords(database);
      const { eligible, rejected } = applyHardFilters(records, query);
      return rankEligible({
        eligible,
        rejected,
        query,
        retrievedIds: retrieveFtsIds(database, queryTokens(query.text)),
        repository: "sqlite",
      });
    } finally {
      database.close();
    }
  }
}

export const createSqliteRepository = (options) => new SqliteKnowledgeRepository(options);

export const createLegacyVisualSqliteRepository = (options) => ({
  query: (input = {}) => new SqliteKnowledgeRepository(options).query({ ...input, domain: "visual-style" }),
});
