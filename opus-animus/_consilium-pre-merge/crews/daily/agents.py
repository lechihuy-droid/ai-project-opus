import os
from crewai import Agent, LLM
from tools.wiki_tool import ReadWikiTool
from tools.telegraph_tool import TelegraphTool

llm = LLM(model="groq/llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))


def briefer() -> Agent:
    return Agent(
        role="Morning Briefer",
        goal="Read the latest wiki pages and write a concise, actionable morning brief under 500 words.",
        backstory="You are a sharp analyst who distills complex research into a crisp morning brief. You focus on what matters most: key insights and market-moving data.",
        tools=[ReadWikiTool(), TelegraphTool()],
        llm=llm,
        verbose=True,
    )
