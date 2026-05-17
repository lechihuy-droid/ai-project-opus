"""
Research Radar — fetch GitHub trending + arXiv recent papers,
2-round filter (heuristic + LLM), score apply-to-OPUS.

Pipeline: fetch → round1_heuristic → round2_llm_score → select_top → format_report
"""
import os
import re
import json
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
import feedparser
from bs4 import BeautifulSoup


# ── Tunables ──────────────────────────────────────────────────────
MIN_STARS_PER_WEEK = 50
WHITELIST = {
    "llm", "agent", "rag", "rlhf", "transformer", "fine-tun", "embedding",
    "claude", "gpt", "gemini", "mistral", "deepseek", "qwen", "phi",
    "reasoning", "evaluation", "benchmark", "sota",
    "wiki", "knowledge", "memory", "tool-use", "tool use",
    "prompt", "orchestration", "workflow", "pipeline",
}
BLACKLIST = {
    "game", "minecraft", "blockchain", "crypto", "nft",
    "wallpaper", "theme", "icon", "emoji", "discord-bot",
}

UA = {"User-Agent": "Mozilla/5.0 (research-radar/0.1)"}


# ── Round 0: Fetch sources ────────────────────────────────────────

def fetch_github_trending(language: str = "python", since: str = "weekly") -> list[dict]:
    """Scrape github.com/trending. Returns list of {title, url, description, stars_period, source}."""
    url = f"https://github.com/trending/{language}?since={since}"
    try:
        r = requests.get(url, headers=UA, timeout=15)
        if r.status_code != 200:
            print(f"[radar] GitHub trending HTTP {r.status_code}")
            return []
        soup = BeautifulSoup(r.text, "html.parser")
        items = []
        for art in soup.select("article.Box-row"):
            link = art.select_one("h2 a")
            if not link:
                continue
            href = link.get("href", "").strip()
            title = href.lstrip("/")  # owner/repo
            full_url = f"https://github.com{href}"
            desc_el = art.select_one("p")
            desc = desc_el.get_text(strip=True) if desc_el else ""
            # stars in period
            stars_el = art.select_one("span.d-inline-block.float-sm-right")
            stars_period = 0
            if stars_el:
                m = re.search(r"([\d,]+)", stars_el.get_text())
                if m:
                    stars_period = int(m.group(1).replace(",", ""))
            items.append({
                "title": title,
                "url": full_url,
                "description": desc,
                "stars_period": stars_period,
                "source": "github-trending",
                "type": "repo",
            })
        return items
    except Exception as e:
        print(f"[radar] GitHub trending error: {e}")
        return []


def fetch_arxiv_recent(categories: list[str] = None, days: int = 7, max_per_cat: int = 15) -> list[dict]:
    """arXiv API: recent papers in cs.AI, cs.LG. Returns list of {title, url, description, source, type}."""
    if categories is None:
        categories = ["cs.AI", "cs.LG", "cs.CL"]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    items = []
    for cat in categories:
        try:
            url = (
                f"http://export.arxiv.org/api/query"
                f"?search_query=cat:{cat}"
                f"&sortBy=submittedDate&sortOrder=descending"
                f"&max_results={max_per_cat}"
            )
            feed = feedparser.parse(url)
            for entry in feed.entries:
                pub = entry.get("published_parsed") or entry.get("updated_parsed")
                if pub:
                    pub_dt = datetime(*pub[:6], tzinfo=timezone.utc)
                    if pub_dt < cutoff:
                        continue
                items.append({
                    "title": entry.get("title", "").strip().replace("\n", " "),
                    "url": entry.get("link", ""),
                    "description": (entry.get("summary", "") or "")[:500].replace("\n", " "),
                    "source": f"arxiv-{cat}",
                    "type": "paper",
                    "stars_period": 0,
                })
        except Exception as e:
            print(f"[radar] arXiv {cat} error: {e}")
    return items


# ── Round 1: Heuristic filter ─────────────────────────────────────

def round1_heuristic(items: list[dict], min_stars: int = MIN_STARS_PER_WEEK) -> list[dict]:
    """Filter by stars (for repos) + keyword whitelist/blacklist."""
    kept = []
    for item in items:
        title_lower = item["title"].lower()
        desc_lower = (item.get("description") or "").lower()
        text = f"{title_lower} {desc_lower}"

        # Blacklist hard reject
        if any(bw in text for bw in BLACKLIST):
            continue

        # Whitelist match (any keyword)
        whitelist_match = any(kw in text for kw in WHITELIST)

        # GitHub: also need min stars
        if item["type"] == "repo":
            if item.get("stars_period", 0) < min_stars:
                continue
            kept.append(item)  # passed stars threshold
        else:
            # papers: need whitelist match (no stars to filter by)
            if whitelist_match:
                kept.append(item)

    return kept


# ── Round 2: LLM per-item scoring ─────────────────────────────────

OPUS_CONTEXT = """OPUS ANIMUS is a personal AI agent system with these modules:
- Module A (ResearchCrew): RSS + web research → Telegraph publish (Groq Llama-3.3-70b)
- Module B (Daily Brief): aggregate Module A output → Telegram daily
- Module C (Personal Wiki Agent): Karpathy LLM Wiki pattern — raw/ → personal-wiki/, ingest/query/lint
- Content Collector: weekly batch fetch RSS sources → wiki ingest
- opus-fabrica/markitdown-agent: file converter daemon, watch raw/inbox/

User goal: build production AI systems, accumulate knowledge, eventually L3 product (SaaS/Consulting/Investing).
Skills user has: Intermediate AI engineering, Intermediate Finance, Basic Business.
"""


def round2_llm_score(items: list[dict]) -> list[dict]:
    """Per-item LLM score. Adds apply_to_opus, skill_value, apply_suggestion, skip_reason."""
    from groq import Groq
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    scored = []

    for i, item in enumerate(items):
        prompt = f"""{OPUS_CONTEXT}

Item:
- Type: {item['type']}
- Title: {item['title']}
- URL: {item['url']}
- Description: {item.get('description','')[:500]}

Task: Score this item against OPUS ANIMUS roadmap. Return ONLY JSON, no markdown:
{{
  "apply_to_opus": 0-10,
  "skill_value": 0-10,
  "apply_suggestion": "1-2 sentences if apply_to_opus >= 6, else empty string",
  "skip_reason": "1 sentence if both scores < 5, else empty string"
}}

apply_to_opus = directly fork/integrate vào module nào (10 = drop-in replacement / new module).
skill_value = expands user's L1 knowledge or L2 skill (10 = paradigm-shifting concept)."""

        try:
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.2,
            )
            raw = resp.choices[0].message.content.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            data = json.loads(raw)
            item["apply_to_opus"] = int(data.get("apply_to_opus", 0))
            item["skill_value"] = int(data.get("skill_value", 0))
            item["apply_suggestion"] = data.get("apply_suggestion", "")[:200]
            item["skip_reason"] = data.get("skip_reason", "")[:200]
        except Exception as e:
            # Fallback: heuristic score based on stars
            stars = item.get("stars_period", 0)
            item["apply_to_opus"] = 0
            item["skill_value"] = min(10, stars // 50) if item["type"] == "repo" else 3
            item["apply_suggestion"] = ""
            item["skip_reason"] = f"LLM fail: {e}"

        scored.append(item)
        time.sleep(0.3)  # gentle rate limit

    return scored


# ── Select top + format ──────────────────────────────────────────

def select_top(items: list[dict], n: int = 5) -> list[dict]:
    """Rank by max(apply_to_opus, skill_value). Tiebreak: apply_to_opus, then stars_period."""
    def key(it):
        combined = max(it.get("apply_to_opus", 0), it.get("skill_value", 0))
        return (-combined, -it.get("apply_to_opus", 0), -it.get("stars_period", 0))
    return sorted(items, key=key)[:n]


def format_report(top_items: list[dict], total_fetched: int, wiki_added: int) -> str:
    iso = datetime.now().isocalendar()
    week = f"W{iso[1]:02d}"
    today = datetime.now().strftime("%Y-%m-%d")

    lines = [f"Research Radar — {week} ({today})"]
    lines.append(f"Fetched: {total_fetched} items | Top: {len(top_items)} | Wiki: +{wiki_added}")
    lines.append("")

    repos = [i for i in top_items if i["type"] == "repo"]
    papers = [i for i in top_items if i["type"] == "paper"]

    if repos:
        lines.append("TOP REPOS")
        for i, item in enumerate(repos, 1):
            apply_flag = "[APPLY]" if item.get("apply_to_opus", 0) >= 6 else ""
            lines.append(f"{i}. {apply_flag} {item['title']} ({item.get('stars_period', 0)} stars/week)")
            if item.get("description"):
                lines.append(f"   {item['description'][:120]}")
            if item.get("apply_suggestion"):
                lines.append(f"   → {item['apply_suggestion']}")
            lines.append(f"   {item['url']}")
            lines.append("")

    if papers:
        lines.append("TOP PAPERS")
        for i, item in enumerate(papers, 1):
            apply_flag = "[APPLY]" if item.get("apply_to_opus", 0) >= 6 else ""
            lines.append(f"{i}. {apply_flag} {item['title']}")
            if item.get("apply_suggestion"):
                lines.append(f"   → {item['apply_suggestion']}")
            lines.append(f"   {item['url']}")
            lines.append("")

    lines.append("/wiki ask <query> để dive sâu")
    return "\n".join(lines)
