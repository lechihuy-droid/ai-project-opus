"""
Daily brief — triggered by Windows Task Scheduler at 06:00 ICT.
Queries personal-wiki/ (Karpathy) → calls LLM → publishes Telegraph → sends Telegram.
Falls back to reading wiki/ folder if wiki has insufficient content.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv()

from datetime import date
from utils.config import wiki_dir, logs_dir
from utils.llm import claude_cli
from utils.telegram import send_message, send_error
from tools.telegraph_tool import publish

TOPICS = ["AI", "JP_STOCK"]


def query_wiki_context() -> str | None:
    """Query personal-wiki/ for AI + Stock separately, merge results."""
    from wiki_ops.query import run_query

    queries = {
        "AI": "What are the latest AI model releases, research papers, and industry news in my wiki?",
        "Stock": "What are the latest Japanese stock market movements, Nikkei data, and economic trends in my wiki?",
    }
    parts = []
    all_pages = []
    for label, question in queries.items():
        try:
            result = run_query(question, verbose=False)
            if result["status"] == "ok" and len(result.get("answer", "")) > 80:
                parts.append(f"=== {label} ===\n{result['answer']}")
                all_pages.extend(result.get("pages_read", []))
        except Exception as e:
            print(f"[run_daily] Wiki query ({label}) failed: {e}")

    if parts:
        print(f"[run_daily] Wiki query OK — {len(parts)} topics, pages: {all_pages}")
        return "\n\n".join(parts)
    return None


def read_wiki_fallback() -> dict[str, str]:
    """Fallback: read today's ephemeral wiki/ folder files (Module A output)."""
    today = date.today().isoformat()
    contents = {}
    for topic in TOPICS:
        files = sorted(wiki_dir().glob(f"*-*{topic}.md"), reverse=True)
        if files and files[0].name.startswith(today):
            contents[topic] = files[0].read_text(encoding="utf-8")
    return contents


def write_brief(context: str) -> str:
    today = date.today().strftime("%d/%m/%Y")
    prompt = (
        "You are a concise morning briefer. Write in plain text, no emojis. Be specific and factual.\n\n"
        f"Write a morning brief for {today} (8:00 JST) based on this context.\n"
        "Under 400 words. Format:\n\n"
        f"Brief {today} | 8:00 JST\n\n"
        "[AI]\n"
        "- key point 1\n"
        "- key point 2\n"
        "- key point 3\n\n"
        "[JP STOCK - Previous Close]\n"
        "- N225: price and change\n"
        "- key market news\n\n"
        f"Context:\n{context[:3000]}"
    )
    return claude_cli(prompt, timeout=120)


def main():
    today_str = date.today().strftime("%d/%m/%Y")
    today_iso = date.today().isoformat()
    print(f"[run_daily] Starting brief for {today_str}")

    try:
        # Primary: query personal-wiki/ (Karpathy compounding path)
        context = query_wiki_context()
        source_label = "wiki"

        # Fallback: read ephemeral wiki/ files from Module A
        if not context:
            print("[run_daily] Wiki query insufficient — falling back to wiki/ folder")
            fallback = read_wiki_fallback()
            if not fallback:
                msg = (f"⚠️ <b>Brief sáng {today_str}</b>\n\nChưa có data hôm nay.\n"
                       f"Chạy: <code>python run_research.py all</code>")
                send_message(msg)
                print("[run_daily] No data found")
                return
            context = "\n\n".join(f"=== {t} ===\n{c[:2000]}" for t, c in fallback.items())
            source_label = "fallback"

        print(f"[run_daily] Writing brief from {source_label} ({len(context)} chars)")
        brief_text = write_brief(context)

        telegraph_url = publish(f"Brief {today_iso}", brief_text)

        log_path = logs_dir() / f"{today_iso}.md"
        log_path.write_text(brief_text, encoding="utf-8")

        tg_msg = f"📅 <b>Brief sáng — {today_str} | 8:00 JST</b>"
        if source_label == "fallback":
            tg_msg += "\n⚠️ Nguồn: wiki/ folder (wiki chưa đủ data)"
        if "telegra.ph" in telegraph_url:
            tg_msg += f"\n\n👉 <a href='{telegraph_url}'>Xem đầy đủ</a>"
        else:
            tg_msg += f"\n\n{brief_text[:600]}"

        send_message(tg_msg)
        print(f"[run_daily] Done — {telegraph_url}")

    except Exception as e:
        print(f"[run_daily] Error: {e}")
        send_error("run_daily", str(e))


if __name__ == "__main__":
    main()
