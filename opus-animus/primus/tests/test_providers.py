from __future__ import annotations

import json

from primus.providers import actio_finance, consilium_info, nexus_context


def test_nexus_context_missing_opus_nexus_degrades(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path))

    assert nexus_context("2026-06-22") == {
        "health_summary": None,
        "calendar_today": None,
    }


def test_nexus_context_reads_vita_health_file_for_date(monkeypatch, tmp_path):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))
    monkeypatch.setenv("OPUS_VITA_DATA", str(tmp_path))
    health_dir = tmp_path / "health-data"
    health_dir.mkdir()
    (health_dir / "2026-06-22.json").write_text(
        json.dumps(
            {
                "date": "2026-06-22",
                "meals": [{"total_kcal": 1800, "total_protein": 90}],
                "sleep_hours": 7,
            }
        ),
        encoding="utf-8",
    )

    result = nexus_context("2026-06-22")

    assert result["health_summary"] is not None


def test_consilium_info_missing_logs_degrades(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_CONSILIUM_LOGS", str(tmp_path / "missing"))

    assert consilium_info(["AI trend radar"], date="2026-06-22") == []


def test_consilium_info_filters_to_active_goal_matches(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_CONSILIUM_LOGS", str(tmp_path / "logs"))
    intel_dir = tmp_path / "logs" / "intel_reviews"
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

    assert consilium_info(["AI trend radar"], date="2026-06-22") == [
        {
            "title": "New model pricing shift",
            "reason": "Directly affects active AI monitoring work.",
            "topic": "AI trend radar",
            "goal_ref": "AI trend radar",
        }
    ]


def _write_signals(tmp_path, payload) -> None:
    signals_dir = tmp_path / "signals"
    signals_dir.mkdir(parents=True, exist_ok=True)
    (signals_dir / "2026-06-22.json").write_text(json.dumps(payload), encoding="utf-8")


def test_actio_finance_skips_when_no_finance_goal_active(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_ACTIO_SIGNALS", str(tmp_path / "signals"))
    _write_signals(tmp_path, [{"title": "Cash drag", "reason": "76% cash idle."}])

    assert actio_finance(["health_energy"], date="2026-06-22") == []


def test_actio_finance_missing_export_degrades(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_ACTIO_SIGNALS", str(tmp_path / "missing"))

    assert actio_finance(["finance_freedom"], date="2026-06-22") == []


def test_actio_finance_surfaces_signals_for_finance_goal(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_ACTIO_SIGNALS", str(tmp_path / "signals"))
    _write_signals(
        tmp_path,
        [
            {
                "title": "Cash drag",
                "reason": "76% net worth is idle cash vs house-fund target.",
                "severity": "high",
                "suggested_action": "Deploy ¥X into the core allocation.",
            },
            {"title": "no reason field"},
        ],
    )

    assert actio_finance(["finance_freedom"], date="2026-06-22") == [
        {
            "title": "Cash drag",
            "reason": "76% net worth is idle cash vs house-fund target.",
            "priority": "high",
            "suggested_action": "Deploy ¥X into the core allocation.",
            "goal_ref": "finance_freedom",
        }
    ]
