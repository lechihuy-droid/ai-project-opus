from datetime import datetime
from fastapi import APIRouter
from .data import (
    wiki_stats, system_status,
    reflection_status, today_articles_count, parse_goals, latest_daily_brief,
)

router = APIRouter()


@router.get("/dashboard")
def get_dashboard():
    now = datetime.now()
    goals = parse_goals()
    refl = reflection_status()
    return {
        "date": now.strftime("%Y-%m-%d  %a"),
        "motto": "Non multa, sed multum.",
        "life_tracks": {
            "finance": goals.get("finance", {}),
            "health":  goals.get("health", {}),
            "career":  goals.get("career", {}),
            "freedom_target":   goals.get("freedom_target", "—"),
            "freedom_timeline": goals.get("freedom_timeline", "—"),
        },
        "system_status": system_status(),
        "wiki": wiki_stats(),
        "today": {
            "articles": today_articles_count(),
            "reflection": refl,
            "goal_last_review": 0,
        },
        "daily_brief": latest_daily_brief(),
    }
