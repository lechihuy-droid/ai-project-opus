import pytest

from logos.rank import rank


ITEMS = [
    {"id": "sleep", "title": "Protect recovery", "priority": "medium", "goal_ref": "health"},
    {"id": "ship", "title": "Ship Logos ranker", "priority": "high", "due": "today"},
    {"id": "read", "title": "Read background notes", "priority": "low"},
]

PROFILE = {"goals": ["health baseline", "ship proactive MVP"]}
CONTEXT = {"energy": "medium", "calendar": {"free_blocks": ["09:00-11:00"]}}


def test_rank_uses_injected_llm_scores_and_sorts_descending():
    def mock_llm(prompt: str) -> str:
        assert "goal alignment" in prompt
        return """
        ```json
        [
          {"id": "read", "score": 0.22, "rank_reason": "useful but not urgent"},
          {"id": "ship", "score": 0.91, "rank_reason": "deadline and goal aligned"},
          {"id": "sleep", "score": 0.64, "rank_reason": "supports energy"}
        ]
        ```
        """

    ranked = rank(ITEMS, PROFILE, CONTEXT, llm=mock_llm)

    assert [item["id"] for item in ranked] == ["ship", "sleep", "read"]
    assert [item["priority"] for item in ranked] == ["high", "medium", "low"]
    assert all("score" in item for item in ranked)
    assert all("rank_reason" in item for item in ranked)


def test_rank_falls_back_to_deterministic_heuristic_when_llm_raises():
    def failing_llm(prompt: str) -> str:
        raise RuntimeError("llm unavailable")

    ranked = rank(ITEMS, PROFILE, CONTEXT, llm=failing_llm)

    assert [item["id"] for item in ranked] == ["ship", "sleep", "read"]
    assert len(ranked) == len(ITEMS)
    assert all(item["rank_reason"] == "heuristic fallback" for item in ranked)
    assert all(0.0 <= item["score"] <= 1.0 for item in ranked)
