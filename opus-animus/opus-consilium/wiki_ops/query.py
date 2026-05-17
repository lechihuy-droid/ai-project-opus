"""
Module C — query operation.
2-call pattern: INDEX → find relevant pages → synthesize answer.
"""
import os
import json
import re
from pathlib import Path

from groq import Groq
from utils.config import personal_wiki_dir


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

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Call 1: find relevant pages from INDEX
    resp1 = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a search assistant. Given a wiki index and a question, return the 2-4 most relevant page slugs as a JSON array. Return ONLY the JSON array, no explanation.",
            },
            {
                "role": "user",
                "content": f"INDEX:\n{index}\n\nQUESTION: {question}\n\nReturn JSON array of relevant page slugs (e.g. [\"llm-agents\", \"rag-vs-wiki\"]):",
            },
        ],
        max_tokens=200,
        temperature=0.1,
    )

    raw = resp1.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        page_slugs = json.loads(raw)
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
    synthesis_system = "You are a personal knowledge assistant. Answer the question based ONLY on the wiki content provided. Cite sources using [[page-name]]. Plain text, no emojis."
    if skills_context:
        synthesis_system += f"\n\n{skills_context}"

    resp2 = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": synthesis_system,
            },
            {
                "role": "user",
                "content": f"WIKI CONTENT:{pages_content}\n\nQUESTION: {question}\n\nAnswer concisely, cite [[sources]]:",
            },
        ],
        max_tokens=600,
        temperature=0.3,
    )

    answer = resp2.choices[0].message.content.strip()

    return {
        "status": "ok",
        "answer": answer,
        "pages_read": pages_read,
    }
