"""
Skills system — procedural knowledge the agent learns over time.
Skills are SKILL.md files with YAML frontmatter stored in skills/<category>/.
"""
import re
from datetime import date
from pathlib import Path

from utils.config import skills_dir


# ---------- internal helpers ----------

def _parse_frontmatter(text: str) -> tuple[dict, str]:
    """Return (metadata_dict, body) from a markdown file with YAML frontmatter."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("---", 3)
    if end == -1:
        return {}, text
    fm_block = text[3:end].strip()
    body = text[end + 3:].strip()
    meta = {}
    for line in fm_block.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            raw_v = v.strip()
            # parse simple lists: [a, b, c]
            if raw_v.startswith("[") and raw_v.endswith("]"):
                inner = raw_v[1:-1]
                meta[k.strip()] = [t.strip() for t in inner.split(",") if t.strip()]
            else:
                meta[k.strip()] = raw_v
    return meta, body


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text[:60]


def _read_index() -> str:
    p = skills_dir() / "INDEX.md"
    return p.read_text(encoding="utf-8") if p.exists() else "# Skills Index\n"


def _write_index(content: str):
    (skills_dir() / "INDEX.md").write_text(content, encoding="utf-8")


def _update_index(category: str, slug: str, title: str, tags: list[str]):
    content = _read_index()
    tag_str = ", ".join(tags)
    new_line = f"- [[{slug}]] — {title} | tags: {tag_str}"
    section_header = f"## {category}"

    lines = content.splitlines()
    out = []
    current_section = None
    inserted = False
    replaced = False
    section_seen = False

    for line in lines:
        if line.startswith("## "):
            if current_section == category and not inserted and not replaced:
                out.append(new_line)
                inserted = True
            current_section = line[3:].strip()
            if current_section == category:
                section_seen = True
            out.append(line)
            continue

        if line.startswith("- [[") and current_section == category:
            if re.search(rf"\[\[{re.escape(slug)}\]\]", line) and not replaced:
                out.append(new_line)
                replaced = True
                inserted = True
                continue

        out.append(line)

    if current_section == category and not inserted and not replaced:
        out.append(new_line)
        inserted = True

    if not section_seen:
        out.extend(["", section_header, new_line])

    now = date.today().isoformat()
    result = "\n".join(out).rstrip() + "\n"
    result = re.sub(r"\*Updated:.*?\*", f"*Updated: {now}*", result)
    _write_index(result)


# ---------- public API ----------

def list_skills() -> list[dict]:
    """Return all skills from INDEX.md as list of {slug, title, tags, category}."""
    content = _read_index()
    skills = []
    current_cat = None
    for line in content.splitlines():
        if line.startswith("## "):
            current_cat = line[3:].strip()
            continue
        m = re.search(r"\[\[([^\]]+)\]\]\s*—\s*([^|]+)(?:\|\s*tags:\s*(.*))?", line)
        if m and current_cat:
            tags_raw = m.group(3) or ""
            skills.append({
                "slug": m.group(1).strip(),
                "title": m.group(2).strip(),
                "tags": [t.strip() for t in tags_raw.split(",") if t.strip()],
                "category": current_cat,
            })
    return skills


def get_skill(slug: str) -> str | None:
    """Return full content of a skill file, or None if not found."""
    for f in skills_dir().rglob(f"{slug}.md"):
        return f.read_text(encoding="utf-8")
    return None


def search_skills(query: str) -> list[dict]:
    """Keyword search over slug + title + tags. Returns matching skill dicts."""
    words = set(query.lower().split())
    results = []
    for skill in list_skills():
        haystack = f"{skill['slug']} {skill['title']} {' '.join(skill['tags'])}".lower()
        if any(w in haystack for w in words):
            results.append(skill)
    return results


def save_skill(title: str, category: str, body: str, tags: list[str] | None = None) -> str:
    """Write a new skill file and update INDEX. Returns slug."""
    slug = _slugify(title)
    tags = tags or []
    tag_str = "[" + ", ".join(tags) + "]"
    today = date.today().isoformat()

    content = (
        f"---\n"
        f"title: {title}\n"
        f"category: {category}\n"
        f"tags: {tag_str}\n"
        f"status: active\n"
        f"created: {today}\n"
        f"uses: 0\n"
        f"---\n\n"
        f"{body.strip()}\n"
    )

    dest = skills_dir(category) / f"{slug}.md"
    dest.write_text(content, encoding="utf-8")
    _update_index(category, slug, title, tags)
    return slug


def increment_uses(slug: str):
    """Increment the `uses` counter in a skill file's frontmatter."""
    for f in skills_dir().rglob(f"{slug}.md"):
        text = f.read_text(encoding="utf-8")
        m = re.search(r"^uses:\s*(\d+)", text, re.MULTILINE)
        if m:
            new_count = int(m.group(1)) + 1
            text = text[:m.start()] + f"uses: {new_count}" + text[m.end():]
            f.write_text(text, encoding="utf-8")
        return


def archive_skill(slug: str):
    """Set status: archived in frontmatter and remove from INDEX."""
    for f in skills_dir().rglob(f"{slug}.md"):
        text = f.read_text(encoding="utf-8")
        text = re.sub(r"^status:\s*\w+", "status: archived", text, flags=re.MULTILINE)
        f.write_text(text, encoding="utf-8")

    # Remove from INDEX
    content = _read_index()
    lines = [l for l in content.splitlines() if not re.search(rf"\[\[{re.escape(slug)}\]\]", l)]
    _write_index("\n".join(lines).rstrip() + "\n")


def get_skills_context(query: str, max_skills: int = 2) -> str:
    """Return formatted skills block to inject into LLM prompts. Empty string if none found."""
    hits = search_skills(query)[:max_skills]
    if not hits:
        return ""
    parts = []
    for h in hits:
        content = get_skill(h["slug"])
        if content:
            _, body = _parse_frontmatter(content)
            parts.append(f"### Skill: {h['title']}\n{body[:600]}")
            increment_uses(h["slug"])
    if not parts:
        return ""
    return "## Learned Skills\n" + "\n\n".join(parts)
