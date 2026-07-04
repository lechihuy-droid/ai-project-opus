from __future__ import annotations

from typing import Any


AGENTS: list[dict[str, Any]] = [
    {
        "id": "lead",
        "name": "Lead Super Agent",
        "role": "orchestrator",
        "description": "Coordinates context preparation, planning, action, review, and finalization.",
        "can_spawn": True,
        "status": "available",
    },
    {
        "id": "researcher",
        "name": "Research Worker",
        "role": "child",
        "description": "Scoped worker profile for gathering local context and producing structured artifacts.",
        "can_spawn": False,
        "status": "available",
    },
    {
        "id": "tester",
        "name": "Test Worker",
        "role": "child",
        "description": "Scoped worker profile for verification tasks.",
        "can_spawn": False,
        "status": "available",
    },
    {
        "id": "reviewer",
        "name": "Review Worker",
        "role": "child",
        "description": "Scoped worker profile for risk and correctness review.",
        "can_spawn": False,
        "status": "available",
    },
]


def list_agents() -> list[dict[str, Any]]:
    return [dict(agent) for agent in AGENTS]


def get_agent(agent_id: str) -> dict[str, Any]:
    for agent in AGENTS:
        if agent["id"] == agent_id:
            return dict(agent)
    raise FileNotFoundError(f"Agent not found: {agent_id}")
