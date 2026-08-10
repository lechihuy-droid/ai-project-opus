from __future__ import annotations

import datetime as dt
import json
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import config
import server
from services import skill_library as sl


FIXTURES = Path(__file__).resolve().parent / "fixtures" / "skills"


@pytest.fixture()
def governance_sources(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    root = tmp_path / "skills"
    shutil.copytree(FIXTURES, root)
    monkeypatch.setattr(
        config,
        "SKILL_SOURCES",
        {
            "claude_user": root / "claude_user",
            "claude_project": root / "claude_project",
            "codex_user": root / "codex_user",
        },
        raising=False,
    )
    sl._clear_cache()


def test_telemetry_is_bulk_metadata_for_used_logical_skill_names(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    now = dt.datetime.now(dt.UTC).isoformat()
    monkeypatch.setattr(
        sl,
        "_safe_collect_skill_tool_events",
        lambda: [
            {"skill": "skillspector", "ts": now},
            {"skill": "claude:skillspector", "ts": now},
            {"skill": "missing-skill", "ts": now},
        ],
    )

    response = TestClient(server.app).get("/api/skill-library/telemetry")

    assert response.status_code == 200, response.text
    assert response.json() == {
        "status": "ready",
        "items": [{"name": "skillspector", "last_used": now, "use_count_30d": 2}],
    }


def test_telemetry_excludes_malformed_timestamps_but_keeps_valid_stale_evidence(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    stale = (dt.datetime.now(dt.UTC) - dt.timedelta(days=31)).isoformat()
    monkeypatch.setattr(
        sl,
        "_safe_collect_skill_tool_events",
        lambda: [
            {"skill": "skillspector", "ts": stale},
            {"skill": "skillspector", "ts": "not-a-timestamp"},
        ],
    )

    response = TestClient(server.app).get("/api/skill-library/telemetry")

    assert response.status_code == 200, response.text
    assert response.json() == {
        "status": "ready",
        "items": [{"name": "skillspector", "last_used": stale, "use_count_30d": 0}],
    }


def _write_skill(root: Path, dirname: str, name: str, body: str) -> None:
    skill_dir = root / dirname
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text(
        f"---\nname: {name}\ndescription: fixture\n---\n{body}\n",
        encoding="utf-8",
    )


def test_target_status_compares_exact_named_variants_and_hides_private_fields(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    root = tmp_path / "target-status"
    sources = {source: root / source for source in ("claude_user", "codex_user")}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "same", "same", "shared")
    _write_skill(sources["codex_user"], "same", "same", "shared")
    _write_skill(sources["claude_user"], "changed", "changed", "source")
    _write_skill(sources["codex_user"], "changed", "changed", "target")
    _write_skill(sources["claude_user"], "absent", "absent", "source only")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    sl._clear_cache()

    response = TestClient(server.app).get("/api/skill-library/target-status?target=codex_user")

    assert response.status_code == 200, response.text
    by_id = {item["skill_id"]: item for item in response.json()["items"]}
    assert by_id["claude_user/same"]["status"] == "in_sync"
    assert by_id["claude_user/changed"]["status"] == "modified"
    assert by_id["claude_user/absent"]["status"] == "missing"
    assert by_id["codex_user/same"]["status"] == "in_sync"
    assert not {"path", "content", "credentials", "adapter"} & set(by_id["claude_user/changed"])
    assert [(item["name"], item["source"]) for item in response.json()["items"]] == [
        ("absent", "claude_user"),
        ("changed", "claude_user"),
        ("changed", "codex_user"),
        ("same", "claude_user"),
        ("same", "codex_user"),
    ]


def test_target_status_reports_conflict_only_when_both_variants_change_from_latest_baseline(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    root = tmp_path / "target-conflict"
    sources = {source: root / source for source in ("claude_user", "codex_user")}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "conflict", "conflict", "baseline")
    _write_skill(sources["codex_user"], "conflict", "conflict", "baseline")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    log_path = tmp_path / "target-status-log.jsonl"
    monkeypatch.setattr(config, "SKILL_DEPLOY_LOG", log_path, raising=False)
    sl._clear_cache()
    baseline_hash = sl._content_hash(sources["claude_user"] / "conflict")
    log_path.write_text(
        json.dumps({
            "skill_id": "claude_user/conflict",
            "target": "codex_user",
            "baseline_hash_after": baseline_hash,
        }) + "\n",
        encoding="utf-8",
    )
    (sources["claude_user"] / "conflict" / "SKILL.md").write_text(
        "---\nname: conflict\ndescription: fixture\n---\nsource changed\n", encoding="utf-8"
    )
    (sources["codex_user"] / "conflict" / "SKILL.md").write_text(
        "---\nname: conflict\ndescription: fixture\n---\ntarget changed\n", encoding="utf-8"
    )
    sl._clear_cache()

    response = TestClient(server.app).get("/api/skill-library/target-status?target=codex_user")

    assert response.status_code == 200, response.text
    item = {row["skill_id"]: row for row in response.json()["items"]}["claude_user/conflict"]
    assert item["status"] == "conflict"
    assert item["source_changed"] is True
    assert item["target_changed"] is True


def test_target_status_reads_and_parses_deploy_log_once_and_uses_newest_valid_exact_baseline(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    root = tmp_path / "target-baselines"
    sources = {source: root / source for source in ("claude_user", "codex_user")}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "primary", "primary", "source changed")
    _write_skill(sources["codex_user"], "primary", "primary", "target changed")
    _write_skill(sources["claude_user"], "other", "other", "source other")
    _write_skill(sources["codex_user"], "other", "other", "target other")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    log_path = tmp_path / "target-baselines-log.jsonl"
    monkeypatch.setattr(config, "SKILL_DEPLOY_LOG", log_path, raising=False)
    old_baseline = "sha256:" + "1" * 64
    newest_baseline = "sha256:" + "2" * 64
    records = [
        {"skill_id": "claude_user/unrelated", "target": "codex_user", "baseline_hash_after": old_baseline},
        {"skill_id": "claude_user/primary", "target": "codex_user", "baseline_hash_after": old_baseline},
        {"skill_id": "claude_user/primary", "target": "codex_user", "baseline_hash_after": newest_baseline},
        {"skill_id": "claude_user/primary", "target": "claude_user", "baseline_hash_after": old_baseline},
        {"skill_id": "claude_user/primary", "target": "codex_user", "baseline_hash_after": "not-a-hash"},
    ]
    log_path.write_text("\n".join(json.dumps(record) for record in records) + "\n", encoding="utf-8")
    sl._clear_cache()

    original_read_text = Path.read_text
    original_loads = json.loads
    read_calls = 0
    parse_calls = 0

    def count_log_reads(path: Path, *args: object, **kwargs: object) -> str:
        nonlocal read_calls
        if path == log_path:
            read_calls += 1
        return original_read_text(path, *args, **kwargs)

    def count_log_parses(value: str, *args: object, **kwargs: object) -> object:
        nonlocal parse_calls
        parse_calls += 1
        return original_loads(value, *args, **kwargs)

    monkeypatch.setattr(Path, "read_text", count_log_reads)
    monkeypatch.setattr(sl.json, "loads", count_log_parses)

    result = sl.target_status("codex_user")

    assert read_calls == 1
    assert parse_calls == len(records)
    item = {row["skill_id"]: row for row in result["items"]}["claude_user/primary"]
    assert item["baseline_hash"] == newest_baseline
    assert item["status"] == "conflict"


def test_target_status_rejects_unknown_target_without_exposing_configuration(
    governance_sources: None,
) -> None:
    response = TestClient(server.app).get("/api/skill-library/target-status?target=not-a-source")

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown target"
    assert "not-a-source" not in response.text
