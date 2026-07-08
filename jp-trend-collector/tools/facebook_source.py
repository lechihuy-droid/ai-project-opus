"""Fetch Page posts via the official Facebook Graph API.

Only works for:
  (a) Pages you administer — use that Page's own Access Token, or
  (b) Other Pages once Meta has granted your app "Page Public Content Access"
      (requires App Review).

Deliberately does NOT do cookie/login-based scraping of facebook.com — that
breaks Facebook's Terms of Service and risks the account being banned.
"""
import os
from datetime import datetime, timezone

import requests

_GRAPH_BASE = "https://graph.facebook.com"


def _parse_time(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(value.replace("+0000", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def fetch_facebook_page(page: dict, access_token: str, api_version: str, limit: int = 15) -> tuple[list[dict], str | None]:
    """Fetch recent posts for one Page. Returns (articles, error)."""
    page_id = page["id"]
    url = f"{_GRAPH_BASE}/{api_version}/{page_id}/posts"
    params = {
        "fields": "message,permalink_url,created_time,shares,"
                  "likes.summary(true).limit(0),comments.summary(true).limit(0)",
        "limit": limit,
        "access_token": access_token,
    }
    try:
        resp = requests.get(url, params=params, timeout=15)
    except Exception as e:
        return [], f"Request error: {e}"

    if resp.status_code != 200:
        detail = ""
        try:
            detail = resp.json().get("error", {}).get("message", "")
        except Exception:
            pass
        return [], f"HTTP {resp.status_code}: {detail or resp.text[:200]}"

    data = resp.json().get("data", [])
    articles = []
    for post in data:
        message = (post.get("message") or "").strip()
        permalink = post.get("permalink_url") or f"https://facebook.com/{post.get('id', '')}"
        if not message:
            continue
        title = message.splitlines()[0][:120]
        likes = post.get("likes", {}).get("summary", {}).get("total_count", 0)
        comments = post.get("comments", {}).get("summary", {}).get("total_count", 0)
        shares = post.get("shares", {}).get("count", 0)
        articles.append({
            "title": title,
            "url": permalink,
            "summary": message[:500],
            "published": _parse_time(post.get("created_time")),
            "source_id": f"fb_{page_id}",
            "source_name": f"Facebook — {page.get('name', page_id)}",
            "source_type": "facebook",
            "tier": page.get("tier", 2),
            "engagement": likes + comments * 2 + shares * 3,
        })
    return articles, None


def fetch_all_facebook(cfg: dict) -> tuple[list[dict], dict]:
    """Fetch all configured Pages. Returns (articles, stats-by-page-id).

    Skips silently (empty result, no error) if disabled or no token is set —
    Facebook collection is opt-in since it requires credentials the user must
    obtain themselves.
    """
    fb_cfg = cfg.get("facebook", {})
    stats: dict = {}
    if not fb_cfg.get("enabled", False):
        return [], stats

    access_token = os.getenv("FB_PAGE_ACCESS_TOKEN", "")
    api_version = os.getenv("FB_GRAPH_API_VERSION", "v19.0")
    if not access_token:
        stats["_config"] = {
            "name": "facebook",
            "fetched": 0,
            "error": "facebook.enabled=true nhưng thiếu FB_PAGE_ACCESS_TOKEN trong .env",
        }
        return [], stats

    all_articles = []
    for page in fb_cfg.get("pages", []):
        if not page.get("id") or page["id"].startswith("REPLACE_WITH"):
            continue
        articles, error = fetch_facebook_page(page, access_token, api_version)
        stats[page["id"]] = {"name": page.get("name", page["id"]), "fetched": len(articles), "error": error}
        all_articles.extend(articles)
    return all_articles, stats
