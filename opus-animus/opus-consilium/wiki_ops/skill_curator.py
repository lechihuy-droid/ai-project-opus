"""
Skill Curator — autonomous consolidation of the skills library.

Runs periodically (e.g. weekly) to:
  1. Merge overlapping skills into umbrella skills
  2. Archive stale skills (uses=0, older than STALE_DAYS)
"""
import json
import re
from datetime import date, timedelta

from utils.llm import claude_cli_json
from wiki_ops.skill_manager import (
    list_skills, get_skill, save_skill, archive_skill, _parse_frontmatter
)

STALE_DAYS = 30
MIN_SKILLS_TO_CURATE = 3


def _load_all_active() -> list[dict]:
    """Return active skills with their full content."""
    result = []
    for s in list_skills():
        content = get_skill(s["slug"])
        if not content:
            continue
        meta, body = _parse_frontmatter(content)
        if meta.get("status", "active") == "archived":
            continue
        result.append({**s, "meta": meta, "body": body, "content": content})
    return result


def _is_stale(meta: dict) -> bool:
    created_str = meta.get("created", "")
    uses = int(meta.get("uses", 0))
    if uses > 0 or not created_str:
        return False
    try:
        created = date.fromisoformat(created_str)
        return (date.today() - created).days >= STALE_DAYS
    except ValueError:
        return False


def _strip_json(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    if not raw.startswith("{"):
        start, end = raw.find("{"), raw.rfind("}")
        if start != -1 and end > start:
            raw = raw[start:end + 1]
    return raw


def curate(dry_run: bool = False) -> dict:
    """
    Main curator entry point.
    Returns: {merged: int, archived: int, skipped: str|None}
    """
    skills = _load_all_active()

    if len(skills) < MIN_SKILLS_TO_CURATE:
        msg = f"Only {len(skills)} skill(s) — need {MIN_SKILLS_TO_CURATE} to curate."
        print(f"[curator] {msg}")
        return {"merged": 0, "archived": 0, "skipped": msg}

    # Build skills summary for LLM
    skills_text = ""
    for s in skills:
        skills_text += f"\n---\nslug: {s['slug']}\ntitle: {s['title']}\ncategory: {s['category']}\ntags: {', '.join(s['tags'])}\nbody:\n{s['body'][:400]}\n"

    prompt = (
        "You are a knowledge curator. Be conservative — only merge when overlap is clear. Return valid JSON only.\n\n"
        "You are reviewing a skills library to find overlaps and suggest consolidations.\n\n"
        f"SKILLS:\n{skills_text}\n\n"
        "Task:\n"
        "1. Identify groups of skills with significant overlap (same procedure, same context).\n"
        "   Only suggest merging when overlap is clear and substantial — be conservative.\n"
        "2. For each group, propose one umbrella skill that replaces them.\n"
        "3. Do NOT suggest merging skills that are genuinely distinct.\n\n"
        "Return ONLY valid JSON:\n"
        '{"consolidations": [{"umbrella_title": "Human Readable Title","umbrella_category": "wiki","umbrella_tags": ["tag1", "tag2"],"merge_slugs": ["slug-a", "slug-b"],"body": "## When to use\\n...\\n\\n## Procedure\\n1. ...\\n\\n## Notes\\n- ..."}]}\n\n'
        'If no clear overlaps exist, return: {"consolidations": []}'
    )

    try:
        result = claude_cli_json(prompt, timeout=120, expect="object")
    except Exception as e:
        print(f"[curator] LLM error: {e}")
        return {"merged": 0, "archived": 0, "skipped": str(e)}

    merged = 0
    archived = 0

    # Process consolidations
    for c in result.get("consolidations", []):
        merge_slugs = c.get("merge_slugs", [])
        if len(merge_slugs) < 2:
            continue

        # Verify slugs exist
        valid = [s for s in merge_slugs if any(sk["slug"] == s for sk in skills)]
        if len(valid) < 2:
            continue

        print(f"[curator] Merging {valid} → '{c['umbrella_title']}'")
        if not dry_run:
            save_skill(
                title=c["umbrella_title"],
                category=c.get("umbrella_category", "wiki"),
                body=c["body"],
                tags=c.get("umbrella_tags", []),
            )
            for slug in valid:
                archive_skill(slug)
                archived += 1
        merged += 1

    # Archive stale skills
    for s in skills:
        if s["slug"] in [slug for c in result.get("consolidations", []) for slug in c.get("merge_slugs", [])]:
            continue  # already handled above
        if _is_stale(s["meta"]):
            print(f"[curator] Archiving stale: {s['slug']} (0 uses, {s['meta'].get('created', '?')})")
            if not dry_run:
                archive_skill(s["slug"])
            archived += 1

    print(f"[curator] Done — merged: {merged} groups, archived: {archived} skills")
    return {"merged": merged, "archived": archived, "skipped": None}
