"""Content Collector — fetch, dedupe, rank, format reading list."""
import re
import requests
import feedparser
from datetime import datetime, timezone, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

_UA = {"User-Agent": "Mozilla/5.0 (content-collector/0.1)"}
LOCAL_TZ = ZoneInfo("Asia/Tokyo")


def _slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text).strip("-")
    return text[:80]


def _parse_time(entry) -> datetime:
    for field in ("published_parsed", "updated_parsed"):
        t = getattr(entry, field, None)
        if t:
            try:
                return datetime(*t[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return datetime.now(timezone.utc)


def _today_local() -> str:
    return datetime.now(LOCAL_TZ).strftime("%Y-%m-%d")


def _fetch_github_trending_source(src: dict, now: datetime, stats: dict) -> list[dict]:
    """Scrape github.com/trending for AI repos. Reuses BeautifulSoup logic."""
    from bs4 import BeautifulSoup
    src_id = src["id"]
    language = src.get("language", "")
    since = src.get("since", "weekly")
    url = f"https://github.com/trending/{language}?since={since}" if language else f"https://github.com/trending?since={since}"
    kw_filter = [kw.lower() for kw in src.get("keyword_filter", [])]
    limit = src.get("max_per_source", 10)
    results = []
    try:
        r = requests.get(url, headers=_UA, timeout=15)
        if r.status_code != 200:
            print(f"[collect] GitHub trending HTTP {r.status_code}")
            return []
        soup = BeautifulSoup(r.text, "html.parser")
        for art in soup.select("article.Box-row"):
            link = art.select_one("h2 a")
            if not link:
                continue
            href = link.get("href", "").strip()
            title = href.lstrip("/")
            repo_url = f"https://github.com{href}"
            desc_el = art.select_one("p")
            desc = desc_el.get_text(strip=True) if desc_el else ""
            stars_el = art.select_one("span.d-inline-block.float-sm-right")
            stars_str = ""
            if stars_el:
                m = re.search(r"([\d,]+)", stars_el.get_text())
                if m:
                    stars_str = m.group(1)
            slug = _slugify(title.replace("/", "-"))
            if not slug:
                continue
            stats[src_id]["fetched"] += 1
            if kw_filter:
                text = (title + " " + desc).lower()
                if not any(kw in text for kw in kw_filter):
                    stats[src_id]["filtered"] += 1
                    continue
            stats[src_id]["passed"] += 1
            results.append({
                "title": title,
                "url": repo_url,
                "summary": desc + (f" | ⭐ {stars_str} this week" if stars_str else ""),
                "published": now,
                "age_hours": 0,
                "source_id": src_id,
                "topic": src.get("topic", "AI"),
                "tier": src.get("tier", 2),
                "slug": slug,
            })
            if len(results) >= limit:
                break
    except Exception as e:
        print(f"[collect] GitHub trending error: {e}")
    return results


def _fetch_hf_papers_source(src: dict, now: datetime, stats: dict) -> list[dict]:
    """Fetch trending papers from HuggingFace Papers API."""
    src_id = src["id"]
    limit = src.get("max_per_source", 10)
    kw_filter = [kw.lower() for kw in src.get("keyword_filter", [])]
    results = []
    try:
        r = requests.get(
            "https://huggingface.co/api/papers",
            params={"limit": min(limit * 3, 30)},
            headers=_UA,
            timeout=15,
        )
        if r.status_code != 200:
            print(f"[collect] HF papers HTTP {r.status_code}")
            return []
        papers = r.json()
        for p in papers:
            title = (p.get("title") or "").strip()
            paper_id = p.get("id", "")
            if not title or not paper_id:
                continue
            paper_url = f"https://huggingface.co/papers/{paper_id}"
            upvotes = p.get("upvotes", 0)
            abstract = (p.get("summary") or p.get("abstract") or "")[:800]
            slug = _slugify(title)
            if not slug:
                continue
            stats[src_id]["fetched"] += 1
            if kw_filter:
                text = (title + " " + abstract).lower()
                if not any(kw in text for kw in kw_filter):
                    stats[src_id]["filtered"] += 1
                    continue
            stats[src_id]["passed"] += 1
            results.append({
                "title": title,
                "url": paper_url,
                "summary": abstract + (f" | 👍 {upvotes}" if upvotes else ""),
                "published": now,
                "age_hours": 0,
                "source_id": src_id,
                "topic": src.get("topic", "AI"),
                "tier": src.get("tier", 1),
                "slug": slug,
            })
            if len(results) >= limit:
                break
    except Exception as e:
        print(f"[collect] HF papers error: {e}")
    return results


def fetch_all_sources(collect_sources: list) -> tuple[list[dict], dict]:
    """
    Returns (articles, stats) where stats = {source_id: {fetched, filtered, passed}}.
    keyword_filter in source config: list of strings — article must match at least one.
    Supported types: rss, github_trending, hf_papers.
    """
    now = datetime.now(timezone.utc)
    articles = []
    stats = {}  # source_id → {fetched, filtered, passed}

    for src in collect_sources:
        if not src.get("enabled", True):
            continue
        src_type = src.get("type")
        src_id = src["id"]

        if src_type == "github_trending":
            stats[src_id] = {"fetched": 0, "filtered": 0, "passed": 0}
            articles.extend(_fetch_github_trending_source(src, now, stats))
            continue

        if src_type == "hf_papers":
            stats[src_id] = {"fetched": 0, "filtered": 0, "passed": 0}
            articles.extend(_fetch_hf_papers_source(src, now, stats))
            continue

        if src_type != "rss":
            continue

        stats[src_id] = {"fetched": 0, "filtered": 0, "passed": 0}
        window_hours = src.get("window_hours", 48)
        cutoff = now - timedelta(hours=window_hours)
        kw_filter = [kw.lower() for kw in src.get("keyword_filter", [])]

        try:
            feed = feedparser.parse(src["url"])
            count = 0
            for entry in feed.entries:
                pub = _parse_time(entry)
                if pub < cutoff:
                    continue
                title = entry.get("title", "").strip()
                url = entry.get("link", "").strip()
                summary = entry.get("summary", "")[:800]
                if not title or not url:
                    continue
                slug = _slugify(title)
                if not slug:
                    continue

                stats[src_id]["fetched"] += 1

                # Per-source keyword filter (config-driven)
                if kw_filter:
                    text = (title + " " + summary).lower()
                    if not any(kw in text for kw in kw_filter):
                        stats[src_id]["filtered"] += 1
                        continue

                stats[src_id]["passed"] += 1
                age_hours = (now - pub).total_seconds() / 3600
                articles.append({
                    "title": title,
                    "url": url,
                    "summary": summary,
                    "published": pub,
                    "age_hours": round(age_hours, 1),
                    "source_id": src_id,
                    "topic": src.get("topic", "AI"),
                    "tier": src.get("tier", 3),
                    "source_kind": src.get("source_kind", ""),
                    "slug": slug,
                })
                count += 1
                if count >= src.get("max_per_source", 10):
                    break
        except Exception as e:
            print(f"[collect] skip {src_id}: {e}")

    return articles, stats


def dedupe_articles(articles: list[dict], raw_dir: Path) -> list[dict]:
    existing_slugs = set()
    for f in (raw_dir / "articles").glob("*.md"):
        existing_slugs.add(f.stem.split("-", 3)[-1] if f.stem.count("-") >= 3 else f.stem)

    return [a for a in articles if a["slug"] not in existing_slugs]


def save_raw_articles(articles: list[dict], raw_dir: Path) -> int:
    articles_dir = raw_dir / "articles"
    articles_dir.mkdir(parents=True, exist_ok=True)
    saved = 0
    date_str = _today_local()
    for a in articles:
        filename = f"{date_str}-{a['slug']}.md"
        path = articles_dir / filename
        if path.exists():
            continue
        score_line = f"\n**Goal-Score:** {a['goal_score']}" if a.get('goal_score') else ""
        relevance_line = f"\n**Relevance:** {a['relevance']}" if a.get('relevance') else ""
        source_kind_line = f"\n**Source-Kind:** {a['source_kind']}" if a.get('source_kind') else ""
        content = f"""# {a['title']}

**Source:** {a['source_id']}
**URL:** {a['url']}
**Published:** {a['published'].strftime('%Y-%m-%d %H:%M UTC')}
**Topic:** {a['topic']}
**Tier:** {a.get('tier', 3)}{source_kind_line}{score_line}{relevance_line}

{a['summary']}
"""
        path.write_text(content, encoding="utf-8")
        saved += 1
    return saved


def goal_align_filter(
    articles: list[dict],
    goal: str,
    min_score: int = 3,
    batch_size: int = 20,
) -> list[dict]:
    """
    Score articles for goal alignment via Claude API (Haiku — cheap, fast).
    Returns articles with goal_score >= min_score. Falls back on API failure.
    """
    if not articles:
        return articles

    import json
    import re
    import os
    from groq import Groq

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    scored_articles = list(articles)

    for batch_start in range(0, len(scored_articles), batch_size):
        batch = scored_articles[batch_start : batch_start + batch_size]
        items = "\n".join(
            f"{i + 1}. [{a['source_id']}] {a['title']} — {a.get('summary', '')[:120]}"
            for i, a in enumerate(batch)
        )
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=1200,
                messages=[{
                    "role": "user",
                    "content": (
                        f"Context: {goal}\n\n"
                        "For each article, provide:\n"
                        "1. score: 1-5 relevance (5=changes what I should do next, 3=useful background, 1=noise/off-topic)\n"
                        "2. note: Vietnamese, max 200 chars, 2 parts separated by ' -> ':\n"
                        "   Part 1: concrete takeaway (what happened, what was released, what was found)\n"
                        "   Part 2: specific next-step for me as the reader: read, test, compare, save, skip, or watch\n"
                        "   Do not mention FPT, FleziPT, COBOL PARK, CTO pitch, sales pitch, or customer conversations.\n"
                        "   Be specific, not generic. Avoid vague phrases like 'nen quan tam'.\n\n"
                        f"Articles:\n{items}\n\n"
                        "Respond ONLY with JSON array:\n"
                        '[{"idx":1,"score":4,"note":"Anthropic improves tool-use accuracy in Claude. '
                        '-> Compare it with OpenAI and decide whether to test Claude in my workflow this week."}, ...]\n'
                        "No other text."
                    ),
                }],
            )
            text = response.choices[0].message.content.strip()
            m = re.search(r"\[.*?\]", text, re.DOTALL)
            if m:
                parsed = json.loads(m.group())
                for item in parsed:
                    idx = item["idx"] - 1
                    if 0 <= idx < len(batch):
                        batch[idx]["goal_score"] = item.get("score", 3)
                        batch[idx]["relevance"]   = item.get("note", "")
        except Exception as e:
            print(f"[collect] Goal filter batch {batch_start}: {e} — fallback score=3")
            for article in batch:
                article.setdefault("goal_score", 3)
                article.setdefault("relevance", "")

    kept = [a for a in scored_articles if a.get("goal_score", 3) >= min_score]
    print(f"[collect] Goal filter: {len(scored_articles)} -> {len(kept)} kept (min={min_score})")
    return kept


def score_article(article: dict) -> int:
    score = 0

    score += {1: 3, 2: 2, 3: 1}.get(article.get("tier", 3), 0)
    source_id = article.get("source_id", "")
    source_kind = article.get("source_kind", "")
    text = (article.get("title", "") + " " + article.get("summary", "")).lower()

    HOT_SOURCES = {
        "openai-news", "anthropic-blog", "microsoft-official-blog", "microsoft-azure-blog",
        "google-ai-blog", "aws-ml-blog", "nvidia-blog", "techcrunch-ai", "venturebeat-ai",
    }
    HOT_MARKET = {
        "launch", "release", "announce", "partnership", "funding", "pricing", "acquisition",
        "enterprise", "regulation", "policy", "copilot", "codex", "claude", "openai",
        "anthropic", "microsoft", "google", "nvidia", "aws",
    }
    if source_kind == "market_news" or source_id in HOT_SOURCES:
        score += 8
    if any(kw in text for kw in HOT_MARKET):
        score += 5
    if source_id.startswith("arxiv") or source_id == "hf-papers":
        score -= 6

    AI_KEYWORDS = {"claude", "gpt", "llm", "agent", "reasoning",
                   "benchmark", "sota", "rlhf", "transformer", "fine-tun",
                   "mistral", "gemini", "deepseek", "qwen", "phi"}
    JP_KEYWORDS = {"nikkei", "boj", "topix", "yen", "jpy", "tariff", "boj",
                   "bank of japan", "nikkei225"}
    title_lower = article["title"].lower()
    if any(kw in title_lower for kw in AI_KEYWORDS | JP_KEYWORDS):
        score += 2

    if article.get("age_hours", 99) <= 12:
        score += 1

    url = article.get("url", "")
    if "github.com" in url or "paperswithcode" in url or "arxiv.org" in url:
        score += 1

    # Boost from LLM goal-align score: 5→+2, 4→+1, 3→0, below 3 already filtered
    goal_score = article.get("goal_score")
    if goal_score is not None:
        score += goal_score - 3

    return score


def rank_top(articles: list[dict], n: int = 5) -> list[dict]:
    scored = [(score_article(a), a) for a in articles]
    scored.sort(key=lambda x: (-x[0], x[1]["tier"], x[1]["age_hours"]))
    return [a for _, a in scored[:n]]


def format_reading_list(top_articles: list[dict], total: int) -> str:
    date_str = _today_local()
    lines = [f"Reading List — {date_str}  ·  {total} new articles\n"]

    for i, a in enumerate(top_articles, 1):
        n_stars = 4 - a.get("tier", 3)  # tier 1 → 3 stars, tier 2 → 2, tier 3 → 1
        stars = "*" * n_stars + " " * (3 - n_stars)
        source_label = f"[{a['source_id']}]"
        lines.append(f"{i}. {source_label} {a['title']}")
        lines.append(f"   {a['url']}")
        lines.append(f"   {'[' + a['topic'] + ']':12s} {stars}")
        lines.append("")

    lines.append("/wiki ask <question> to query your wiki")
    return "\n".join(lines)


def daily_synthesis(articles: list[dict], groq_api_key: str) -> dict:
    """
    Synthesize top articles into a structured daily intelligence review.
    Returns a dict saved to logs/intel_reviews/YYYY-MM-DD.json.
    Format matches what _llm_market_review() in api/intel.py reads.
    """
    import json as _json
    import subprocess as _sub

    date_str = _today_local()
    now_str = datetime.now(LOCAL_TZ).strftime("%Y-%m-%dT%H:%M:%S%z")

    fallback = {
        "status": "fallback_no_articles",
        "date": date_str,
        "generated_at": now_str,
        "title": f"Daily Intelligence — {date_str}",
        "reading_time": "0 phút",
        "sections": [],
    }

    if not articles:
        return fallback

    items_text = "\n".join(
        f"{i}. [{a.get('source_id', '?')}] {a.get('title', '')}\n"
        f"   Score: {a.get('goal_score', 3)}/5 | Topic: {a.get('topic', 'AI')}\n"
        f"   {(a.get('relevance') or a.get('summary') or '')[:200]}"
        for i, a in enumerate(articles[:10], 1)
    )

    prompt = (
        "Bạn là AI market analyst. Dưới đây là top articles của ngày hôm nay.\n"
        "Viết daily intelligence review ngắn gọn bằng tiếng Việt, format JSON.\n\n"
        f"Articles:\n{items_text}\n\n"
        "Yêu cầu:\n"
        "- 4 sections: 'Điểm nóng hôm nay', 'Top 5 cần đọc', 'Tín hiệu thị trường', 'Hành động'\n"
        "- Mỗi section: heading (string) + body (string, dùng \\n để xuống dòng)\n"
        "- 'Top 5 cần đọc': liệt kê 5 bài với format '1. Tên bài — tại sao quan trọng'\n"
        "- 'Hành động': 2-3 bullet cụ thể, bắt đầu bằng '- '\n"
        "- Tổng reading_time ước tính (vd: '4 phút')\n\n"
        "Output ONLY valid JSON, no markdown fences:\n"
        '{"title":"Daily AI & Market Intelligence — ' + date_str + '",'
        '"reading_time":"4 phút",'
        '"sections":[{"heading":"Điểm nóng hôm nay","body":"..."},'
        '{"heading":"Top 5 cần đọc","body":"1. ...\\n2. ..."},'
        '{"heading":"Tín hiệu thị trường","body":"..."},'
        '{"heading":"Hành động","body":"- ...\\n- ..."}]}'
    )

    try:
        _CLAUDE = r"C:\Users\HUY\AppData\Roaming\npm\claude.cmd"
        result = _sub.run(
            ["cmd", "/c", _CLAUDE],
            input=prompt,
            capture_output=True, text=True, encoding="utf-8",
            timeout=120,
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
        parsed = _json.loads(m.group())
        parsed["status"] = "current_llm"
        parsed["date"] = date_str
        parsed["generated_at"] = now_str
        return parsed
    except Exception as e:
        print(f"[collect] daily_synthesis error: {e}")
        fallback["status"] = "fallback_llm_error"
        fallback["error"] = str(e)[:200]
        return fallback
