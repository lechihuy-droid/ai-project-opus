"""
Weekly Research Synthesizer — Chủ nhật 06:00 JST
Tổng hợp 7 ngày raw/articles/ → LLM synthesis → logs/weekly/YYYY-Www.json

Usage:
  python run_weekly.py            # full synthesis + Telegram
  python run_weekly.py --dry-run  # parse + preview, no save, no Telegram
  python run_weekly.py --no-notify # synthesize + save, skip Telegram
  python run_weekly.py --days 14  # look back 14 days instead of 7
"""
import json
import os
import re
import sys
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).parent))

ROOT = Path(__file__).parent
WEEKLY_DIR = ROOT / "logs" / "weekly"
RAW_ARTICLES_DIR = ROOT / "raw" / "articles"


def _iso_week(dt: datetime) -> str:
    iso = dt.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def _parse_article_meta(path: Path) -> dict | None:
    """Parse metadata header from raw/articles/*.md file."""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
        lines = text.splitlines()
        meta = {"slug": path.stem, "path": str(path)}

        # Title = first line starting with #
        for line in lines[:3]:
            if line.startswith("# "):
                meta["title"] = line[2:].strip()
                break

        # Metadata fields
        field_map = {
            "**Source:**": "source",
            "**URL:**": "url",
            "**Topic:**": "topic",
            "**Tier:**": "tier",
            "**Goal-Score:**": "goal_score",
            "**Relevance:**": "relevance",
            "**Source-Kind:**": "source_kind",
            "**Published:**": "published",
        }
        for line in lines:
            for prefix, key in field_map.items():
                if line.startswith(prefix):
                    val = line[len(prefix):].strip()
                    if key in ("tier", "goal_score"):
                        try:
                            val = int(val)
                        except ValueError:
                            pass
                    meta[key] = val
                    break

        # Summary = first non-empty line after blank line following metadata
        in_meta = True
        summary_lines = []
        for line in lines:
            if in_meta and line.startswith("**") and ":**" in line:
                continue
            if in_meta and not line.strip():
                in_meta = False
                continue
            if not in_meta and line.strip() and not line.startswith("#"):
                summary_lines.append(line.strip())
                if len(summary_lines) >= 3:
                    break

        meta["summary"] = " ".join(summary_lines)[:400]

        # Date from filename: YYYY-MM-DD-slug
        stem = path.stem
        date_match = re.match(r"(\d{4}-\d{2}-\d{2})", stem)
        if date_match:
            meta["date"] = date_match.group(1)

        return meta if meta.get("title") and meta.get("url") else None
    except Exception as e:
        print(f"[weekly] skip {path.name}: {e}")
        return None


def load_week_articles(raw_dir: Path = RAW_ARTICLES_DIR, days: int = 7) -> list[dict]:
    """Read all articles from raw/articles/ written in the past `days` days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_str = cutoff.strftime("%Y-%m-%d")
    articles = []

    for path in sorted(raw_dir.glob("*.md"), reverse=True):
        stem = path.stem
        date_match = re.match(r"(\d{4}-\d{2}-\d{2})", stem)
        if not date_match:
            continue
        article_date = date_match.group(1)
        if article_date < cutoff_str:
            continue
        meta = _parse_article_meta(path)
        if meta:
            articles.append(meta)

    return articles


def group_by_topic(articles: list[dict]) -> dict[str, list]:
    """Group articles into AI, competitor, market, other."""
    groups: dict[str, list] = {"AI": [], "competitor": [], "market": [], "other": []}
    for a in articles:
        topic = (a.get("topic") or "").upper()
        source_kind = (a.get("source_kind") or "").lower()
        if "COMPETITOR" in topic:
            groups["competitor"].append(a)
        elif source_kind == "market_news" or "JP_STOCK" in topic:
            groups["market"].append(a)
        elif "AI" in topic:
            groups["AI"].append(a)
        else:
            groups["other"].append(a)
    return groups


def _build_context(groups: dict[str, list], max_per_group: int = 8) -> str:
    """Build text context for LLM prompt."""
    lines = []
    for group_name, articles in groups.items():
        if not articles:
            continue
        top = sorted(
            articles,
            key=lambda a: -(a.get("goal_score") or 3),
        )[:max_per_group]
        lines.append(f"=== {group_name.upper()} ({len(articles)} articles) ===")
        for i, a in enumerate(top, 1):
            lines.append(
                f"{i}. [{a.get('source', a.get('source_id', '?'))}] {a.get('title', '')}\n"
                f"   Score: {a.get('goal_score', 3)}/5\n"
                f"   {(a.get('relevance') or a.get('summary') or '')[:200]}"
            )
        lines.append("")
    return "\n".join(lines)


def weekly_synthesis(groups: dict, groq_api_key: str, week_str: str, period: str, article_count: int) -> dict:
    """Call Claude CLI to synthesize weekly research report."""
    import subprocess

    now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    fallback = {
        "week": week_str,
        "period": period,
        "generated_at": now_str,
        "article_count": article_count,
        "status": "fallback",
        "sections": [],
    }

    context = _build_context(groups)
    if not context.strip():
        fallback["status"] = "fallback_no_articles"
        return fallback

    prompt = (
        f"Bạn là AI market research analyst. Đây là tổng hợp tin tức tuần {week_str} ({period}).\n"
        f"Tổng cộng: {article_count} articles được thu thập.\n\n"
        f"{context}\n\n"
        "Viết weekly strategic research report bằng tiếng Việt. Output JSON với 5 sections:\n\n"
        "1. 'Tóm tắt tuần' — 3-4 câu overview: điều gì nổi bật nhất tuần này trong AI & market\n"
        "2. 'Top 5 Stories' — mảng items, mỗi item: {title, source, why, action}\n"
        "   'why': tại sao quan trọng (1-2 câu)\n"
        "   'action': hành động cụ thể (read/test/compare/watch/skip)\n"
        "3. 'Xu hướng tín hiệu' — mảng signals, mỗi signal: {name, trend ('up'/'stable'/'down'), summary}\n"
        "   Signals: AI-SDLC, ROI/Proof Points, Legacy Modernization, SIer Partnership, Sovereign AI\n"
        "4. 'Động thái các bên' — mảng actors: {name, summary} cho OpenAI/Anthropic/Google/Microsoft + others nổi bật\n"
        "5. 'Kế hoạch hành động' — mảng 3-5 items (string), hành động cụ thể cho tuần tới\n\n"
        "Respond ONLY with JSON:\n"
        '{"sections":['
        '{"heading":"Tóm tắt tuần","body":"..."},'
        '{"heading":"Top 5 Stories","items":[{"title":"...","source":"...","why":"...","action":"..."}]},'
        '{"heading":"Xu hướng tín hiệu","signals":[{"name":"AI-SDLC","trend":"up","summary":"..."}]},'
        '{"heading":"Động thái các bên","actors":[{"name":"OpenAI","summary":"..."}]},'
        '{"heading":"Kế hoạch hành động","items":["...","...","..."]}'
        "]}"
    )

    try:
        _CLAUDE = r"C:\Users\HUY\AppData\Roaming\npm\claude.cmd"
        result = subprocess.run(
            ["cmd", "/c", _CLAUDE],
            input=prompt,
            capture_output=True, text=True, encoding="utf-8",
            timeout=180,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr[:300])
        text = result.stdout.strip()
        # Strip markdown fences if present
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            raise ValueError(f"No JSON in response: {text[:200]}")
        parsed = json.loads(m.group())
        return {
            "week": week_str,
            "period": period,
            "generated_at": now_str,
            "article_count": article_count,
            "status": "ok",
            "sections": parsed.get("sections", []),
        }
    except Exception as e:
        print(f"[weekly] synthesis error: {e}")
        fallback["status"] = "fallback_llm_error"
        fallback["error"] = str(e)[:200]
        return fallback


def save_weekly_report(report: dict, weekly_dir: Path = WEEKLY_DIR) -> Path:
    weekly_dir.mkdir(parents=True, exist_ok=True)
    path = weekly_dir / f"{report['week']}.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def send_telegram(text: str):
    import requests as req
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("[weekly] Telegram env missing — skip")
        return
    try:
        r = req.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=15,
        )
        if r.status_code == 200:
            print("[weekly] Telegram sent")
        else:
            print(f"[weekly] Telegram warn: {r.status_code}")
    except Exception as e:
        print(f"[weekly] Telegram error: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse + preview, no save, no Telegram")
    parser.add_argument("--no-notify", action="store_true",
                        help="Synthesize + save, skip Telegram")
    parser.add_argument("--days", type=int, default=7,
                        help="Look-back window in days (default: 7)")
    args = parser.parse_args()

    now = datetime.now()
    week_str = _iso_week(now)
    cutoff = now - timedelta(days=args.days)
    period = f"{cutoff.strftime('%Y-%m-%d')} → {now.strftime('%Y-%m-%d')}"

    print(f"[weekly] Week: {week_str} | Period: {period} | Look-back: {args.days} days")

    articles = load_week_articles(RAW_ARTICLES_DIR, days=args.days)
    print(f"[weekly] Articles found: {len(articles)}")

    if not articles:
        print("[weekly] No articles found — exit")
        return

    groups = group_by_topic(articles)
    for g, items in groups.items():
        print(f"[weekly]   {g}: {len(items)} articles")

    if args.dry_run:
        print("\n--- DRY RUN — context preview ---")
        print(_build_context(groups))
        print(f"\n[weekly] Would synthesize {len(articles)} articles for {week_str}")
        return

    print(f"[weekly] Synthesizing with Claude Sonnet...")
    report = weekly_synthesis(groups, "", week_str, period, len(articles))

    saved_path = save_weekly_report(report)
    print(f"[weekly] Saved → {saved_path} (status={report.get('status')})")

    if args.no_notify:
        return

    # Telegram summary
    sections = report.get("sections", [])
    summary_section = next((s for s in sections if s.get("heading") == "Tóm tắt tuần"), None)
    actions_section = next((s for s in sections if s.get("heading") == "Kế hoạch hành động"), None)

    msg_lines = [
        f"Weekly Research — {week_str}",
        f"({period}, {len(articles)} articles)\n",
    ]
    if summary_section:
        msg_lines.append(summary_section.get("body", ""))
    if actions_section:
        items = actions_section.get("items", [])
        if items:
            msg_lines.append("\nHành động tuần tới:")
            msg_lines.extend(f"• {item}" for item in items[:3])

    send_telegram("\n".join(msg_lines))


if __name__ == "__main__":
    main()
