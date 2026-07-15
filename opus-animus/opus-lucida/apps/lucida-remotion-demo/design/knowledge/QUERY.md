# Knowledge Query Contract

`scripts/knowledge/repositories/json-repository.mjs` and
`scripts/knowledge/repositories/sqlite-repository.mjs` return
`lucida-knowledge-query/v1`. Both repositories materialize the same normalized
records and run the same hard-filter, lexical BM25-like score, rule-score, and
stable `id` tie-break logic. SQLite runs FTS5 against `search_fts` to choose its
lexical candidates; JSON uses the equivalent folded-token matcher. Scores are
therefore intentionally identical in v0.1, while parity is defined by result
IDs, order, and explanation/reason codes.

The safe corpus contains renderable canonical templates and reference chunks
whose source has both approved rights and approval. Unsafe reference evidence
is excluded before both results and rejected-candidate explanations, so a query
never returns unapproved rights or reference evidence.

Hard filters apply before lexical retrieval: `intent`, `aspectRatio`, `family`,
`status`, `sourceType`, `mediaType`, `renderable`, `rights`, and `approval`.
Search normalizes Unicode NFC/lowercase text and a folded form that removes
Vietnamese diacritics and maps `đ` to `d`.

Each result includes stable identity, score details, selected reason codes,
filter/ranking explanation, capabilities, and provenance. Rejected candidates
contain only safe-corpus records and their hard-filter reason codes.

## Retrieval Evaluation Contract

`npm run knowledge:eval` requires an already-built SQLite projection and fails
with a direct rebuild instruction when it is absent. It validates the gold
fixtures before querying both repositories, then writes the deterministic
`design/knowledge/reports/retrieval-v0.1.json` report. The report contains
per-query input, expected relevance and explanation codes, JSON/SQLite evidence,
failures, actual metric values, and thresholds; it deliberately contains no
wall-clock timestamp. `npm run knowledge:qa` runs validation, compilation,
projection build, knowledge tests, and the evaluation in that order.
