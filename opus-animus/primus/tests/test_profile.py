from __future__ import annotations

import json

from primus.profile import active_goal_keywords, load_user_profile


def test_load_user_profile_returns_seeded_structure(monkeypatch):
    monkeypatch.delenv("ANIMUS_USER_PROFILE", raising=False)

    profile = load_user_profile()

    assert set(profile) == {"goals", "preferences", "constraints"}
    assert 4 <= len(profile["goals"]) <= 6
    assert all({"id", "title", "area", "keywords", "priority"} <= set(goal) for goal in profile["goals"])
    assert profile["preferences"]["language"] == "vi"
    assert profile["preferences"]["timezone"] == "Asia/Tokyo"
    assert profile["constraints"]["approval_required"] is True


def test_load_user_profile_degrades_when_dir_missing(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_USER_PROFILE", str(tmp_path / "missing-profile"))

    assert load_user_profile() == {"goals": [], "preferences": {}, "constraints": {}}


def test_load_user_profile_reads_env_override(monkeypatch, tmp_path):
    profile_dir = tmp_path / "profile"
    profile_dir.mkdir()
    (profile_dir / "goals.json").write_text(
        json.dumps([{"id": "goal-1", "keywords": ["alpha"]}]),
        encoding="utf-8",
    )
    (profile_dir / "preferences.json").write_text(
        json.dumps({"language": "vi"}),
        encoding="utf-8",
    )
    (profile_dir / "constraints.json").write_text(
        json.dumps({"approval_required": True}),
        encoding="utf-8",
    )
    monkeypatch.setenv("ANIMUS_USER_PROFILE", str(profile_dir))

    assert load_user_profile() == {
        "goals": [{"id": "goal-1", "keywords": ["alpha"]}],
        "preferences": {"language": "vi"},
        "constraints": {"approval_required": True},
    }


def test_active_goal_keywords_flattens_goal_ids_and_keywords():
    profile = {
        "goals": [
            {"id": "career_ai_fde", "keywords": ["ai", "dashboard"]},
            {"id": "health_energy", "keywords": ["sleep", "protein"]},
        ]
    }

    assert active_goal_keywords(profile) == [
        "career_ai_fde",
        "ai",
        "dashboard",
        "health_energy",
        "sleep",
        "protein",
    ]
