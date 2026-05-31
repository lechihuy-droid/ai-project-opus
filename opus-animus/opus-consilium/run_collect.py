"""
Content Collector — daily batch 05:30
Fetch high-signal sources → raw/ → Home Intel logs.

Usage:
  python run_collect.py              # full pipeline
  python run_collect.py --dry-run    # fetch + rank, no write
  python run_collect.py --no-ingest  # collect, skip wiki ingest
"""
import json
import sys
import argparse
from datetime import datetime
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).parent))

from utils.config import load_config, raw_dir
from tools.collect_tool import (
    fetch_all_sources,
    dedupe_articles,
    goal_align_filter,
    save_raw_articles,
    rank_top,
    format_reading_list,
    daily_synthesis,
)
from wiki_ops.ingest import ingest_batch, personal_wiki_dir


def update_wiki_health(stats: dict, n_new: int, n_saved: int, n_ingested: int):
    """Append a row to personal-wiki/WIKI_HEALTH.md after each run."""
    try:
        health_path = personal_wiki_dir() / "WIKI_HEALTH.md"
        if not health_path.exists():
            return

        total_fetched = sum(s["fetched"] for s in stats.values())
        total_filtered = sum(s["filtered"] for s in stats.values())
        total_passed = sum(s["passed"] for s in stats.values())

        # Count current wiki pages
        wiki_pages = len(list(personal_wiki_dir().rglob("*.md"))) - 3  # exclude INDEX/SCHEMA/log/health
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Source breakdown (non-zero only)
        src_notes = "; ".join(
            f"{sid}:{s['fetched']}→{s['passed']}"
            for sid, s in stats.items() if s["fetched"] > 0
        )

        row = (
            f"| {now} | content-collector"
            f" | {total_fetched} | {total_filtered} dropped | {total_passed} | {n_saved} | {n_ingested}"
            f" | {wiki_pages} | {src_notes} |\n"
        )

        content = health_path.read_text(encoding="utf-8")
        # Update snapshot stats
        import re
        content = re.sub(r"\| Total wiki pages \|.*\n", f"| Total wiki pages | {wiki_pages} |\n", content)
        content = re.sub(r"\*Updated:.*?\*", f"*Updated: {now}*", content)
        # Append row
        content += row
        health_path.write_text(content, encoding="utf-8")
        print(f"[collect] WIKI_HEALTH updated — pages: {wiki_pages}")
    except Exception as e:
        print(f"[collect] WIKI_HEALTH update failed: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Fetch + rank only, no file writes")
    parser.add_argument("--no-ingest", action="store_true",
                        help="Save raw articles but skip wiki ingest")
    parser.add_argument("--no-notify", action="store_true",
                        help="Deprecated no-op; Telegram notifications are disabled")
    args = parser.parse_args()

    cfg = load_config()
    collect_cfg = cfg.get("collect", {})
    collect_sources = cfg.get("collect_sources", [])

    if not collect_sources:
        print("[collect] No collect_sources in config.yaml — exit")
        sys.exit(1)

    print(f"[collect] Fetching {len(collect_sources)} sources...")
    articles, fetch_stats = fetch_all_sources(collect_sources)
    total_fetched = sum(s["fetched"] for s in fetch_stats.values())
    total_filtered = sum(s["filtered"] for s in fetch_stats.values())
    print(f"[collect] Fetched: {total_fetched} | Filtered out: {total_filtered} | Passed: {len(articles)}")

    raw_articles_dir = raw_dir("articles")
    new_articles = dedupe_articles(articles, raw_articles_dir.parent)
    print(f"[collect] New (after dedupe): {len(new_articles)}")

    goal_filter_cfg = collect_cfg.get("goal_filter", {})
    if goal_filter_cfg.get("enabled", False) and new_articles:
        goal = goal_filter_cfg.get("goal", "Build AI Engineering skill")
        min_score = goal_filter_cfg.get("min_score", 3)
        new_articles = goal_align_filter(new_articles, goal=goal, min_score=min_score)

    if len(new_articles) == 0:
        print("[collect] Nothing new")
        return

    saved = 0
    n_ingested = 0
    if not args.dry_run:
        saved = save_raw_articles(new_articles, raw_articles_dir.parent)
        print(f"[collect] Saved to raw/: {saved} files")

        if collect_cfg.get("auto_ingest", True) and not args.no_ingest:
            limit = collect_cfg.get("ingest_batch_limit", 15)
            print(f"[collect] Ingesting batch (limit={limit})...")
            batch_result = ingest_batch(limit=limit)
            n_ingested = batch_result.get("ingested", 0)

            # Ingest personal ideas.md daily
            from wiki_ops.ingest import run_ingest
            ideas_file = raw_dir("inbox") / "ideas.md"
            if ideas_file.exists():
                print("[collect] Ingesting ideas.md...")
                run_ingest(str(ideas_file))
        else:
            print("[collect] Auto-ingest disabled — raw saved, wiki unchanged")

        update_wiki_health(fetch_stats, len(new_articles), saved, n_ingested)

    notify_n = collect_cfg.get("notify_top_n", 5)
    top = rank_top(new_articles, n=max(notify_n, 10))

    # Daily LLM synthesis → logs/intel_reviews/YYYY-MM-DD.json
    if not args.dry_run and saved > 0:
        try:
            review = daily_synthesis(top[:10], "")
            intel_reviews_dir = Path(__file__).parent / "logs" / "intel_reviews"
            intel_reviews_dir.mkdir(parents=True, exist_ok=True)
            today_str = datetime.now().strftime("%Y-%m-%d")
            review_path = intel_reviews_dir / f"{today_str}.json"
            review_path.write_text(
                json.dumps(review, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"[collect] Daily synthesis saved → {review_path.name} (status={review.get('status')})")
        except Exception as e:
            print(f"[collect] Daily synthesis failed: {e}")

    reading_list = format_reading_list(top[:notify_n], total=len(new_articles))

    if args.dry_run:
        print("\n--- DRY RUN PREVIEW ---")
        print(reading_list)
    else:
        print("\n--- HOME INTEL PREVIEW ---")
        print(reading_list)
        print("[collect] Telegram disabled — read full output in Opus Home")


if __name__ == "__main__":
    main()
