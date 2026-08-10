from __future__ import annotations

import datetime as dt
import json
import multiprocessing
import os
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import config
import server
from services import skill_library as sl


FIXTURES = Path(__file__).resolve().parent / "fixtures" / "skills"


def _hold_destination_lock(lock_path: str, ready: object, release: object) -> None:
    from services import skill_library

    with skill_library._filesystem_destination_lock(Path(lock_path)):
        ready.set()
        release.wait(5)


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
    monkeypatch.setattr(config, "SKILL_DEPLOY_LOG", tmp_path / "skill_deploy_log.jsonl", raising=False)
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


def _make_deploy_conflict(tmp_path: Path) -> tuple[Path, Path, str]:
    sources = {
        "claude_user": tmp_path / "conflict-sources" / "claude_user",
        "codex_user": tmp_path / "conflict-sources" / "codex_user",
    }
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "baseline")
    shutil.copytree(sources["claude_user"] / "skillspector", sources["codex_user"] / "skillspector")
    baseline_hash = sl._content_hash(sources["claude_user"] / "skillspector")
    config.SKILL_DEPLOY_LOG.write_text(
        json.dumps({
            "skill_id": "claude_user/skillspector",
            "target": "codex_user",
            "baseline_hash_after": baseline_hash,
        }) + "\n",
        encoding="utf-8",
    )
    (sources["claude_user"] / "skillspector" / "SKILL.md").write_text(
        "---\nname: skillspector\ndescription: fixture\n---\nsource changed\n",
        encoding="utf-8",
    )
    (sources["codex_user"] / "skillspector" / "SKILL.md").write_text(
        "---\nname: skillspector\ndescription: fixture\n---\ntarget changed\n",
        encoding="utf-8",
    )
    return sources["claude_user"] / "skillspector", sources["codex_user"] / "skillspector", baseline_hash


def test_deploy_rejects_stale_expected_target_hash(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "stale" / "claude_user", "codex_user": tmp_path / "stale" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    sl._clear_cache()

    with pytest.raises(sl.SkillPreconditionError, match="Target changed since comparison"):
        sl.deploy("claude_user/skillspector", "codex_user", expected_target_hash="sha256:" + "0" * 64)


def test_deploy_explicit_null_expected_hash_requires_target_to_remain_missing(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "missing-cas" / "claude_user", "codex_user": tmp_path / "missing-cas" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "foreign target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    sl._clear_cache()

    with pytest.raises(sl.SkillPreconditionError, match="Target changed since comparison"):
        sl.deploy("claude_user/skillspector", "codex_user", expected_target_hash=None)

    assert "foreign target" in (sources["codex_user"] / "skillspector" / "SKILL.md").read_text(encoding="utf-8")


def test_deploy_omitted_expected_hash_preserves_legacy_overwrite_behavior(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "legacy-cas" / "claude_user", "codex_user": tmp_path / "legacy-cas" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "legacy target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    sl._clear_cache()

    result = sl.deploy("claude_user/skillspector", "codex_user")

    assert result["status"] == "in_sync"


def test_deploy_rechecks_target_inside_destination_lock_before_overwrite(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "locked" / "claude_user", "codex_user": tmp_path / "locked" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    target_path = sources["codex_user"] / "skillspector"
    expected_target_hash = sl._content_hash(target_path)

    class MutatingLock:
        def __enter__(self) -> None:
            (target_path / "SKILL.md").write_text(
                "---\nname: skillspector\ndescription: fixture\n---\nexternal change\n",
                encoding="utf-8",
            )

        def __exit__(self, *_: object) -> None:
            return None

    monkeypatch.setattr(sl, "_destination_lock", lambda _path: MutatingLock())
    sl._clear_cache()

    with pytest.raises(sl.SkillPreconditionError, match="Target changed since comparison"):
        sl.deploy("claude_user/skillspector", "codex_user", expected_target_hash=expected_target_hash)

    assert "external change" in (target_path / "SKILL.md").read_text(encoding="utf-8")
    assert not list(target_path.parent.glob("skillspector.bak-*"))


def test_deploy_fails_closed_when_target_changes_immediately_before_atomic_backup(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "atomic" / "claude_user", "codex_user": tmp_path / "atomic" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    target_path = sources["codex_user"] / "skillspector"
    expected_target_hash = sl._content_hash(target_path)

    def mutate_then_backup(dest_path: Path, backup_path: Path) -> None:
        (dest_path / "SKILL.md").write_text(
            "---\nname: skillspector\ndescription: fixture\n---\nexternal change\n",
            encoding="utf-8",
        )
        dest_path.replace(backup_path)

    monkeypatch.setattr(sl, "_backup_target_atomically", mutate_then_backup)
    sl._clear_cache()

    with pytest.raises(sl.SkillPreconditionError, match="Target changed since comparison"):
        sl.deploy("claude_user/skillspector", "codex_user", expected_target_hash=expected_target_hash)

    assert "external change" in (target_path / "SKILL.md").read_text(encoding="utf-8")
    assert not list(target_path.parent.glob(".skillspector.staging-*"))


def test_deploy_process_lock_prevents_second_process_from_overwriting_target(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "multiprocess" / "claude_user", "codex_user": tmp_path / "multiprocess" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    target_path = sources["codex_user"] / "skillspector"
    expected_target_hash = sl._content_hash(target_path)
    context = multiprocessing.get_context("spawn")
    ready = context.Event()
    release = context.Event()
    holder = context.Process(target=_hold_destination_lock, args=(str(target_path), ready, release))
    holder.start()
    try:
        ready_received = ready.wait(30)
        assert ready_received, f"spawn lock holder did not initialize (exitcode={holder.exitcode})"
        monkeypatch.setattr(sl, "_DEPLOY_LOCK_WAIT_SECONDS", 0.1)
        with pytest.raises(sl.SkillPreconditionError, match="Deployment target is busy"):
            sl.deploy("claude_user/skillspector", "codex_user", expected_target_hash=expected_target_hash)
    finally:
        release.set()
        holder.join(10)
        if holder.is_alive():
            holder.terminate()
            holder.join(5)

    assert holder.exitcode == 0
    assert "target" in (target_path / "SKILL.md").read_text(encoding="utf-8")


def test_deploy_rollback_preserves_foreign_destination_changed_after_publish(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "post-publish" / "claude_user", "codex_user": tmp_path / "post-publish" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    target_path = sources["codex_user"] / "skillspector"
    expected_target_hash = sl._content_hash(target_path)

    def publish_then_mutate(staging_path: Path, dest_path: Path) -> None:
        os.rename(staging_path, dest_path)
        (dest_path / "SKILL.md").write_text(
            "---\nname: skillspector\ndescription: fixture\n---\nforeign after publish\n",
            encoding="utf-8",
        )

    monkeypatch.setattr(sl, "_publish_staging_atomically", publish_then_mutate)
    sl._clear_cache()

    with pytest.raises(sl.SkillPreconditionError):
        sl.deploy("claude_user/skillspector", "codex_user", expected_target_hash=expected_target_hash)

    assert "foreign after publish" in (target_path / "SKILL.md").read_text(encoding="utf-8")
    backups = list(target_path.parent.glob("skillspector.bak-*"))
    assert len(backups) == 1
    assert "target" in (backups[0] / "SKILL.md").read_text(encoding="utf-8")


def test_deploy_requires_explicit_override_for_conflict(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "conflict-sources" / "claude_user", "codex_user": tmp_path / "conflict-sources" / "codex_user"}
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    _make_deploy_conflict(tmp_path)
    sl._clear_cache()

    with pytest.raises(sl.SkillConflictError, match="Conflict requires review"):
        sl.deploy("claude_user/skillspector", "codex_user")


def test_deploy_conflict_override_preserves_backup_records_evidence_and_returns_in_sync(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "conflict-sources" / "claude_user", "codex_user": tmp_path / "conflict-sources" / "codex_user"}
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    source_path, target_path, _baseline_hash = _make_deploy_conflict(tmp_path)
    target_before = target_path / "SKILL.md"
    target_before_content = target_before.read_text(encoding="utf-8")
    expected_target_hash = sl._content_hash(target_path)
    sl._clear_cache()

    result = sl.deploy(
        "claude_user/skillspector",
        "codex_user",
        expected_target_hash=expected_target_hash,
        allow_conflict=True,
    )

    assert result["ok"] is True
    assert result["status"] == "in_sync"
    assert result["source_hash"] == sl._content_hash(source_path)
    assert result["target_hash_before"] == expected_target_hash
    assert result["baseline_hash_after"] == result["source_hash"]
    assert "content" not in result
    backups = list(target_path.parent.glob("skillspector.bak-*"))
    assert len(backups) == 1
    assert (backups[0] / "SKILL.md").read_text(encoding="utf-8") == target_before_content
    status = next(
        item for item in sl.target_status("codex_user")["items"] if item["skill_id"] == "claude_user/skillspector"
    )
    assert status["status"] == "in_sync"
    evidence = json.loads(config.SKILL_DEPLOY_LOG.read_text(encoding="utf-8").splitlines()[-1])
    assert evidence["source_hash"] == result["source_hash"]
    assert evidence["target_hash_before"] == expected_target_hash
    assert evidence["baseline_hash_after"] == result["baseline_hash_after"]


def test_deploy_api_validates_preconditions_and_maps_them_to_sanitized_conflicts(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "conflict-sources" / "claude_user", "codex_user": tmp_path / "conflict-sources" / "codex_user"}
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    _make_deploy_conflict(tmp_path)
    sl._clear_cache()
    client = TestClient(server.app, headers={config.HUB_CLIENT_HEADER: config.HUB_CLIENT_VALUE})
    url = "/api/skill-library/claude_user/skillspector/deploy"

    bad_expected = client.post(url, json={"target": "codex_user", "expected_target_hash": 42})
    bad_override = client.post(url, json={"target": "codex_user", "allow_conflict": "yes"})
    malformed = client.post(url, json={"target": "codex_user", "expected_target_hash": "sha256:stale"})
    stale = client.post(url, json={"target": "codex_user", "expected_target_hash": "sha256:" + "0" * 64})
    conflict = client.post(url, json={"target": "codex_user"})

    assert bad_expected.status_code == 400
    assert bad_expected.json()["detail"] == "expected_target_hash must be a string"
    assert bad_override.status_code == 400
    assert bad_override.json()["detail"] == "allow_conflict must be a boolean"
    assert malformed.status_code == 400
    assert malformed.json()["detail"] == "expected_target_hash must be a SHA-256 hash"
    assert stale.status_code == 409
    assert stale.json()["detail"] == "Target changed since comparison"
    assert conflict.status_code == 409
    assert conflict.json()["detail"] == "Conflict requires review"
    assert str(tmp_path) not in stale.text
    assert str(tmp_path) not in conflict.text
    current_target_hash = sl._content_hash(sources["codex_user"] / "skillspector")
    approved = client.post(url, json={
        "target": "codex_user",
        "expected_target_hash": current_target_hash,
        "allow_conflict": True,
    })
    assert approved.status_code == 200
    assert "path" not in approved.json()


def test_deploy_api_explicit_null_expected_hash_is_missing_target_cas(
    governance_sources: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    sources = {"claude_user": tmp_path / "api-missing-cas" / "claude_user", "codex_user": tmp_path / "api-missing-cas" / "codex_user"}
    for source_root in sources.values():
        source_root.mkdir(parents=True)
    _write_skill(sources["claude_user"], "skillspector", "skillspector", "source")
    _write_skill(sources["codex_user"], "skillspector", "skillspector", "foreign target")
    monkeypatch.setattr(config, "SKILL_SOURCES", sources, raising=False)
    sl._clear_cache()
    client = TestClient(server.app, headers={config.HUB_CLIENT_HEADER: config.HUB_CLIENT_VALUE})

    response = client.post(
        "/api/skill-library/claude_user/skillspector/deploy",
        json={"target": "codex_user", "expected_target_hash": None},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Target changed since comparison"
