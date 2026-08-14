# Skills Registry Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a registry-first Skills UI with truthful variant metadata, lazy telemetry, target-aware comparison, read-only compare, and conflict-safe synchronization.

**Architecture:** Keep `GET /api/skill-library/summary` as the metadata-only first-paint path. Add lazy bulk telemetry and target-status contracts in the existing skill-library service/API, then consume them from a focused Skills page plus a separate inspector component. Strong hashes, conflict baselines, and deploy evidence remain server-authoritative; the frontend never derives governance status itself.

**Tech Stack:** Python 3.11, FastAPI, pytest, React 19, TypeScript, Tailwind utility classes, existing Harness UI primitives, Playwright smoke script.

## Global Constraints

- Namespaced `skill_id` is the operation source of truth; do not introduce a universal canonical-source policy.
- Summary first paint must perform zero full-body reads, recursive content reads, or telemetry scans.
- Telemetry and target comparison load independently and cannot block or clear the primary registry table.
- Target statuses are exactly `in_sync | modified | missing | conflict` on successful comparison; transport/loading errors are UI state, not persisted domain status.
- Conflict requires a deploy baseline where both current source and current target differ from the baseline and differ from each other.
- Sync must preserve backup-before-copy and append evidence. Stale expected target hash and unapproved conflict return HTTP 409.
- Do not expose filesystem paths, content, credentials, or adapter configuration in summary, telemetry, or target-status responses.
- Do not change skill selection, prompt loading, capability authorization, agent manifests, or workflow execution.
- Do not add a package or frontend test framework.
- All UI copy goes through `t()` and existing compact UI primitives remain authoritative.

---

## File Structure

- Modify `harness/hub/services/skill_library.py`: summary enrichment, telemetry projection, comparison model, deploy preconditions/evidence.
- Modify `harness/hub/api/skills.py`: additive telemetry and target-status routes plus safe deploy request mapping.
- Modify `harness/hub/tests/test_skill_catalog_performance_spec.py`: protect metadata-only first paint and summary search/count behavior.
- Create `harness/hub/tests/test_skill_governance_spec.py`: public target-status, telemetry, concurrency, conflict, and evidence requirements.
- Modify `harness/hub/tests/test_skill_library.py`: preserve legacy deploy/backup/log behavior.
- Modify `harness/hub/tests/fixtures/route_inventory.json`: register additive GET routes.
- Modify `harness/hub/web-v3/src/pages/SkillsPage.tsx`: registry IA, lazy optional data, target filter, compact diagnostic banner.
- Create `harness/hub/web-v3/src/components/SkillInspector.tsx`: detail, variants, compare, sync, focus-safe inspector.
- Modify `harness/hub/web-v3/src/lib/i18n/skills.ts`: explicit registry/governance copy.
- Create `harness/hub/tests/test_skill_registry_ui_spec.py`: frontend public/source contract without adding a test framework.
- Create `harness/hub/tests/ui_skills_registry_smoke.py`: rendered Playwright acceptance.
- Modify `harness/hub/docs/SD-skills-registry-governance.md`: mark implemented contracts/evidence only after verification.

### Task 1: Metadata Summary and Lazy Telemetry

**Files:**
- Modify: `harness/hub/tests/test_skill_catalog_performance_spec.py`
- Create: `harness/hub/tests/test_skill_governance_spec.py`
- Modify: `harness/hub/services/skill_library.py`
- Modify: `harness/hub/api/skills.py`
- Modify: `harness/hub/tests/fixtures/route_inventory.json`

**Interfaces:**
- Produces: `list_skill_telemetry() -> dict[str, Any]`
- Produces: `GET /api/skill-library/telemetry -> {status, items[]}`
- Extends: summary item with `variants_count: int`
- Extends: summary search to include `source`

- [ ] **Step 1: Write failing public-contract tests**

Add tests with these assertions:

```python
def test_summary_exposes_variant_count_without_hashing_or_telemetry(summary_sources, monkeypatch):
    monkeypatch.setattr(sl, "_content_hash", lambda _: (_ for _ in ()).throw(AssertionError("hash")))
    monkeypatch.setattr(sl, "_safe_collect_skill_tool_events", lambda: (_ for _ in ()).throw(AssertionError("telemetry")))
    data = _summary(TestClient(server.app), "query=claude_project&limit=10")
    assert data["total"] == 1
    assert data["items"][0]["variants_count"] == 2


def test_telemetry_endpoint_is_bulk_and_contains_no_skill_content(monkeypatch):
    monkeypatch.setattr(sl, "_safe_collect_skill_tool_events", lambda: [
        {"skill": "skillspector", "ts": "2026-08-10T00:00:00+00:00"}
    ])
    response = TestClient(server.app).get("/api/skill-library/telemetry")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["items"] == [{"name": "skillspector", "last_used": "2026-08-10T00:00:00+00:00", "use_count_30d": 1}]
    assert "content" not in response.text
    assert "path" not in response.text
```

- [ ] **Step 2: Run RED tests**

Run:

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
& 'C:\Users\HUY\workspace\ai-project-opus\.ih\Scripts\python.exe' -m pytest harness\hub\tests\test_skill_catalog_performance_spec.py harness\hub\tests\test_skill_governance_spec.py -q
```

Expected: failures because `variants_count`, `list_skill_telemetry`, and the telemetry route do not exist.

- [ ] **Step 3: Implement cheap variant aggregation**

In `list_skill_summary`, compute counts from already indexed rows and keep the returned keys bounded:

```python
variant_counts: dict[str, int] = {}
for row in rows:
    variant_counts[str(row["name"])] = variant_counts.get(str(row["name"]), 0) + 1

items = [
    {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "source": row["source"],
        "variants_count": variant_counts[str(row["name"])],
    }
    for row in filtered_rows[offset:offset + limit]
]
```

Search predicate must include `str(row["source"]).lower()`.

- [ ] **Step 4: Implement lazy telemetry projection and API**

Add:

```python
def list_skill_telemetry() -> dict[str, Any]:
    names = sorted({str(row["name"]) for row in _scan_all_sources()})
    events = _safe_collect_skill_tool_events()
    items = []
    for name in names:
        last_used, use_count_30d = _telemetry(name, events)
        if last_used is not None:
            items.append({"name": name, "last_used": last_used, "use_count_30d": use_count_30d})
    return {"status": "ready", "items": items}
```

Expose an explicit route before the catch-all detail route:

```python
@router.get("/api/skill-library/telemetry")
def api_skill_library_telemetry() -> dict[str, object]:
    return skill_library.list_skill_telemetry()
```

- [ ] **Step 5: Update route inventory and run GREEN tests**

Run the Task 1 command plus:

```powershell
& 'C:\Users\HUY\workspace\ai-project-opus\.ih\Scripts\python.exe' -m pytest harness\hub\tests\test_route_inventory.py -q
```

- [ ] **Step 6: Commit Task 1**

```powershell
git add harness/hub/services/skill_library.py harness/hub/api/skills.py harness/hub/tests/test_skill_catalog_performance_spec.py harness/hub/tests/test_skill_governance_spec.py harness/hub/tests/fixtures/route_inventory.json
git commit -m "feat(harness): add skill registry metadata"
```

### Task 2: Target Comparison Domain

**Files:**
- Modify: `harness/hub/tests/test_skill_governance_spec.py`
- Modify: `harness/hub/services/skill_library.py`
- Modify: `harness/hub/api/skills.py`
- Modify: `harness/hub/tests/fixtures/route_inventory.json`

**Interfaces:**
- Produces: `target_status(target: str) -> dict[str, Any]`
- Produces: `GET /api/skill-library/target-status?target=<source>`
- Consumes: latest evidence records written by Task 3 when present; absence yields `modified`, never `conflict`

- [ ] **Step 1: Write RED fixtures for all statuses**

Create same-name source/target fixtures and assert:

```python
response = client.get("/api/skill-library/target-status?target=codex_user")
assert response.status_code == 200
by_id = {item["skill_id"]: item for item in response.json()["items"]}
assert by_id["claude_user/same"]["status"] == "in_sync"
assert by_id["claude_user/changed"]["status"] == "modified"
assert by_id["claude_user/absent"]["status"] == "missing"
assert by_id["codex_user/same"]["status"] == "in_sync"
assert not {"path", "content"} & set(by_id["claude_user/changed"])
```

Write a deploy-log record with `baseline_hash_after`, then change both source and target and assert `conflict`, `source_changed is True`, and `target_changed is True`.

- [ ] **Step 2: Verify RED**

Run:

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
& 'C:\Users\HUY\workspace\ai-project-opus\.ih\Scripts\python.exe' -m pytest harness\hub\tests\test_skill_governance_spec.py -q
```

Expected: target-status route/function missing.

- [ ] **Step 3: Implement comparison with explicit ordering**

Add internal helpers that resolve exact `(source, name)` variants and latest matching baseline. Implement this decision order verbatim:

```python
if source == target:
    status = "in_sync"
elif target_entry is None:
    status = "missing"
elif source_hash == target_hash:
    status = "in_sync"
elif baseline_hash and source_hash != baseline_hash and target_hash != baseline_hash:
    status = "conflict"
else:
    status = "modified"
```

Return only IDs, sources, target, hashes, baseline, booleans, and status. Sort by `(name, source)`.

- [ ] **Step 4: Add validated API route**

```python
@router.get("/api/skill-library/target-status")
def api_skill_library_target_status(target: str) -> dict[str, object]:
    try:
        return skill_library.target_status(target)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
```

Invalid targets return sanitized HTTP 400.

- [ ] **Step 5: Run GREEN and regression tests**

Run Task 2 tests plus `test_skill_library.py`, `test_skill_catalog_performance_spec.py`, and `test_route_inventory.py`.

- [ ] **Step 6: Commit Task 2**

```powershell
git add harness/hub/services/skill_library.py harness/hub/api/skills.py harness/hub/tests/test_skill_governance_spec.py harness/hub/tests/fixtures/route_inventory.json
git commit -m "feat(harness): compare skill deployment targets"
```

### Task 3: Conflict-Safe Synchronization and Evidence

**Files:**
- Modify: `harness/hub/tests/test_skill_governance_spec.py`
- Modify: `harness/hub/tests/test_skill_library.py`
- Modify: `harness/hub/services/skill_library.py`
- Modify: `harness/hub/api/skills.py`

**Interfaces:**
- Extends: `deploy(skill_id, target, *, expected_target_hash=None, allow_conflict=False)`
- Produces deploy evidence fields: `source_hash`, `target_hash_before`, `baseline_hash_after`
- Produces: `SkillConflictError` and `SkillPreconditionError` so API status mapping never depends on exception text
- API maps those two typed preconditions to HTTP 409 with sanitized detail

- [ ] **Step 1: Write RED synchronization tests**

Tests must prove:

```python
with pytest.raises(sl.SkillPreconditionError, match="Target changed since comparison"):
    sl.deploy("claude_user/skillspector", "codex_user", expected_target_hash="sha256:stale")

with pytest.raises(sl.SkillConflictError, match="Conflict requires review"):
    sl.deploy("claude_user/skillspector", "codex_user", allow_conflict=False)

result = sl.deploy(
    "claude_user/skillspector",
    "codex_user",
    expected_target_hash=current_target_hash,
    allow_conflict=True,
)
assert result["status"] == "in_sync"
items = sl.target_status("codex_user")["items"]
assert next(item for item in items if item["skill_id"] == "claude_user/skillspector")["status"] == "in_sync"
```

Also assert backup content and evidence log fields.

- [ ] **Step 2: Verify RED**

Expected failure: current deploy signature accepts neither precondition and log lacks hashes.

- [ ] **Step 3: Implement preflight and evidence**

Before moving/copying:

```python
source_hash = _content_hash(source_path)
target_hash_before = _content_hash(dest_path) if dest_path.exists() else None
comparison = _target_status_for_entry(entry, target, latest_baseline)
if expected_target_hash is not None and expected_target_hash != target_hash_before:
    raise SkillPreconditionError("Target changed since comparison")
if comparison["status"] == "conflict" and not allow_conflict:
    raise SkillConflictError("Conflict requires review")
```

After copy, compute `baseline_hash_after`; require it equals `source_hash`. Append the extended log record and return the hashes/status without returning source content.

- [ ] **Step 4: Map API preconditions**

Parse only typed values:

```python
target = payload.get("target")
expected = payload.get("expected_target_hash")
allow_conflict = payload.get("allow_conflict", False)
if expected is not None and not isinstance(expected, str):
    raise HTTPException(status_code=400, detail="expected_target_hash must be a string")
if not isinstance(allow_conflict, bool):
    raise HTTPException(status_code=400, detail="allow_conflict must be a boolean")
```

Return 409 for stale/conflict preconditions and retain existing 400/404 behavior for invalid target/missing skill.

- [ ] **Step 5: Run GREEN, legacy deploy, and API tests**

Run `test_skill_governance_spec.py`, `test_skill_library.py`, `test_added_api_endpoints.py`, and `test_route_inventory.py`.

- [ ] **Step 6: Commit Task 3**

```powershell
git add harness/hub/services/skill_library.py harness/hub/api/skills.py harness/hub/tests/test_skill_governance_spec.py harness/hub/tests/test_skill_library.py
git commit -m "feat(harness): guard skill synchronization"
```

### Task 4: Registry UI and Inspector

**Files:**
- Create: `harness/hub/tests/test_skill_registry_ui_spec.py`
- Modify: `harness/hub/web-v3/src/pages/SkillsPage.tsx`
- Create: `harness/hub/web-v3/src/components/SkillInspector.tsx`
- Modify: `harness/hub/web-v3/src/lib/i18n/skills.ts`

**Interfaces:**
- Consumes summary `variants_count`
- Consumes lazy telemetry keyed by `name`
- Consumes lazy target status keyed by namespaced `skill_id`
- Inspector calls existing detail endpoints for at most source and target variants
- Inspector sync sends `target`, `expected_target_hash`, and explicit `allow_conflict`

- [ ] **Step 1: Write RED UI contract tests**

Assert source contracts that survive implementation refactoring:

```python
def test_registry_has_truthful_columns_and_no_duplicate_source_sidebar():
    source = SKILLS_PAGE.read_text(encoding="utf-8")
    for key in ("skills.columnSource", "skills.columnVariants", "skills.columnTargetStatus", "skills.columnLastUsed"):
        assert key in source
    assert "w-[180px] shrink-0" not in source


def test_optional_governance_loads_do_not_block_summary():
    load = _initial_load_body(SKILLS_PAGE)
    assert "/api/skill-library/summary" in load
    assert "/telemetry" not in load
    assert "/target-status" not in load


def test_inspector_requires_explicit_conflict_confirmation():
    source = INSPECTOR.read_text(encoding="utf-8")
    assert "expected_target_hash" in source
    assert "allow_conflict" in source
    assert "window.confirm" in source or "confirmConflict" in source
```

- [ ] **Step 2: Verify RED**

Run `test_skill_registry_ui_spec.py`; expect missing component/copy/contracts.

- [ ] **Step 3: Implement primary registry layout**

Keep initial summary request isolated. Remove the 180px source aside. Render toolbar and a table that owns `min-h-0 flex-1`; diagnostic banner is `shrink-0` and contains only aggregate counts plus a disclosure action.

Use columns:

```text
Skill | Source | Variants | Target status | Used by | Last used | Actions
```

Before target status loads, show neutral `Checking`; on failure show `Unavailable`. Never infer target status from global drift.

- [ ] **Step 4: Implement lazy telemetry and target effects**

Fetch telemetry once after summary. Fetch target status whenever `target` changes, cancel stale effects with an `active` boolean, and merge by `skill_id`/logical name in memoized view data. Enable usage sorts only when telemetry status is ready.

- [ ] **Step 5: Implement `SkillInspector`**

Props:

```ts
type SkillInspectorProps = {
  skill: SkillSummaryItem
  target: string
  comparison?: TargetStatusItem
  variants: SkillSummaryItem[]
  onClose: () => void
  onSynced: () => void
}
```

Load source detail on open. Load target detail only when comparison has `target_skill_id` and compare is expanded. Render bounded side-by-side `<pre>` elements. Restore focus to the invoking row/action after close. For conflict sync, require explicit confirmation before sending `allow_conflict: true`; all other sync requests send false.

- [ ] **Step 6: Add explicit i18n copy**

Add keys for `Source`, `Consistency`, `Variants`, `Target status`, all target states, `Checking`, `Unavailable`, `Compare changes`, `Sync to target`, conflict confirmation, evidence labels, global differences summary, and `Latest variant update`. Remove UI use of misleading `Category` and `Recently used` before telemetry readiness.

- [ ] **Step 7: Run UI contracts, lint, and build**

Run:

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
& 'C:\Users\HUY\workspace\ai-project-opus\.ih\Scripts\python.exe' -m pytest harness\hub\tests\test_skill_registry_ui_spec.py harness\hub\tests\test_skill_catalog_performance_spec.py -q
cd harness\hub\web-v3
pnpm lint
pnpm build
```

- [ ] **Step 8: Commit Task 4**

```powershell
git add harness/hub/web-v3/src/pages/SkillsPage.tsx harness/hub/web-v3/src/components/SkillInspector.tsx harness/hub/web-v3/src/lib/i18n/skills.ts harness/hub/tests/test_skill_registry_ui_spec.py
git commit -m "feat(harness): redesign skills registry"
```

### Task 5: Rendered Acceptance and Documentation

**Files:**
- Create: `harness/hub/tests/ui_skills_registry_smoke.py`
- Modify: `harness/hub/docs/SD-skills-registry-governance.md`

**Interfaces:**
- Consumes the final public UI/API behavior only
- Produces repeatable browser evidence; no production behavior

- [ ] **Step 1: Write browser acceptance**

The script opens `/#/skills` at 1440x960 and asserts:

```python
expect(page.get_by_role("heading", name="Skills")).to_be_visible()
expect(page.get_by_role("table")).to_be_visible()
assert page.get_by_role("row").count() > 1
expect(page.get_by_text("Deployment target", exact=True)).to_be_visible()
expect(page.get_by_text(re.compile("skills? differ across sources|All variants are consistent"))).to_be_visible()
```

Then select a row, verify inspector semantics, open compare without a write request, close with Escape, and assert focus restoration plus zero console errors. Use request interception to prove telemetry/target-status delay does not hide the table.

- [ ] **Step 2: Run browser smoke through the existing server harness**

Use the same `HARNESS_UI_URL`/Playwright pattern as `ui_skill_resolution_smoke.py`. Record the exact server command, browser command, viewport, elapsed first-table time, and result.

- [ ] **Step 3: Run full verification**

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
& 'C:\Users\HUY\workspace\ai-project-opus\.ih\Scripts\python.exe' -m pytest harness\hub\tests -q
cd harness\hub\web-v3
pnpm lint
pnpm build
```

Also re-measure summary cold and warm p95; retain the current `<= 200 ms` warm target.

- [ ] **Step 4: Update design evidence**

Change design status to `Implemented` only when backend suite, lint, build, and browser smoke have fresh passing evidence. Add exact commands/results and list any deferred non-blocking findings.

- [ ] **Step 5: Commit Task 5**

```powershell
git add harness/hub/tests/ui_skills_registry_smoke.py harness/hub/docs/SD-skills-registry-governance.md
git commit -m "docs(harness): verify skills governance UI"
```

## Final Review Gate

- Generate one review package from merge base `origin/main` through final HEAD.
- Reviewer checks every acceptance criterion in `harness/hub/docs/SD-skills-registry-governance.md` and all deferred findings in the SDD ledger.
- Any Critical/Important finding gets one consolidated fix wave and one scoped re-review.
- Do not merge or push until full backend suite, lint, build, and available browser smoke pass on the final tree.
