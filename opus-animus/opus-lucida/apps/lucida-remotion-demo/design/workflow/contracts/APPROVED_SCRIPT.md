# ApprovedScript Contract

Canonical frozen content handed off from the upstream content workflow.

## Required
- `schemaVersion`, `scriptId`, `revision`, `status`
- title and language
- immutable voice-over text
- sentence/segment IDs and order
- timing estimate
- editorial locks and permitted rewrite level
- entities, claims, pronunciation, required on-screen text
- approval record, provenance, and content hash

## Invariants
- status is `approved` or explicitly accepted `approved-with-notes`
- frozen text cannot be edited inside Create Workflow
- factual/statistical/historical claims meet verification policy
- every revision has a new hash; superseded revisions cannot start a new run

See G01 and G02 for normalization and timing requirements.