from __future__ import annotations

import datetime as dt
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
