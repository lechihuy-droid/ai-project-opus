from __future__ import annotations

import os
from pathlib import Path

import pytest

import config
from services import fsbrowse


def test_list_dirs_lists_directories_in_name_order(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(config, "FS_BROWSE_ROOTS", (tmp_path,))
    (tmp_path / "zulu").mkdir()
    (tmp_path / "Alpha").mkdir()
    (tmp_path / "file.txt").write_text("not a directory")

    result = fsbrowse.list_dirs(str(tmp_path))

    assert result["path"] == str(tmp_path.resolve())
    assert [entry["name"] for entry in result["entries"]] == ["Alpha", "zulu"]


def test_list_dirs_omits_ignored_and_hidden_directories(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(config, "FS_BROWSE_ROOTS", (tmp_path,))
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
    monkeypatch.setattr(config, "FS_BROWSE_ROOTS", (tmp_path,))
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


def test_resolve_workspace_dir_rejects_file(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(config, "FS_BROWSE_ROOTS", (tmp_path,))
    file_path = tmp_path / "file.txt"
    file_path.write_text("content")

    with pytest.raises(ValueError, match="not a directory"):
        fsbrowse.resolve_workspace_dir(str(file_path))


def test_list_dirs_rejects_path_outside_configured_roots() -> None:
    with pytest.raises(PermissionError):
        fsbrowse.list_dirs("/")


def test_list_dirs_allows_workspace_root() -> None:
    result = fsbrowse.list_dirs(str(config.ROOT))

    assert result["path"] == str(config.ROOT.resolve())


def test_resolve_workspace_dir_denial_is_audited(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    records: list[dict[str, object]] = []
    monkeypatch.setattr(config, "FS_BROWSE_ROOTS", (tmp_path / "allowed",))
    monkeypatch.setattr(fsbrowse.audit, "append", lambda action, **kwargs: records.append({"action": action, **kwargs}))
    outside = tmp_path / "outside"
    outside.mkdir()

    with pytest.raises(ValueError):
        fsbrowse.resolve_workspace_dir(str(outside))

    assert len(records) == 1
    assert records[0]["action"] == "fsbrowse.denied"


def test_resolve_workspace_dir_external_override_is_audited_once(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path,
) -> None:
    records: list[dict[str, object]] = []
    monkeypatch.setattr(config, "FS_BROWSE_ROOTS", (tmp_path / "allowed",))
    monkeypatch.setattr(fsbrowse.audit, "append", lambda action, **kwargs: records.append({"action": action, **kwargs}))
    outside = tmp_path / "outside"
    outside.mkdir()

    resolved = fsbrowse.resolve_workspace_dir(str(outside), allow_external=True)

    assert resolved == outside.resolve()
    assert len(records) == 1
    assert records[0]["action"] == "fsbrowse.external_override"
