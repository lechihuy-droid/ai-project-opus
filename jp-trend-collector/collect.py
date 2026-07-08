"""jp-trend-collector — daily Japan trend digest for content ideation.

Usage:
  python collect.py                  # fetch all sources, write report to output/
  python collect.py --no-facebook    # skip Facebook even if configured
  python collect.py --no-trends      # skip Google Trends
"""
import argparse
import json
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from tools.rss_source import fetch_all_rss
from tools.facebook_source import fetch_all_facebook
from tools.google_trends_source import fetch_google_trends
from tools.aggregate import (
    dedupe_articles,
    extract_hot_keywords,
    rank_articles,
    build_markdown_report,
    to_json_safe,
)


def load_config() -> dict:
    with open(ROOT / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-facebook", action="store_true")
    parser.add_argument("--no-trends", action="store_true")
    parser.add_argument("--output-dir", default=str(ROOT / "output"))
    args = parser.parse_args()

    cfg = load_config()
    all_stats: dict = {}

    print("[collect] Fetching RSS sources...")
    rss_articles, rss_stats = fetch_all_rss(cfg.get("news_sources", []))
    all_stats.update(rss_stats)
    print(f"[collect]   -> {len(rss_articles)} articles")

    trends_articles = []
    if not args.no_trends:
        print("[collect] Fetching Google Trends Japan...")
        trends_articles, trends_stats = fetch_google_trends(cfg)
        all_stats.update(trends_stats)
        print(f"[collect]   -> {len(trends_articles)} keywords")

    fb_articles = []
    if not args.no_facebook:
        print("[collect] Fetching Facebook Pages...")
        fb_articles, fb_stats = fetch_all_facebook(cfg)
        all_stats.update(fb_stats)
        print(f"[collect]   -> {len(fb_articles)} posts")

    articles = dedupe_articles(rss_articles + trends_articles + fb_articles)
    watch_keywords = cfg.get("watch_keywords", [])
    articles = rank_articles(articles, watch_keywords)
    hot_keywords = extract_hot_keywords(articles, cfg.get("report", {}).get("top_keywords", 15))

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    from datetime import datetime
    from zoneinfo import ZoneInfo
    tz = ZoneInfo(cfg.get("report", {}).get("timezone", "Asia/Tokyo"))
    date_str = datetime.now(tz).strftime("%Y-%m-%d")

    md_report = build_markdown_report(articles, hot_keywords, all_stats, cfg)
    md_path = output_dir / f"{date_str}.md"
    md_path.write_text(md_report, encoding="utf-8")

    json_path = output_dir / f"{date_str}.json"
    json_path.write_text(
        json.dumps(to_json_safe(articles), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\n[collect] Tổng: {len(articles)} bài (đã dedupe)")
    print(f"[collect] Report: {md_path}")
    print(f"[collect] JSON:   {json_path}")
    print("\n" + md_report[:2000])


if __name__ == "__main__":
    main()
