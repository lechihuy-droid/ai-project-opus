from __future__ import annotations

import sqlite3
from pathlib import Path

from .indexer import DB_PATH


SPECIAL_CHARS = {'"', "(", ")", "*", ":"}


def _phrase(query: str) -> str:
    return '"' + query.replace('"', '""') + '"'


def _sanitize(query: str) -> str:
    stripped = query.strip()
    if any(char in stripped for char in SPECIAL_CHARS):
        return _phrase(stripped)
    return stripped


def search(
    db_path: Path | str = DB_PATH,
    query: str = "",
    limit: int = 8,
    kind: str | None = None,
) -> list[dict[str, object]]:
    clean_query = query.strip()
    if clean_query == "":
        raise ValueError("query must not be empty")

    db = Path(db_path)
    if not db.exists():
        raise FileNotFoundError(f"{db} not found; run `python run_recall.py index` first")

    match_query = _sanitize(clean_query)
    return _search_once(db, match_query, limit, kind, fallback_query=clean_query)


def _search_once(
    db: Path,
    match_query: str,
    limit: int,
    kind: str | None,
    fallback_query: str,
) -> list[dict[str, object]]:
    params: list[object] = [match_query]
    kind_clause = ""
    if kind is not None:
        kind_clause = " AND kind = ?"
        params.append(kind)
    params.append(limit)

    # Ranking = bm25 (âm hơn = liên quan hơn) cộng một boost cố định cho kind
    # 'status': khi mở session, "trạng thái hiện tại" thường là ký ức relevant
    # nhất nên được ưu tiên nhẹ. Hằng -1.0 đủ để status nhỉnh khi điểm bm25 sát
    # nhau, nhưng KHÔNG đè được một section khác khớp rõ ràng hơn (chênh > 1.0).
    sql = f"""
        SELECT
            path,
            section,
            kind,
            mtime,
            snippet(memory, 2, '[', ']', '...', 12) AS snippet,
            bm25(memory) AS rank
        FROM memory
        WHERE memory MATCH ?{kind_clause}
        ORDER BY rank + CASE kind WHEN 'status' THEN -1.0 ELSE 0 END
        LIMIT ?
    """

    try:
        with sqlite3.connect(db) as conn:
            rows = conn.execute(sql, params).fetchall()
    except sqlite3.OperationalError as exc:
        phrase_query = _phrase(fallback_query)
        if match_query == phrase_query:
            raise RuntimeError(f"FTS5 query failed: {exc}") from exc
        return _search_once(db, phrase_query, limit, kind, fallback_query)

    return [
        {
            "path": row[0],
            "section": row[1],
            "kind": row[2],
            "mtime": row[3],
            "snippet": row[4],
            "rank": row[5],
        }
        for row in rows
    ]
