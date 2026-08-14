from __future__ import annotations

from pathlib import Path


WEB_ROOT = Path(__file__).resolve().parents[1] / "web-v3" / "src"
SKILLS_PAGE = WEB_ROOT / "pages" / "SkillsPage.tsx"
INSPECTOR = WEB_ROOT / "components" / "SkillInspector.tsx"
SKILLS_COPY = WEB_ROOT / "lib" / "i18n" / "skills.ts"


def _initial_load_body(path: Path) -> str:
    source = path.read_text(encoding="utf-8")
    start = source.index("const load =")
    end = source.index("useEffect(load", start)
    return source[start:end]


def test_registry_has_truthful_columns_and_no_duplicate_source_sidebar() -> None:
    source = SKILLS_PAGE.read_text(encoding="utf-8")

    for key in (
        "skills.columnSource",
        "skills.columnVariants",
        "skills.columnTargetStatus",
        "skills.columnLastUsed",
        "skills.columnActions",
    ):
        assert key in source
    assert "w-[180px] shrink-0" not in source
    assert "skills.columnCategory" not in source


def test_optional_governance_loads_do_not_block_summary() -> None:
    load = _initial_load_body(SKILLS_PAGE)

    assert "/api/skill-library/summary" in load
    assert "/telemetry" not in load
    assert "/target-status" not in load
    assert "Promise.all" not in load


def test_registry_has_only_available_metadata_controls_and_truthful_optional_states() -> None:
    source = SKILLS_PAGE.read_text(encoding="utf-8")

    for key in ("skills.filterSource", "skills.filterConsistency", "skills.sort", "skills.deployTarget"):
        assert key in source
    assert "capability" not in source.lower()
    assert "skills.checking" in source
    assert "skills.unavailable" in source
    assert "let active = true" in source
    assert "if (!active) return" in source


def test_consistency_summary_is_scoped_to_the_selected_target_and_validates_response_identity() -> None:
    source = SKILLS_PAGE.read_text(encoding="utf-8")
    copy = SKILLS_COPY.read_text(encoding="utf-8")

    assert "data.target !== target" in source
    assert "skills.targetDifferences" in source
    assert "skills.targetConsistent" in source
    assert "skills.globalDifferences" not in source
    assert "differ from target {target}" in copy


def test_inspector_compare_is_lazy_and_read_only() -> None:
    source = INSPECTOR.read_text(encoding="utf-8")

    assert "comparisonExpanded" in source
    assert "comparison?.target_skill_id" in source
    assert "api<Detail>(`/api/skill-library/${targetSkillId}`)" in source
    assert "method: 'POST'" in source


def test_inspector_requires_explicit_conflict_confirmation_and_restores_focus() -> None:
    source = INSPECTOR.read_text(encoding="utf-8")

    assert "expected_target_hash" in source
    assert "allow_conflict" in source
    assert "window.confirm" in source or "confirmConflict" in source
    assert "event.key === 'Escape'" in source
    assert "invoker?.focus()" in source


def test_inspector_keys_target_detail_and_implements_modal_focus_lifecycle() -> None:
    source = INSPECTOR.read_text(encoding="utf-8")

    assert "targetDetail?.skillId === targetSkillId" in source
    assert "setTargetDetail(null)" in source
    assert "closeButtonRef.current?.focus()" in source
    assert "event.key !== 'Tab'" in source
    assert "panelRef.current" in source
    assert "return () => { window.removeEventListener('keydown', onKeyDown); invoker?.focus() }" in source


def test_inspector_dedupes_inflight_target_detail_requests_and_retries_only_deliberately() -> None:
    source = INSPECTOR.read_text(encoding="utf-8")

    assert "const targetRequestRef = useRef(new Map<string, Promise<Detail>>())" in source
    assert "targetRequestRef.current.get(targetSkillId)" in source
    assert "targetRequestRef.current.set(targetSkillId, request)" in source
    assert "setTargetDetailRetry(value => value + 1)" in source


def test_inspector_reuses_per_target_promises_for_aba_changes_and_guards_stale_commits() -> None:
    source = INSPECTOR.read_text(encoding="utf-8")

    assert "const targetDetailCacheRef = useRef(new Map<string, Detail>())" in source
    assert "const targetRequestRef = useRef(new Map<string, Promise<Detail>>())" in source
    assert "const targetGenerationRef = useRef(new Map<string, number>())" in source
    assert "targetRequestRef.current.get(targetSkillId)" in source
    assert "targetDetailCacheRef.current.get(targetSkillId)" in source
    assert "currentTargetRef.current !== targetSkillId" in source
    assert "targetDetailCacheRef.current.clear()" in source
    assert "targetRequestRef.current.clear()" in source
    assert "targetDetailCacheRef.current.delete(targetSkillId)" in source


def test_successful_sync_invalidates_only_current_target_detail_before_refreshing() -> None:
    source = INSPECTOR.read_text(encoding="utf-8")

    assert "const invalidateTargetDetail = () =>" in source
    assert "targetGenerationRef.current.set(targetSkillId" in source
    assert "targetDetailCacheRef.current.delete(targetSkillId)" in source
    assert "targetRequestRef.current.delete(targetSkillId)" in source
    assert "invalidateTargetDetail()" in source
    assert "setTargetDetailRetry(value => value + 1)" in source


def test_initial_target_detail_generation_is_registered_before_response_guard() -> None:
    source = INSPECTOR.read_text(encoding="utf-8")

    register = source.index("targetGenerationRef.current.set(targetSkillId, generation)")
    guard = source.index("targetGenerationRef.current.get(targetSkillId) !== generation")
    assert register < guard


def test_inspector_parent_callbacks_are_stable_across_optional_data_rerenders() -> None:
    source = SKILLS_PAGE.read_text(encoding="utf-8")

    assert "const closeInspector = useCallback(() => setSelected(null), [])" in source
    assert "key={selected.id}" in source


def test_registry_copy_includes_governance_labels() -> None:
    source = SKILLS_COPY.read_text(encoding="utf-8")

    for key in (
        "skills.columnSource",
        "skills.columnVariants",
        "skills.columnTargetStatus",
        "skills.columnLastUsed",
        "skills.inSync",
        "skills.modified",
        "skills.missing",
        "skills.conflict",
        "skills.checking",
        "skills.unavailable",
        "skills.compareChanges",
        "skills.syncToTarget",
        "skills.confirmConflict",
        "skills.targetDifferences",
        "skills.targetConsistent",
    ):
        assert key in source
