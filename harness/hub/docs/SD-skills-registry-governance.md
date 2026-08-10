# Skills Registry and Deployment Governance Design

**Status:** Implemented, browser evidence pending
**Date:** 2026-08-10  
**Surface:** Harness Hub `#/skills`

## Verification evidence (2026-08-10)

- `pnpm lint` in `harness/hub/web-v3`: pass (`oxlint`, exit 0).
- Full backend verification on final HEAD: `435 passed, 1 skipped, 2 warnings in 145.24s`.
- Frontend build: the Task 4 builder recorded an elevated `pnpm build` pass in round 5 (`1862 modules`, `19.14 s`). The coordinator's independent build attempt remains blocked at Vite/esbuild `spawn EPERM` in this sandbox; that is environment provenance, not a failed source build.
- Summary endpoint measurement with FastAPI `TestClient`, excluding server startup:
  cold `519.90 ms`; ten warm samples `71.10, 51.61, 47.44, 42.26, 51.08, 47.28, 46.90, 45.24, 47.56, 49.81 ms`; warm p95 `71.10 ms` (within the `<=200 ms` target).
- A repeatable native Playwright acceptance script is present at `harness/hub/tests/ui_skills_registry_smoke.py`. It uses `HARNESS_UI_URL`, a `1440x960` viewport, holds telemetry and target-status independently to prove the registry table paints first, checks compare is read-only, and checks Escape focus restoration and console errors.
- The browser smoke is the sole pending gate: the Harness server started successfully through `harness/codex-stack/skills/webapp-testing/scripts/with_server.py`, but the `.ih` runtime has no `playwright`; the available Python 3.11 runtime was blocked from launching the Playwright driver by sandbox `WinError 5`. The required elevated retry could not be approved because the environment reported its usage limit.

The remaining fresh gate before this status can become fully `Implemented` is the Playwright smoke through `with_server.py` on a host allowed to launch browser subprocesses.

## 1. Goal

Turn Skills into a registry-first operational screen while preserving the fast metadata-only catalog path. Operators must be able to find a namespaced skill variant, understand how many variants exist, compare a chosen source variant with a deployment target, and synchronize safely with evidence.

The screen must distinguish three concepts:

- **Variant count:** inventory fact; never a warning by itself.
- **Selected-target consistency:** state of one source variant relative to one selected deployment target.
- **Target comparison:** the evidence and status used for that selected-target decision.

## 2. Usage

1. Operator opens Skills and immediately sees the registry table without waiting for hashes, telemetry, agents, or deploy logs.
2. Operator searches and filters by skill name, description, or source.
3. Operator chooses a deployment target. Target comparison loads asynchronously and updates the row status without redefining inventory.
4. Operator opens a skill inspector, chooses/observes the namespaced source variant, reviews source and target evidence, and optionally compares content.
5. Operator synchronizes to the selected target. Harness checks optimistic concurrency and conflict policy, creates the existing backup, records evidence, refreshes comparison state, and reports the result.

## 3. Information architecture

```text
Header: Skills                                            New skill
Description

Search | Source | Consistency | Sort                Target: <source>

Registry table (primary, always keeps usable height)
Skill | Source | Variants | Target status | Used by | Last used

Compact selected-target diagnostic: N differ from target <source> | Review

Right inspector / responsive overlay
identity | variants | source/target hashes | compare | sync | deploy evidence
```

Rules:

- Remove the duplicate source sidebar; source remains a toolbar filter.
- Selected-target diagnostics never consume the table's primary vertical area.
- Detail/compare opens beside or over the table, never below it.
- Controls use existing compact primitives. Do not resize the shared primary button.
- Status copy must be explicit: `Checking`, `In sync`, `Modified`, `Missing`, `Conflict`, or `Unavailable`.

## 4. Identity and canonical semantics

Harness does not invent a universal canonical source. The authoritative source for a sync operation is the exact namespaced `skill_id` selected by the operator, for example `claude_project/frontend-design`.

The target is a registered skill source such as `codex_stack`. A row whose source equals the selected target is `In sync` with itself and cannot deploy to itself.

This preserves existing fail-closed namespaced identity and avoids silently selecting a same-name variant from another source.

## 5. Backend contracts

### 5.1 Metadata summary

`GET /api/skill-library/summary`

Remains the first-paint contract. It may add cheap metadata derived from the in-memory index:

```json
{
  "id": "claude_project/frontend-design",
  "name": "frontend-design",
  "source": "claude_project",
  "description": "...",
  "variants_count": 3
}
```

It must not read full skill bodies, recursively hash assets, or scan telemetry. Search includes name, description, and source. Capability/tag search is excluded until those fields have a catalog contract.

### 5.2 Lazy telemetry

`GET /api/skill-library/telemetry`

Returns cached, bulk usage metadata keyed by logical skill name:

```json
{
  "status": "ready",
  "items": [{"name": "frontend-design", "last_used": "...", "use_count_30d": 4}]
}
```

Telemetry loads independently after the registry table. `Recently used` and `Uses in last 30 days` are disabled or absent until telemetry is ready. Telemetry failure leaves the primary table usable.

### 5.3 Target comparison

`GET /api/skill-library/target-status?target=<source>`

Returns one status per namespaced source variant. This endpoint may compute strong hashes and therefore loads asynchronously.

```json
{
  "target": "codex_stack",
  "items": [{
    "skill_id": "claude_project/frontend-design",
    "target_skill_id": "codex_stack/frontend-design",
    "status": "conflict",
    "source_hash": "sha256:...",
    "target_hash": "sha256:...",
    "baseline_hash": "sha256:...",
    "source_changed": true,
    "target_changed": true
  }]
}
```

Status rules, in order:

1. Source equals target -> `in_sync`.
2. Target variant absent -> `missing`.
3. Source hash equals target hash -> `in_sync`.
4. A deploy baseline exists and source and target both differ from it -> `conflict`.
5. Otherwise -> `modified`.

The endpoint never returns filesystem paths, content, credentials, or adapter configuration.

### 5.4 Safe synchronization

Existing deploy endpoint is extended without breaking old callers:

```json
{
  "target": "codex_stack",
  "expected_target_hash": "sha256:...",
  "allow_conflict": false
}
```

- Recompute target state immediately before write.
- If target hash differs from `expected_target_hash`, return HTTP 409.
- If status is `conflict` and `allow_conflict` is false, return HTTP 409.
- UI may resend with `allow_conflict: true` only after an explicit confirmation from the inspector.
- Preserve backup-before-copy behavior.
- Deploy log records `source_hash`, `target_hash_before`, `baseline_hash_after`, source skill ID, target, timestamp, and destination path.
- After successful sync, the source and target hashes must match and comparison returns `in_sync`.

Legacy requests containing only `target` retain current behavior for non-conflict states, but still receive concurrency protection when an expected hash is supplied.

## 6. Inspector and compare

Selecting a row opens a right inspector on desktop and an accessible overlay on narrow screens. It shows:

- namespaced identity and description;
- source and selected target;
- all discovered variants;
- comparison status and hashes;
- latest deploy evidence;
- `Compare changes` and `Sync to target` actions.

Compare loads only the selected source detail and matching target detail, then renders bounded side-by-side text. It performs no writes. Missing targets show an empty target state rather than an error.

## 7. Loading, error, and accessibility states

- Summary loading: table skeleton/explicit loading state.
- Optional comparison/telemetry failure: local `Unavailable`; no global page failure.
- Selected-target consistency pending: neutral, never amber.
- Amber only for `modified` or `missing` selected-target results.
- Conflict uses error/critical styling and requires explicit review.
- Inspector has dialog/complementary semantics as appropriate, Escape close, visible focus, and focus restoration.
- Row and action controls remain keyboard reachable; status is never communicated by color alone.

## 8. Performance constraints

- Preserve metadata-only first paint and current summary latency budgets.
- Summary must still perform zero full-body and recursive content reads.
- Target comparison and telemetry are parallel optional requests and cannot block table rendering.
- No N+1 detail requests for table rows. Detail content loads only for the open inspector/compare.

## 9. Acceptance criteria

- Registry remains visible with large inventories and when optional endpoints are delayed or fail.
- Filters name their dimensions and search covers name, description, and source.
- Variant count is displayed independently from consistency and target status.
- Unique one-variant skills are not warnings.
- Target fixtures cover `in_sync`, `modified`, `missing`, and `conflict`.
- Changing target recalculates row status but does not change inventory rows.
- Recently-used sorting is unavailable before telemetry and correct after telemetry.
- Compare is read-only and loads exactly two selected variants at most.
- Sync rejects stale target hashes and unapproved conflicts, preserves backup behavior, logs evidence, and becomes `in_sync` after success.
- Existing summary performance, skill CRUD, deploy, agent resolution, and run pin tests remain green.
- Frontend lint/build and rendered keyboard/browser acceptance pass.

## 10. Explicit exclusions

- No universal canonical-source policy.
- No capability/tag search until metadata supports it.
- No changes to skill selection, prompt loading, capability authorization, or workflow execution.
- No automatic background sync and no silent conflict overwrite.
- No package/framework addition solely for this screen.

## 11. Rollback

UI can fall back to metadata summary plus selected-target diagnostic. New telemetry and target-status endpoints are additive. Deploy request extensions are optional and preserve the existing backup/log path. Removing the new UI does not alter stored skills or agent manifests.
