import time
from crewai import Crew, Process
from utils.config import get_sources
from crews.research.agents import researcher, writer
from crews.research.tasks import research_task, write_task


def build_sources_summary(topic: str) -> str:
    sources = get_sources(topic=topic)
    lines = []
    for s in sources:
        if s["type"] == "rss":
            lines.append(f"- RSS: {s['id']} → {s['url']}")
        elif s["type"] == "yfinance":
            lines.append(f"- Stock: {', '.join(s.get('symbols', []))}")
        elif s["type"] == "web_search":
            lines.append(f"- Web search: \"{s.get('query', topic + ' news today')}\"")
    return "\n".join(lines) if lines else "No sources configured."


def run_research(topic: str, wiki_context: dict | None = None) -> str:
    sources_summary = build_sources_summary(topic)

    r_agent = researcher(topic)
    w_agent = writer(topic)

    crew = Crew(
        agents=[r_agent, w_agent],
        tasks=[
            research_task(r_agent, topic, sources_summary, wiki_context=wiki_context or {}),
            write_task(w_agent, topic),
        ],
        process=Process.sequential,
        verbose=True,
    )

    for attempt in range(3):
        try:
            result = crew.kickoff()
            return str(result)
        except Exception as e:
            if "rate_limit" in str(e).lower() and attempt < 2:
                wait = 60 * (attempt + 1)
                print(f"[Rate limit] Waiting {wait}s before retry {attempt + 2}/3...")
                time.sleep(wait)
            else:
                raise
    return "Failed after retries"
