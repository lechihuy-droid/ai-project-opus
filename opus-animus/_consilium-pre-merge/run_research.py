"""
Manual trigger for Module A — ResearchCrew.
Usage:
  python run_research.py AI
  python run_research.py JP_STOCK
  python run_research.py all
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from crews.research.crew import run_research

TOPICS = ["AI", "JP_STOCK"]


def personal_wiki_has_content(topic: str) -> bool:
    """Check if personal-wiki has pages for this topic (guard for 5B)."""
    try:
        from utils.config import personal_wiki_dir
        topic_map = {"AI": "AI", "JP_STOCK": "Stock"}
        folder = personal_wiki_dir() / topic_map.get(topic, topic)
        return folder.exists() and len(list(folder.glob("*.md"))) >= 10
    except Exception:
        return False


def get_wiki_context(topic: str) -> dict:
    """Phase 5B: query personal-wiki before research to avoid re-covering known content."""
    try:
        from wiki_ops.query import run_query
        topic_map = {"AI": "AI news and LLM developments", "JP_STOCK": "Japanese stock market"}
        result = run_query(
            f"What topics and subtopics do I already have in my wiki about {topic_map.get(topic, topic)}? List them briefly.",
            verbose=False,
        )
        if result["status"] == "ok":
            return {
                "known_summary": result["answer"],
                "pages_read": result.get("pages_read", []),
            }
    except Exception:
        pass
    return {}


def main():
    arg = sys.argv[1].upper() if len(sys.argv) > 1 else "all"
    topics = TOPICS if arg == "ALL" else [arg]

    for topic in topics:
        print(f"\n{'='*50}\nRunning ResearchCrew for: {topic}\n{'='*50}")

        # Phase 5B: query personal-wiki for context (only if enough content exists)
        wiki_context = {}
        if personal_wiki_has_content(topic):
            print(f"[run_research] Querying personal-wiki for {topic} context...")
            wiki_context = get_wiki_context(topic)
            if wiki_context.get("known_summary"):
                print(f"[run_research] Wiki context: {wiki_context['known_summary'][:100]}...")

        run_start = datetime.now()

        try:
            result = run_research(topic, wiki_context=wiki_context)
            print(f"\n[run_research] Done: {result}")
        except Exception as e:
            print(f"\n[run_research] Error ({topic}): {e}")
            continue

        # Phase 5A: ingest new raw files into personal-wiki
        try:
            from wiki_ops.ingest import ingest_new_raw
            print(f"[run_research] Ingesting new raw files into personal-wiki...")
            ingest_new_raw(since=run_start)
        except Exception as e:
            print(f"[run_research] Module C ingest error: {e}")


if __name__ == "__main__":
    main()
