from __future__ import annotations

import json

from primus import vita
from primus.providers import nexus_context


DATE = "2026-06-22"


def _write_vita_fixture(root) -> None:
    health_dir = root / "health-data"
    workout_dir = root / "workout-data"
    health_dir.mkdir()
    workout_dir.mkdir()
    (health_dir / "index.json").write_text(json.dumps([DATE]), encoding="utf-8")
    (workout_dir / "index.json").write_text(json.dumps([DATE]), encoding="utf-8")
    (health_dir / f"{DATE}.json").write_text(
        json.dumps(
            {
                "date": DATE,
                "meals": [
                    {"total_kcal": 1000, "total_protein": 50},
                    {"total_kcal": 850, "total_protein": 45},
                ],
                "water_ml": 2100,
                "steps": 8200,
                "sleep_hours": 7.5,
                "weight_kg": 70.2,
                "notes": "Fixture health day.",
            }
        ),
        encoding="utf-8",
    )
    (workout_dir / f"{DATE}.json").write_text(
        json.dumps(
            {
                "date": DATE,
                "sessions": [
                    {
                        "time": "07:00",
                        "type": "strength",
                        "duration_min": 45,
                        "calories": 300,
                        "exercises": ["squat"],
                        "notes": "Fixture strength.",
                    },
                    {
                        "time": "18:30",
                        "type": "cardio",
                        "duration_min": 20,
                        "calories": 180,
                        "exercises": ["run"],
                        "notes": "Fixture cardio.",
                    },
                ],
            }
        ),
        encoding="utf-8",
    )


def test_vita_health_parses_fixture(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path))
    _write_vita_fixture(tmp_path)

    result = vita.vita_health(DATE)

    assert result == {
        "sleep_hours": 7.5,
        "weight_kg": 70.2,
        "total_kcal": 1850,
        "total_protein": 95,
        "steps": 8200,
        "water_ml": 2100,
        "summary": "Ngủ 7.5h; 1850 kcal / 95g đạm; 8200 bước; 2100ml nước; 70.2kg.",
    }


def test_vita_workout_parses_fixture(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path))
    _write_vita_fixture(tmp_path)

    result = vita.vita_workout(DATE)

    assert result == {
        "trained_today": True,
        "sessions": 2,
        "types": ["strength", "cardio"],
        "total_min": 65,
        "streak_days": 1,
        "summary": "Đã tập: 2 buổi (strength, cardio), 65'; chuỗi 1 ngày.",
    }


def test_vita_returns_none_for_missing_date(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path))
    _write_vita_fixture(tmp_path)

    assert vita.vita_health("2026-06-23") is None
    assert vita.vita_workout("2026-06-23") is None


def test_vita_returns_none_when_data_root_missing(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path / "missing"))

    assert vita.vita_health(DATE) is None
    assert vita.vita_workout(DATE) is None


def test_nexus_context_uses_vita_health_and_workout(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path))
    _write_vita_fixture(tmp_path)

    result = nexus_context(DATE)

    assert result["health_summary"] is not None
    assert "Ngủ 7.5h" in result["health_summary"]
    assert "Đã tập: 2 buổi" in result["health_summary"]
    assert result["calendar_today"] is None


def test_nexus_context_degrades_when_vita_dir_empty(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path))

    result = nexus_context(DATE)

    assert result == {
        "health_summary": None,
        "calendar_today": None,
    }
