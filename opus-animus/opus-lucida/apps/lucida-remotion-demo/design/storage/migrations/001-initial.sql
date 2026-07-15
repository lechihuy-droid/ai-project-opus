-- Lucida Local RAG v0.1 initial SQLite projection schema.
-- Transactions are owned by scripts/knowledge/migrate.mjs.

CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY NOT NULL,
  checksum TEXT NOT NULL CHECK(length(checksum) = 64),
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE projection_builds (
  build_id TEXT PRIMARY KEY NOT NULL,
  schema_version TEXT NOT NULL,
  manifest_hash TEXT NOT NULL CHECK(length(manifest_hash) = 64),
  status TEXT NOT NULL CHECK(status IN ('building', 'published', 'failed')),
  UNIQUE(schema_version, manifest_hash)
) STRICT;

CREATE TABLE canonical_entities (
  entity_id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('template', 'adapter', 'style', 'motion', 'asset', 'evidence')),
  logical_id TEXT NOT NULL,
  version TEXT NOT NULL,
  package_path TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK(length(content_hash) = 64),
  definition_json TEXT NOT NULL CHECK(json_valid(definition_json)),
  build_id TEXT NOT NULL REFERENCES projection_builds(build_id) ON DELETE CASCADE,
  UNIQUE(entity_type, logical_id, version)
) STRICT;

CREATE TABLE entity_capabilities (
  entity_id TEXT NOT NULL REFERENCES canonical_entities(entity_id) ON DELETE CASCADE,
  capability_type TEXT NOT NULL CHECK(capability_type IN ('intent', 'preset', 'aspect_ratio', 'renderable', 'family', 'status')),
  capability_value TEXT NOT NULL CHECK(length(capability_value) > 0),
  PRIMARY KEY(entity_id, capability_type, capability_value)
) STRICT;

CREATE TABLE entity_relations (
  source_id TEXT NOT NULL REFERENCES canonical_entities(entity_id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES canonical_entities(entity_id) ON DELETE RESTRICT,
  relation TEXT NOT NULL CHECK(relation IN ('adapter', 'compatible_with', 'derived_from', 'supports')),
  score REAL CHECK(score IS NULL OR (score >= 0 AND score <= 1)),
  rule_json TEXT NOT NULL CHECK(json_valid(rule_json)),
  PRIMARY KEY(source_id, target_id, relation)
) STRICT;

CREATE TABLE validation_artifacts (
  entity_id TEXT NOT NULL REFERENCES canonical_entities(entity_id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('passed', 'failed')),
  artifact_uri TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK(length(content_hash) = 64),
  PRIMARY KEY(entity_id, check_type)
) STRICT;

CREATE TABLE sources (
  source_id TEXT PRIMARY KEY NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('canonical-package', 'repository', 'web', 'image', 'theme')),
  rights_policy TEXT NOT NULL CHECK(length(rights_policy) > 0)
) STRICT;

CREATE TABLE source_snapshots (
  snapshot_id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
  revision TEXT NOT NULL,
  checksum TEXT NOT NULL CHECK(length(checksum) = 64),
  collector_version TEXT NOT NULL,
  UNIQUE(source_id, revision, checksum)
) STRICT;

CREATE TABLE provenance_records (
  entity_id TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(source_id) ON DELETE RESTRICT,
  snapshot_id TEXT NOT NULL REFERENCES source_snapshots(snapshot_id) ON DELETE RESTRICT,
  source_path TEXT NOT NULL,
  license_status TEXT NOT NULL CHECK(license_status IN ('recorded', 'unknown', 'restricted')),
  review_status TEXT NOT NULL CHECK(review_status IN ('validated', 'approved', 'rejected', 'pending'))
) STRICT;

CREATE TABLE documents (
  document_id TEXT PRIMARY KEY NOT NULL,
  snapshot_id TEXT NOT NULL REFERENCES source_snapshots(snapshot_id) ON DELETE CASCADE,
  source_ref TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK(media_type IN ('canonical-entity', 'markdown', 'repository', 'web', 'image', 'theme')),
  UNIQUE(snapshot_id, source_ref)
) STRICT;

CREATE TABLE chunks (
  chunk_id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  raw_text TEXT NOT NULL,
  search_text TEXT NOT NULL,
  search_folded TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK(length(content_hash) = 64),
  UNIQUE(document_id, ordinal),
  UNIQUE(document_id, content_hash)
) STRICT;

CREATE TABLE observations (
  observation_id TEXT PRIMARY KEY NOT NULL,
  chunk_id TEXT NOT NULL REFERENCES chunks(chunk_id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK(review_status IN ('approved', 'rejected', 'pending')),
  definition_json TEXT NOT NULL CHECK(json_valid(definition_json))
) STRICT;

CREATE TABLE search_documents (
  rowid INTEGER PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK(owner_type IN ('entity', 'document', 'chunk')),
  owner_id TEXT NOT NULL,
  entity_id TEXT REFERENCES canonical_entities(entity_id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(document_id) ON DELETE CASCADE,
  chunk_id TEXT REFERENCES chunks(chunk_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT NOT NULL,
  provenance TEXT NOT NULL,
  search_text TEXT NOT NULL,
  search_folded TEXT NOT NULL,
  UNIQUE(owner_type, owner_id),
  CHECK(
    (owner_type = 'entity' AND entity_id IS NOT NULL AND document_id IS NULL AND chunk_id IS NULL AND owner_id = entity_id)
    OR (owner_type = 'document' AND entity_id IS NULL AND document_id IS NOT NULL AND chunk_id IS NULL AND owner_id = document_id)
    OR (owner_type = 'chunk' AND entity_id IS NULL AND document_id IS NULL AND chunk_id IS NOT NULL AND owner_id = chunk_id)
  )
) STRICT;

CREATE VIRTUAL TABLE search_fts USING fts5(
  title,
  body,
  tags,
  provenance,
  search_text,
  search_folded,
  content = 'search_documents',
  content_rowid = 'rowid',
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TRIGGER search_documents_ai AFTER INSERT ON search_documents BEGIN
  INSERT INTO search_fts(rowid, title, body, tags, provenance, search_text, search_folded)
  VALUES (new.rowid, new.title, new.body, new.tags, new.provenance, new.search_text, new.search_folded);
END;

CREATE TRIGGER search_documents_ad AFTER DELETE ON search_documents BEGIN
  INSERT INTO search_fts(search_fts, rowid, title, body, tags, provenance, search_text, search_folded)
  VALUES ('delete', old.rowid, old.title, old.body, old.tags, old.provenance, old.search_text, old.search_folded);
END;

CREATE TRIGGER search_documents_au AFTER UPDATE ON search_documents BEGIN
  INSERT INTO search_fts(search_fts, rowid, title, body, tags, provenance, search_text, search_folded)
  VALUES ('delete', old.rowid, old.title, old.body, old.tags, old.provenance, old.search_text, old.search_folded);
  INSERT INTO search_fts(rowid, title, body, tags, provenance, search_text, search_folded)
  VALUES (new.rowid, new.title, new.body, new.tags, new.provenance, new.search_text, new.search_folded);
END;

CREATE INDEX canonical_entities_build_id_idx ON canonical_entities(build_id);
CREATE INDEX entity_capabilities_lookup_idx ON entity_capabilities(capability_type, capability_value, entity_id);
CREATE INDEX entity_relations_target_idx ON entity_relations(target_id, relation);
CREATE INDEX source_snapshots_source_idx ON source_snapshots(source_id);
CREATE INDEX documents_snapshot_idx ON documents(snapshot_id);
CREATE INDEX chunks_document_idx ON chunks(document_id, ordinal);
CREATE INDEX search_documents_entity_idx ON search_documents(entity_id);
