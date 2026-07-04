from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

SOURCE_GLOBS: tuple[tuple[str, str], ...] = (
    ("../ai/sessions/*.md", "session"),
    ("../ai/handoff-*.md", "handoff"),
    ("../ai/status.md", "status"),
    ("personal-wiki/INDEX.md", "wiki-index"),
    ("../opus-lucida/ai/*.md", "session"),
)


def iter_sources(
    source_globs: tuple[tuple[str, str], ...] = SOURCE_GLOBS,
    base_dir: Path | None = None,
) -> list[tuple[Path, str]]:
    """Return stable (path, kind) pairs for recall memory sources."""
    root = (base_dir or PROJECT_ROOT).resolve()
    sources: list[tuple[Path, str]] = []
    seen: set[Path] = set()

    for pattern, kind in source_globs:
        for path in sorted(root.glob(pattern)):
            if not path.is_file():
                continue
            resolved = path.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            sources.append((resolved, kind))

    return sources
