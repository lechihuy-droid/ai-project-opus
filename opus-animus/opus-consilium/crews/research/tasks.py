from datetime import date
from crewai import Task
from crewai import Agent


def research_task(agent: Agent, topic: str, sources_summary: str, wiki_context: dict | None = None) -> Task:
    context_note = ""
    if wiki_context and wiki_context.get("known_summary"):
        context_note = f"""
Prior knowledge from personal wiki (already compiled — focus on NEW content):
{wiki_context['known_summary'][:500]}

Focus on developments NOT already covered above. Do NOT skip sources — fetch all, but prioritize new angles.
"""

    return Task(
        description=f"""
Gather today's ({date.today().isoformat()}) content for topic: **{topic}**

Available sources to fetch:
{sources_summary}
{context_note}
Instructions:
- Fetch each RSS source using the RSS Fetcher tool (max 5 items each, last 48h only)
- If topic is JP_STOCK, fetch stock data using the Stock Data tool for symbols: ^N225
- Run a web search for latest news on this topic
- Collect all raw content — do NOT summarize yet
""",
        expected_output="A comprehensive collection of raw articles, data points, and search results for the topic.",
        agent=agent,
    )


def write_task(agent: Agent, topic: str) -> Task:
    today = date.today().isoformat()
    return Task(
        description=f"""
Using the research collected, create a wiki page for **{topic}** dated {today}.

Wiki format:
```
# {{topic}} — {today}

## Highlights
- (3-5 key insights)

## Articles
### [Title](url)
Summary (2-3 sentences)...

## Market Data (only for JP_STOCK)
(price, change, context)

---
*Generated: {today}*
```

Then:
1. Save the wiki using Save Wiki tool with topic="{topic}"
2. Publish to Telegraph using Publish to Telegraph tool
3. Return the Telegraph URL as final output
""",
        expected_output=f"Telegraph URL (https://telegra.ph/...) for the {topic} wiki page.",
        agent=agent,
    )
