from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import config
from services import boundary, fsbrowse
from services.providers.base import ChatEvent, ToolPolicy


ToolHandler = Callable[[dict[str, object]], object]


@dataclass(frozen=True)
class Tool:
    name: str
    schema: dict[str, object]
    handler: ToolHandler
    path_args: tuple[str, ...] = ("path",)


def _path(value: dict[str, object]) -> Path:
    path = value.get("path")
    if isinstance(path, Path):
        return path
    if not isinstance(path, str) or not path:
        raise ValueError("path must be a non-empty string")
    return Path(path)


def _read_file(value: dict[str, object]) -> str:
    return _path(value).read_text(encoding="utf-8", errors="replace")


def _grep(value: dict[str, object]) -> list[dict[str, object]]:
    query = value.get("query")
    if not isinstance(query, str) or not query:
        raise ValueError("query must be a non-empty string")
    matches: list[dict[str, object]] = []
    for number, line in enumerate(_path(value).read_text(encoding="utf-8", errors="replace").splitlines(), 1):
        if query in line:
            matches.append({"line": number, "text": line})
    return matches


def _list_dir(value: dict[str, object]) -> list[str]:
    return sorted(item.name for item in _path(value).iterdir())


_PATH_SCHEMA = {"type": "string", "description": "Path inside an allowed workspace directory."}
REGISTRY: dict[str, Tool] = {
    "read_file": Tool("read_file", {
        "type": "object", "properties": {"path": _PATH_SCHEMA}, "required": ["path"], "additionalProperties": False,
    }, _read_file),
    "grep": Tool("grep", {
        "type": "object", "properties": {"path": _PATH_SCHEMA, "query": {"type": "string"}},
        "required": ["path", "query"], "additionalProperties": False,
    }, _grep),
    "list_dir": Tool("list_dir", {
        "type": "object", "properties": {"path": _PATH_SCHEMA}, "required": ["path"], "additionalProperties": False,
    }, _list_dir),
}


def schemas() -> list[dict[str, object]]:
    return [{"type": "function", "function": {"name": tool.name, "parameters": tool.schema}} for tool in REGISTRY.values()]


def _refusal(tool_use_id: str, message: str) -> ChatEvent:
    return {"type": "tool_result", "tool_use_id": tool_use_id, "tool_output": {"refused": message}}


def dispatch(tool_name: str, tool_input: object, tool_use_id: str, policy: ToolPolicy) -> ChatEvent:
    """Run one registered read-only tool, returning refusals to the model instead of raising."""
    tool = REGISTRY.get(tool_name)
    if tool is None:
        return _refusal(tool_use_id, f"unknown tool: {tool_name}")
    if tool_name not in policy.get("allowed_tools", []):
        return _refusal(tool_use_id, f"tool not allowed: {tool_name}")
    if not isinstance(tool_input, dict):
        return _refusal(tool_use_id, "tool input must be an object")
    allowed_paths = policy.get("allowed_paths", [])
    if not allowed_paths:
        return _refusal(tool_use_id, "no allowed paths")
    try:
        value = dict(tool_input)
        for argument in tool.path_args:
            raw_path = value.get(argument)
            if not isinstance(raw_path, str) or not raw_path:
                raise ValueError(f"{argument} must be a non-empty string")
            roots = _roots(allowed_paths)
            if not roots:
                return _refusal(tool_use_id, "no usable allowed paths")
            resolved = boundary.resolve_under_any(raw_path, [config.ROOT, *roots])
            if not any(_is_allowed(resolved, root) for root in roots):
                return _refusal(tool_use_id, f"path not allowed: {raw_path}")
            value[argument] = resolved
        return {"type": "tool_result", "tool_use_id": tool_use_id, "tool_output": tool.handler(value)}
    except (OSError, PermissionError, ValueError) as exc:
        return _refusal(tool_use_id, str(exc))


def _roots(allowed_paths: object) -> list[Path]:
    """Resolve the policy's roots, dropping anything the browser would refuse.

    Widening dispatch beyond config.ROOT also removed the old implicit check
    that every allowed_path sat inside the workspace: resolve_in_root used to
    raise on a base outside ROOT, so an agent profile could never grant one.
    allowed_paths is editable from the Agents page, so without this filter a
    profile could name ~/.ssh directly and skip the per-run folder picker,
    its deny-list and its audit entry.
    """
    if not isinstance(allowed_paths, list):
        return []
    roots: list[Path] = []
    for root in allowed_paths:
        if not isinstance(root, str) or not root:
            continue
        resolved = boundary.resolve_relative_to_root(root)
        if fsbrowse.is_denied(resolved):
            continue
        roots.append(resolved)
    return roots


def _is_allowed(path: Path, root: Path) -> bool:
    try:
        boundary.resolve_under_any(path, [root])
    except (PermissionError, ValueError):
        return False
    return True


def tool_message(result: ChatEvent) -> dict[str, str]:
    return {"role": "tool", "tool_call_id": str(result["tool_use_id"]), "content": json.dumps(result["tool_output"])}
