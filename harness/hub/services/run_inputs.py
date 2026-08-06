from __future__ import annotations

from pathlib import Path
from typing import Any

from services import chat_files, fsbrowse, runtime_artifacts


_FOLDER_MAX_DEPTH = 3
_FOLDER_MAX_FILES = 50


def _reference(item: dict[str, Any]) -> dict[str, str]:
    kind = item.get("kind")
    if kind == "artifact":
        artifact_id = item.get("id")
        if not isinstance(artifact_id, str) or not artifact_id:
            raise ValueError("artifact input requires a non-empty id")
        return {"kind": "artifact", "id": artifact_id}
    if kind == "chat_file":
        chat_id, name = item.get("chat_id"), item.get("name")
        if not isinstance(chat_id, str) or not chat_id or not isinstance(name, str) or not name:
            raise ValueError("chat_file input requires chat_id and name")
        return {"kind": "chat_file", "chat_id": chat_id, "name": name}
    if kind == "folder":
        path = fsbrowse.resolve_workspace_dir(item.get("path"))
        if path is None:
            raise ValueError("folder input requires a path")
        return {"kind": "folder", "path": str(path)}
    raise ValueError(f"Unsupported input kind: {kind!r}")


def _folder_files(root: Path) -> tuple[list[Path], bool]:
    files: list[Path] = []

    def visit(directory: Path, depth: int) -> bool:
        try:
            children = sorted(directory.iterdir(), key=lambda path: path.name.lower())
        except PermissionError:
            return False
        for path in children:
            try:
                resolved = path.resolve()
                if fsbrowse.is_denied(resolved) or not resolved.is_relative_to(root):
                    continue
                if resolved.is_file():
                    if len(files) >= _FOLDER_MAX_FILES:
                        return True
                    files.append(resolved)
                elif resolved.is_dir() and depth < _FOLDER_MAX_DEPTH and path.name not in fsbrowse.IGNORED_DIR_NAMES and not path.name.startswith("."):
                    if visit(resolved, depth + 1):
                        return True
            except (OSError, PermissionError):
                continue
        return False

    return files, visit(root, 0)


def resolve_inputs(value: object) -> tuple[list[dict[str, str]], str]:
    """Validate input references and assemble their bounded, auditable prompt block."""
    if value is None:
        return [], ""
    if not isinstance(value, list):
        raise ValueError("inputs must be an array")

    references: list[dict[str, str]] = []
    parts: list[str] = []
    remaining = chat_files.CHAT_FILE_CONTEXT_MAX_CHARS
    truncated = False
    for raw in value:
        if not isinstance(raw, dict):
            raise ValueError("each input must be an object")
        reference = _reference(raw)
        references.append(reference)
        if reference["kind"] == "artifact":
            artifact_id = reference["id"]
            try:
                artifact = runtime_artifacts.read_library_artifact(artifact_id)
            except FileNotFoundError as exc:
                raise ValueError(f"Input artifact not found: {artifact_id}") from exc
            versions = artifact.get("versions")
            if not isinstance(versions, list) or not versions or not isinstance(versions[-1], dict):
                raise ValueError(f"Input artifact has no readable content: {artifact_id}")
            content = versions[-1].get("content")
            if not isinstance(content, str):
                raise ValueError(f"Input artifact has no readable content: {artifact_id}")
            title = str(artifact.get("title") or artifact_id)
            label = f'[Input: artifact "{title}"]'
        elif reference["kind"] == "chat_file":
            chat_id, name = reference["chat_id"], reference["name"]
            try:
                path = chat_files.download(chat_id, name)
            except (FileNotFoundError, PermissionError) as exc:
                raise ValueError(f"Input file not found: {chat_id}/{name}") from exc
            label = f"[Input: file {name}]"
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                parts.append(f"{label}\n[Binary content is not included in the prompt]")
                continue

        else:
            folder = Path(reference["path"])
            parts.append(f"[Input: folder {folder}]")
            files, listing_truncated = _folder_files(folder)
            for path in files:
                if remaining <= 0:
                    truncated = True
                    break
                # Read at most the remaining budget rather than the whole file:
                # the folder is anywhere on disk, so a single large text file
                # would otherwise be loaded into memory just to be sliced away.
                try:
                    with path.open(encoding="utf-8") as handle:
                        excerpt = handle.read(remaining)
                        has_more = bool(handle.read(1))
                except (UnicodeDecodeError, OSError):
                    continue
                parts.append(f"[File: {path.relative_to(folder)}]\n{excerpt}")
                remaining -= len(excerpt)
                truncated = truncated or has_more
            if listing_truncated:
                parts.append(f"[Folder listing truncated at {_FOLDER_MAX_FILES} files]")
            continue

        if remaining <= 0:
            truncated = True
            continue
        excerpt = content[:remaining]
        parts.append(f"{label}\n{excerpt}")
        remaining -= len(excerpt)
        truncated = truncated or len(excerpt) < len(content)

    if truncated:
        parts.append(f"[Input text truncated at {chat_files.CHAT_FILE_CONTEXT_MAX_CHARS} characters]")
    return references, "\n\n".join(parts)
