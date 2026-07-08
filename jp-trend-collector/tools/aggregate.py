"""Dedupe, rank, extract hot keywords, and render the daily report."""
import re
from collections import Counter
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

# Kanji + Katakana + long-vowel-mark runs of length >= 2: cheap proxy for
# proper nouns (place/company/person names) without pulling in a full
# Japanese morphological analyzer (MeCab/fugashi) just for this.
_KEYWORD_RE = re.compile(r"[一-鿿゠-ヿー]{2,}")

_STOPWORDS = {
    "日本", "今日", "昨日", "明日", "速報", "動画", "写真", "会見", "発表",
    "関係", "問題", "対応", "全国", "地域", "今年", "去年", "最新",
}


def dedupe_articles(articles: list[dict]) -> list[dict]:
    seen = set()
    unique = []
    for art in articles:
        key = art["url"].split("?")[0].rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        unique.append(art)
    return unique


def extract_hot_keywords(articles: list[dict], top_n: int = 15) -> list[tuple[str, int]]:
    counter = Counter()
    for art in articles:
        text = f"{art['title']} {art.get('summary', '')}"
        for kw in _KEYWORD_RE.findall(text):
            if kw in _STOPWORDS:
                continue
            counter[kw] += 1
    return [(kw, n) for kw, n in counter.most_common(top_n * 2) if n >= 2][:top_n]


def score_article(art: dict, watch_keywords: list[str], now: datetime) -> float:
    age_hours = max((now - art["published"]).total_seconds() / 3600, 0)
    recency_score = max(10 - age_hours / 6, 0)  # decays to 0 over ~2.5 days
    tier_score = {1: 5, 2: 2, 3: 0}.get(art.get("tier", 2), 0)

    text = f"{art['title']} {art.get('summary', '')}"
    keyword_score = sum(3 for kw in watch_keywords if kw in text)

    engagement = art.get("engagement", 0)
    engagement_score = min(engagement / 20, 10)

    return recency_score + tier_score + keyword_score + engagement_score


def rank_articles(articles: list[dict], watch_keywords: list[str]) -> list[dict]:
    now = datetime.now(timezone.utc)
    for art in articles:
        art["_score"] = score_article(art, watch_keywords, now)
    return sorted(articles, key=lambda a: a["_score"], reverse=True)


def group_by_source(articles: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for art in articles:
        grouped.setdefault(art["source_name"], []).append(art)
    return grouped


def to_json_safe(articles: list[dict]) -> list[dict]:
    out = []
    for art in articles:
        item = dict(art)
        item["published"] = art["published"].isoformat()
        out.append(item)
    return out


def build_markdown_report(
    articles: list[dict],
    hot_keywords: list[tuple[str, int]],
    all_stats: dict,
    cfg: dict,
) -> str:
    tz = ZoneInfo(cfg.get("report", {}).get("timezone", "Asia/Tokyo"))
    today = datetime.now(tz).strftime("%Y-%m-%d %H:%M %Z")
    top_per_source = cfg.get("report", {}).get("top_per_source", 8)

    lines = [f"# Japan Trend Report — {today}", ""]

    if hot_keywords:
        lines.append("## 🔥 Từ khoá hot hôm nay")
        for kw, n in hot_keywords:
            lines.append(f"- **{kw}** — xuất hiện {n} lần")
        lines.append("")

    grouped = group_by_source(articles)
    for source_name, items in grouped.items():
        items = sorted(items, key=lambda a: a["_score"], reverse=True)[:top_per_source]
        if not items:
            continue
        lines.append(f"## 📰 {source_name}")
        for art in items:
            extra = f" (👍 {art['engagement']})" if "engagement" in art else ""
            lines.append(f"- [{art['title']}]({art['url']}){extra}")
        lines.append("")

    lines.append("## ⚙️ Trạng thái nguồn")
    for src_id, s in all_stats.items():
        status = f"lỗi: {s['error']}" if s.get("error") else f"{s['fetched']} bài"
        lines.append(f"- {s['name']}: {status}")

    return "\n".join(lines)
