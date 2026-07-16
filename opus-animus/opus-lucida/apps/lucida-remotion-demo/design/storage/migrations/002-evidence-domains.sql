-- W6: domains are mandatory for all new projection rows. Existing W5 projection
-- rows stay nullable until the rebuild replaces them from canonical records.
ALTER TABLE sources ADD COLUMN domain TEXT CHECK(domain IN ('factual', 'visual-style'));
ALTER TABLE documents ADD COLUMN domain TEXT CHECK(domain IN ('factual', 'visual-style'));
ALTER TABLE chunks ADD COLUMN domain TEXT CHECK(domain IN ('factual', 'visual-style'));
ALTER TABLE search_documents ADD COLUMN domain TEXT CHECK(domain IN ('factual', 'visual-style'));
ALTER TABLE canonical_entities ADD COLUMN domain TEXT CHECK(domain IN ('factual', 'visual-style'));

CREATE INDEX sources_domain_idx ON sources(domain, source_id);
CREATE INDEX documents_domain_idx ON documents(domain, document_id);
CREATE INDEX chunks_domain_idx ON chunks(domain, chunk_id);
CREATE INDEX search_documents_domain_idx ON search_documents(domain, owner_id);
CREATE INDEX canonical_entities_domain_idx ON canonical_entities(domain, entity_id);

CREATE TRIGGER sources_domain_required_insert BEFORE INSERT ON sources
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'sources.domain is required'); END;
CREATE TRIGGER documents_domain_required_insert BEFORE INSERT ON documents
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'documents.domain is required'); END;
CREATE TRIGGER chunks_domain_required_insert BEFORE INSERT ON chunks
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'chunks.domain is required'); END;
CREATE TRIGGER search_documents_domain_required_insert BEFORE INSERT ON search_documents
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'search_documents.domain is required'); END;
CREATE TRIGGER canonical_entities_domain_required_insert BEFORE INSERT ON canonical_entities
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'canonical_entities.domain is required'); END;

CREATE TRIGGER sources_domain_required_update BEFORE UPDATE OF domain ON sources
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'sources.domain is required'); END;
CREATE TRIGGER documents_domain_required_update BEFORE UPDATE OF domain ON documents
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'documents.domain is required'); END;
CREATE TRIGGER chunks_domain_required_update BEFORE UPDATE OF domain ON chunks
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'chunks.domain is required'); END;
CREATE TRIGGER search_documents_domain_required_update BEFORE UPDATE OF domain ON search_documents
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'search_documents.domain is required'); END;
CREATE TRIGGER canonical_entities_domain_required_update BEFORE UPDATE OF domain ON canonical_entities
WHEN NEW.domain IS NULL
BEGIN SELECT RAISE(ABORT, 'canonical_entities.domain is required'); END;
