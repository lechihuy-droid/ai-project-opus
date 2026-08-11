from __future__ import annotations

import importlib
import shutil
from pathlib import Path

import config


def test_codex_provider_cmd_resolves_via_path_when_binary_is_found(monkeypatch) -> None:
    """PROVIDERS["codex"]["cmd"] should prefer whatever `codex` resolves to on
    PATH (so it works on Linux/macOS, not just the hardcoded Windows AppData
    layout)."""
    monkeypatch.setattr(shutil, "which", lambda name: "/usr/local/bin/codex" if name == "codex" else None)
    importlib.reload(config)
    try:
        assert config.PROVIDERS["codex"]["cmd"] == ["/usr/local/bin/codex"]
    finally:
        importlib.reload(config)


def test_codex_provider_cmd_falls_back_to_windows_appdata_path_when_not_on_path(monkeypatch) -> None:
    """When `codex` isn't found on PATH (e.g. this Linux container), fall
    back to the historical Windows AppData path instead of raising."""
    monkeypatch.setattr(shutil, "which", lambda name: None)
    importlib.reload(config)
    try:
        expected = str(Path.home() / "AppData" / "Local" / "pnpm" / "codex")
        assert config.PROVIDERS["codex"]["cmd"] == [expected]
    finally:
        importlib.reload(config)
