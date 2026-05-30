"""
Module C — Personal Wiki Agent entry point.

Usage:
  python run_wiki.py ingest <url|file_path>
  python run_wiki.py ingest --dry-run <url|file_path>
  python run_wiki.py query "<question>"
  python run_wiki.py lint
  python run_wiki.py audit-research [--plan|--apply] [--limit N]
  python run_wiki.py poll          (called by Task Scheduler every 5 min)
  python run_wiki.py test          (M1 milestone check)
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv()


def cmd_test():
    """M1: verify foundation — markitdown, folders, schema."""
    from utils.config import personal_wiki_dir, raw_dir
    from tools.markitdown_tool import convert_url

    print("[test] Checking folder structure...")
    for name in ["AI", "Stock", "Personal", "Tech"]:
        d = personal_wiki_dir() / name
        print(f"  {'OK' if d.exists() else 'MISSING'} personal-wiki/{name}/")
    for name in ["articles", "papers", "notes"]:
        d = raw_dir(name)
        print(f"  {'OK' if d.exists() else 'MISSING'} raw/{name}/")

    schema = personal_wiki_dir() / "SCHEMA.md"
    index = personal_wiki_dir() / "INDEX.md"
    print(f"  {'OK' if schema.exists() else 'MISSING'} personal-wiki/SCHEMA.md")
    print(f"  {'OK' if index.exists() else 'MISSING'} personal-wiki/INDEX.md")

    print("\n[test] Checking markitdown (fetch example.com)...")
    result = convert_url("https://example.com")
    if result and len(result) > 20:
        print(f"  OK markitdown — {len(result)} chars")
    else:
        print(f"  FAIL markitdown — {result[:100]}")

    print("\n[test] M1 PASS — foundation ready")


def cmd_ingest(source: str, dry_run: bool = False):
    """M2: ingest URL or file → wiki page."""
    from wiki_ops.ingest import run_ingest
    result = run_ingest(source, dry_run=dry_run)
    if result["status"] == "ok":
        verb = "Would write" if dry_run else result.get("action", "create").title()
        print(f"[ingest] {verb}: {result['page_path']}")
    else:
        print(f"[ingest] Error: {result.get('error')}")


def cmd_query(question: str):
    """M3: query wiki."""
    from wiki_ops.query import run_query
    result = run_query(question)
    print(f"\n--- Answer ---\n{result['answer']}")
    if result.get("pages_read"):
        print(f"\nSources: {', '.join('[[' + p + ']]' for p in result['pages_read'])}")


def cmd_lint():
    """Phase 4: run lint checks."""
    from wiki_ops.lint import run_lint
    run_lint()


def cmd_poll():
    """Phase 3: called by Task Scheduler — process pending Telegram /wiki commands."""
    from wiki_ops.telegram_handler import poll_once
    poll_once()


def cmd_reflect():
    """GAP-2: weekly reflection + spaced repetition."""
    from wiki_ops.reflect import run_reflect
    run_reflect(send_telegram=True)


def cmd_audit_research(args: list[str]):
    """Audit raw/wiki items against the three Consilium research lanes."""
    from wiki_ops.research_audit import main as audit_main
    audit_main(args or ["--plan"])


def cmd_skill(args: list[str]):
    """Manage learned skills: list | show <slug> | add"""
    from wiki_ops.skill_manager import list_skills, get_skill, save_skill

    subcmd = args[0].lower() if args else "list"

    if subcmd == "list":
        skills = list_skills()
        if not skills:
            print("[skill] No skills yet. Use: run_wiki.py skill add")
            return
        for s in skills:
            print(f"  [{s['category']}] {s['slug']} — {s['title']}")

    elif subcmd == "show":
        if len(args) < 2:
            print("Usage: run_wiki.py skill show <slug>")
            return
        content = get_skill(args[1])
        if content:
            print(content)
        else:
            print(f"[skill] Not found: {args[1]}")

    elif subcmd == "add":
        print("Title: ", end="", flush=True)
        title = input().strip()
        print("Category (wiki/research/daily): ", end="", flush=True)
        category = input().strip() or "wiki"
        print("Tags (comma-separated): ", end="", flush=True)
        tags = [t.strip() for t in input().split(",") if t.strip()]
        print("Body (paste markdown, end with a line containing only '---END'):")
        lines = []
        while True:
            line = input()
            if line == "---END":
                break
            lines.append(line)
        slug = save_skill(title, category, "\n".join(lines), tags)
        print(f"[skill] Saved: {slug}")

    elif subcmd == "curate":
        from wiki_ops.skill_curator import curate
        dry_run = "--dry-run" in args
        if dry_run:
            print("[skill] Dry run — no changes will be written")
        curate(dry_run=dry_run)

    else:
        print(f"Unknown skill subcommand: {subcmd}. Use list|show|add|curate")


def main():
    if len(sys.argv) < 2:
        print("Usage: run_wiki.py test|ingest|query|lint|audit-research|poll|reflect|skill [args]")
        return

    cmd = sys.argv[1].lower()

    if cmd == "test":
        cmd_test()
    elif cmd == "ingest":
        if len(sys.argv) < 3:
            print("Usage: run_wiki.py ingest [--dry-run] <url|file_path>")
            return
        args = sys.argv[2:]
        dry_run = False
        if "--dry-run" in args:
            dry_run = True
            args.remove("--dry-run")
        if not args:
            print("Usage: run_wiki.py ingest [--dry-run] <url|file_path>")
            return
        cmd_ingest(" ".join(args), dry_run=dry_run)
    elif cmd == "query":
        if len(sys.argv) < 3:
            print("Usage: run_wiki.py query \"<question>\"")
            return
        cmd_query(" ".join(sys.argv[2:]))
    elif cmd == "lint":
        send_telegram = "--no-telegram" not in sys.argv[2:]
        from wiki_ops.lint import run_lint
        run_lint(send_telegram=send_telegram)
    elif cmd == "poll":
        cmd_poll()
    elif cmd == "reflect":
        cmd_reflect()
    elif cmd == "audit-research":
        cmd_audit_research(sys.argv[2:])
    elif cmd == "skill":
        cmd_skill(sys.argv[2:])
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
