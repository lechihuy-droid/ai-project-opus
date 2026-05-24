"""
Module C — Telegram polling handler.
Called by Task Scheduler every 5 minutes via: python run_wiki.py poll

Supported commands:
  /wiki <url>           → ingest URL
  /wiki note <text>     → ingest plain text note
  /wiki ask <question>  → query wiki
  /wiki digest          → lint report + weekly summary
  /wiki help            → show available commands
"""
import os
import json
import requests
from pathlib import Path

OFFSET_FILE = Path(__file__).parent.parent / ".wiki_tg_offset.json"
TG_API = "https://api.telegram.org/bot{token}/{method}"


def _token() -> str:
    return os.getenv("TELEGRAM_BOT_TOKEN", "")


def _chat_id() -> str:
    return os.getenv("TELEGRAM_CHAT_ID", "")


def _get_updates(offset: int) -> list[dict]:
    url = TG_API.format(token=_token(), method="getUpdates")
    try:
        resp = requests.get(url, params={"offset": offset, "timeout": 5}, timeout=10)
        if resp.ok:
            return resp.json().get("result", [])
    except Exception as e:
        print(f"[poll] getUpdates error: {e}")
    return []


def _reply(chat_id: str, text: str):
    url = TG_API.format(token=_token(), method="sendMessage")
    text = text[:3800]
    try:
        requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=10)
    except Exception as e:
        print(f"[poll] reply error: {e}")


def _load_offset() -> int:
    if OFFSET_FILE.exists():
        try:
            return json.loads(OFFSET_FILE.read_text()).get("offset", 0)
        except Exception:
            pass
    return 0


def _save_offset(offset: int):
    OFFSET_FILE.write_text(json.dumps({"offset": offset}))


def _handle_command(text: str, chat_id: str):
    text = text.strip()

    if not text.startswith("/wiki"):
        return

    args = text[len("/wiki"):].strip()

    # /wiki help
    if not args or args == "help":
        _reply(chat_id, (
            "<b>Wiki commands:</b>\n"
            "/wiki &lt;url&gt; — ingest URL\n"
            "/wiki thought &lt;text&gt; — capture personal insight\n"
            "/wiki note &lt;text&gt; — ingest plain text note\n"
            "/wiki ask &lt;question&gt; — query your wiki\n"
            "/wiki used &lt;slug&gt; for &lt;action&gt; — mark knowledge applied\n"
            "/wiki reflect — run weekly reflection\n"
            "/wiki digest — lint report\n"
            "/wiki help — show this message"
        ))
        return

    # /wiki thought <text> — GAP-3: personal insight capture
    if args.startswith("thought "):
        thought = args[8:].strip()
        if not thought:
            _reply(chat_id, "Usage: /wiki thought <your insight>")
            return
        _reply(chat_id, "Capturing thought...")
        from pathlib import Path
        from utils.config import raw_dir
        from datetime import datetime
        notes_dir = raw_dir("notes")
        notes_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y-%m-%d-%H%M")
        note_file = notes_dir / f"{ts}-thought.md"
        note_file.write_text(f"# Personal Thought — {ts}\n\n{thought}\n", encoding="utf-8")
        from wiki_ops.ingest import run_ingest
        result = run_ingest(str(note_file))
        if result["status"] == "ok":
            _reply(chat_id, f"Thought saved to <b>Personal/{result['filename']}</b>")
        else:
            _reply(chat_id, f"Saved raw, ingest error: {result.get('error', '')[:100]}")
        return

    # /wiki used <slug> for <action> — GAP-4+6: application tracking
    if args.startswith("used "):
        rest = args[5:].strip()
        if " for " not in rest:
            _reply(chat_id, "Usage: /wiki used &lt;page-slug&gt; for &lt;what you did&gt;")
            return
        slug, action = rest.split(" for ", 1)
        slug = slug.strip()
        action = action.strip()
        from utils.config import personal_wiki_dir
        from datetime import date
        wiki = personal_wiki_dir()
        matches = list(wiki.rglob(f"*{slug}*.md"))
        if not matches:
            _reply(chat_id, f"Page not found: {slug}\nCheck INDEX.md for exact slug.")
            return
        page = matches[0]
        content = page.read_text(encoding="utf-8")
        tag_line = f"applied:: {date.today().isoformat()} — {action}"
        if "## Applied" in content:
            content = content.replace("## Applied", f"## Applied\n- {tag_line}")
        else:
            content += f"\n## Applied\n- {tag_line}\n"
        page.write_text(content, encoding="utf-8")
        _reply(chat_id, f"Tagged <b>{page.name}</b>:\n<i>{tag_line}</i>")
        return

    # /wiki note <text>
    if args.startswith("note "):
        note = args[5:].strip()
        _reply(chat_id, "Saving note...")
        from wiki_ops.ingest import run_ingest
        result = run_ingest(note)
        if result["status"] == "ok":
            _reply(chat_id, f"Saved to <b>{result['page_path']}</b>")
        else:
            _reply(chat_id, f"Error: {result.get('error', 'unknown')}")
        return

    # /wiki ask <question>
    if args.startswith("ask "):
        question = args[4:].strip()
        _reply(chat_id, "Searching wiki...")
        from wiki_ops.query import run_query
        result = run_query(question, verbose=False)
        answer = result["answer"]
        if result.get("pages_read"):
            sources = ", ".join(f"[[{p}]]" for p in result["pages_read"])
            answer += f"\n\nSources: {sources}"
        _reply(chat_id, answer)
        return

    # /wiki digest
    if args == "digest":
        _reply(chat_id, "Running lint + digest...")
        from wiki_ops.lint import run_lint
        report = run_lint(send_telegram=False)
        _reply(chat_id, f"<pre>{report[:3000]}</pre>")
        return

    # /wiki <url> — ingest URL
    if args.startswith("http://") or args.startswith("https://"):
        _reply(chat_id, f"Ingesting: {args[:60]}...")
        from wiki_ops.ingest import run_ingest
        result = run_ingest(args)
        if result["status"] == "ok":
            _reply(chat_id, f"Saved to <b>{result['page_path']}</b>")
        else:
            _reply(chat_id, f"Error: {result.get('error', 'unknown')}")
        return

    # /wiki reflect — trigger manual reflection
    if args == "reflect":
        _reply(chat_id, "Running weekly reflection...")
        from wiki_ops.reflect import run_reflect
        result = run_reflect(send_telegram=False)
        _reply(chat_id, result[:3500])
        return

    # fallback
    _reply(chat_id, f"Unknown args: {args[:80]}\nSend /wiki help for usage.")



def _ideas_file() -> Path:
    from utils.config import raw_dir
    f = raw_dir("inbox") / "ideas.md"
    if not f.exists():
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text("# Ideas Inbox\n\nAppend-only capture file. LLM synthesizes vào wiki tự động.\n\n", encoding="utf-8")
    return f


def _capture_idea(text: str, chat_id: str):
    """Append free-text to ideas.md. Ingest runs daily with content-collector (05:30)."""
    from datetime import datetime

    ideas = _ideas_file()
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"\n---\n\n## {ts}\n{text.strip()}\n"
    with ideas.open("a", encoding="utf-8") as f:
        f.write(entry)

    _reply(chat_id, f"✓ Saved — wiki sẽ tổng hợp lúc 05:30")


def _decision_context() -> tuple[str, list[str]]:
    """Read the core decision-brain pages for mobile Consilium chat."""
    from utils.config import personal_wiki_dir

    wiki = personal_wiki_dir()
    page_paths = [
        "Personal/wiki-chat-protocol.md",
        "Personal/current-beliefs.md",
        "Personal/open-questions.md",
        "Personal/decisions.md",
        "Personal/active-project-context.md",
        "AI/ai-trend-radar.md",
        "Personal/reskill-roadmap.md",
        "Stock/investment-theses.md",
    ]
    chunks = []
    read = []
    for rel in page_paths:
        p = wiki / rel
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        stem = p.stem
        chunks.append(f"=== [[{stem}]] ===\n{text[:2200]}")
        read.append(stem)
    return "\n\n".join(chunks), read


def _run_consilium_brief(question: str) -> dict:
    """Single-call decision brief for iPhone/Telegram use."""
    from utils.llm import claude_cli

    context, pages_read = _decision_context()

    if not question.strip():
        question = (
            "Give me today's AI trend, re-skill, and investment brief. "
            "Answer: what changed, what it means for AI trends, what it means "
            "for re-skill, what it means for investment thinking, what to do, "
            "what to ignore, and which wiki pages should be updated."
        )

    prompt = (
        "You are Opus Consilium, Huy's decision brain. "
        "Use the provided wiki pages only. Do not summarize all news. "
        "Focus on AI trends, re-skill planning, investment thinking, "
        "Opus Animus strategy, and Lucida workflow implications. "
        "Separate evidence from speculation. Plain text, no emojis. "
        "Cite pages as [[page-name]].\n\n"
        f"DECISION WIKI CONTEXT:\n{context}\n\nQUESTION:\n{question}"
    )
    answer = claude_cli(prompt, timeout=180)
    return {
        "status": "ok",
        "answer": answer,
        "pages_read": pages_read,
    }


def _handle_consilium_command(text: str, chat_id: str):
    text = text.strip()
    if not text.startswith("/consilium"):
        return

    args = text[len("/consilium"):].strip()

    if args == "help":
        _reply(chat_id, (
            "<b>Consilium commands:</b>\n"
            "/consilium - AI trend + re-skill + investment brief\n"
            "/consilium ask &lt;question&gt; - decision-brain Q&A\n"
            "/consilium brief - same as /consilium\n"
            "/wiki help - raw wiki commands"
        ))
        return

    if args == "brief":
        args = ""
    elif args.startswith("ask "):
        args = args[4:].strip()

    _reply(chat_id, "Reading Consilium decision brain...")
    try:
        result = _run_consilium_brief(args)
        answer = result["answer"]
        if result.get("pages_read"):
            answer += "\n\nDecision pages: " + ", ".join(f"[[{p}]]" for p in result["pages_read"])
        _reply(chat_id, answer)
    except Exception as e:
        print(f"[consilium] error: {e}")
        _reply(chat_id, f"Consilium error: {e}")


def poll_once():
    """Process all pending messages since last offset."""
    if not _token():
        print("[poll] TELEGRAM_BOT_TOKEN not set")
        return

    offset = _load_offset()
    updates = _get_updates(offset)

    if not updates:
        return

    for update in updates:
        msg = update.get("message", {})
        text = msg.get("text", "")
        chat_id = str(msg.get("chat", {}).get("id", _chat_id()))

        if not text:
            pass
        elif text.startswith("/consilium"):
            print(f"[poll] Consilium command from {chat_id}: {text[:60]}")
            try:
                _handle_consilium_command(text, chat_id)
            except Exception as e:
                print(f"[poll] Consilium handler error: {e}")
                _reply(chat_id, f"Error: {e}")
        elif text and text.startswith("/wiki"):
            print(f"[poll] Command from {chat_id}: {text[:60]}")
            try:
                _handle_command(text, chat_id)
            except Exception as e:
                print(f"[poll] Handler error: {e}")
                _reply(chat_id, f"Error: {e}")
        elif text:
            # Free text → capture to ideas.md
            print(f"[poll] Capturing idea: {text[:60]}")
            try:
                _capture_idea(text, chat_id)
            except Exception as e:
                print(f"[poll] Capture error: {e}")
                _reply(chat_id, f"Error saving: {e}")

    _save_offset(updates[-1]["update_id"] + 1)
    print(f"[poll] Processed {len(updates)} update(s)")
