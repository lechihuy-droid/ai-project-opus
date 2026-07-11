# G12 — Publication

**Verb:** Publish

## Input
- validated `VideoArtifact`
- `RenderReport`
- project publication policy
- required metadata and provenance

## Worker
Deterministic publication service with optional human release approval. No GPT or Codex.

## Transform
Package the final video, sidecar captions, thumbnails/previews, metadata, provenance, hashes, workflow history, and distribution targets.

## Output
- `PublicationBundle`

## Verify
- required artifacts and checksums exist
- rights and attribution requirements are satisfied
- publication metadata matches target platform
- artifact versions and lineage are complete
- release approval is valid

## Failure routing
Metadata defects remain in G12. Media defects return to G11. Rights/provenance defects return to the owning resource or content gate. Publication is never partially marked successful without an explicit partial-release state.