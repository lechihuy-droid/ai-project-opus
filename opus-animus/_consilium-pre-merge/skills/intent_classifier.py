"""
Phase 6 — Intent classifier for Hermes Skill Layer.
Maps natural language input → structured intent for wiki operations.

Standalone — works without Hermes runtime. Hermes wraps this when available.
"""
import re
from dataclasses import dataclass, field


@dataclass
class Intent:
    operation: str          # ingest | query | lint | digest | unknown
    args: dict = field(default_factory=dict)
    confidence: float = 1.0
    raw_input: str = ""


# Rule-based classifier (fast, no LLM cost for clear cases)
_INGEST_PATTERNS = [
    r"https?://\S+",                        # bare URL
    r"(lưu|save|ingest|add|thêm).*(này|bài|link|url|article)",
    r"(clip|download|bookmark)",
]

_QUERY_PATTERNS = [
    r"^/wiki ask",
    r"(biết gì|know about|what is|explain|tóm tắt|summarize)",
    r"(liên quan|related to|connection between)",
    r"\?$",                                 # ends with question mark
]

_LINT_PATTERNS = [
    r"^/wiki digest",
    r"(lint|check|kiểm tra|health|báo cáo|report)",
    r"(tuần này|this week|weekly)",
]


def _extract_url(text: str) -> str | None:
    match = re.search(r"https?://\S+", text)
    return match.group(0) if match else None


def classify(text: str, has_attachment: bool = False) -> Intent:
    """
    Rule-based classification, falls back to LLM for ambiguous cases.
    Returns Intent with operation + args.
    """
    text_lower = text.lower().strip()

    # Explicit /wiki commands — highest confidence
    if text_lower.startswith("/wiki"):
        args_str = text[5:].strip()
        if not args_str or args_str == "help":
            return Intent("help", {}, 1.0, text)
        if args_str.startswith("ask "):
            return Intent("query", {"question": args_str[4:].strip()}, 1.0, text)
        if args_str.startswith("note "):
            return Intent("ingest", {"source": args_str[5:].strip(), "type": "note"}, 1.0, text)
        if args_str == "digest":
            return Intent("digest", {}, 1.0, text)
        if args_str == "lint":
            return Intent("lint", {}, 1.0, text)
        url = _extract_url(args_str)
        if url:
            return Intent("ingest", {"source": url, "type": "url"}, 1.0, text)

    # File attachment — always ingest
    if has_attachment:
        return Intent("ingest", {"type": "file"}, 0.95, text)

    # URL in message — ingest
    url = _extract_url(text)
    if url:
        for pattern in _INGEST_PATTERNS:
            if re.search(pattern, text_lower):
                return Intent("ingest", {"source": url, "type": "url"}, 0.9, text)
        # bare URL with no other context
        return Intent("ingest", {"source": url, "type": "url"}, 0.8, text)

    # Query patterns
    for pattern in _QUERY_PATTERNS:
        if re.search(pattern, text_lower):
            return Intent("query", {"question": text}, 0.85, text)

    # Lint/digest patterns
    for pattern in _LINT_PATTERNS:
        if re.search(pattern, text_lower):
            return Intent("digest", {}, 0.85, text)

    # Ambiguous — fall back to LLM classifier
    return _llm_classify(text)


def _llm_classify(text: str) -> Intent:
    """LLM fallback for ambiguous natural language input — via Claude CLI."""
    try:
        from utils.llm import claude_cli_json
        prompt = (
            "Classify this message into one wiki operation. "
            "Return JSON ONLY (no other text): "
            '{"operation":"ingest|query|lint|digest|unknown",'
            '"args":{"source":"...","question":"..."},'
            '"confidence":0.0-1.0}\n\n'
            f"Message: {text}"
        )
        data = claude_cli_json(prompt, timeout=60, expect="object")
        return Intent(
            operation=data.get("operation", "unknown"),
            args=data.get("args", {}),
            confidence=float(data.get("confidence", 0.5)),
            raw_input=text,
        )
    except Exception:
        return Intent("unknown", {}, 0.0, text)
