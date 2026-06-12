"""
OPUS ANIMUS HOME — terminal dashboard
python run_home.py
"""
import sys, os, re, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from datetime import datetime, date, timedelta
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, str(Path(__file__).parent))
from utils.config import personal_wiki_dir, raw_dir

W = 62  # width

def div(label=""):
    if label:
        print(f"-- {label} " + "-" * (W - len(label) - 4))
    else:
        print("-" * W)

def row(label, value, target=""):
    l = f"  {label:<22}"
    v = f"{value:<16}"
    t = f"→ {target}" if target else ""
    print(f"{l}{v}{t}")


# ── A: SYSTEM DATA ────────────────────────────────────────

def wiki_stats() -> dict:
    wiki = personal_wiki_dir()
    pages = [f for f in wiki.rglob("*.md")
             if f.name not in ("SCHEMA.md", "INDEX.md", "log.md")
             and "reflection-" not in f.name]
    topics = {}
    for p in pages:
        t = p.parent.name
        topics[t] = topics.get(t, 0) + 1

    # recent page titles from log.md (column: page_path)
    recent = []
    log = wiki / "log.md"
    if log.exists():
        lines = [l for l in log.read_text(encoding="utf-8").splitlines()
                 if "|" in l and not l.startswith("|---") and not l.startswith("| Date")]
        for line in reversed(lines[-8:]):
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 4 and "/" in parts[3]:
                recent.append(parts[3])  # topic/filename.md
            if len(recent) >= 4:
                break

    # pages added this week
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

    return {
        "total": len(pages),
        "topics": topics,
        "recent": recent,
        "week": week_count,
    }


def today_articles() -> int:
    today = date.today().isoformat()
    d = raw_dir("articles")
    return len(list(d.glob(f"{today}*.md"))) if d.exists() else 0


def inbox_count() -> int:
    inbox = raw_dir("articles").parent / "inbox"
    if not inbox.exists():
        return 0
    return len([f for f in inbox.iterdir() if f.is_file()])


def reflection_status() -> str:
    iso = date.today().isocalendar()
    week = f"{iso[0]}-W{iso[1]:02d}"
    path = personal_wiki_dir() / "Personal" / f"reflection-{week}.md"
    return f"Done  W{iso[1]}" if path.exists() else f"PENDING  W{iso[1]}"


def module_status(task_name: str) -> str:
    import subprocess
    try:
        r = subprocess.run(
            ["cmd", "/c", f"schtasks /query /fo LIST /tn {task_name}"],
            capture_output=True, text=True, timeout=5
        )
        for line in r.stdout.splitlines():
            if "Last Run Time" in line:
                val = line.split(":", 1)[-1].strip()
                if val and "N/A" not in val and val != "":
                    # shorten datetime
                    try:
                        dt = datetime.strptime(val, "%m/%d/%Y %I:%M:%S %p")
                        return dt.strftime("%m-%d %H:%M")
                    except Exception:
                        return val[:20]
    except Exception:
        pass
    return "—"


# ── B: LIFE METRICS from GOALS.md ────────────────────────

def parse_goals() -> dict:
    goals_path = Path(__file__).parent.parent / "GOALS.md"
    if not goals_path.exists():
        return {}
    content = goals_path.read_text(encoding="utf-8")

    def extract_table_col(section_header: str, col_idx: int = 2) -> dict:
        """Extract current values from a markdown table under a section."""
        result = {}
        in_section = False
        in_table = False
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
                if len(parts) > col_idx:
                    key = parts[0].replace("`", "").strip()
                    val = parts[col_idx].replace("`", "").strip()
                    val = val if "[___]" not in val else "—"
                    result[key] = val
        return result

    finance = extract_table_col("Track 1", col_idx=1)
    health  = extract_table_col("Track 2", col_idx=1)
    career  = extract_table_col("Track 3", col_idx=1)

    # Extract freedom target
    freedom_match = re.search(r"passive income ≥ (.+?) — target trong (.+?)(?:\*\*|$)", content)
    freedom = freedom_match.group(1) if freedom_match else "—"
    timeline = freedom_match.group(2) if freedom_match else "—"

    return {
        "finance": finance,
        "health": health,
        "career": career,
        "freedom_target": freedom,
        "freedom_timeline": timeline,
    }


# ── MAIN ──────────────────────────────────────────────────

def main():
    now = datetime.now().strftime("%Y-%m-%d  %H:%M")
    print()
    print("=" * W)
    print(f"  OPUS ANIMUS                        {now}")
    print(f'  "Non multa, sed multum."')
    print("=" * W)

    # B: Life tracks
    goals = parse_goals()

    div("LIFE TRACKS")
    f = goals.get("finance", {})
    h = goals.get("health", {})
    c = goals.get("career", {})

    print(f"  {'FINANCIAL':<20}  {'HEALTH':<18}  CAREER")
    print(f"  {'─'*19}  {'─'*17}  {'─'*16}")

    freedom = goals.get("freedom_target", "—")
    # strip parenthetical notes + /tháng suffix for display (Timeline đã ngụ ý per-month)
    freedom_short = re.sub(r"\s*\([^)]*\)", "", freedom).strip()
    freedom_short = re.sub(r"\s*/\s*th[áa]ng\s*$", "", freedom_short).strip()
    timeline = goals.get("freedom_timeline", "—")
    income   = f.get("Thu nhập chính (lương)", "—")
    passive  = f.get("Thu nhập phụ (side/passive)", "—")
    savings  = f.get("Tiết kiệm/đầu tư", "—")

    sleep    = h.get("Giấc ngủ", "—")
    workout  = h.get("Tập luyện", "—")
    energy   = h.get("Năng lượng buổi sáng", "—")
    stress   = h.get("Stress level", "—")

    role     = c.get("Vị trí", "—")
    salary   = c.get("Lương", "—")

    lines_f = [
        f"Target: {freedom_short}",
        f"Timeline: {timeline}",
        f"Lương: {income}",
        f"Passive: {passive}",
        f"Savings: {savings}",
    ]
    lines_h = [
        f"Ngủ: {sleep}",
        f"Tập: {workout}",
        f"Năng lượng: {energy}",
        f"Stress: {stress}",
    ]
    lines_c = [
        f"Vị trí: {role}",
        f"Lương: {salary}",
    ]

    n = max(len(lines_f), len(lines_h), len(lines_c))
    for i in range(n):
        lf = lines_f[i] if i < len(lines_f) else ""
        lh = lines_h[i] if i < len(lines_h) else ""
        lc = lines_c[i] if i < len(lines_c) else ""
        print(f"  {lf:<22}  {lh:<19}  {lc}")

    # A: System status
    div("SYSTEM STATUS")
    modules = [
        ("Module A  ResearchCrew ", "daily-research"),
        ("Module B  Daily Brief  ", "daily-brief"),
        ("Module C  Wiki Agent   ", "wiki-poll"),
        ("Collector Content Batch", "content-collector"),
    ]
    for label, task in modules:
        last = module_status(task)
        print(f"  {label}   last run: {last}")

    # A: Wiki
    div("WIKI")
    stats = wiki_stats()
    topic_str = "  ".join(f"{k}:{v}" for k, v in stats["topics"].items())
    print(f"  Pages: {stats['total']}  ({topic_str})")
    print(f"  This week: +{stats['week']}   Today raw/: {today_articles()}   Inbox: {inbox_count()}")
    if stats["recent"]:
        print(f"  Recent:")
        for r in stats["recent"]:
            print(f"    · {r}")

    # A+B: Today
    div("TODAY")
    ref = reflection_status()
    goals_path = Path(__file__).parent.parent / "GOALS.md"
    goals_ok = "OK" if goals_path.exists() else "MISSING — fill in GOALS.md"
    print(f"  Reflection W18     {ref}")
    print(f"  GOALS.md           {goals_ok}")
    print(f"  /wiki thought      ready on Telegram")
    print(f"  /wiki used         ready on Telegram")

    print("=" * W)
    print()


if __name__ == "__main__":
    main()
