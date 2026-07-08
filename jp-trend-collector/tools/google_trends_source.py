"""Fetch today's trending searches for Japan from Google Trends.

Uses pytrends (unofficial, scrapes Google's internal trends endpoint — no
login/auth required, but the response format can change without notice).
Best-effort only: any failure is reported as a stat error, never raised.
"""
from datetime import datetime, timezone


def fetch_google_trends(cfg: dict) -> tuple[list[dict], dict]:
    trends_cfg = cfg.get("google_trends", {})
    stats: dict = {}
    if not trends_cfg.get("enabled", True):
        return [], stats

    geo = trends_cfg.get("geo", "JP")
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl="ja-JP", tz=540)
        df = pytrends.trending_searches(pn="japan" if geo == "JP" else geo.lower())
        keywords = df[0].tolist()
    except Exception as e:
        stats["google_trends"] = {"name": "Google Trends Japan", "fetched": 0, "error": str(e)}
        return [], stats

    now = datetime.now(timezone.utc)
    articles = []
    for kw in keywords:
        kw = str(kw).strip()
        if not kw:
            continue
        articles.append({
            "title": kw,
            "url": f"https://www.google.com/search?q={kw}",
            "summary": "",
            "published": now,
            "source_id": "google_trends",
            "source_name": "Google Trends Japan",
            "source_type": "trends",
            "tier": 1,
        })
    stats["google_trends"] = {"name": "Google Trends Japan", "fetched": len(articles), "error": None}
    return articles, stats
