# Skill Catalog Performance Specification

**Status:** Approved for implementation  
**Date:** 2026-08-10  
**Scope:** Harness Hub skill and agent catalog read paths

## 1. Usage and problem

An operator opens the Skills page to browse the catalog, or the Agents page to inspect and edit agents. The first useful table must appear without waiting for optional drift, telemetry, deploy-log, or editor-only data. Listing skills must not read full `SKILL.md` bodies or recursively hash skill assets.

Measured baseline with 136 skills: metadata inventory 0.172 s; full catalog 5.4-5.9 s with a 24.254 s observed spike; drift 1.482 s; agent catalog 2.737 s; combined browser verification 54.3 s.

## 2. Requirements

### P0 functional requirements

- **FR-1 Summary contract:** Catalog listing returns metadata sufficient for the table without loading full skill bodies, recursively hashing directories, or scanning usage logs.
- **FR-2 Progressive Skills UI:** The Skills table renders when summary data is ready. Drift, deploy log, and agent usage load independently and cannot block or erase the table.
- **FR-3 Progressive Agents UI:** The Agents table renders without waiting for the skill catalog. Skill choices may load when the editor needs them.
- **FR-4 Strong integrity preserved:** Skill detail, deploy, verification, and run pinning may compute a strong recursive content hash. Moving hashing off the listing path must not weaken this evidence.
- **FR-5 Shared identity:** Summary and detail use the existing namespaced skill ID and preserve collision behavior.
- **FR-6 Failure isolation:** Failure of optional drift, telemetry, or deploy-log data is represented locally and does not fail the primary catalog.

### P0 non-functional requirements

- **NFR-1:** Skills first useful table cold target <= 2 s in the browser acceptance environment.
- **NFR-2:** Agents first useful table cold target <= 1 s in the browser acceptance environment.
- **NFR-3:** Warm skill-summary API p95 target <= 200 ms on the local fixture catalog.
- **NFR-4:** Summary endpoint performs zero full-body reads and zero recursive content reads for skill directories.
- **NFR-5:** One refresh operation owns filesystem discovery; concurrent readers consume an immutable snapshot rather than duplicating scans.
- **NFR-6:** No secrets, skill bodies, adapter configuration, or external paths newly exposed by summary responses.

### P1 requirements

- **FR-7 Pagination/filtering:** Summary supports server-side offset/limit plus query/source filtering and returns total count.
- **FR-8 Snapshot status:** Responses expose index revision/update status so stale-while-revalidate can be audited.
- **FR-9 Derived data:** Drift and telemetry consume cached/materialized data and remain outside the primary rendering path.

## 3. Explicit exclusions

- Do not remove strong SHA-256 hashing from deploy, integrity verification, or run pinning.
- Do not redesign skill selection, capability authorization, or workflow execution semantics.
- Do not add a new frontend framework or browser-test framework solely for this change.
- Do not claim performance success by increasing timeouts.

## 4. Design contract

The backend exposes a lightweight summary/index read path. Full content and strong hash are selected-skill operations. The frontend treats catalog summary as critical data and drift, telemetry, deploy log, and editor options as independently loadable data.

Preferred flow:

```text
skill sources -> metadata snapshot -> paginated summary API -> first table
selected skill -> detail loader -> full SKILL.md
deploy/run/verify -> strong recursive hash -> immutable evidence pin
snapshot -> background/lazy drift and telemetry
```

The implementation may begin with an in-process immutable snapshot and explicit invalidation. Persistent indexing or filesystem watching is not required in this wave.

## 5. Build and verification plan

1. Add specification-level backend tests proving FR-1, FR-4, FR-5, FR-6, FR-7 and NFR-4. Run them RED before production edits.
2. Implement the minimum summary/index contract and API required to make backend tests GREEN.
3. Add frontend contract/static or browser acceptance tests proving FR-2 and FR-3. Delayed optional endpoints must not block the primary table.
4. Implement progressive UI loading and failure isolation.
5. Run targeted backend tests, existing skill/agent regression tests, frontend lint/build, and browser acceptance when the environment supports it.
6. Review each requirement above against evidence. Performance claims require fresh measurements, not code inspection.

## 6. Rollback

The existing `/api/skill-library` detail-compatible behavior remains available until callers migrate. If summary rollout fails, frontend calls can be reverted without changing skill content, agent manifests, deploy evidence, or run pins.
