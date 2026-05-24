"""
Module C — ingest operation.
Takes a URL, file path, or plain text → saves to raw/ → compiles wiki page.
"""
import os
import json
import re
from datetime import datetime, date
from pathlib import Path

from utils.config import personal_wiki_dir, raw_dir
from utils.llm import claude_cli_json

_TOPICS = ["AI", "Stock", "Personal", "Tech"]


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text[:60]


def _detect_type(src: str) -> tuple[str, str]:
    """Returns (content, category)."""
    from tools.markitdown_tool import convert_url, convert_file

    if src.startswith("http://") or src.startswith("https://"):
        content = convert_url(src)
        category = "papers" if ("arxiv" in src or src.endswith(".pdf")) else "articles"
    elif Path(src).exists():
        suffix = Path(src).suffix.lower()
        PAPER_EXT = {".pdf"}
        CONVERT_EXT = {".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls",
                       ".html", ".htm", ".png", ".jpg", ".jpeg", ".mp3", ".m4a"}
        if suffix in PAPER_EXT:
            content = convert_file(src)
            category = "papers"
        elif suffix in CONVERT_EXT:
            content = convert_file(src)
            category = "articles"
        else:
            content = Path(src).read_text(encoding="utf-8", errors="replace")
            category = "articles"
    else:
        content = src
        category = "notes"

    return content, category


def _save_raw(content: str, category: str, slug: str) -> Path:
    today = date.today().isoformat()
    path = raw_dir(category) / f"{today}-{slug}.md"
    if not path.exists():
        path.write_text(content, encoding="utf-8")
    return path


def _is_existing_raw_path(source: str) -> bool:
    try:
        src = Path(source).resolve()
        raw_root = raw_dir().resolve()
        return src.exists() and raw_root in src.parents
    except Exception:
        return False


def _raw_path(category: str, slug: str) -> Path:
    today = date.today().isoformat()
    return raw_dir(category) / f"{today}-{slug}.md"


def _read_schema() -> str:
    p = personal_wiki_dir() / "SCHEMA.md"
    return p.read_text(encoding="utf-8") if p.exists() else ""


def _read_index() -> str:
    p = personal_wiki_dir() / "INDEX.md"
    return p.read_text(encoding="utf-8") if p.exists() else "# Personal Wiki Index\n(empty)"


def _extract_index_pages(index: str) -> list[dict]:
    """Return pages listed in INDEX.md as {topic, stem, title, line}."""
    pages = []
    current_topic = None
    for line in index.splitlines():
        if line.startswith("## "):
            current_topic = line.replace("## ", "", 1).strip()
            continue
        m = re.search(r"\[\[([^\]]+)\]\]\s*—\s*([^|]+)", line)
        if m and current_topic and current_topic != "Hygiene Queue":
            pages.append({
                "topic": current_topic,
                "stem": m.group(1).strip(),
                "title": m.group(2).strip(),
                "line": line.strip(),
            })
    return pages


def _candidate_pages_context(index: str, source_text: str = "", limit: int = 6) -> str:
    """Small existing-page context to help the LLM update instead of duplicate."""
    wiki = personal_wiki_dir()
    chunks = []
    source_words = set(re.findall(r"[a-zA-Z][a-zA-Z0-9-]{3,}", source_text.lower()))
    pages = _extract_index_pages(index)
    if source_words:
        def score(page: dict) -> int:
            hay = f"{page['stem']} {page['title']}".lower()
            return sum(1 for w in source_words if w in hay)
        pages = sorted(pages, key=score, reverse=True)

    for page in pages[:limit]:
        matches = list(wiki.rglob(f"{page['stem']}.md"))
        snippet = ""
        if matches:
            text = matches[0].read_text(encoding="utf-8", errors="replace")
            snippet = text[:500]
        chunks.append(
            f"=== {page['topic']}/{page['stem']}.md ===\n"
            f"INDEX: {page['line']}\n"
            f"SNIPPET:\n{snippet}"
        )
    return "\n\n".join(chunks)


def _update_index(topic: str, filename: str, title: str, tags: list[str]):
    index_path = personal_wiki_dir() / "INDEX.md"
    content = index_path.read_text(encoding="utf-8")
    stem = filename.replace(".md", "")
    tag_str = ", ".join(tags) if tags else ""
    new_line = f"- [[{stem}]] — {title} | tags: {tag_str}"

    lines = content.splitlines()
    out = []
    current_topic = None
    inserted = False
    replaced = False
    topic_seen = False

    for line in lines:
        if line.startswith("## "):
            if current_topic == topic and not inserted and not replaced:
                out.append(new_line)
                inserted = True
            current_topic = line.replace("## ", "", 1).strip()
            if current_topic == topic:
                topic_seen = True
            out.append(line)
            continue

        is_index_entry = line.startswith("- [[") and current_topic != "Hygiene Queue"
        if is_index_entry and re.search(rf"\[\[{re.escape(stem)}\]\]", line):
            if current_topic == topic and not replaced:
                out.append(new_line)
                replaced = True
                inserted = True
            continue

        out.append(line)

    if current_topic == topic and not inserted and not replaced:
        out.append(new_line)
        inserted = True

    if not topic_seen:
        out.extend(["", f"## {topic}", new_line])

    content = "\n".join(out).rstrip() + "\n"

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    content = re.sub(r"\*Updated:.*?\*", f"*Updated: {now}*", content)
    if "*Updated:" not in content:
        content = content.replace("# Personal Wiki Index", f"# Personal Wiki Index\n*Updated: {now}*")

    index_path.write_text(content, encoding="utf-8")


def _update_log(source: str, page_path: str, topic: str, action: str = "create"):
    log_path = personal_wiki_dir() / "log.md"
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    safe_source = source.replace("|", "\\|").replace("\n", " ")
    entry = f"| {now} | {safe_source} | {page_path} | {topic} | {action} |\n"
    current = log_path.read_text(encoding="utf-8")
    log_path.write_text(current + entry, encoding="utf-8")


def _backup_page(page_path: Path) -> Path:
    backup_root = personal_wiki_dir().parent / "backups" / "personal-wiki"
    rel = page_path.relative_to(personal_wiki_dir())
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = backup_root / rel.parent / f"{page_path.stem}.{stamp}.md"
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    backup_path.write_text(page_path.read_text(encoding="utf-8"), encoding="utf-8")
    return backup_path


def _strip_json(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    if not raw.startswith("{"):
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start:end + 1]
    return raw


def _add_backlinks(backlink_pages: list[str], new_page_stem: str, new_page_title: str):
    """Add [[new_page]] to See also section of existing pages."""
    wiki = personal_wiki_dir()
    for page_name in backlink_pages:
        page_name = page_name.replace(".md", "")
        matches = list(wiki.rglob(f"{page_name}.md"))
        if not matches:
            continue
        page_path = matches[0]
        content = page_path.read_text(encoding="utf-8")
        link = f"[[{new_page_stem}]]"
        if link not in content:
            if "## See also" in content:
                content = content.replace("## See also", f"## See also\n- {link} — {new_page_title}")
            else:
                content += f"\n## See also\n- {link} — {new_page_title}\n"
            page_path.write_text(content, encoding="utf-8")


def run_ingest(source: str, verbose: bool = True, dry_run: bool = False) -> dict:
    """
    Main ingest entry point.
    Returns: {status, action, page_path, topic, filename, dry_run}
    """
    if verbose:
        print(f"[ingest] Source: {source[:80]}")

    # Step 1-2: detect type + save raw
    content, category = _detect_type(source)
    if content.startswith("[markitdown]"):
        print(f"[ingest] Warning: {content}")

    slug = _slugify(Path(source).stem if Path(source).exists() else source.split("/")[-1].split("?")[0])
    if _is_existing_raw_path(source):
        raw_path = Path(source).resolve()
        raw_status = "existing"
    else:
        raw_path = _raw_path(category, slug) if dry_run else _save_raw(content[:8000], category, slug)
        raw_status = "planned" if dry_run else "saved"
    if verbose:
        if raw_status == "existing":
            print(f"[ingest] Using existing raw: {raw_path.name}")
        elif dry_run:
            print(f"[ingest] Dry run: raw would be saved as {raw_path.name}")
        else:
            print(f"[ingest] Raw saved: {raw_path.name}")

    # Step 3-4: read schema + index
    schema = _read_schema()
    index = _read_index()
    candidates = _candidate_pages_context(index, source_text=content)

    # Step 5: LLM call
    from wiki_ops.skill_manager import get_skills_context
    from wiki_ops.context_compressor import compress_source
    skills_context = get_skills_context(f"ingest {category} {source[:80]}")

    source_for_llm, was_compressed = compress_source(content, category)
    if verbose and was_compressed:
        print(f"[ingest] Compressed: {len(content)} → {len(source_for_llm)} chars")

    prompt = (
        "You are a personal knowledge librarian. "
        "Compile sources into a concept-first Obsidian wiki. "
        "Prefer updating an existing concept page over creating a duplicate. "
        "Return only one valid JSON object. The first character must be { and the last character must be }. "
        "No markdown fences, no explanation, no prose outside JSON."
        + (f"\n\n{skills_context}" if skills_context else "")
        + f"""

SCHEMA:
{schema}

EXISTING INDEX:
{index}

EXISTING PAGE CANDIDATES (use these to decide create vs update):
{candidates}

SOURCE ({len(content)} chars{' — compressed' if was_compressed else ''}):
{source_for_llm}

Task:
1. Decide whether this source updates an existing concept page or creates a distinct new concept page.
2. Prefer "update" if the source overlaps an existing page in the index.
3. Use "create" only when no existing page can naturally absorb the source.
4. Return the FULL final markdown page content, not a patch.
5. Follow SCHEMA exactly, including Why It Matters, Application To OPUS ANIMUS, Open Questions, Applied, See Also, and Sources where relevant.

Return ONLY valid JSON, no markdown fences. Your entire response must be parseable by json.loads:
{{
  "action": "create",
  "topic": "AI",
  "filename": "kebab-case-name.md",
  "title": "Human Readable Title",
  "tags": ["tag1", "tag2"],
  "content": "---\\ntitle: \\"Title\\"\\naliases: []\\ntopic: AI\\ntags: [tag1, tag2]\\nstatus: seed\\nconfidence: medium\\nsources: [\\"{raw_path.as_posix()}\\"]\\nrelated: []\\napplied: []\\nopen_questions: []\\ncreated: {date.today().isoformat()}\\nupdated: {date.today().isoformat()}\\n---\\n\\n# Title\\n\\n## Summary\\n...\\n\\n## Key Points\\n- ...\\n\\n## Why It Matters\\n...\\n\\n## Details\\n...\\n\\n## Application To OPUS ANIMUS\\n...\\n\\n## Open Questions\\n- ...\\n\\n## Applied\\n\\n## See Also\\n- [[related-page]]\\n\\n## Sources\\n- {raw_path.as_posix()}\\n- {source[:100]}\\n",
  "backlink_pages": ["existing-page-that-should-link-here.md"]
}}"""
    )

    try:
        result = claude_cli_json(prompt, timeout=180, expect="object")
    except json.JSONDecodeError as e:
        print(f"[ingest] JSON parse error: {e}")
        return {"status": "error", "error": str(e)}
    except Exception as e:
        print(f"[ingest] LLM error: {e}")
        return {"status": "error", "error": str(e)}

    # Step 5: save wiki page
    action = result.get("action", "create")
    if action not in {"create", "update"}:
        action = "create"
    topic = result.get("topic", "Tech")
    filename = result.get("filename", f"{slug}.md")
    if not filename.endswith(".md"):
        filename += ".md"

    backup_path = None
    if action == "update":
        existing = list(personal_wiki_dir().rglob(filename))
        if existing:
            page_path = existing[0]
            topic = page_path.parent.name
            if not dry_run:
                backup_path = _backup_page(page_path)
        else:
            action = "create"
            topic_dir = personal_wiki_dir() / topic
            topic_dir.mkdir(exist_ok=True)
            page_path = topic_dir / filename
    else:
        topic_dir = personal_wiki_dir() / topic
        topic_dir.mkdir(exist_ok=True)
        page_path = topic_dir / filename

    topic_dir = page_path.parent
    topic_dir.mkdir(exist_ok=True)
    if not dry_run:
        page_path.write_text(result["content"], encoding="utf-8")

    if verbose:
        prefix = "[ingest] Dry run: would" if dry_run else "[ingest] Wiki page"
        print(f"{prefix} {action}: {topic}/{filename}")
        if backup_path:
            print(f"[ingest] Backup saved: {backup_path}")

    # Step 6-7: update INDEX + log
    if not dry_run:
        _update_index(topic, filename, result.get("title", filename), result.get("tags", []))
        _update_log(source, f"{topic}/{filename}", topic, action=action)

    # Backlinks
    if not dry_run and result.get("backlink_pages"):
        _add_backlinks(result["backlink_pages"], filename.replace(".md", ""), result.get("title", ""))

    return {
        "status": "ok",
        "action": action,
        "dry_run": dry_run,
        "page_path": f"{topic}/{filename}",
        "topic": topic,
        "filename": filename,
        "backup_path": str(backup_path) if backup_path else None,
    }


def _processed_path() -> Path:
    return personal_wiki_dir() / "processed.txt"


def _load_processed() -> set[str]:
    p = _processed_path()
    if not p.exists():
        return set()
    return set(p.read_text(encoding="utf-8").splitlines())


def _mark_processed(filename: str):
    p = _processed_path()
    with p.open("a", encoding="utf-8") as f:
        f.write(filename + "\n")


def ingest_batch(limit: int = 15) -> dict:
    """
    Scan raw/articles/ → ingest files not yet processed.
    Dedup tracked in personal-wiki/processed.txt (one filename per line).
    Returns: {"ingested": int, "skipped": int, "errors": int}
    """
    processed = _load_processed()
    results = {"ingested": 0, "skipped": 0, "errors": 0}

    candidates = sorted(raw_dir("articles").glob("*.md"), key=lambda f: f.stat().st_mtime)
    for f in candidates:
        if results["ingested"] >= limit:
            break
        if f.name in processed:
            results["skipped"] += 1
            continue
        r = run_ingest(str(f), verbose=False)
        if r.get("status") == "ok":
            _mark_processed(f.name)
            results["ingested"] += 1
            print(f"[batch] ingested: {r['page_path']}")
        else:
            results["errors"] += 1
            print(f"[batch] error on {f.name}: {r.get('error', '?')}")

    print(f"[batch] done — {results}")
    return results


def ingest_new_raw(since: datetime):
    """Ingest raw/research/ files created after `since`. Used by Module A hook."""
    processed = _load_processed()
    new_files = [
        f for f in raw_dir("research").glob("*.md")
        if datetime.fromtimestamp(f.stat().st_mtime) >= since
        and f.name not in processed
    ]

    if not new_files:
        print("[ingest] No new research files to ingest.")
        return

    print(f"[ingest] Ingesting {len(new_files)} research file(s)...")
    for f in sorted(new_files):
        r = run_ingest(str(f), verbose=True)
        if r.get("status") == "ok":
            _mark_processed(f.name)
