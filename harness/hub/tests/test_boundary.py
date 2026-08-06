from __future__ import annotations

from pathlib import Path

import pytest

import config
from services.boundary import resolve_in_root, resolve_under_any


def test_resolve_in_root_allows_paths_inside_root() -> None:
    resolved = resolve_in_root("harness")
    assert resolved == (config.ROOT / "harness").resolve()


def test_resolve_in_root_rejects_traversal_outside_root() -> None:
    with pytest.raises(PermissionError):
        resolve_in_root(Path("..") / ".." / "windows")


def test_resolve_under_any_allows_only_listed_roots(tmp_path: Path) -> None:
    first_root = tmp_path / "first"
    second_root = tmp_path / "second"
    outside = tmp_path / "outside"
    for directory in (first_root, second_root, outside):
        directory.mkdir()
    target = second_root / "file.txt"
    target.write_text("content")

    assert resolve_under_any(target, [first_root, second_root]) == target.resolve()
    with pytest.raises(PermissionError):
        resolve_under_any(outside, [first_root, second_root])
    with pytest.raises(PermissionError):
        resolve_under_any(target, [])
    with pytest.raises(PermissionError):
        resolve_under_any(first_root / ".." / "outside", [first_root])


def test_resolve_under_any_reads_relative_paths_against_root_not_cwd(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # run-hub.ps1 launches the server without pinning a cwd, and agent
    # profiles author allowed_paths as repo-relative strings, so resolution
    # must not follow os.getcwd().
    monkeypatch.chdir(tmp_path)

    assert resolve_under_any("harness", [config.ROOT]) == (config.ROOT / "harness").resolve()
    assert resolve_under_any("harness/hub", ["harness"]) == (config.ROOT / "harness" / "hub").resolve()
