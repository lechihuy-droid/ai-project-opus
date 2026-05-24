from datetime import date
from crewai import Crew, Process
from utils.config import wiki_dir
from crews.daily.agents import briefer
from crews.daily.tasks import brief_task

TOPICS = ["AI", "JP_STOCK"]


def check_today_wiki() -> tuple[list[str], list[str]]:
    today = date.today().isoformat()
    available, missing = [], []
    for topic in TOPICS:
        files = list(wiki_dir().glob(f"{today}-{topic}.md"))
        if files:
            available.append(topic)
        else:
            missing.append(topic)
    return available, missing


def run_daily() -> dict:
    available, missing = check_today_wiki()

    if not available:
        return {"status": "no_data", "missing": missing, "telegraph_url": None}

    agent = briefer()
    crew = Crew(
        agents=[agent],
        tasks=[brief_task(agent, available, missing)],
        process=Process.sequential,
        verbose=True,
    )

    result = str(crew.kickoff())
    telegraph_url = result.strip().split()[-1] if "telegra.ph" in result else None

    return {
        "status": "ok",
        "missing": missing,
        "telegraph_url": telegraph_url,
        "brief_snippet": result[:800],
    }
