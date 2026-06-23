from __future__ import annotations

import run_brief


DATE = "2026-06-22"


def test_first_pull_generates_brief(capsys, monkeypatch):
    calls: list[dict] = []
    monkeypatch.setattr(
        run_brief,
        "_load_user_profile",
        lambda: {"goals": [{"id": "career_ai_fde", "keywords": ["ai"]}], "preferences": {}, "constraints": {}},
    )

    def fake_generate(intent_packet: dict):
        calls.append(intent_packet)
        return "Chào buổi sáng.\n\nPrimus đề xuất:\n1. Test item", [{"id": "item-1"}]

    result = run_brief.main(
        today=DATE,
        generate=fake_generate,
        get_existing=lambda date: [],
    )

    assert result == 0
    assert calls == [
        {
            "origin": "user",
            "expected_output": "proactive_item set",
            "date": DATE,
            "profile": {"goals": [{"id": "career_ai_fde", "keywords": ["ai"]}], "preferences": {}, "constraints": {}},
        }
    ]
    assert "Primus đề xuất" in capsys.readouterr().out


def test_second_pull_same_day_returns_no_new_message(capsys):
    calls: list[dict] = []

    def fake_generate(intent_packet: dict):
        calls.append(intent_packet)
        return "Không nên được gọi", []

    result = run_brief.main(
        today=DATE,
        generate=fake_generate,
        get_existing=lambda date: [{"id": "existing-item"}],
    )

    assert result == 0
    assert calls == []
    assert run_brief.NO_NEW_MESSAGE in capsys.readouterr().out
