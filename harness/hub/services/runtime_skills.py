from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from services import runtime_state


def _skill_roots() -> list[Path]:
    home = Path.home()
    return [
        home / ".codex" / "skills",
        home / ".codex" / "plugins" / "cache",
    ]


def _skill_id(path: Path) -> str:
    digest = hashlib.sha1(str(path.resolve()).encode("utf-8")).hexdigest()[:12]
    return f"skill-{digest}"


def _summary(text: str) -> tuple[str, str]:
    title = "Untitled skill"
    description = ""
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            title = stripped.lstrip("#").strip() or title
            continue
        description = stripped
        break
    return title, description


def _iter_skill_files() -> list[Path]:
    files: list[Path] = []
    for root in _skill_roots():
        if not root.exists():
            continue
        try:
            files.extend(path for path in root.rglob("SKILL.md") if path.is_file())
        except OSError:
            continue
    return sorted(files, key=lambda path: str(path).lower())


def _skill_record(path: Path, include_body: bool = False) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8", errors="replace")
    title, description = _summary(text)
    record: dict[str, Any] = {
        "id": _skill_id(path),
        "title": title,
        "description": description,
        "path": str(path),
        "read_only": True,
    }
    if include_body:
        record["body"] = text
    return record


def list_skills() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for path in _iter_skill_files():
        try:
            rows.append(_skill_record(path))
        except OSError:
            continue
    return rows


def get_skill(skill_id: str) -> dict[str, Any]:
    for path in _iter_skill_files():
        if _skill_id(path) == skill_id:
            return _skill_record(path, include_body=True)
    raise FileNotFoundError(f"Skill not found: {skill_id}")


def skill_usage(skill_id: str) -> dict[str, Any]:
    get_skill(skill_id)
    path = runtime_state.runtime_path("store", "", "skill_usage.jsonl")
    rows: list[dict[str, Any]] = []
    if path.is_file():
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(item, dict) and item.get("skill_id") == skill_id:
                    rows.append(item)
    return {"skill_id": skill_id, "count": len(rows), "events": rows[-50:]}
