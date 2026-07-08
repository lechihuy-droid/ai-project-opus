"""Fetch articles from Japanese news RSS feeds."""
from datetime import datetime, timezone

import feedparser
import requests

_UA = {"User-Agent": "Mozilla/5.0 (jp-trend-collector/0.1)"}


def _parse_time(entry) -> datetime:
    for field in ("published_parsed", "updated_parsed"):
        t = getattr(entry, field, None)
        if t:
            try:
                return datetime(*t[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return datetime.now(timezone.utc)


def fetch_rss_source(src: dict) -> tuple[list[dict], str | None]:
    """Fetch one RSS source. Returns (articles, error)."""
    try:
        resp = requests.get(src["url"], headers=_UA, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return [], f"HTTP error: {e}"

    feed = feedparser.parse(resp.content)
    if feed.bozo and not feed.entries:
        return [], f"Parse error: {feed.bozo_exception}"

    articles = []
    for entry in feed.entries:
        title = (entry.get("title") or "").strip()
        url = (entry.get("link") or "").strip()
        if not title or not url:
            continue
        summary = (entry.get("summary") or "").strip()
        articles.append({
            "title": title,
            "url": url,
            "summary": summary,
            "published": _parse_time(entry),
            "source_id": src["id"],
            "source_name": src["name"],
            "source_type": "rss",
            "tier": src.get("tier", 2),
        })
    return articles, None


def fetch_all_rss(sources: list[dict]) -> tuple[list[dict], dict]:
    """Fetch all enabled RSS sources. Returns (articles, stats-by-source-id)."""
    all_articles = []
    stats = {}
    for src in sources:
        if not src.get("enabled", True) or src.get("type") != "rss":
            continue
        articles, error = fetch_rss_source(src)
        stats[src["id"]] = {"name": src["name"], "fetched": len(articles), "error": error}
        all_articles.extend(articles)
    return all_articles, stats
