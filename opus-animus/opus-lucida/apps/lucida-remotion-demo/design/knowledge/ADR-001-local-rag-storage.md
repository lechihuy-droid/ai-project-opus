# ADR-001: Local RAG Storage for v0.1

- Status: Accepted
- Date: 2026-07-14
- Decision owner: Lucida Local RAG

## Context

Lucida v0.1 needs deterministic, reviewable knowledge retrieval on one local
host. The renderer must remain available when local search data is absent or
being rebuilt. The implementation plan also requires canonical knowledge to be
inspectable in source control and local search data to be disposable.

## Decision

The active v0.1 storage architecture is:

```text
Git canonical packages + schemas
            |
            v
deterministic knowledge compiler
            |
            +--> generated JSON runtime index
            |
            +--> SQLite FTS5 local query projection
```

- Git packages and schemas are the canonical source of truth.
- Generated JSON is the renderer runtime source. The renderer never opens the
  SQLite database.
- SQLite FTS5 is a local, read-heavy query projection. It is generated under
  `.generated/knowledge/`, is gitignored, and can be deleted and rebuilt from
  canonical packages.
- Retrieval for v0.1 is hard filters, FTS5/BM25 lexical search, and rule-based
  compatibility scoring. It does not depend on embeddings or a vector service.
- Node `>=24.14 <25` is required so the built-in `node:sqlite` contract is
  stable for the planned compiler and projection tooling.

## Consequences

This keeps canonical review and history in Git, allows deterministic generated
artifacts, and prevents local database availability from blocking Remotion
rendering. It is intentionally single-host and single-writer; it does not
provide remote APIs, distributed writes, or multi-user review.

The compiler, JSON index, and SQLite projection are delivered in later waves.
This ADR only locks their contract and does not introduce those implementations.

## Future Trigger

PostgreSQL and pgvector are deferred. Re-evaluate a service-backed store only
when Lucida needs concurrent remote writers, multi-user review, operational
durability beyond rebuildable projections, or FTS5 misses Recall@5 or nDCG@5
targets in two consecutive benchmarks after metadata and chunking remediation.

Any change requires a new ADR, migration and backup plan, query-parity tests,
and proof that the renderer remains database-independent.

## Supersedes

Earlier architecture text that presented PostgreSQL/pgvector as the initial
storage stack is historical only. This ADR is the single active storage
decision for Lucida Local RAG v0.1.
