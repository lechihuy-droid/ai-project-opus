from logos.arbiter import arbitrate


def test_health_rest_beats_hard_deadline_push():
    items = [
        {
            "id": "ship",
            "kind": "deadline_push",
            "title": "Push the launch deadline today",
            "deadline": True,
        },
        {
            "id": "rest",
            "kind": "health_nudge",
            "title": "Rest for recovery",
            "reason": "Protect health after poor sleep",
        },
    ]

    resolved, tradeoff_notes = arbitrate(items)

    assert [item["id"] for item in resolved] == ["rest"]
    assert tradeoff_notes == [
        {
            "kept": "rest",
            "dropped": "ship",
            "reason": "safety/health takes precedence over hard_deadline",
        }
    ]


def test_explicit_conflict_keeps_higher_tier():
    items = [
        {"id": "nice-to-have", "title": "Clean up notes", "conflicts_with": ["goal-work"]},
        {"id": "goal-work", "title": "Advance active project", "active_goal": True},
    ]

    resolved, tradeoff_notes = arbitrate(items)

    assert [item["id"] for item in resolved] == ["goal-work"]
    assert tradeoff_notes == [
        {
            "kept": "goal-work",
            "dropped": "nice-to-have",
            "reason": "goal_priority takes precedence over preference",
        }
    ]


def test_no_conflict_returns_items_unchanged_without_tradeoff_notes():
    items = [
        {"id": "ship", "title": "Ship ranker", "active_goal": True},
        {"id": "walk", "kind": "health_nudge", "title": "Take a walk break"},
    ]

    resolved, tradeoff_notes = arbitrate(items)

    assert resolved is items
    assert tradeoff_notes == []
