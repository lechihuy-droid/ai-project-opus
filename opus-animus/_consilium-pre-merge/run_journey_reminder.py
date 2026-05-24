"""
Sunday evening Telegram reminder to update JOURNEY.md with Claude.
Task Scheduler: weekly Sunday 20:00
"""
import os
import requests
from datetime import date
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

today = date.today().isoformat()
week = date.today().isocalendar()[1]

msg = f"""📖 *JOURNEY.md — Weekly Update Reminder*
📅 {today} · Week {week}

Tuần này đã kết thúc. Hãy mở Claude Code và nói:

> "Hãy update JOURNEY.md với những gì đã xây dựng tuần này"

OPUS ANIMUS — ghi lại hành trình để không quên."""

requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
    json={"chat_id": CHAT_ID, "text": msg, "parse_mode": "Markdown"},
    timeout=10,
)
print(f"Journey reminder sent — Week {week}")
