from __future__ import annotations

import ctypes
import os
from pathlib import Path

import config
from services import audit


_USER_PROFILE = Path(os.environ.get("USERPROFILE", Path.home())).resolve()
# Secondary defense-in-depth only; FS_BROWSE_ROOTS is the load-bearing allowlist.
DENIED_ROOTS: tuple[Path, ...] = tuple(
    path.resolve()
    for path in (
        Path("C:/Windows"),
        Path("C:/Program Files"),
        Path("C:/Program Files (x86)"),
        Path("C:/ProgramData"),
        _USER_PROFILE / ".ssh",
        _USER_PROFILE / ".aws",
        _USER_PROFILE / ".gnupg",
        _USER_PROFILE / ".azure",
        _USER_PROFILE / ".kube",
    )
)
IGNORED_DIR_NAMES = frozenset({
    ".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".pnpm-store",
})


def _inside(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def is_denied(path: Path) -> bool:
    resolved = path.resolve()
    return any(_inside(resolved, root) for root in DENIED_ROOTS)


def _is_inside_browse_root(path: Path) -> bool:
    resolved = path.resolve()
    return any(_inside(resolved, Path(root).resolve()) for root in config.FS_BROWSE_ROOTS)


def list_drives() -> list[str]:
    if os.name != "nt":
        return ["/"]
    bitmask = ctypes.windll.kernel32.GetLogicalDrives()
    return [f"{chr(ord('A') + index)}:" for index in range(26) if bitmask & (1 << index)]


def list_dirs(path: str | None, *, show_hidden: bool = False) -> dict[str, object]:
    if path is None:
        # The top of the tree is the configured roots, not the machine's drives.
        # Listing drives here would offer C:\ and D:\ and then refuse every one
        # of them below, since nothing outside FS_BROWSE_ROOTS can be opened.
        roots = [Path(root).resolve() for root in config.FS_BROWSE_ROOTS]
        return {
            "path": None,
            "parent": None,
            "entries": [{"name": root.name or str(root), "path": str(root)} for root in roots],
        }

    resolved = Path(path).resolve()
    if not _is_inside_browse_root(resolved):
        raise PermissionError(f"Path is outside configured browse roots: {resolved}")
    if is_denied(resolved):
        raise PermissionError(f"Path is denied: {resolved}")
    if not resolved.exists():
        raise ValueError(f"Path does not exist: {resolved}")
    if not resolved.is_dir():
        raise ValueError(f"Path is not a directory: {resolved}")

    entries: list[dict[str, str]] = []
    try:
        children = list(resolved.iterdir())
    except PermissionError:
        raise PermissionError(f"Cannot read directory: {resolved}") from None
    for child in children:
        try:
            if not child.is_dir() or is_denied(child):
                continue
        except PermissionError:
            continue
        if child.name in IGNORED_DIR_NAMES or (not show_hidden and child.name.startswith(".")):
            continue
        entries.append({"name": child.name, "path": str(child.resolve())})
    entries.sort(key=lambda entry: entry["name"].lower())

    parent = None if resolved.parent == resolved else str(resolved.parent)
    return {"path": str(resolved), "parent": parent, "entries": entries, "inside_root": is_inside_root(resolved)}


def is_inside_root(path: Path) -> bool:
    """Whether a directory sits inside the project workspace.

    The picker warns before a run is scoped outside it — the client cannot
    work this out on its own without hardcoding a server path.
    """
    return _is_inside_browse_root(path)


def resolve_workspace_dir(value: object, *, allow_external: bool = False) -> Path | None:
    if value is None or value == "":
        return None
    if not isinstance(value, str):
        raise ValueError("Workspace directory must be a path string")

    path = Path(value).resolve()
    if not _is_inside_browse_root(path):
        if not allow_external:
            audit.append("fsbrowse.denied", context={"path": str(path), "reason": "outside_configured_root"})
            raise ValueError(f"Workspace directory is outside configured browse roots: {path}")
        audit.append("fsbrowse.external_override", context={"path": str(path)})
    if not path.exists():
        raise ValueError(f"Workspace directory does not exist: {path}")
    if not path.is_dir():
        raise ValueError(f"Workspace directory is not a directory: {path}")
    if is_denied(path):
        raise ValueError(f"Workspace directory is denied: {path}")
    if path.parent == path:
        raise ValueError("Workspace directory cannot be a drive root")
    if path == _USER_PROFILE:
        raise ValueError("Workspace directory cannot be the user profile root")
    return path
