"""
Prompt Harvest — weekly job extracting Claude Code prompts → wiki ingest.

Usage:
  python run_prompt_harvest.py            # harvest since last run
  python run_prompt_harvest.py --all      # reprocess all history
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv()


def main():
    reprocess_all = "--all" in sys.argv

    from tools.prompt_extractor import harvest
    from datetime import datetime, timezone

    since = datetime(2020, 1, 1, tzinfo=timezone.utc) if reprocess_all else None
    print(f"[harvest] {'Full reprocess' if reprocess_all else 'Incremental harvest'} starting...")

    result = harvest(since=since)

    if result["status"] == "empty":
        print("[harvest] No new meaningful prompts since last run.")
        return

    print(f"[harvest] Extracted {result['prompt_count']} prompts → {result['output_path']}")

    # Ingest into personal-wiki
    from wiki_ops.ingest import run_ingest
    ingest_result = run_ingest(result["output_path"], verbose=True)

    if ingest_result["status"] == "ok":
        print(f"[harvest] Wiki page: {ingest_result['page_path']} ({ingest_result['action']})")
    else:
        print(f"[harvest] Ingest error: {ingest_result.get('error')}")


if __name__ == "__main__":
    main()
