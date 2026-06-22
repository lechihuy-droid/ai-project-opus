"""Make and persist strategic Logos decisions."""

from __future__ import annotations

import json
import os
from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


Decision = dict[str, Any]
LLM = Callable[[str], Decision | str]


def decide(question: str, context: dict, llm: LLM | None = None) -> Decision:
    """Return a decision and append it to the durable decision log."""

    decision = _resolve_decision(question, context, llm)
    _append_decision_log(question, decision)
    return decision


def _resolve_decision(question: str, context: dict, llm: LLM | None) -> Decision:
    precomputed = _precomputed_decision(context)
    if precomputed is not None:
        return precomputed

    if llm is not None:
        return _normalize_decision(_llm_decision(llm, question, context))

    return {
        "decision": f"Defer final choice for: {_single_line(question)}",
        "rationale": "No precomputed decision was provided; deterministic MVP stub recorded the question for follow-up.",
        "alternatives": _context_alternatives(context),
    }


def _precomputed_decision(context: dict) -> Decision | None:
    for key in ("precomputed_decision", "decision"):
        value = context.get(key)
        if isinstance(value, dict):
            return _normalize_decision(value)

    decision = context.get("decision")
    if isinstance(decision, str) and decision.strip():
        return _normalize_decision(
            {
                "decision": decision,
                "rationale": context.get("rationale", "Decision provided by context."),
                "alternatives": context.get("alternatives", []),
            }
        )
    return None


def _llm_decision(llm: LLM, question: str, context: dict) -> Decision | str:
    prompt = (
        "Return a strategic decision as JSON with keys: decision, rationale, alternatives.\n\n"
        f"Question: {question}\n"
        f"Context: {json.dumps(context, ensure_ascii=False, sort_keys=True)}"
    )
    return llm(prompt)


def _normalize_decision(value: Decision | str) -> Decision:
    if isinstance(value, str):
        value = _parse_json_decision(value)

    alternatives = value.get("alternatives", [])
    if isinstance(alternatives, str):
        alternatives = [alternatives]
    elif not isinstance(alternatives, list):
        alternatives = []

    return {
        "decision": str(value.get("decision", "")).strip(),
        "rationale": str(value.get("rationale", "")).strip(),
        "alternatives": [str(item).strip() for item in alternatives if str(item).strip()],
    }


def _parse_json_decision(text: str) -> Decision:
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    raise ValueError("LLM response did not contain a decision JSON object")


def _append_decision_log(question: str, decision: Decision) -> None:
    path = _decision_log_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    sequence = _next_sequence(path)
    entry_id = f"DL-{_jst_date()}-{sequence:02d}"
    alternatives = decision["alternatives"] or ["None"]
    block = (
        f"## {entry_id}\n\n"
        f"Question: {_single_line(question)}\n"
        f"Decision: {_single_line(decision['decision'])}\n"
        f"Rationale: {_single_line(decision['rationale'])}\n"
        f"Alternatives: {'; '.join(_single_line(item) for item in alternatives)}\n\n"
    )

    with path.open("a", encoding="utf-8") as file:
        file.write(block)


def _decision_log_path() -> Path:
    override = os.environ.get("ANIMUS_DECISION_LOG")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[2] / "DECISION-LOG.md"


def _next_sequence(path: Path) -> int:
    if not path.exists():
        return 1
    count = 0
    with path.open("r", encoding="utf-8") as file:
        for line in file:
            if line.startswith("## DL-"):
                count += 1
    return count + 1


def _jst_date() -> str:
    return datetime.now(ZoneInfo("Asia/Tokyo")).strftime("%Y-%m-%d")


def _context_alternatives(context: dict) -> list[str]:
    alternatives = context.get("alternatives", [])
    if isinstance(alternatives, str):
        return [alternatives]
    if isinstance(alternatives, list):
        return [str(item) for item in alternatives]
    return []


def _single_line(value: object) -> str:
    return " ".join(str(value).split())
