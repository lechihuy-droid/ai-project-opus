"""
Module C — lint operation.
Pure Python — no LLM calls. Scans personal-wiki/ for consistency issues.
"""
import re
from datetime import datetime, timedelta
from pathlib import Path

from utils.config import personal_wiki_dir
from utils.telegram import send_message


def _get_all_pages() -> list[Path]:
    wiki = personal_wiki_dir()
    return [
        p for p in wiki.rglob("*.md")
        if p.name not in ("SCHEMA.md", "INDEX.md", "log.md")
        and "_archive" not in p.parts
    ]


def _parse_frontmatter(content: str) -> dict:
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}
    fm = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip().strip('"')
    return fm


def _extract_wikilinks(content: str) -> list[str]:
    return re.findall(r"\[\[([^\]]+)\]\]", content)


def check_orphan_pages(pages: list[Path]) -> list[str]:
    """Pages that no other page links to."""
    all_links = set()
    for p in pages:
        content = p.read_text(encoding="utf-8", errors="replace")
        for link in _extract_wikilinks(content):
            all_links.add(link.lower())

    issues = []
    for p in pages:
        stem = p.stem.lower()
        if stem not in all_links:
            rel = p.relative_to(personal_wiki_dir())
            issues.append(f"[ORPHAN]      {rel} — no inbound [[links]]")
    return issues


def check_broken_links(pages: list[Path]) -> list[str]:
    """[[links]] pointing to pages that don't exist."""
    wiki = personal_wiki_dir()
    all_stems = {p.stem.lower() for p in pages}

    issues = []
    for p in pages:
        content = p.read_text(encoding="utf-8", errors="replace")
        rel = p.relative_to(wiki)
        for link in _extract_wikilinks(content):
            if link.lower() not in all_stems:
                issues.append(f"[BROKEN]      {rel} -> [[{link}]] not found")
    return issues


def check_contradictions(pages: list[Path]) -> list[str]:
    """Pages tagged with 'contradiction' that haven't been resolved."""
    issues = []
    for p in pages:
        content = p.read_text(encoding="utf-8", errors="replace")
        fm = _parse_frontmatter(content)
        tags_raw = fm.get("tags", "")
        if "contradiction" in tags_raw.lower():
            rel = p.relative_to(personal_wiki_dir())
            issues.append(f"[CONTRADICTION] {rel} — tagged as contradiction, needs review")
    return issues


def check_stale_pages(pages: list[Path], days: int = 30) -> list[str]:
    """Pages not updated in `days` days."""
    cutoff = datetime.now() - timedelta(days=days)
    issues = []
    for p in pages:
        content = p.read_text(encoding="utf-8", errors="replace")
        fm = _parse_frontmatter(content)
        updated_str = fm.get("updated", "")
        if not updated_str:
            continue
        try:
            updated = datetime.strptime(updated_str, "%Y-%m-%d")
            if updated < cutoff:
                rel = p.relative_to(personal_wiki_dir())
                issues.append(f"[STALE]       {rel} — last updated {updated_str} ({(datetime.now()-updated).days}d ago)")
        except ValueError:
            pass
    return issues


def check_missing_frontmatter(pages: list[Path]) -> list[str]:
    """Pages missing YAML frontmatter."""
    issues = []
    for p in pages:
        content = p.read_text(encoding="utf-8", errors="replace")
        if not content.startswith("---"):
            rel = p.relative_to(personal_wiki_dir())
            issues.append(f"[NO FRONTMATTER] {rel}")
    return issues


def _count_by_topic(pages: list[Path]) -> dict:
    counts = {}
    wiki = personal_wiki_dir()
    for p in pages:
        parts = p.relative_to(wiki).parts
        topic = parts[0] if len(parts) > 1 else "root"
        counts[topic] = counts.get(topic, 0) + 1
    return counts


def _pages_added_this_week(pages: list[Path]) -> list[Path]:
    cutoff = datetime.now() - timedelta(days=7)
    new = []
    for p in pages:
        content = p.read_text(encoding="utf-8", errors="replace")
        fm = _parse_frontmatter(content)
        created_str = fm.get("created", "")
        try:
            if datetime.strptime(created_str, "%Y-%m-%d") >= cutoff:
                new.append(p)
        except ValueError:
            pass
    return new


def run_lint(send_telegram: bool = True) -> str:
    pages = _get_all_pages()

    issues = []
    issues += check_orphan_pages(pages)
    issues += check_broken_links(pages)
    issues += check_contradictions(pages)
    issues += check_stale_pages(pages)
    issues += check_missing_frontmatter(pages)

    ok_checks = []
    if not any("[CONTRADICTION]" in i for i in issues):
        ok_checks.append("[OK]          No unresolved contradictions")
    if not any("[NO FRONTMATTER]" in i for i in issues):
        ok_checks.append("[OK]          All pages have frontmatter")

    counts = _count_by_topic(pages)
    counts_str = " | ".join(f"{v} {k}" for k, v in sorted(counts.items()))
    new_pages = _pages_added_this_week(pages)
    new_by_topic = _count_by_topic(new_pages)
    new_str = ", ".join(f"{v} {k}" for k, v in sorted(new_by_topic.items())) or "none"

    today = datetime.now().strftime("%Y-%m-%d")
    report_lines = [
        f"Wiki Lint Report — {today}",
        f"Pages: {len(pages)} total | {counts_str}",
        "",
    ]
    if issues:
        report_lines += issues
    report_lines += ok_checks
    report_lines += [
        "",
        f"Added this week: {len(new_pages)} pages ({new_str})",
    ]

    report = "\n".join(report_lines)
    print(report)

    if send_telegram:
        tg_text = f"<b>Wiki Lint — {today}</b>\n<pre>{report}</pre>"
        send_message(tg_text[:3800])

    return report
