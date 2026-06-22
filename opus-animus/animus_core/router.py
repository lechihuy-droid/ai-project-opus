"""Rule-first subsystem router for Opus Animus."""

from __future__ import annotations

import re
import unicodedata


SUBSYSTEMS = ("NEXUS", "CONSILIUM", "LOGOS", "RECTOR", "LUCIDA", "WIKI", "INFRA")

PREFIX_OVERRIDES = {
    "logos": "LOGOS",
    "rector": "RECTOR",
    "consilium": "CONSILIUM",
    "wiki": "WIKI",
    "lucida": "LUCIDA",
    "infra": "INFRA",
    "nexus": "NEXUS",
}

KEYWORDS = {
    "LOGOS": (
        "nen",
        "uu tien",
        "bo",
        "huong",
        "quyet dinh",
        "focus",
        "priority",
        "decide",
        "drop",
        "stop",
        "dung",
        "tap trung",
        "viec nao truoc",
        "dang lam",
        "lam tiep",
    ),
    "RECTOR": (
        "break",
        "task",
        "tuan",
        "handoff",
        "status",
        "todo",
        "due",
        "done",
        "cap nhat handoff",
        "add task",
        "danh dau",
    ),
    "CONSILIUM": (
        "tin",
        "tong hop",
        "nguon",
        "nghien cuu",
        "research",
        "summarize",
        "tom tat",
        "collect",
        "intel",
        "paper",
        "doc giup",
    ),
    "WIKI": (
        "luu",
        "ghi nho",
        "nho",
        "knowledge",
        "wiki",
        "save",
        "memory",
        "long-term",
        "knowledge base",
        "nho giup",
    ),
    "LUCIDA": (
        "script",
        "slide",
        "slides",
        "video",
        "content",
        "deck",
        "layout",
        "lesson",
        "post",
    ),
    "NEXUS": (
        "suc khoe",
        "can",
        "ngu",
        "lich",
        "health",
        "sleep",
        "an gi",
        "nen an",
        "tap",
        "calendar",
        "can nang",
        "du dam",
    ),
    "INFRA": (
        "chay",
        "schedule",
        "pipeline",
        "pipeline collect",
        "job",
        "scheduler",
        "chay lai",
        "daily collect",
    ),
}


def route(user_input: str) -> dict:
    """Route user input to one Opus Animus subsystem."""

    prefix_target = _prefix_override(user_input)
    if prefix_target is not None:
        return {"target_subsystem": prefix_target, "route_confidence": 1.0}

    text = _strip_primus(user_input)
    normalized = _normalize(text)
    scores = _score(normalized)
    hits = {target: score for target, score in scores.items() if score > 0}

    if not hits:
        fallback = _llm_fallback(text)
        if fallback is not None:
            return {"target_subsystem": fallback, "route_confidence": 0.5}
        return {"target_subsystem": "CONSILIUM", "route_confidence": 0.4}

    best_score = max(hits.values())
    winners = [target for target in SUBSYSTEMS if hits.get(target) == best_score]
    if len(winners) == 1:
        return {"target_subsystem": winners[0], "route_confidence": 0.9}

    return {"target_subsystem": _tie_break(winners), "route_confidence": 0.6}


def _prefix_override(text: str) -> str | None:
    match = re.match(r"^\s*([A-Za-z]+)\s*:", text)
    if match is None:
        return None
    return PREFIX_OVERRIDES.get(match.group(1).casefold())


def _strip_primus(text: str) -> str:
    return re.sub(r"^\s*Primus\s*,\s*", "", text, flags=re.IGNORECASE)


def _normalize(text: str) -> str:
    lowered = text.casefold().replace("đ", "d").replace("Đ", "d")
    decomposed = unicodedata.normalize("NFKD", lowered)
    no_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", no_accents).strip()


def _score(normalized_text: str) -> dict[str, int]:
    return {
        target: sum(1 for keyword in keywords if _keyword_matches(normalized_text, keyword))
        for target, keywords in KEYWORDS.items()
    }


def _keyword_matches(text: str, keyword: str) -> bool:
    if " " in keyword or "-" in keyword:
        return keyword in text
    return re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", text) is not None


def _tie_break(winners: list[str]) -> str:
    for target in SUBSYSTEMS:
        if target in winners:
            return target
    return winners[0]


def _llm_fallback(text: str) -> str | None:
    """Optional placeholder for future ambiguous routing; disabled by default."""

    return None
