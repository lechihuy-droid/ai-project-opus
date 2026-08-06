from __future__ import annotations

import os
from pathlib import Path

import pytest

from services import fsbrowse


def test_list_dirs_lists_directories_in_name_order(tmp_path: Path) -> None:
    (tmp_path / "zulu").mkdir()
    (tmp_path / "Alpha").mkdir()
    (tmp_path / "file.txt").write_text("not a directory")

    result = fsbrowse.list_dirs(str(tmp_path))

    assert result["path"] == str(tmp_path.resolve())
    assert [entry["name"] for entry in result["entries"]] == ["Alpha", "zulu"]


def test_list_dirs_omits_ignored_and_hidden_directories(tmp_path: Path) -> None:
    (tmp_path / "visible").mkdir()
    (tmp_path / "node_modules").mkdir()
    (tmp_path / ".hidden").mkdir()

    result = fsbrowse.list_dirs(str(tmp_path))

    assert [entry["name"] for entry in result["entries"]] == ["visible"]


def test_is_denied_blocks_descendants(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    denied = (tmp_path / "denied").resolve()
    (denied / "child").mkdir(parents=True)
    monkeypatch.setattr(fsbrowse, "DENIED_ROOTS", (denied,))

    assert fsbrowse.is_denied(denied / "child")


def test_resolve_workspace_dir_blocks_symlink_into_denied_root(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path,
) -> None:
    denied = (tmp_path / "denied").resolve()
    denied.mkdir()
    linked = tmp_path / "linked"
    try:
        os.symlink(denied, linked, target_is_directory=True)
    except OSError as exc:
        pytest.skip(f"symlink unavailable: {exc}")
    monkeypatch.setattr(fsbrowse, "DENIED_ROOTS", (denied,))

    with pytest.raises(ValueError, match="denied"):
        fsbrowse.resolve_workspace_dir(str(linked))


def test_resolve_workspace_dir_none_returns_none() -> None:
    assert fsbrowse.resolve_workspace_dir(None) is None


def test_resolve_workspace_dir_rejects_file(tmp_path: Path) -> None:
    file_path = tmp_path / "file.txt"
    file_path.write_text("content")

    with pytest.raises(ValueError, match="not a directory"):
        fsbrowse.resolve_workspace_dir(str(file_path))
