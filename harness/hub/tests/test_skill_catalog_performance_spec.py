from __future__ import annotations

import os
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import config
import server
from services import skill_library as sl


FIXTURES = Path(__file__).resolve().parent / "fixtures" / "skills"
SKILLS_PAGE = Path(__file__).resolve().parents[1] / "web-v3" / "src" / "pages" / "SkillsPage.tsx"
AGENTS_PAGE = Path(__file__).resolve().parents[1] / "web-v3" / "src" / "pages" / "AgentsPage.tsx"


@pytest.fixture()
def summary_sources(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> dict[str, Path]:
    root = tmp_path / "skills"
    shutil.copytree(FIXTURES, root)
    sources = {
        "claude_user": root / "claude_user",
        "claude_project": root / "claude_project",
        "codex_user": root / "codex_user",
    }
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    monkeypatch.setitem(config.USAGE_SOURCES, "claude", tmp_path / "empty_claude_projects")
    sl._clear_cache()
    return sources


def _client() -> TestClient:
    return TestClient(server.app, headers={"X-Hub-Token": config.HUB_TOKEN})


def _summary(client: TestClient, query: str = "") -> dict[str, object]:
    response = client.get(f"/api/skill-library/summary?{query}".rstrip("?"))
    assert response.status_code == 200, response.text
    data = response.json()
    assert set(("items", "total", "offset", "limit", "revision", "status")) <= set(data)
    assert isinstance(data["items"], list)
    return data


def test_summary_listing_never_reads_full_skill_bodies_or_recursive_assets(
    summary_sources: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A full SKILL.md read or recursive directory walk on this path is a regression."""
    original_read_text = Path.read_text
    original_read_bytes = Path.read_bytes

    def reject_skill_body_read(path: Path, *args: object, **kwargs: object) -> str:
        if path.name == "SKILL.md":
            raise AssertionError("summary listing read a full SKILL.md body")
        return original_read_text(path, *args, **kwargs)

    def reject_skill_bytes_read(path: Path, *args: object, **kwargs: object) -> bytes:
        if path.name == "SKILL.md":
            raise AssertionError("summary listing read SKILL.md bytes")
        return original_read_bytes(path, *args, **kwargs)

    def reject_recursive_asset_walk(_: Path) -> list[Path]:
        raise AssertionError("summary listing recursively walked skill assets")

    monkeypatch.setattr(Path, "read_text", reject_skill_body_read)
    monkeypatch.setattr(Path, "read_bytes", reject_skill_bytes_read)
    monkeypatch.setattr(sl, "_skill_files", reject_recursive_asset_walk)
    monkeypatch.setattr(
        sl,
        "_safe_collect_skill_tool_events",
        lambda: (_ for _ in ()).throw(AssertionError("summary listing scanned telemetry")),
    )

    data = _summary(_client(), "offset=0&limit=10")
    items = data["items"]
    assert {item["id"] for item in items} == {
        "claude_user/skillspector",
        "claude_project/skillspector",
        "codex_user/lonewolf",
    }
    for item in items:
        assert {"id", "name", "description", "source"} <= set(item)
        assert not {"content", "content_hash", "path", "last_used", "use_count_30d"} & set(item)


def test_summary_preserves_namespaced_identity_for_same_name_collisions(summary_sources: dict[str, Path]) -> None:
    data = _summary(_client(), "query=skillspector&offset=0&limit=10")

    assert data["total"] == 2
    assert {(item["id"], item["source"], item["name"]) for item in data["items"]} == {
        ("claude_project/skillspector", "claude_project", "skillspector"),
        ("claude_user/skillspector", "claude_user", "skillspector"),
    }


def test_summary_includes_variant_count_from_full_index_before_filtering_and_pagination(
    summary_sources: dict[str, Path],
) -> None:
    data = _summary(TestClient(server.app), "source=claude_user&offset=0&limit=1")

    assert data["items"] == [
        {
            "id": "claude_user/skillspector",
            "name": "skillspector",
            "description": "Fixture skill variant A used to test skill_library drift detection.",
            "source": "claude_user",
            "variants_count": 2,
        }
    ]


def test_summary_search_matches_source_metadata(summary_sources: dict[str, Path]) -> None:
    data = _summary(TestClient(server.app), "query=claude_project&offset=0&limit=10")

    assert data["total"] == 1
    assert data["items"][0]["id"] == "claude_project/skillspector"


def test_summary_applies_server_side_pagination_and_filters_and_rejects_invalid_ranges(
    summary_sources: dict[str, Path]
) -> None:
    client = _client()

    page = _summary(client, "query=skillspector&offset=1&limit=1")
    assert page["total"] == 2
    assert page["offset"] == 1
    assert page["limit"] == 1
    assert len(page["items"]) == 1
    assert page["items"][0]["id"] == "claude_user/skillspector"

    filtered = _summary(client, "source=codex_user&offset=0&limit=10")
    assert filtered["total"] == 1
    assert filtered["items"] == [
        {
            "id": "codex_user/lonewolf",
            "name": "lonewolf",
            "description": "Unique fixture skill with no coverage overlap in other sources.",
            "source": "codex_user",
            "variants_count": 1,
        }
    ]

    assert client.get("/api/skill-library/summary?offset=-1&limit=1").status_code == 422
    assert client.get("/api/skill-library/summary?offset=0&limit=0").status_code == 422


def test_summary_can_return_a_catalog_larger_than_its_default_page(summary_sources: dict[str, Path]) -> None:
    for index in range(98):
        skill_dir = summary_sources["codex_user"] / f"extra-{index:03d}"
        skill_dir.mkdir()
        (skill_dir / "SKILL.md").write_text(
            f"---\nname: extra-{index:03d}\ndescription: fixture\n---\nbody\n",
            encoding="utf-8",
        )
    sl._clear_cache()

    data = _summary(_client(), "offset=0&limit=500")

    assert data["total"] == 101
    assert len(data["items"]) == 101


def test_summary_reuses_validated_fingerprint_without_stats_inside_ttl(
    summary_sources: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A warm summary must not re-stat catalog roots or known SKILL.md files."""
    clock = [100.0]
    monkeypatch.setattr(sl.time, "monotonic", lambda: clock[0])
    sl._clear_cache()
    first = sl.list_skill_summary(limit=10)

    stat_paths: list[Path] = []
    original_dir_mtime = sl._dir_mtime_ns

    def counted_dir_mtime(path: Path) -> int:
        stat_paths.append(path)
        return original_dir_mtime(path)

    monkeypatch.setattr(sl, "_dir_mtime_ns", counted_dir_mtime)

    second = sl.list_skill_summary(limit=10)

    assert stat_paths == []
    assert second["revision"] == first["revision"]
    assert second["items"] == first["items"]


def test_summary_revalidates_exactly_once_after_monotonic_ttl_expiry(
    summary_sources: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    clock = [100.0]
    monkeypatch.setattr(sl.time, "monotonic", lambda: clock[0])
    sl._clear_cache()
    sl.list_skill_summary(limit=10)

    fingerprint_calls = 0
    stat_paths: list[Path] = []
    original_fingerprint = sl._fingerprint_sources
    original_dir_mtime = sl._dir_mtime_ns

    def counted_fingerprint() -> object:
        nonlocal fingerprint_calls
        fingerprint_calls += 1
        return original_fingerprint()

    def counted_dir_mtime(path: Path) -> int:
        stat_paths.append(path)
        return original_dir_mtime(path)

    monkeypatch.setattr(sl, "_fingerprint_sources", counted_fingerprint)
    monkeypatch.setattr(sl, "_dir_mtime_ns", counted_dir_mtime)
    clock[0] += 1.01

    sl.list_skill_summary(limit=10)

    assert fingerprint_calls == 1
    assert stat_paths


def test_fingerprint_ttl_starts_after_successful_validation(
    summary_sources: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    clock = [100.0]
    monkeypatch.setattr(sl.time, "monotonic", lambda: clock[0])
    sl._clear_cache()
    original_fingerprint = sl._fingerprint_sources

    def delayed_fingerprint() -> object:
        clock[0] = 100.75
        return original_fingerprint()

    monkeypatch.setattr(sl, "_fingerprint_sources", delayed_fingerprint)
    sl.list_skill_summary(limit=10)

    stat_paths: list[Path] = []
    original_dir_mtime = sl._dir_mtime_ns

    def counted_dir_mtime(path: Path) -> int:
        stat_paths.append(path)
        return original_dir_mtime(path)

    monkeypatch.setattr(sl, "_dir_mtime_ns", counted_dir_mtime)
    clock[0] = 101.1

    sl.list_skill_summary(limit=10)

    assert stat_paths == []


def test_clear_cache_forces_fingerprint_validation_before_ttl_expiry(
    summary_sources: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    clock = [100.0]
    monkeypatch.setattr(sl.time, "monotonic", lambda: clock[0])
    sl._clear_cache()
    sl.list_skill_summary(limit=10)

    stat_paths: list[Path] = []
    original_dir_mtime = sl._dir_mtime_ns

    def counted_dir_mtime(path: Path) -> int:
        stat_paths.append(path)
        return original_dir_mtime(path)

    monkeypatch.setattr(sl, "_dir_mtime_ns", counted_dir_mtime)
    sl._clear_cache()

    sl.list_skill_summary(limit=10)

    assert stat_paths


def test_out_of_band_skill_edit_is_visible_only_after_ttl_expiry(
    summary_sources: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    clock = [100.0]
    monkeypatch.setattr(sl.time, "monotonic", lambda: clock[0])
    sl._clear_cache()
    before = sl.list_skill_summary(query="skillspector", limit=10)
    path = summary_sources["claude_user"] / "skillspector" / "SKILL.md"
    previous_mtime = path.stat().st_mtime_ns
    path.write_text("---\nname: skillspector\ndescription: changed outside Hub\n---\nbody", encoding="utf-8")
    # Force a deterministic metadata change without relying on filesystem clock resolution.
    path.touch(exist_ok=True)
    os.utime(path, ns=(previous_mtime + 1_000_000_000, previous_mtime + 1_000_000_000))

    inside_ttl = sl.list_skill_summary(query="skillspector", limit=10)
    clock[0] += 1.01
    after_expiry = sl.list_skill_summary(query="skillspector", limit=10)

    assert inside_ttl == before
    assert after_expiry["revision"] == before["revision"] + 1
    changed = next(item for item in after_expiry["items"] if item["id"] == "claude_user/skillspector")
    assert changed["description"] == "changed outside Hub"


def test_ttl_validation_without_catalog_change_keeps_revision_stable(
    summary_sources: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    clock = [100.0]
    monkeypatch.setattr(sl.time, "monotonic", lambda: clock[0])
    sl._clear_cache()
    before = sl.list_skill_summary(limit=10)

    clock[0] += 1.01
    after = sl.list_skill_summary(limit=10)

    assert after["revision"] == before["revision"]
    assert after["items"] == before["items"]


def test_skills_page_requests_a_complete_summary_not_the_default_first_page() -> None:
    source = SKILLS_PAGE.read_text(encoding="utf-8")

    assert "/api/skill-library/summary?limit=500" in source


def test_agents_skill_picker_requests_a_complete_summary_not_the_default_first_page() -> None:
    source = AGENTS_PAGE.read_text(encoding="utf-8")

    assert "/api/skill-library/summary?limit=500" in source


def test_selected_skill_strong_hash_changes_when_nested_dependency_changes(summary_sources: dict[str, Path]) -> None:
    skill_dir = summary_sources["claude_user"] / "skillspector"
    dependency = skill_dir / "references" / "policy.md"
    dependency.parent.mkdir()
    dependency.write_text("allow v1", encoding="utf-8")

    before = sl.skill_content_descriptor("claude_user/skillspector")["content_hash"]
    dependency.write_text("allow v2", encoding="utf-8")
    after = sl.skill_content_descriptor("claude_user/skillspector")["content_hash"]

    assert before.startswith("sha256:")
    assert after.startswith("sha256:")
    assert after != before


def _initial_load_body(path: Path) -> str:
    source = path.read_text(encoding="utf-8")
    start = source.index("const load =")
    end = source.index("useEffect(load", start)
    return source[start:end]


def test_skills_primary_catalog_load_is_independent_of_optional_requests() -> None:
    load = _initial_load_body(SKILLS_PAGE)

    assert "/api/skill-library/summary" in load
    assert "setSkills" in load
    assert "Promise.all" not in load
    assert "/api/skill-library/drift" not in load
    assert "/api/skill-library/deploy-log" not in load
    assert "/api/agents" not in load


def test_agents_primary_catalog_load_does_not_wait_for_skill_library() -> None:
    load = _initial_load_body(AGENTS_PAGE)

    assert "/api/agents" in load
    assert "setAgents" in load
    assert "Promise.all" not in load
    assert "/api/skill-library" not in load


def test_optional_skills_loads_cannot_clear_primary_table_state() -> None:
    source = SKILLS_PAGE.read_text(encoding="utf-8")

    assert "setSkills([])" not in source
    assert "setAgents([])" not in source
