import re
import feedparser
from datetime import datetime, date, timezone, timedelta
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


def _slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s_]+", "-", text)[:60]


class RSSInput(BaseModel):
    url: str = Field(description="RSS feed URL to fetch")
    max_items: int = Field(default=5, description="Max articles to return")


class RSSTool(BaseTool):
    name: str = "Fetch RSS Feed"
    description: str = "Fetch recent articles from an RSS feed URL. Returns titles, summaries, and links."
    args_schema: type[BaseModel] = RSSInput

    def _run(self, url: str, max_items: int = 5) -> str:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
        try:
            feed = feedparser.parse(url)
            if not feed.entries:
                return f"[RSS] No entries found at {url}"

            items = []
            for entry in feed.entries[:max_items * 2]:
                published = entry.get("published_parsed") or entry.get("updated_parsed")
                if published:
                    pub_dt = datetime(*published[:6], tzinfo=timezone.utc)
                    if pub_dt < cutoff:
                        continue
                # no date field → include anyway (can't filter)

                title = entry.get("title", "No title")
                link = entry.get("link", "")
                summary = entry.get("summary", entry.get("description", ""))[:300]
                items.append(f"- **{title}**\n  {link}\n  {summary}")

                # save raw for Module C — try full content, fall back to snippet
                full_content = _fetch_full_content(link) or summary
                _save_raw_article(title, link, full_content)

                if len(items) >= max_items:
                    break

            if not items:
                return f"[RSS] No articles in last 24h from {url}"

            return f"[RSS: {feed.feed.get('title', url)}]\n" + "\n\n".join(items)

        except Exception as e:
            return f"[RSS] Error fetching {url}: {e}"


def _fetch_full_content(url: str) -> str | None:
    """Try to fetch full article HTML via markitdown. Returns None on failure."""
    if not url:
        return None
    try:
        from tools.markitdown_tool import convert_url
        result = convert_url(url)
        if result and not result.startswith("[markitdown]") and len(result) > 200:
            return result[:6000]
    except Exception:
        pass
    return None


_NAV_SIGNALS = ["Skip to content", "Skip to sidebar", "[Try GitHub Copilot]",
                "data-testid=", "<nav", "aria-label="]

def _save_raw_article(title: str, url: str, content: str):
    try:
        # Guard: title must exist for a valid slug
        if not title or not title.strip():
            return
        slug = _slugify(title)
        if not slug:
            return

        # Guard: reject navigation / boilerplate HTML dumps
        if any(sig in content for sig in _NAV_SIGNALS):
            return

        # Guard: minimum meaningful content
        clean = re.sub(r"\s+", " ", content).strip()
        if len(clean) < 300:
            return

        from utils.config import raw_dir
        path = raw_dir("articles") / f"{date.today()}-{slug}.md"
        if not path.exists():
            path.write_text(
                f"# {title}\n\nSource: {url}\n\n{content}",
                encoding="utf-8"
            )
    except Exception:
        pass
