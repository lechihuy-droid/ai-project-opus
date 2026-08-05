import logging
import os
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from openai import OpenAI

logger = logging.getLogger(__name__)


class BDState(TypedDict):
    rd_text: str
    prompts: dict[str, str]
    model: str
    parsed: str
    draft: str
    reviewed: str


def _chat(state: BDState, prompt: str) -> str:
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        logger.warning("NVIDIA_API_KEY is empty; using deterministic placeholder LLM output")
        return f"{prompt}\n\n{state['rd_text']}"

    client = OpenAI(
        base_url=os.getenv("VGOV_LLM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        api_key=api_key,
    )
    response = client.chat.completions.create(
        model=state["model"],
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content or ""


def parse_rd(state: BDState) -> dict[str, str]:
    prompt = state["prompts"].get("parse_rd", "Parse this RD:\n") + state["rd_text"]
    return {"parsed": _chat(state, prompt)}


def generate_bd(state: BDState) -> dict[str, str]:
    prompt = state["prompts"].get("generate_bd", "Generate a basic design:\n") + state["parsed"]
    return {"draft": _chat(state, prompt)}


def review_bd(state: BDState) -> dict[str, str]:
    prompt = state["prompts"].get("review_bd", "Review and return final basic design:\n") + state["draft"]
    return {"reviewed": _chat(state, prompt)}


def build_graph() -> Any:
    graph = StateGraph(BDState)
    graph.add_node("parse_rd", parse_rd)
    graph.add_node("generate_bd", generate_bd)
    graph.add_node("review_bd", review_bd)
    graph.add_edge(START, "parse_rd")
    graph.add_edge("parse_rd", "generate_bd")
    graph.add_edge("generate_bd", "review_bd")
    graph.add_edge("review_bd", END)
    return graph.compile()
