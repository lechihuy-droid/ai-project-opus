"""Wave 3 checks for multi-template export and diff history."""

from __future__ import annotations

import json
from pathlib import Path

from docx import Document

from insighthub.__main__ import generate as cli_generate
from insighthub.datasource import load
from insighthub.reconcile import reconcile


def test_generate_uses_selected_template(tmp_path):
    paths = cli_generate(
        report_type="weekly",
        lang="en",
        use_llm=False,
        out=str(tmp_path),
        connections="connections.yaml",
        template="weekly-compact",
    )

    document = Document(paths["weekly_docx"])
    paragraphs = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
    assert any("Compact Weekly Status Report" in text for text in paragraphs)


def test_generate_adds_diff_section_and_writes_diff_markdown(tmp_path):
    paths = cli_generate(
        report_type="weekly",
        lang="en",
        use_llm=False,
        out=str(tmp_path),
        connections="connections.yaml",
    )
    history_files = sorted((tmp_path / "history").glob("*.json"))
    assert history_files

    previous_snapshot_path = history_files[-1]
    previous_snapshot = json.loads(previous_snapshot_path.read_text(encoding="utf-8"))

    state = load()
    rec = reconcile(state)
    completed_key = rec.completed_in_period[0]
    previous_snapshot["issues"][completed_key]["status"] = "In Progress"
    previous_snapshot["metrics"]["throughput"] = max(previous_snapshot["metrics"]["throughput"] - 1, 0)
    previous_snapshot_path.write_text(
        json.dumps(previous_snapshot, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    paths = cli_generate(
        report_type="weekly",
        lang="en",
        use_llm=False,
        out=str(tmp_path),
        connections="connections.yaml",
    )

    diff_markdown = Path(paths["diff_md"]).read_text(encoding="utf-8")
    weekly_markdown = Path(paths["weekly_md"]).read_text(encoding="utf-8")

    assert "Changes vs last report" in diff_markdown
    assert completed_key in diff_markdown
    assert "Throughput +1" in diff_markdown
    assert "## Changes vs last report" in weekly_markdown
