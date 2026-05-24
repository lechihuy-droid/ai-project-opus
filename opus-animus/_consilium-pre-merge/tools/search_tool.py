import re
from datetime import date
from ddgs import DDGS
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


def _slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s_]+", "-", text)[:50]


class SearchInput(BaseModel):
    query: str = Field(description="Search query")
    max_results: int = Field(default=5, description="Number of results to return")


class WebSearchTool(BaseTool):
    name: str = "Web Search"
    description: str = "Search the web using DuckDuckGo. Returns titles, URLs, and snippets."
    args_schema: type[BaseModel] = SearchInput

    def _run(self, query: str, max_results: int = 5) -> str:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))

            if not results:
                return f"[Search] No results for: {query}"

            lines = [f"[Web Search: '{query}']"]
            for r in results:
                lines.append(f"- **{r['title']}**\n  {r['href']}\n  {r['body'][:200]}")

            # save raw for Module C
            _save_raw_search(query, results)

            return "\n\n".join(lines)

        except Exception as e:
            return f"[Search] Error: {e}"


def _save_raw_search(query: str, results: list[dict]):
    try:
        from utils.config import raw_dir
        slug = _slugify(query)
        path = raw_dir("articles") / f"{date.today()}-search-{slug}.md"
        if not path.exists():
            content = f"# Search: {query}\n\n"
            content += "\n\n".join(
                f"## {r['title']}\nURL: {r['href']}\n\n{r['body'][:300]}"
                for r in results
            )
            path.write_text(content, encoding="utf-8")
    except Exception:
        pass
