from __future__ import annotations

import shutil
from pathlib import Path

import pytest

import config
from services import fsbrowse


@pytest.fixture()
def audit_log(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    store = tmp_path / "store"
    monkeypatch.setattr(config, "RUNTIME_STORE_DIR", store)
    return store / "security_audit.jsonl"


def _entry_count(path: Path) -> int:
    if not path.is_file():
        return 0
    return len([line for line in path.read_text(encoding="utf-8").splitlines() if line])


@pytest.fixture()
def inside_root_dir() -> Path:
    workspace = config.ROOT / "_test_workspace_inside_root"
    workspace.mkdir(exist_ok=True)
    try:
        yield workspace
    finally:
        shutil.rmtree(workspace, ignore_errors=True)


def test_resolve_workspace_dir_inside_root_writes_no_audit_entry(
    audit_log: Path, inside_root_dir: Path,
) -> None:
    assert fsbrowse.is_inside_root(inside_root_dir)

    result = fsbrowse.resolve_workspace_dir(str(inside_root_dir))

    assert result == inside_root_dir.resolve()
    assert _entry_count(audit_log) == 0


def test_resolve_workspace_dir_outside_root_writes_one_audit_entry(
    audit_log: Path, tmp_path: Path,
) -> None:
    assert not fsbrowse.is_inside_root(tmp_path)

    result = fsbrowse.resolve_workspace_dir(str(tmp_path))

    assert result == tmp_path.resolve()
    entries = [line for line in audit_log.read_text(encoding="utf-8").splitlines() if line]
    assert len(entries) == 1
    assert "workspace_dir_outside_root" in entries[0]
    assert str(tmp_path.resolve()) in entries[0]
