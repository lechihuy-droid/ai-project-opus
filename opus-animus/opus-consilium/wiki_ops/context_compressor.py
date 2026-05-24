"""
Context compression for ingest sources.

If a source is short enough (<= THRESHOLD), pass it as-is.
If longer, use one LLM call to extract key information before the main ingest call.
This preserves signal from long papers/articles that would otherwise be truncated.
"""
from utils.llm import claude_cli

COMPRESS_THRESHOLD = 3000   # chars — below this, no compression needed
COMPRESS_INPUT_CAP = 6000   # chars fed to the compressor LLM (captures head + structure)


_CATEGORY_HINTS = {
    "papers": (
        "This is an academic paper. Extract: title, authors, abstract (verbatim if short), "
        "key contributions as bullet points, methodology summary, main results/numbers. "
        "Preserve model names, dataset names, benchmark scores exactly."
    ),
    "articles": (
        "This is a blog post or article. Extract: main thesis, key points as bullet points, "
        "important facts/data/numbers, conclusions. Preserve specific claims and named entities."
    ),
    "notes": (
        "This is a personal note. Preserve the content faithfully, removing only boilerplate "
        "headers/footers. Keep all specific details, dates, names."
    ),
}


def compress_source(content: str, category: str) -> tuple[str, bool]:
    """
    Returns (processed_content, was_compressed).
    processed_content is ready to paste into the ingest LLM prompt.
    """
    if len(content) <= COMPRESS_THRESHOLD:
        return content, False

    hint = _CATEGORY_HINTS.get(category, _CATEGORY_HINTS["articles"])
    input_text = content[:COMPRESS_INPUT_CAP]

    prompt = (
        "You are a precise content extractor. "
        "Extract key information faithfully. Never add information not in the source. "
        "Output plain text, no JSON, no markdown fences.\n\n"
        f"{hint}\n\n"
        f"Output a structured summary of ~1800 chars.\n\n"
        f"SOURCE ({len(content)} chars total, showing first {len(input_text)}):\n"
        f"{input_text}"
    )
    return claude_cli(prompt, timeout=120), True
