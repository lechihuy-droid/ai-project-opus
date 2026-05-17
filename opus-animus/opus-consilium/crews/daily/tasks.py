from datetime import date
from crewai import Task, Agent


def brief_task(agent: Agent, available_topics: list[str], missing_topics: list[str]) -> Task:
    today = date.today().isoformat()
    date_str = date.today().strftime('%d/%m/%Y')
    missing_note = ""
    if missing_topics:
        missing_note = f"\nNote: No data today for: {', '.join(missing_topics)}. Skip these topics."

    return Task(
        description=f"""
Create the morning brief for {today} (8:00 JST).
{missing_note}

Steps:
1. For each available topic ({', '.join(available_topics)}), use Read Latest Wiki tool to get content
2. Write a plain text brief in this format (under 500 words, NO emojis, use plain ASCII):

---
Brief {date_str} | 8:00 JST

[AI]
- highlight 1
- highlight 2
- highlight 3

[JP STOCK - Previous Close]
- N225: X,XXX (+X.XX%)
- Key market news

---

3. Publish the brief using Publish to Telegraph tool with title "Brief {today}"
4. Return ONLY the Telegraph URL
""",
        expected_output="A Telegraph URL (https://telegra.ph/...) for the morning brief.",
        agent=agent,
    )
