import os
from crewai import Agent, LLM
from tools.rss_tool import RSSTool
from tools.yfinance_tool import YFinanceTool
from tools.search_tool import WebSearchTool
from tools.wiki_tool import SaveWikiTool
from tools.telegraph_tool import TelegraphTool

llm = LLM(model="groq/llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))


def researcher(topic: str) -> Agent:
    return Agent(
        role="Research Analyst",
        goal=f"Gather comprehensive, up-to-date information about {topic} from all available sources.",
        backstory="You are a meticulous researcher who fetches data from RSS feeds, financial APIs, and web search. You collect raw content without editorializing.",
        tools=[RSSTool(), YFinanceTool(), WebSearchTool()],
        llm=llm,
        verbose=True,
    )


def writer(topic: str) -> Agent:
    return Agent(
        role="Knowledge Writer",
        goal=f"Synthesize research into a clear, structured markdown wiki page about {topic}, then publish it.",
        backstory="You are a skilled technical writer who transforms raw research into concise, well-structured markdown documents. You always include sources and key highlights.",
        tools=[SaveWikiTool(), TelegraphTool()],
        llm=llm,
        verbose=True,
    )
