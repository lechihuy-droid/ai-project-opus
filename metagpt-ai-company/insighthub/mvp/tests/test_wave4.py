"""Wave 4 checks for portfolio roll-up generation."""

from __future__ import annotations

from pathlib import Path

from insighthub.__main__ import generate as cli_generate


def test_generate_portfolio_dashboard_for_multiple_projects(tmp_path):
    paths = cli_generate(
        report_type="portfolio",
        lang="en",
        use_llm=False,
        out=str(tmp_path),
        connections=["connections.yaml", "data/sample-variant/connections.yaml"],
    )

    portfolio_markdown = Path(paths["portfolio_md"]).read_text(encoding="utf-8")

    assert Path(paths["portfolio_docx"]).exists()
    assert "## Portfolio Dashboard" in portfolio_markdown
    assert "Project Sakura" in portfolio_markdown
    assert "Project Kiku" in portfolio_markdown
    assert "projects/project-sakura/weekly.md" in portfolio_markdown
    assert (tmp_path / "projects" / "project-sakura" / "weekly.md").exists()
    assert (tmp_path / "projects" / "project-kiku" / "weekly.md").exists()
