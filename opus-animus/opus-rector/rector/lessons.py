from __future__ import annotations

import os
from pathlib import Path


MAX_LESSONS = 30
LESSONS_FILE = "lessons.md"


def log_lesson(text: str) -> None:
    lesson = text.strip()
    if not lesson:
        raise ValueError("lesson text must not be empty")

    lessons = list_lessons()
    lessons.append(lesson)
    lessons = lessons[-MAX_LESSONS:]
    _write_lessons(lessons)


def list_lessons() -> list[str]:
    path = _lessons_path()
    if not path.exists():
        return []

    lessons: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            lessons.append(stripped[2:].strip())
    return lessons


def _write_lessons(lessons: list[str]) -> None:
    path = _lessons_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    content = "".join(f"- {lesson}\n" for lesson in lessons)
    path.write_text(content, encoding="utf-8")


def _lessons_path() -> Path:
    animus_root = os.environ.get("ANIMUS_ROOT")
    if animus_root:
        return Path(animus_root) / "opus-rector" / LESSONS_FILE
    return Path(__file__).resolve().parents[1] / LESSONS_FILE
