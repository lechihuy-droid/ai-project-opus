from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

import config


ROOT_RESOLVED = config.ROOT.resolve()


def _inside(path: Path, base: Path) -> bool:
    try:
        path.relative_to(base)
    except ValueError:
        return False
    return True


def resolve_in_root(p: str | Path, base: str | Path = config.ROOT) -> Path:
    base_path = Path(base).resolve()
    if not _inside(base_path, ROOT_RESOLVED):
        raise PermissionError(f"Base path is outside project root: {base_path}")

    candidate = Path(p)
    if not candidate.is_absolute():
        candidate = base_path / candidate
    resolved = candidate.resolve()

    if not _inside(resolved, base_path):
        raise PermissionError(f"Path is outside allowed root: {resolved}")
    return resolved


def resolve_under_any(p: str | Path, roots: Sequence[str | Path], base: str | Path = config.ROOT) -> Path:
    """Resolve p and require it inside at least one root.

    Relative paths — both `p` and any relative entry in `roots` — are taken
    against `base`, never against the process working directory. Agent
    profiles author `allowed_paths` as repo-relative strings (see
    example-scoped-inspector) and `run-hub.ps1` does not pin a cwd, so
    resolving against os.getcwd() would silently point them elsewhere
    depending on where the server was launched from.
    """
    base_path = Path(base).resolve()
    candidate = _against(p, base_path)
    for root in roots:
        root_path = _against(root, base_path)
        if not root_path.exists():
            continue
        if _inside(candidate, root_path):
            return candidate
    raise PermissionError(f"Path is outside allowed roots: {candidate}")


def _against(value: str | Path, base: Path) -> Path:
    path = Path(value)
    return (path if path.is_absolute() else base / path).resolve()


def resolve_relative_to_root(value: str | Path) -> Path:
    """Resolve a possibly-relative path against config.ROOT without requiring containment."""
    return _against(value, ROOT_RESOLVED)
