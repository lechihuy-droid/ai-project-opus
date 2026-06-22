from __future__ import annotations

import json

from primus.providers import consilium_info, nexus_context


def test_nexus_context_missing_opus_nexus_degrades(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))

    assert nexus_context("2026-06-22") == {
        "health_summary": None,
        "calendar_today": None,
    }


def test_nexus_context_reads_health_file_for_date(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))
    health_dir = tmp_path / "opus-nexus" / "health"
    health_dir.mkdir(parents=True)
    (health_dir / "2026-06-22.md").write_text("Sleep: 7h. Energy: medium.", encoding="utf-8")

    result = nexus_context("2026-06-22")

    assert result["health_summary"] is not None


def test_consilium_info_missing_logs_degrades(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))

    assert consilium_info(["AI trend radar"]) == []


def test_consilium_info_filters_to_active_goal_matches(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))
    intel_dir = tmp_path / "opus-consilium" / "logs" / "intel_reviews"
    intel_dir.mkdir(parents=True)
    (intel_dir / "2026-06-22.json").write_text(
        json.dumps(
            {
                "items": [
                    {
                        "topic": "AI trend radar",
                        "title": "New model pricing shift",
                        "reason": "Directly affects active AI monitoring work.",
                    },
                    {
                        "topic": "Travel planning",
                        "title": "New rail pass",
                        "reason": "Useful only for a future trip.",
                    },
                ]
            }
        ),
        encoding="utf-8",
    )

    assert consilium_info(["AI trend radar"]) == [
        {
            "title": "New model pricing shift",
            "reason": "Directly affects active AI monitoring work.",
            "goal_ref": "AI trend radar",
        }
    ]
