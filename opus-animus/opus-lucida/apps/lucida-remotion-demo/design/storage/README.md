# Lucida Local RAG SQLite Projection

`lucida-knowledge.db` is local derived data for knowledge tooling. It is not a
renderer dependency, canonical source, or runtime import. The renderer keeps
using `.generated/knowledge/*.json` when the database is absent or being
rebuilt.

## Location and lifecycle

- Database: `.generated/knowledge/lucida-knowledge.db`
- Canonical projection input: the validated generated JSON indexes and manifest
- Driver: built-in `node:sqlite` on Node `>=24.14 <25`
- Migration source: `design/storage/migrations/*.sql`, ordered by filename

`npm run knowledge:migrate` creates or upgrades the local schema. Each pending
migration and its `schema_migrations` record run in one transaction, with
foreign keys enabled and checked before commit. Migration checksums prevent a
changed migration from being silently accepted. There are no down migrations:
this is derived data, so schema rollback is performed with the previous code
version followed by a clean rebuild.

`npm run knowledge:build` creates a temporary database alongside the
last-good database, migrates it, projects the current generated JSON, rebuilds
and validates FTS5, checks SQLite and foreign-key integrity, then publishes it.
On Windows the publish sequence temporarily renames the old database to a
backup before replacing it; any publish error restores that backup. A failed
build never mutates the last-good database.

## Schema contract

All ordinary relational tables are `STRICT`, use explicit foreign keys and
delete behavior, and enforce enum-like values with `CHECK` constraints.
`search_fts` is the sole virtual-table exception: it is an FTS5 external-content
index over `search_documents`. Insert, update, and delete triggers keep it
synchronized. Tooling runs both the FTS5 `rebuild` and `integrity-check`
commands after projection.

Wave 3 materializes generated template and adapter entries, their capability
metadata, validation evidence, provenance metadata, and searchable entity
documents. The source, snapshot, document, chunk, and observation tables are
already constrained for Wave 4 approved-reference ingestion but are not filled
from unapproved data.

Stable IDs exposed by the database are text identifiers. SQLite integer
`rowid` is internal to FTS external content only. Search normalization stores
NFC lowercase text plus a folded form (NFD, combining marks removed, `đ` to
`d`, punctuation normalized to whitespace). Both forms are indexed with
`unicode61 remove_diacritics 2`.
