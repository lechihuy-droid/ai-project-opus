from __future__ import annotations

import json
import re

from primus import providers
from primus.brief import assemble_brief_text, generate_brief

import logos.arbiter
import logos.rank
import rector.proactive
import rector.tasks


DATE = "2026-06-22"


def _intent_packet() -> dict:
    return {
        "origin": "user",
        "user_input": "Primus, hôm nay tôi nên tập trung gì?",
        "date": DATE,
        "profile": {"active_goals": ["ANIMUS"]},
    }


def _set_brief_env(monkeypatch, tmp_path) -> tuple:
    traces_dir = tmp_path / "traces"
    proactive_dir = tmp_path / "proactive"
    monkeypatch.setenv("ANIMUS_BRIEF_NO_LLM", "1")
    monkeypatch.setenv("ANIMUS_TRACES_DIR", str(traces_dir))
    monkeypatch.setenv("ANIMUS_PROACTIVE_DIR", str(proactive_dir))
    return traces_dir, proactive_dir


def _patch_happy_path(monkeypatch) -> None:
    monkeypatch.setattr(
        rector.tasks,
        "pull_due_tasks",
        lambda date, profile: [
            {
                "id": "ANIMUS-13",
                "title": "Hoàn tất controller loop brief",
                "due": DATE,
                "goal_ref": "ANIMUS",
            },
            {
                "id": "ANIMUS-14",
                "title": "Review proactive item schema",
                "flag": "this_week",
                "goal_ref": "ANIMUS",
            },
        ],
    )
    monkeypatch.setattr(
        providers,
        "nexus_context",
        lambda date: {
            "health_summary": "Ngủ 6h; năng lượng trung bình.",
            "calendar_today": "Lịch bận 10:00-12:00.",
        },
    )
    monkeypatch.setattr(providers, "consilium_info", lambda active_goals: [])
    monkeypatch.setattr(logos.rank, "rank", lambda items, profile, ctx, llm=None: items)
    monkeypatch.setattr(logos.arbiter, "arbitrate", lambda ranked: (ranked, []))


def test_generate_brief_happy_path_writes_trace_and_saves_items(monkeypatch, tmp_path):
    traces_dir, _ = _set_brief_env(monkeypatch, tmp_path)
    _patch_happy_path(monkeypatch)

    brief_text, items = generate_brief(_intent_packet())

    assert "Primus đề xuất" in brief_text
    assert items
    trace_files = list(traces_dir.glob("*.jsonl"))
    assert trace_files
    records = [
        json.loads(line)
        for trace_file in trace_files
        for line in trace_file.read_text(encoding="utf-8").splitlines()
    ]
    assert len(records) >= 1
    assert rector.proactive.get_proactive_set(DATE) == items


def test_generate_brief_empty_path_returns_nothing_new(monkeypatch, tmp_path):
    _set_brief_env(monkeypatch, tmp_path)
    monkeypatch.setattr(rector.tasks, "pull_due_tasks", lambda date, profile: [])
    monkeypatch.setattr(
        providers,
        "nexus_context",
        lambda date: {"health_summary": None, "calendar_today": None},
    )
    monkeypatch.setattr(providers, "consilium_info", lambda active_goals: [])
    monkeypatch.setattr(logos.rank, "rank", lambda items, profile, ctx, llm=None: items)
    monkeypatch.setattr(logos.arbiter, "arbitrate", lambda ranked: (ranked, []))

    brief_text, items = generate_brief(_intent_packet())

    assert "nothing-new" in brief_text
    assert items == []


def test_returned_items_are_suggestion_only(monkeypatch, tmp_path):
    _set_brief_env(monkeypatch, tmp_path)
    _patch_happy_path(monkeypatch)

    _, items = generate_brief(_intent_packet())

    assert all(item["requires_approval"] is True for item in items)


def test_generate_brief_caps_returned_saved_and_displayed_items(monkeypatch, tmp_path):
    _set_brief_env(monkeypatch, tmp_path)
    monkeypatch.setenv("ANIMUS_BRIEF_MAX_ITEMS", "3")
    monkeypatch.setattr(
        rector.tasks,
        "pull_due_tasks",
        lambda date, profile: [
            {
                "id": f"ANIMUS-{index}",
                "title": f"Prioritized task {index}",
                "due": DATE,
                "goal_ref": "ANIMUS",
            }
            for index in range(8)
        ],
    )
    monkeypatch.setattr(
        providers,
        "nexus_context",
        lambda date: {"health_summary": None, "calendar_today": None},
    )
    monkeypatch.setattr(providers, "consilium_info", lambda active_goals: [])

    brief_text, items = generate_brief(_intent_packet())

    assert len(items) == 3
    assert len(rector.proactive.get_proactive_set(DATE)) == 3
    numbered_lines = [
        match.group(1)
        for line in brief_text.splitlines()
        if (match := re.match(r"^(\d+)\. ", line))
    ]
    assert numbered_lines == ["1", "2", "3"]


def test_assemble_brief_skips_auto_echo_action_but_keeps_distinct_action():
    brief_text = assemble_brief_text(
        {"health_summary": None, "calendar_today": None},
        [
            {
                "id": "auto-echo",
                "source_subsystem": "RECTOR",
                "priority": "medium",
                "title": "Auto echo task",
                "reason": "Due today.",
                "suggested_action": "Xử lý: Auto echo task",
            },
            {
                "id": "real-action",
                "source_subsystem": "RECTOR",
                "priority": "medium",
                "title": "Real action task",
                "reason": "Needs focus.",
                "suggested_action": "Draft the review note.",
            },
        ],
        [],
    )

    assert "Gợi ý: Xử lý:" not in brief_text
    assert "Gợi ý: Draft the review note." in brief_text
