"""Shared data functions — reused by both run_home.py (terminal) and dashboard API."""
import re
import subprocess
from datetime import datetime, date, timedelta
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.config import personal_wiki_dir, raw_dir

ROOT = Path(__file__).parent.parent


def _markdown_section(text: str, heading: str) -> str:
    pattern = rf"^##\s+{re.escape(heading)}\s*$"
    match = re.search(pattern, text, flags=re.MULTILINE)
    if not match:
        return ""
    rest = text[match.end():]
    next_heading = re.search(r"^##\s+", rest, flags=re.MULTILINE)
    return rest[: next_heading.start()].strip() if next_heading else rest.strip()


def _markdown_subsections(text: str, heading: str) -> list[str]:
    sections = []
    pattern = rf"^###\s+{re.escape(heading)}\s*$"
    for match in re.finditer(pattern, text, flags=re.MULTILINE):
        rest = text[match.end():]
        next_heading = re.search(r"^###\s+|^##\s+", rest, flags=re.MULTILINE)
        sections.append(rest[: next_heading.start()].strip() if next_heading else rest.strip())
    return sections


def _compact_markdown_text(text: str, limit: int = 360) -> str:
    cleaned = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("```"):
            continue
        if stripped.startswith("- "):
            stripped = stripped[2:].strip()
        cleaned.append(stripped)
    compact = " ".join(cleaned)
    compact = re.sub(r"\s+", " ", compact).strip()
    return compact[:limit].rstrip() + ("..." if len(compact) > limit else "")


def _markdown_bullets(text: str, limit: int = 5) -> list[str]:
    bullets = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            bullets.append(stripped[2:].strip())
        if len(bullets) >= limit:
            break
    return bullets


def latest_daily_brief() -> dict:
    daily_dir = ROOT / "logs" / "daily"
    if not daily_dir.exists():
        return {"available": False, "message": "Run run_daily.py to create a Consilium daily brief."}

    files = sorted(daily_dir.glob("*.md"), key=lambda path: path.stat().st_mtime, reverse=True)
    if not files:
        return {"available": False, "message": "Run run_daily.py to create a Consilium daily brief."}

    path = files[0]
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    title = next((line.lstrip("# ").strip() for line in lines if line.startswith("# ")), path.stem)
    meta = next((line for line in lines if line.startswith("Brief ")), "")
    decision_text = _markdown_section(text, "Decision")
    suggested_actions = [
        _compact_markdown_text(section, limit=220)
        for section in _markdown_subsections(text, "Suggested action")
        if section.strip()
    ][:3]
    wiki_updates = []
    for section in _markdown_subsections(text, "Wiki updates"):
        wiki_updates.extend(_markdown_bullets(section, limit=4))

    return {
        "available": True,
        "date": path.stem,
        "title": title,
        "mode": "LLM-assisted" if "LLM-assisted" in meta else "deterministic",
        "local_only": "local-only" in meta.lower() or "local-only" in text.lower(),
        "decision": _compact_markdown_text(decision_text, limit=420),
        "suggested_actions": suggested_actions,
        "wiki_updates": wiki_updates[:5],
        "path": str(path.relative_to(ROOT)),
    }


def wiki_stats() -> dict:
    wiki = personal_wiki_dir()
    pages = [f for f in wiki.rglob("*.md")
             if f.name not in ("SCHEMA.md", "INDEX.md", "log.md", "WIKI_HEALTH.md", "processed.txt")
             and "reflection-" not in f.name]
    topics = {}
    for p in pages:
        t = p.parent.name
        topics[t] = topics.get(t, 0) + 1

    recent = []
    log = wiki / "log.md"
    if log.exists():
        lines = [l for l in log.read_text(encoding="utf-8").splitlines()
                 if "|" in l and not l.startswith("|---") and not l.startswith("| Date")]
        for line in reversed(lines[-8:]):
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 4 and "/" in parts[2]:
                recent.append(parts[2])
            if len(recent) >= 5:
                break

    cutoff = datetime.now() - timedelta(days=7)
    week_count = 0
    if log.exists():
        for line in log.read_text(encoding="utf-8").splitlines():
            if "|" not in line or line.startswith("|---"):
                continue
            parts = [p.strip() for p in line.split("|")]
            try:
                ts = datetime.strptime(parts[1], "%Y-%m-%d %H:%M")
                if ts >= cutoff:
                    week_count += 1
            except Exception:
                pass

    inbox = raw_dir("articles").parent / "inbox"
    inbox_count = len([f for f in inbox.iterdir() if f.is_file()]) if inbox.exists() else 0

    return {
        "total": len(pages),
        "topics": [{"name": k, "n": v} for k, v in sorted(topics.items(), key=lambda x: -x[1])],
        "recent": recent,
        "week": week_count,
        "inbox": inbox_count,
    }


def pmp_status() -> dict:
    exam_date = date(2026, 5, 29)
    today = date.today()
    days_left = (exam_date - today).days
    total_days = 31
    days_done = max(0, total_days - days_left)
    if days_left > 21:
        phase = "Coverage"
    elif days_left > 10:
        phase = "Review"
    elif days_left > 3:
        phase = "Mock"
    else:
        phase = "Taper"
    return {
        "days": days_left,
        "phase": phase,
        "exam": exam_date.isoformat(),
        "total_days": total_days,
        "days_done": days_done,
        "bar_pct": round(days_done / total_days, 3),
    }


def module_status(task_name: str) -> str:
    try:
        r = subprocess.run(
            ["cmd", "/c", f"schtasks /query /fo LIST /tn {task_name}"],
            capture_output=True, text=True, timeout=5
        )
        for line in r.stdout.splitlines():
            if "Last Run Time" in line:
                val = line.split(":", 1)[-1].strip()
                if val and "N/A" not in val and val != "":
                    try:
                        dt = datetime.strptime(val, "%m/%d/%Y %I:%M:%S %p")
                        return dt.strftime("%m-%d %H:%M")
                    except Exception:
                        return val[:20]
    except Exception:
        pass
    return "—"


def system_status() -> list:
    modules = [
        ("Module A  ResearchCrew",  "daily-research"),
        ("Module B  Daily Brief",   "daily-brief"),
        ("Module C  Wiki Agent",    "wiki-poll"),
        ("Collector  Content Batch","content-collector"),
        ("Markitdown  Input tool",  None),
    ]
    result = []
    for name, task in modules:
        if task:
            last = module_status(task)
            ok = last != "—"
        else:
            # markitdown: check if inbox dir exists
            inbox = raw_dir("articles").parent / "inbox"
            last = "watching inbox/" if inbox.exists() else "—"
            ok = inbox.exists()
        result.append({"name": name, "task": task or "", "last_run": last, "ok": ok})
    return result


def reflection_status() -> dict:
    iso = date.today().isocalendar()
    week = f"{iso[0]}-W{iso[1]:02d}"
    path = personal_wiki_dir() / "Personal" / f"reflection-{week}.md"
    done = path.exists()
    return {"done": done, "week": iso[1], "label": f"Done  W{iso[1]}" if done else f"PENDING  W{iso[1]}"}


def today_articles_count() -> int:
    today = date.today().isoformat()
    d = raw_dir("articles")
    return len(list(d.glob(f"{today}*.md"))) if d.exists() else 0


def _ingested_slugs() -> set:
    """Return slugs of articles already ingested into the wiki (from log.md)."""
    slugs = set()
    try:
        log = personal_wiki_dir() / "log.md"
        if not log.exists():
            return slugs
        for line in log.read_text(encoding="utf-8").splitlines():
            if "articles/" not in line:
                continue
            m = re.search(r'articles/(\d{4}-\d{2}-\d{2}[^\s|]+?)(?:\.md)?(?:\s|\|)', line)
            if m:
                slugs.add(m.group(1))
    except Exception:
        pass
    return slugs


def list_articles(limit: int = 30, days_back: int = 1) -> list:
    """Return recent articles from raw/articles/ with full metadata."""
    d = raw_dir("articles")
    if not d.exists():
        return []
    cutoff_date = date.today() - timedelta(days=max(days_back - 1, 0))
    all_files = sorted(d.glob("*.md"), key=lambda f: f.stat().st_mtime, reverse=True)
    files = []
    for f in all_files:
        try:
            file_date = datetime.strptime(f.stem[:10], "%Y-%m-%d").date()
        except ValueError:
            continue
        if file_date >= cutoff_date:
            files.append(f)
    ingested = _ingested_slugs()
    result = []
    for f in files[:limit]:
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
            title = url = source = topic = relevance = source_kind = ""
            goal_score = 0
            meta_done = False
            summary_lines = []
            for line in text.splitlines():
                stripped = line.strip()
                if stripped.startswith("# ") and not title:
                    title = stripped[2:].strip()
                elif stripped.startswith("**URL:**"):
                    url = stripped.replace("**URL:**", "").strip()
                elif stripped.startswith("**Source:**"):
                    source = stripped.replace("**Source:**", "").strip()
                elif stripped.startswith("**Topic:**"):
                    topic = stripped.replace("**Topic:**", "").strip()
                elif stripped.startswith("**Source-Kind:**"):
                    source_kind = stripped.replace("**Source-Kind:**", "").strip()
                elif stripped.startswith("**Goal-Score:**"):
                    try:
                        goal_score = int(stripped.replace("**Goal-Score:**", "").strip())
                    except Exception:
                        pass
                elif stripped.startswith("**Relevance:**"):
                    relevance = stripped.replace("**Relevance:**", "").strip()
                elif not meta_done and stripped == "" and title:
                    meta_done = True
                elif meta_done and stripped and not stripped.startswith("**"):
                    summary_lines.append(stripped)
                    if len(summary_lines) >= 3:
                        break
            if not title:
                continue
            result.append({
                "title":       title,
                "url":         url,
                "source":      source,
                "topic":       topic,
                "source_kind": source_kind,
                "slug":        f.stem,
                "date":        f.stem[:10],
                "goal_score":  goal_score,
                "summary":     " ".join(summary_lines)[:280],
                "relevance":   relevance,
                "wiki_status": "ingested" if f.stem in ingested else "pending",
            })
        except Exception:
            continue
    return result


def parse_goals() -> dict:
    goals_path = Path(__file__).parent.parent.parent / "GOALS.md"
    if not goals_path.exists():
        return {}
    content = goals_path.read_text(encoding="utf-8")

    HEADER_WORDS = {"hạng mục", "metric", "field", "muc"}

    def extract_table(section_header: str) -> dict:
        result = {}
        in_section = False
        for line in content.splitlines():
            if section_header in line:
                in_section = True
                continue
            if in_section and line.startswith("## "):
                break
            if in_section and "|" in line:
                if line.startswith("|---") or "---|" in line:
                    continue
                parts = [p.strip() for p in line.split("|")]
                parts = [p for p in parts if p]
                if len(parts) >= 2:
                    key = parts[0].replace("`", "").strip()
                    if key.lower() in HEADER_WORDS:
                        continue
                    val = parts[1].replace("`", "").strip()
                    val = val if "[___]" not in val else "—"
                    result[key] = val
        return result

    finance = extract_table("Track 1")
    health  = extract_table("Track 2")
    career  = extract_table("Track 3")

    freedom_match = re.search(r"passive income ≥ (.+?) — target trong (.+?)(?:\*\*|$|\n)", content)
    freedom = freedom_match.group(1).strip() if freedom_match else "—"
    timeline = freedom_match.group(2).strip() if freedom_match else "—"

    # L2 skills
    l2_rows = []
    in_l2 = False
    for line in content.splitlines():
        if "L2 — SKILL" in line:
            in_l2 = True
            continue
        if in_l2 and line.startswith("### L3"):
            break
        if in_l2 and "|" in line and not line.startswith("|---") and "Skill" not in line:
            parts = [p.strip() for p in line.split("|")]
            parts = [p for p in parts if p]
            if len(parts) >= 2:
                l2_rows.append({"skill": parts[0], "current": parts[1] if len(parts) > 1 else "—"})

    return {
        "finance": finance,
        "health":  health,
        "career":  career,
        "freedom_target": freedom,
        "freedom_timeline": timeline,
        "l2_skills": l2_rows,
    }
