from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

from memory.indexer import DB_PATH, build_index
from memory.search import search
from memory.sources import iter_sources

APP_ROOT = Path(__file__).resolve().parent


def _configure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Index and search Opus cross-session memory with SQLite FTS5."
    )
    parser.add_argument("query", nargs="*", help='query text, or "index" to rebuild memory/recall.db')
    parser.add_argument("--json", action="store_true", help="emit JSON results")
    parser.add_argument("--limit", type=int, default=8, help="maximum results to return")
    parser.add_argument(
        "--kind",
        choices=("session", "handoff", "status", "wiki-index"),
        help="filter by source kind",
    )
    return parser


def _format_text(results: list[dict[str, object]]) -> str:
    lines: list[str] = []
    for index, item in enumerate(results, 1):
        section = str(item["section"])
        section_label = f" § {section}" if section else ""
        lines.append(f"{index}. [{item['path']}{section_label}] ({item['mtime']})")
        lines.append(f"   {item['snippet']}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    _configure_stdio()
    parser = _parser()
    args = parser.parse_args(argv)

    if not args.query or not " ".join(args.query).strip():
        parser.print_usage(sys.stderr)
        return 2

    if args.query[0] == "index":
        start = time.perf_counter()
        stats = build_index(DB_PATH, iter_sources())
        elapsed = time.perf_counter() - start
        db_label = DB_PATH.relative_to(APP_ROOT)
        print(
            f"Indexed {stats['files']} files, {stats['sections']} sections"
            f" -> {db_label.as_posix()} ({elapsed:.1f}s)"
        )
        if stats["skipped"]:
            print(f"Skipped {stats['skipped']} files", file=sys.stderr)
        return 0

    query = " ".join(args.query)
    try:
        results = search(DB_PATH, query, limit=args.limit, kind=args.kind)
    except ValueError:
        parser.print_usage(sys.stderr)
        return 2
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(results, ensure_ascii=False))
        return 0

    if not results:
        print("Khong tim thay ky uc khop. Thu tu khoa khac hoac chay `index` neu vua them session.")
        return 0

    print(_format_text(results))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
