"""
Module C — query operation.
2-call pattern: INDEX → find relevant pages → synthesize answer.
"""
import re
from pathlib import Path

from utils.config import personal_wiki_dir
from utils.llm import claude_cli, claude_cli_json


def _read_index() -> str:
    p = personal_wiki_dir() / "INDEX.md"
    return p.read_text(encoding="utf-8") if p.exists() else ""


def _read_page(stem: str) -> str | None:
    wiki = personal_wiki_dir()
    matches = list(wiki.rglob(f"{stem}.md"))
    if matches:
        return matches[0].read_text(encoding="utf-8")
    return None


def run_query(question: str, verbose: bool = True) -> dict:
    """
    Returns: {status, answer, pages_read}
    """
    index = _read_index()
    if not index.strip() or "## AI" not in index and "## Stock" not in index:
        return {
            "status": "empty",
            "answer": "Wiki chua co noi dung. Hay ingest mot so sources truoc.",
            "pages_read": [],
        }

    # Call 1: find relevant pages from INDEX
    prompt1 = (
        "You are a search assistant. Given a wiki index and a question, return the 2-4 most "
        "relevant page slugs as a JSON array. Return ONLY the JSON array, no explanation.\n\n"
        f"INDEX:\n{index}\n\n"
        f"QUESTION: {question}\n\n"
        'Return JSON array of relevant page slugs (e.g. ["llm-agents", "rag-vs-wiki"]):'
    )
    try:
        page_slugs = claude_cli_json(prompt1, timeout=60, expect="array")
        if not isinstance(page_slugs, list):
            page_slugs = []
    except Exception:
        page_slugs = []

    if verbose:
        print(f"[query] Relevant pages: {page_slugs}")

    # Read page contents
    pages_content = ""
    pages_read = []
    for slug in page_slugs[:4]:
        content = _read_page(slug)
        if content:
            pages_content += f"\n\n=== [[{slug}]] ===\n{content[:2000]}"
            pages_read.append(slug)

    if not pages_content:
        return {
            "status": "no_match",
            "answer": f"Khong tim thay page lien quan den: '{question}'. Thu ingest them sources.",
            "pages_read": [],
        }

    # Call 2: synthesize answer
    from wiki_ops.skill_manager import get_skills_context
    skills_context = get_skills_context(question)
    synthesis_prompt = (
        "You are a personal knowledge assistant. Answer the question based ONLY on the wiki "
        "content provided. Cite sources using [[page-name]]. Plain text, no emojis."
        + (f"\n\n{skills_context}" if skills_context else "")
        + f"\n\nWIKI CONTENT:{pages_content}\n\nQUESTION: {question}\n\nAnswer concisely, cite [[sources]]:"
    )
    answer = claude_cli(synthesis_prompt, timeout=120)

    return {
        "status": "ok",
        "answer": answer,
        "pages_read": pages_read,
    }
