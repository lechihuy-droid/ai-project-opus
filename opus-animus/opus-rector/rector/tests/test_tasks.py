import warnings

from rector.tasks import pull_due_tasks


def test_pull_due_tasks_returns_due_weekly_and_active_goal_items(tmp_path, monkeypatch):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))
    (tmp_path / "TODO.md").write_text(
        "\n".join(
            [
                "# Backlog",
                "- [ ] [CONS-1] Draft Consilium brief due 2026-06-24",
                "- [ ] [LUCIDA-3] Ship Lucida flow due 2026-07-20",
                "- [ ] [LOGOS-2] Tune active goal ranking",
            ]
        ),
        encoding="utf-8",
    )
    (tmp_path / "WEEKLY-PLAN.md").write_text(
        "- [ ] [RECTOR-4] Prepare weekly execution note\n",
        encoding="utf-8",
    )

    tasks = pull_due_tasks("2026-06-21", {"active_goals": ["LOGOS"], "window_days": 7})

    assert tasks == [
        {
            "id": "CONS-1",
            "title": "Draft Consilium brief",
            "source": "TODO",
            "due": "2026-06-24",
            "flag": None,
            "goal_ref": "CONS",
        },
        {
            "id": "LOGOS-2",
            "title": "Tune active goal ranking",
            "source": "TODO",
            "due": None,
            "flag": None,
            "goal_ref": "LOGOS",
        },
        {
            "id": "RECTOR-4",
            "title": "Prepare weekly execution note",
            "source": "WEEKLY-PLAN",
            "due": None,
            "flag": "this_week",
            "goal_ref": "RECTOR",
        },
    ]


def test_pull_due_tasks_missing_files_warns_and_returns_empty(tmp_path, monkeypatch):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        tasks = pull_due_tasks("2026-06-21", {})

    assert tasks == []
    assert len(caught) == 2
    assert all("not found" in str(warning.message) for warning in caught)
