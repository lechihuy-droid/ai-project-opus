"""
Prompt Extractor — harvest meaningful user prompts from Claude Code history.

Reads ~/.claude/projects/**/*.jsonl, filters trivial messages,
groups by project/session, exports to raw/notes/ for wiki ingest.
Tracks last harvest timestamp to avoid reprocessing.
"""
import json
import glob
import re
from datetime import datetime, timezone
from pathlib import Path

from utils.config import raw_dir

CLAUDE_PROJECTS_DIR = Path.home() / ".claude" / "projects"
LAST_HARVEST_FILE = raw_dir("notes") / ".last_harvest"

MIN_LENGTH = 80

_TRIVIAL = re.compile(
    r"^(yes|no|có|không|tiếp|ok|okay|done|xong|next|continue|yep|nope|sure|"
    r"thanks|cảm ơn|great|good|perfect|got it|understood|noted|"
    r"p\d+[ab]?|[\d\s\.\-]+)[\.\!\?]?$",
    re.IGNORECASE,
)

PROJECT_LABELS = {
    "c--Users-HUY-AI": "OPUS ANIMUS",
    "c--Users-HUY-sier-project": "Sier Project",
    "c--Users-HUY-AI-WIKI-personal-agent": "Wiki Agent",
    "c--Users-HUY-PMP-Quiz-App": "PMP Quiz",
    "c--Users-HUY-continue": "Continue",
}


def _load_last_harvest() -> datetime:
    if LAST_HARVEST_FILE.exists():
        ts = LAST_HARVEST_FILE.read_text(encoding="utf-8").strip()
        try:
            return datetime.fromisoformat(ts)
        except ValueError:
            pass
    return datetime(2020, 1, 1, tzinfo=timezone.utc)


def _save_last_harvest(dt: datetime):
    LAST_HARVEST_FILE.write_text(dt.isoformat(), encoding="utf-8")


def _is_meaningful(text: str) -> bool:
    text = text.strip()
    if len(text) < MIN_LENGTH:
        return False
    if _TRIVIAL.match(text):
        return False
    # Skip if it's mostly a URL or file path
    if text.startswith("http") or text.startswith("c:\\") or text.startswith("/"):
        return False
    return True


def _project_label(project_slug: str) -> str:
    return PROJECT_LABELS.get(project_slug, project_slug.replace("c--Users-HUY-", "").replace("-", " ").title())


def harvest(since: datetime | None = None) -> dict:
    """
    Extract new meaningful prompts since last harvest (or since param).
    Returns: {status, output_path, prompt_count, exported_path}
    """
    cutoff = since or _load_last_harvest()
    now = datetime.now(timezone.utc)

    jsonl_files = glob.glob(str(CLAUDE_PROJECTS_DIR / "**" / "*.jsonl"), recursive=True)

    # Collect prompts newer than cutoff, grouped by project
    by_project: dict[str, list[tuple[datetime, str]]] = {}

    for fpath in jsonl_files:
        slug_parts = Path(fpath).parts
        # Find project slug from path
        try:
            proj_idx = next(i for i, p in enumerate(slug_parts) if p == "projects") + 1
            project_slug = slug_parts[proj_idx]
        except StopIteration:
            project_slug = "unknown"

        for line in open(fpath, encoding="utf-8", errors="ignore"):
            try:
                obj = json.loads(line)
                if obj.get("type") != "user":
                    continue
                ts_str = obj.get("timestamp", "")
                if not ts_str:
                    continue
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if ts <= cutoff:
                    continue

                content = obj.get("message", {}).get("content", [])
                for c in content:
                    if isinstance(c, dict) and c.get("type") == "text":
                        text = c["text"].strip()
                        if _is_meaningful(text):
                            by_project.setdefault(project_slug, []).append((ts, text))
            except Exception:
                continue

    total = sum(len(v) for v in by_project.values())
    if total == 0:
        return {"status": "empty", "prompt_count": 0, "output_path": None}

    # Build markdown output
    week_str = now.strftime("%Y-W%W")
    lines = [
        f"# Claude Prompt Harvest — {week_str}",
        f"*Period: {cutoff.strftime('%Y-%m-%d')} → {now.strftime('%Y-%m-%d')} | {total} prompts*",
        "",
        "Capture of meaningful prompts reflecting thinking patterns, problem framing, and AI usage.",
        "",
    ]

    for slug, entries in sorted(by_project.items()):
        label = _project_label(slug)
        entries.sort(key=lambda x: x[0])
        lines.append(f"## {label}")
        for ts, text in entries:
            # Indent multi-line prompts
            first_line = text.split("\n")[0][:200]
            lines.append(f"- [{ts.strftime('%m-%d')}] {first_line}")
        lines.append("")

    output_path = raw_dir("notes") / f"{now.strftime('%Y-%m-%d')}-prompt-harvest.md"
    output_path.write_text("\n".join(lines), encoding="utf-8")

    _save_last_harvest(now)

    return {
        "status": "ok",
        "prompt_count": total,
        "output_path": str(output_path),
    }
