from __future__ import annotations

import json
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from memory.indexer import DB_PATH, build_index, parse_sections
from memory.search import search
from memory.sources import iter_sources

FIXTURES = Path(__file__).resolve().parent / "_fixtures"
TEST_TMP_ROOT = ROOT / "memory" / "test_tmp"


def _case_dir(name: str) -> Path:
    path = TEST_TMP_ROOT / name
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _fixture_sources() -> list[tuple[Path, str]]:
    return [
        (FIXTURES / "session.md", "session"),
        (FIXTURES / "status.md", "status"),
    ]


def _build_fixture_db(case_name: str, sources: list[tuple[Path, str]] | None = None) -> Path:
    case_dir = _case_dir(case_name)
    db_path = case_dir / "recall.db"
    build_index(db_path, sources or _fixture_sources())
    return db_path


def _row_count(db_path: Path) -> int:
    with sqlite3.connect(db_path) as conn:
        return conn.execute("SELECT count(*) FROM memory").fetchone()[0]


def _run_cli(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(ROOT / "run_recall.py"), *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def test_u1_parse_sections_with_preamble_and_two_sections() -> None:
    sections = parse_sections("# Title\nintro\n## One\nbody 1\n## Two\nbody 2")
    assert len(sections) == 3
    assert [heading for heading, _ in sections] == ["", "One", "Two"]


def test_u2_parse_sections_without_h2() -> None:
    assert parse_sections("# Title\nonly body") == [("", "# Title\nonly body")]


def test_u3_parse_sections_empty() -> None:
    assert parse_sections("") == []


def test_u4_build_index_idempotent() -> None:
    case_dir = _case_dir("u4")
    db_path = case_dir / "recall.db"
    build_index(db_path, _fixture_sources())
    first = _row_count(db_path)
    build_index(db_path, _fixture_sources())
    second = _row_count(db_path)
    assert first == second


def test_u5_search_fixture_top_path() -> None:
    db_path = _build_fixture_db("u5")
    results = search(db_path, "needle")
    assert results
    assert results[0]["path"].endswith("memory/_fixtures/session.md")


def test_u6_search_gibberish_returns_empty() -> None:
    db_path = _build_fixture_db("u6")
    assert search(db_path, "zzzxxyyq") == []


def test_u7_search_vietnamese_without_diacritics() -> None:
    db_path = _build_fixture_db("u7")
    assert search(db_path, "tổng hợp")


def test_u8_search_special_chars_does_not_raise() -> None:
    db_path = _build_fixture_db("u8")
    results = search(db_path, 'special "quote" (paren)')
    assert isinstance(results, list)


def test_u9_build_index_skips_bad_encoding() -> None:
    case_dir = _case_dir("u9")
    good = case_dir / "good.md"
    bad = case_dir / "bad.md"
    shutil.copyfile(FIXTURES / "session.md", good)
    bad.write_bytes(b"\xff\xfe\xfa")
    stats = build_index(case_dir / "recall.db", [(good, "session"), (bad, "session")])
    assert stats["files"] == 1
    assert stats["skipped"] == 1
    assert stats["sections"] > 0


def test_it1_cli_index_then_weekly_synthesis() -> None:
    index = _run_cli("index")
    assert index.returncode == 0, index.stderr
    result = _run_cli("weekly synthesis")
    assert result.returncode == 0, result.stderr
    assert "1. [" in result.stdout


def test_it2_cli_empty_query_usage_exit_2() -> None:
    result = _run_cli("")
    assert result.returncode == 2
    assert "usage:" in result.stderr


def test_it3_cli_json_output_loads() -> None:
    result = _run_cli("wiki", "--json")
    assert result.returncode == 0, result.stderr
    assert isinstance(json.loads(result.stdout), list)


def test_it4_cli_kind_session_filter() -> None:
    result = _run_cli("RVC", "--kind", "session", "--json")
    assert result.returncode == 0, result.stderr
    rows = json.loads(result.stdout)
    assert rows
    assert all(row["kind"] == "session" for row in rows)


def test_it5_reindex_after_session_change_finds_new_content() -> None:
    case_dir = _case_dir("it5")
    session = case_dir / "session.md"
    session.write_text("# Session\n## Notes\nold content\n", encoding="utf-8")
    db_path = case_dir / "recall.db"
    build_index(db_path, [(session, "session")])
    assert search(db_path, "newtoken") == []
    session.write_text("# Session\n## Notes\nold content newtoken\n", encoding="utf-8")
    build_index(db_path, [(session, "session")])
    assert search(db_path, "newtoken")


def test_ec1_missing_source_directory_is_ignored() -> None:
    case_dir = _case_dir("ec1")
    shutil.copyfile(FIXTURES / "status.md", case_dir / "status.md")
    sources = iter_sources(
        (("missing/*.md", "session"), ("status.md", "status")),
        base_dir=case_dir,
    )
    assert len(sources) == 1
    stats = build_index(case_dir / "recall.db", sources)
    assert stats["files"] == 1


def test_ec2_japanese_unicode_query_does_not_crash() -> None:
    db_path = _build_fixture_db("ec2")
    assert isinstance(search(db_path, "九州そら"), list)


def test_ec3_cli_missing_db_suggests_index_exit_1() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    backup = DB_PATH.with_suffix(".db.ec3bak")
    assert not backup.exists()
    had_db = DB_PATH.exists()
    if had_db:
        DB_PATH.replace(backup)
    try:
        result = _run_cli("x")
        assert result.returncode == 1
        assert "run `python run_recall.py index` first" in result.stderr
    finally:
        if backup.exists():
            backup.replace(DB_PATH)


TESTS = [
    test_u1_parse_sections_with_preamble_and_two_sections,
    test_u2_parse_sections_without_h2,
    test_u3_parse_sections_empty,
    test_u4_build_index_idempotent,
    test_u5_search_fixture_top_path,
    test_u6_search_gibberish_returns_empty,
    test_u7_search_vietnamese_without_diacritics,
    test_u8_search_special_chars_does_not_raise,
    test_u9_build_index_skips_bad_encoding,
    test_it1_cli_index_then_weekly_synthesis,
    test_it2_cli_empty_query_usage_exit_2,
    test_it3_cli_json_output_loads,
    test_it4_cli_kind_session_filter,
    test_it5_reindex_after_session_change_finds_new_content,
    test_ec1_missing_source_directory_is_ignored,
    test_ec2_japanese_unicode_query_does_not_crash,
    test_ec3_cli_missing_db_suggests_index_exit_1,
]


def main() -> int:
    for test in TESTS:
        test()
        print(f"PASS {test.__name__}")
    print(f"{len(TESTS)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
