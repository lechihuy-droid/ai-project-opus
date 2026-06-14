from __future__ import annotations

import sqlite3
import sys
from datetime import datetime
from pathlib import Path
import re

from .sources import PROJECT_ROOT


SECTION_RE = re.compile(r"^## (.+)$", re.MULTILINE)
DB_PATH = PROJECT_ROOT / "memory" / "recall.db"
DISPLAY_ROOT = PROJECT_ROOT.parent


def parse_sections(text: str) -> list[tuple[str, str]]:
    if text == "":
        return []

    matches = list(SECTION_RE.finditer(text))
    if not matches:
        return [("", text)]

    sections: list[tuple[str, str]] = []
    first = matches[0]
    if first.start() > 0:
        sections.append(("", text[: first.start()].rstrip("\n")))

    for index, match in enumerate(matches):
        next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        heading = match.group(1).strip()
        body = text[match.end() : next_start].strip("\n")
        sections.append((heading, body))

    return sections


def _display_path(path: Path) -> str:
    try:
        return path.resolve().relative_to(DISPLAY_ROOT).as_posix()
    except ValueError:
        return path.resolve().as_posix()


def _mtime_date(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()


def build_index(db_path: Path | str = DB_PATH, sources: list[tuple[Path, str]] | None = None) -> dict[str, int]:
    if sources is None:
        from .sources import iter_sources

        sources = iter_sources()

    db = Path(db_path)
    db.parent.mkdir(parents=True, exist_ok=True)

    try:
        conn = sqlite3.connect(db)
        conn.execute("DROP TABLE IF EXISTS memory")
        conn.execute(
            """
            CREATE VIRTUAL TABLE memory USING fts5(
                path,
                section,
                body,
                kind UNINDEXED,
                mtime UNINDEXED,
                tokenize = "unicode61 remove_diacritics 2"
            )
            """
        )
    except sqlite3.OperationalError as exc:
        raise RuntimeError("SQLite build thieu FTS5 hoac tokenizer unicode61 remove_diacritics 2") from exc

    files = 0
    sections = 0
    skipped = 0

    with conn:
        for path, kind in sources:
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError as exc:
                skipped += 1
                print(f"warning: skip {path}: {exc}", file=sys.stderr)
                continue

            files += 1
            mtime = _mtime_date(path)
            display_path = _display_path(path)
            parsed = parse_sections(text)
            for heading, body in parsed:
                conn.execute(
                    "INSERT INTO memory(path, section, body, kind, mtime) VALUES (?, ?, ?, ?, ?)",
                    (display_path, heading, body, kind, mtime),
                )
                sections += 1

    conn.close()
    return {"files": files, "sections": sections, "skipped": skipped}
