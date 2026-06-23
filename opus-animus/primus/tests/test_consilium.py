from __future__ import annotations

import json

from primus import consilium
from primus.providers import consilium_info


DATE = "2026-06-22"


def _intel_reviews_dir(tmp_path, monkeypatch):
    logs_dir = tmp_path / "logs"
    intel_dir = logs_dir / "intel_reviews"
    intel_dir.mkdir(parents=True)
    monkeypatch.setenv("OPUS_CONSILIUM_LOGS", str(logs_dir))
    return intel_dir


def test_consilium_intel_parses_latest_review_on_or_before_date(monkeypatch, tmp_path):
    intel_dir = _intel_reviews_dir(tmp_path, monkeypatch)
    (intel_dir / "2026-06-21.json").write_text(
        json.dumps(
            {
                "date": "2026-06-21",
                "llm_review": {"title": "Daily Intel"},
                "articles": [
                    {
                        "title": "AI-SDLC platform shift",
                        "summary": "Changes agent workflow planning.",
                        "topic": "AI trend radar",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    (intel_dir / "2026-06-24.json").write_text(
        json.dumps(
            {
                "date": "2026-06-24",
                "articles": [
                    {
                        "title": "Future item",
                        "summary": "Should not be selected for the earlier date.",
                        "topic": "AI",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    assert consilium.consilium_intel(DATE) == [
        {
            "title": "AI-SDLC platform shift",
            "reason": "Changes agent workflow planning.",
            "topic": "AI trend radar",
        }
    ]


def test_consilium_info_keeps_only_goal_matching_items(monkeypatch, tmp_path):
    intel_dir = _intel_reviews_dir(tmp_path, monkeypatch)
    (intel_dir / f"{DATE}.json").write_text(
        json.dumps(
            {
                "date": DATE,
                "sections": [
                    {
                        "heading": "Top 5 to read",
                        "body": (
                            "1. AI-SDLC platform shift - Changes agent workflow planning.\n"
                            "2. Travel rail pass - Useful only for vacation planning."
                        ),
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    assert consilium_info(["AI-SDLC"], date=DATE) == [
        {
            "title": "AI-SDLC platform shift",
            "reason": "Changes agent workflow planning.",
            "topic": "Top 5 to read",
            "goal_ref": "AI-SDLC",
        }
    ]


def test_consilium_missing_dir_degrades_to_empty(monkeypatch, tmp_path):
    monkeypatch.setenv("OPUS_CONSILIUM_LOGS", str(tmp_path / "missing"))

    assert consilium.consilium_intel(DATE) == []
    assert consilium_info(["AI-SDLC"], date=DATE) == []
