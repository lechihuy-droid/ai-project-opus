"""
GAP-2: Reflection layer — weekly synthesis
GAP-5: Spaced repetition — surface old pages

Output: personal-wiki/Personal/reflection-YYYY-WW.md + Telegram summary
"""
import os
import re
from datetime import datetime, date, timedelta
from pathlib import Path

from utils.config import personal_wiki_dir, raw_dir
from utils.llm import claude_cli


def _get_week_str() -> str:
    iso = date.today().isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


def _get_recent_pages(days: int = 7) -> list[tuple[str, str]]:
    """Pages ingested in last N days from log.md."""
    log_path = personal_wiki_dir() / "log.md"
    if not log_path.exists():
        return []

    cutoff = datetime.now() - timedelta(days=days)
    pages = []
    for line in log_path.read_text(encoding="utf-8").splitlines():
        if "|" not in line or line.startswith("|---"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 4:
            continue
        try:
            ts = datetime.strptime(parts[1], "%Y-%m-%d %H:%M")
            if ts >= cutoff:
                pages.append((parts[2], parts[3]))  # (source, page_path)
        except Exception:
            continue
    return pages


def _get_old_pages_for_review(n: int = 3) -> list[Path]:
    """Oldest pages without `applied::` tag — spaced repetition candidates."""
    wiki = personal_wiki_dir()
    pages = []
    for f in wiki.rglob("*.md"):
        if f.name in ("SCHEMA.md", "INDEX.md", "log.md"):
            continue
        if f.parent.name == "Personal" and "reflection-" in f.name:
            continue
        content = f.read_text(encoding="utf-8", errors="replace")
        if "applied::" not in content:
            mtime = f.stat().st_mtime
            pages.append((mtime, f))

    pages.sort(key=lambda x: x[0])
    return [f for _, f in pages[:n]]


def _read_page_snippet(path: Path, max_chars: int = 500) -> str:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
        return content[:max_chars]
    except Exception:
        return ""


def run_reflect(send_telegram: bool = True) -> str:
    week = _get_week_str()
    today = date.today().isoformat()

    recent = _get_recent_pages(days=7)
    old_pages = _get_old_pages_for_review(n=3)

    recent_summary = "\n".join(f"- {p[1]}" for p in recent) if recent else "(no new pages this week)"
    old_summary = "\n".join(f"- {p.name} (added: {datetime.fromtimestamp(p.stat().st_mtime).strftime('%Y-%m-%d')})"
                            for p in old_pages) if old_pages else "(wiki still growing)"

    # Read snippets of recent pages for LLM context
    page_contexts = []
    wiki = personal_wiki_dir()
    for _, page_path in recent[:5]:
        matches = list(wiki.rglob(page_path.split("/")[-1]))
        if matches:
            snippet = _read_page_snippet(matches[0])
            page_contexts.append(f"[{page_path}]\n{snippet}\n")
    context_text = "\n---\n".join(page_contexts) if page_contexts else recent_summary

    prompt = f"""You are a personal knowledge curator helping someone reflect on their weekly learning.

Week: {week}
New pages ingested this week ({len(recent)}):
{recent_summary}

Sample content from recent pages:
{context_text[:3000]}

Old pages pending review (no applied:: tag):
{old_summary}

Write a concise weekly reflection in Vietnamese. Format:
## Reflection {week}

**3 điều đáng chú ý tuần này:**
1. ...
2. ...
3. ...

**Insight mới hoặc mâu thuẫn với điều đã biết:**
...

**3 pages cũ nên đọc lại:**
{old_summary}

**Câu hỏi để suy nghĩ tuần tới:**
...

Keep it tight — 200-300 words max. Be specific, not generic."""

    try:
        reflection_text = claude_cli(prompt, timeout=120)
    except Exception as e:
        reflection_text = f"(LLM error: {e})\n\nPages this week:\n{recent_summary}"

    # Save to wiki
    personal_dir = wiki / "Personal"
    personal_dir.mkdir(exist_ok=True)
    output_path = personal_dir / f"reflection-{week}.md"
    full_content = f"""---
title: "Reflection {week}"
topic: Personal
tags: [reflection, weekly]
created: {today}
updated: {today}
---

{reflection_text}
"""
    output_path.write_text(full_content, encoding="utf-8")

    # Telegram
    if send_telegram:
        import requests
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
        if token and chat_id:
            msg = f"Weekly Reflection {week}\n\n{reflection_text[:3000]}"
            try:
                requests.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": chat_id, "text": msg},
                    timeout=10,
                )
            except Exception as e:
                print(f"[reflect] Telegram error: {e}")

    print(f"[reflect] Saved: Personal/reflection-{week}.md")
    return reflection_text
