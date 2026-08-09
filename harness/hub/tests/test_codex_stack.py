from __future__ import annotations

from pathlib import Path

import config
from services import skill_library


EXPECTED_CODEX_STACK = {
    "api-design", "backend-patterns", "brainstorming", "documents",
    "finishing-a-development-branch", "frontend-design", "mcp-builder", "pdf",
    "postgres-patterns", "receiving-code-review", "requesting-code-review",
    "security-review", "skill-creator", "speckit-analyze", "speckit-checklist",
    "speckit-clarify", "speckit-constitution", "speckit-implement", "speckit-plan",
    "speckit-specify", "speckit-tasks", "spreadsheets", "subagent-driven-development",
    "systematic-debugging", "test-driven-development", "using-git-worktrees",
    "verification-before-completion", "web-artifacts-builder", "webapp-testing", "writing-plans",
}


def test_codex_stack_has_exactly_thirty_named_skills() -> None:
    rows = skill_library.list_skills()
    names = {row["name"] for row in rows if row.get("source") == "codex_stack"}
    assert names == EXPECTED_CODEX_STACK


def test_codex_stack_skill_files_have_required_frontmatter() -> None:
    root = Path(config.SKILL_SOURCES["codex_stack"])
    for name in EXPECTED_CODEX_STACK:
        skill_md = root / name / "SKILL.md"
        assert skill_md.is_file(), name
        text = skill_md.read_text(encoding="utf-8")
        assert text.startswith("---\n"), name
        assert f"name: {name}" in text or f"name: \"{name}\"" in text, name
        assert "description:" in text, name
