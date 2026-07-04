"""
Consilium lane runner.

Runs the collector through one decision-oriented research lane:
- tech: technical learning and workflow leverage
- ceo: business model, market structure, capital allocation
- competitor: competitor moves and positioning
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

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
from run_collect import update_wiki_health


def send_telegram(text: str):
    """Telegram notify hook kept optional; current collector disables Telegram sends."""
    print("[lane] Telegram notification disabled")


LANES = {
    "tech": {
        "label": "Tech Learning Research",
        "task": "consilium-tech-daily",
        "cadence": "daily",
        "include": {
            "openai-news",
            "anthropic-blog",
            "google-ai-blog",
            "aws-ml-blog",
            "nvidia-blog",
            "simon-willison",
            "hf-blog",
            "import-ai",
            "interconnects",
            "the-gradient",
            "arxiv-ai",
            "arxiv-lg",
            "hf-papers",
            "github-trending-ai",
        },
        "goal": (
            "Tech Learning Research for Huy. Keep signals that improve how I build, "
            "evaluate, automate, or learn AI systems: agents, coding tools, model capability, "
            "workflow patterns, benchmark lessons, practical repos, and techniques worth testing. "
            "Drop generic business news unless it changes my engineering practice this week."
        ),
    },
    "ceo": {
        "label": "CEO Business Model Research",
        "task": "consilium-ceo-weekly",
        "cadence": "weekly",
        "include_source_kind": {"market_news"},
        "include_topics": {"JP_STOCK"},
        "also_include": {
            "techcrunch-ai",
            "venturebeat-ai",
            "nikkei-asia",
            "everest-group",
            "hfs-research",
        },
        "goal": (
            "CEO Business Model Research for Huy. Keep signals that change market structure, "
            "pricing, adoption, regulation, distribution, enterprise budget, product strategy, "
            "or investment thesis. Translate each signal into strategic implication: opportunity, "
            "threat, timing, capital allocation, or what to ignore."
        ),
    },
    "competitor": {
        "label": "Competitor Intelligence Research",
        "task": "consilium-competitor-weekly",
        "cadence": "weekly",
        "include_topics": {"COMPETITOR"},
        "goal": (
            "Competitor Intelligence Research for Huy. Keep concrete moves by Microsoft, "
            "Fujitsu, NTT Data, Hitachi, Accenture, Capgemini, IBM Japan, SIs, analysts, "
            "and AI-SDLC vendors: launches, partnerships, ROI proof, legacy modernization, "
            "sovereign/on-prem AI, delivery model, hiring, pricing, and customer proof points. "
            "Drop vague AI hype."
        ),
    },
}


def select_sources(all_sources: list[dict], lane: dict) -> list[dict]:
    selected = []
    include = set(lane.get("include", set()))
    include_topics = set(lane.get("include_topics", set()))
    include_source_kind = set(lane.get("include_source_kind", set()))
    also_include = set(lane.get("also_include", set()))

    for src in all_sources:
        source_id = src.get("id", "")
        topic = src.get("topic", "")
        source_kind = src.get("source_kind", "")
        if source_id in include or source_id in also_include:
            selected.append(src)
        elif topic in include_topics:
            selected.append(src)
        elif source_kind in include_source_kind:
            selected.append(src)

    return selected


def write_lane_report(lane_key: str, lane: dict, fetch_stats: dict, articles: list[dict], saved: int, review: dict | None) -> Path:
    out_dir = Path(__file__).parent / "logs" / "lane_runs" / lane_key
    out_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now()
    path = out_dir / f"{now.strftime('%Y-%m-%d')}.json"
    top = rank_top(articles, n=min(10, len(articles))) if articles else []
    report = {
        "lane": lane_key,
        "label": lane["label"],
        "task": lane["task"],
        "cadence": lane["cadence"],
        "generated_at": now.isoformat(timespec="seconds"),
        "sources": len(fetch_stats),
        "stats": fetch_stats,
        "new_articles": len(articles),
        "saved": saved,
        "top": [
            {
                "title": a.get("title", ""),
                "url": a.get("url", ""),
                "source_id": a.get("source_id", ""),
                "topic": a.get("topic", ""),
                "goal_score": a.get("goal_score", 0),
                "relevance": a.get("relevance", ""),
            }
            for a in top
        ],
        "synthesis_status": (review or {}).get("status"),
    }
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", choices=sorted(LANES), required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--ingest", action="store_true", help="Also run wiki ingest after saving raw articles")
    parser.add_argument("--no-notify", action="store_true")
    args = parser.parse_args()

    lane = LANES[args.lane]
    cfg = load_config()
    collect_cfg = cfg.get("collect", {})
    all_sources = cfg.get("collect_sources", [])
    sources = select_sources(all_sources, lane)

    if not sources:
        print(f"[lane:{args.lane}] No matching sources")
        sys.exit(1)

    print(f"[lane:{args.lane}] {lane['label']} | sources={len(sources)}")
    articles, fetch_stats = fetch_all_sources(sources)
    total_fetched = sum(s["fetched"] for s in fetch_stats.values())
    total_filtered = sum(s["filtered"] for s in fetch_stats.values())
    print(f"[lane:{args.lane}] Fetched: {total_fetched} | Filtered: {total_filtered} | Passed: {len(articles)}")

    raw_articles_dir = raw_dir("articles")
    new_articles = dedupe_articles(articles, raw_articles_dir.parent)
    print(f"[lane:{args.lane}] New after dedupe: {len(new_articles)}")

    if new_articles and collect_cfg.get("goal_filter", {}).get("enabled", False):
        min_score = collect_cfg.get("goal_filter", {}).get("min_score", 3)
        new_articles = goal_align_filter(new_articles, goal=lane["goal"], min_score=min_score)

    if not new_articles:
        write_lane_report(args.lane, lane, fetch_stats, [], 0, None)
        print(f"[lane:{args.lane}] Nothing new")
        return

    saved = 0
    n_ingested = 0
    review = None
    if not args.dry_run:
        saved = save_raw_articles(new_articles, raw_articles_dir.parent)
        print(f"[lane:{args.lane}] Saved: {saved}")

        if args.ingest:
            from wiki_ops.ingest import ingest_batch

            limit = collect_cfg.get("ingest_batch_limit", 15)
            batch_result = ingest_batch(limit=limit)
            n_ingested = batch_result.get("ingested", 0)
            print(f"[lane:{args.lane}] Ingested: {n_ingested}")
        else:
            print(f"[lane:{args.lane}] Wiki ingest skipped; lane output stays in raw + report")

        update_wiki_health(fetch_stats, len(new_articles), saved, n_ingested)
        try:
            review = daily_synthesis(rank_top(new_articles, n=10), "")
        except Exception as exc:
            review = {"status": "synthesis_error", "error": str(exc)}

    report_path = write_lane_report(args.lane, lane, fetch_stats, new_articles, saved, review)
    print(f"[lane:{args.lane}] Report: {report_path}")

    notify_n = collect_cfg.get("notify_top_n", 5)
    reading_list = f"{lane['label']}\n\n" + format_reading_list(
        rank_top(new_articles, n=notify_n),
        total=len(new_articles),
    )
    if args.dry_run:
        print("\n--- DRY RUN PREVIEW ---")
        print(reading_list)
    elif args.no_notify:
        print("\n--- NOTIFY SKIPPED ---")
        print(reading_list)
    else:
        send_telegram(reading_list)


if __name__ == "__main__":
    main()
