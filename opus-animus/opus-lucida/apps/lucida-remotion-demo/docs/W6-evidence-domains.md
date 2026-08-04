# W6 Evidence Domains

Canonical evidence domain is exactly `factual` or `visual-style`. New canonical sources and documents must declare it; unknown or missing values are rejected by schemas, compilers, repositories, and Director.

## Ownership

- Factual evidence may support `ContentBrief.factRefs` and production claims only.
- Visual-style evidence may support style package selection only. `selectVisualKnowledge` always submits `domain: "visual-style"` and removes `factRefs` from its visual query text.
- The Director accepts only `visual-style` evidence. Mapper rejects a fact reference that resolves to a visual evidence ID.
- Renderers do not read SQLite, repositories, or canonical source-library files. The runtime template registry may import `.generated/knowledge/template-index.json`; that file is a deterministic compiled runtime artifact, not a retrieval dependency.

## Ingest and Migration

Run `npm run knowledge:migrate-domains` once for the explicitly enumerated current visual corpus. The migration validates the complete corpus before writing, stages all changed bytes, and rolls back committed files if a write fails. Explicit future `factual` records are preserved; unknown records without a domain are rejected instead of guessed. It writes `design/knowledge/reports/evidence-domain-migration.json` and is idempotent. `--check` reports pending updates without writing.

Future sources are not inferred from type or path. Ingest/approval/promotion requires a declared domain and preserves it to source, document, chunk, search and selection records.

## Query and Projection

`knowledge:query` and both repository APIs require `domain`. The only compatibility surface is the explicitly named `createLegacyVisualJsonRepository` / `createLegacyVisualSqliteRepository`, which injects `visual-style` for legacy callers.

The JSON and SQLite repositories apply `FILTER_DOMAIN_MISMATCH` before lexical ranking. Domain mismatches appear only as ID/reason trace; unsafe or unknown-domain records remain invisible. SQLite migration `002-evidence-domains.sql` adds constrained domain columns, indexes and insert triggers. Rebuild writes every domain explicitly and atomically replaces stale projection rows.

Generated reference indexes expose per-record domain counts. The knowledge manifest contains domain counts and hashes, so a domain change changes the manifest hash and makes an older SQLite projection stale.
