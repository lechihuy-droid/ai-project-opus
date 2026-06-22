from logos.decide import decide


def test_decide_appends_decision_log_with_incrementing_sequence(tmp_path, monkeypatch):
    log_path = tmp_path / "DECISION-LOG.md"
    monkeypatch.setenv("ANIMUS_DECISION_LOG", str(log_path))

    first = decide(
        "Should Logos ship decide?",
        {
            "decision": "Ship the MVP decision logger.",
            "rationale": "Persistence is required.",
            "alternatives": ["Keep decision in chat"],
        },
    )
    second = decide("What next?", {"alternatives": ["Wait"]})

    assert set(first) == {"decision", "rationale", "alternatives"}
    assert set(second) == {"decision", "rationale", "alternatives"}

    text = log_path.read_text(encoding="utf-8")
    headings = [line for line in text.splitlines() if line.startswith("## DL-")]

    assert len(headings) == 2
    assert headings[0].endswith("-01")
    assert headings[1].endswith("-02")
    assert "Question: Should Logos ship decide?" in text
    assert "Decision: Ship the MVP decision logger." in text
    assert "Rationale: Persistence is required." in text
    assert "Alternatives: Keep decision in chat" in text
