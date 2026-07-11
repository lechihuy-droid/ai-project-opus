# Artifact Lifecycle

## States
- `draft`
- `validated`
- `approved`
- `rejected`
- `stale`
- `superseded`
- `published`
- `archived`

## Lifecycle rules
1. Only validated artifacts may be consumed by downstream gates.
2. Human approval applies to one exact content hash.
3. Dependency changes mark affected artifacts stale.
4. New revisions supersede, never overwrite, canonical artifacts.
5. Published artifacts retain full lineage and retention metadata.
6. Restricted media may expire while manifests, hashes, rights records, and derived observations remain.
7. Deletion requires retention-policy authorization and an auditable tombstone.
8. Reprocessing creates a new artifact version tied to the new worker/model/policy versions.