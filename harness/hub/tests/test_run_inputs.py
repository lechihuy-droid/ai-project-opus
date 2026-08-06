from __future__ import annotations

from pathlib import Path

import pytest

from services import chat_files, fsbrowse, run_inputs


def test_folder_input_empty_and_ignored_directories(tmp_path: Path) -> None:
    folder = tmp_path / "folder"
    folder.mkdir()
    references, block = run_inputs.resolve_inputs([{"kind": "folder", "path": str(folder)}])
    assert references == [{"kind": "folder", "path": str(folder)}]
    assert block == f"[Input: folder {folder}]"

    (folder / "node_modules").mkdir()
    (folder / "node_modules" / "ignored.txt").write_text("no", encoding="utf-8")
    (folder / "shown.txt").write_text("yes", encoding="utf-8")
    _, block = run_inputs.resolve_inputs([{"kind": "folder", "path": str(folder)}])
    assert "shown.txt" in block
    assert "ignored.txt" not in block


def test_folder_input_is_deterministic_skips_binary_and_caps_files(tmp_path: Path) -> None:
    folder = tmp_path / "folder"
    folder.mkdir()
    (folder / "z.txt").write_text("z", encoding="utf-8")
    nested = folder / "nested" / "deep"
    nested.mkdir(parents=True)
    (nested / "a.txt").write_text("a", encoding="utf-8")
    (folder / "binary.bin").write_bytes(b"\xff\xfe")
    for index in range(50):
        (folder / f"file-{index:02}.txt").write_text(str(index), encoding="utf-8")

    _, block = run_inputs.resolve_inputs([{"kind": "folder", "path": str(folder)}])
    assert "[File: binary.bin]" not in block
    assert block.index("[File: file-00.txt]") < block.index("[File: file-01.txt]")
    assert "[Folder listing truncated at 50 files]" in block


def test_folder_input_rejects_denied_path(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    folder = tmp_path / "denied"
    folder.mkdir()
    monkeypatch.setattr(fsbrowse, "DENIED_ROOTS", (folder.resolve(),))

    with pytest.raises(ValueError, match="denied"):
        run_inputs.resolve_inputs([{"kind": "folder", "path": str(folder)}])


def test_folder_input_never_reads_more_than_the_remaining_budget(tmp_path, monkeypatch) -> None:
    # The picked folder can be anywhere on disk, so a single oversized text
    # file must not be pulled into memory just to be truncated afterwards.
    monkeypatch.setattr(chat_files, "CHAT_FILE_CONTEXT_MAX_CHARS", 32)
    big = tmp_path / "big.txt"
    big.write_text("x" * 5000, encoding="utf-8")

    reads: list[int | None] = []
    real_open = Path.open

    def spy_open(self, *args, **kwargs):
        handle = real_open(self, *args, **kwargs)
        original_read = handle.read

        def read(size=-1):
            if self == big.resolve():
                reads.append(size)
            return original_read(size)

        handle.read = read
        return handle

    monkeypatch.setattr(Path, "open", spy_open)
    _, prompt = run_inputs.resolve_inputs([{"kind": "folder", "path": str(tmp_path)}])

    assert reads and reads[0] == 32
    assert "x" * 33 not in prompt
