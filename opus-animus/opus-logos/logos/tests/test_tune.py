from logos.tune import tune


def test_tune_downranks_accepted_not_done_and_upranks_done(tmp_path, monkeypatch):
    rules_path = tmp_path / "ranking-rules.md"
    monkeypatch.setenv("ANIMUS_RANKING_RULES", str(rules_path))

    rules = tune(
        [
            {
                "item_id": "a1",
                "kind": "A",
                "engagement": "accepted",
                "outcome": "not_done",
            },
            {
                "item_id": "b1",
                "kind": "B",
                "engagement": "dismissed",
                "outcome": "done",
            },
        ]
    )

    joined = "\n".join(rules)
    assert "down-rank kind A" in joined
    assert "up-rank kind B" in joined

    persisted = rules_path.read_text(encoding="utf-8")
    assert "- down-rank kind A" in persisted
    assert "- up-rank kind B" in persisted


def test_tune_caps_rules_at_30(tmp_path, monkeypatch):
    rules_path = tmp_path / "ranking-rules.md"
    monkeypatch.setenv("ANIMUS_RANKING_RULES", str(rules_path))

    signals = [
        {
            "item_id": f"item-{index}",
            "kind": f"K{index:02d}",
            "engagement": "accepted",
            "outcome": "done",
        }
        for index in range(35)
    ]

    rules = tune(signals)
    persisted_rules = [
        line for line in rules_path.read_text(encoding="utf-8").splitlines() if line.startswith("- ")
    ]

    assert len(rules) == 30
    assert len(persisted_rules) == 30
    assert "up-rank kind K34" in rules[-1]
