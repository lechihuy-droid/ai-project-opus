"""Wave 2 checks for monthly reports and tone references."""

from __future__ import annotations

from pathlib import Path

from insighthub.__main__ import generate as cli_generate
from insighthub.anomalies import detect
from insighthub.datasource import load, load_previous_reports
from insighthub.monthly import build_monthly_facts
from insighthub.reconcile import reconcile
from insighthub.report import _system_prompt, generate
from insighthub.validate import validate


def test_monthly_report_has_three_extra_sections_and_validates(tmp_path):
    state = load()
    rec = reconcile(state)
    facts = build_monthly_facts(state, rec, detect(state, rec))
    report = generate(facts, lang="en", use_llm=False, report_type="monthly")

    section_ids = [section.section_id for section in report.sections]
    assert section_ids[-3:] == ["phase_trend", "budget_effort", "quality_kpis"]
    assert validate(report, facts) == []

    paths = cli_generate("monthly", "en", False, str(tmp_path), "connections.yaml")
    assert Path(paths["monthly_docx"]).exists()
    markdown = Path(paths["monthly_md"]).read_text(encoding="utf-8")
    assert "## Phase Trend" in markdown
    assert "## Budget and Effort" in markdown
    assert "## Quality KPIs" in markdown


def test_previous_reports_feed_tone_reference_prompt_only():
    previous_reports = load_previous_reports()
    assert previous_reports

    prompt = _system_prompt(
        "en",
        None,
        report_type="weekly",
        section_order=("exec_summary",),
        style_reference=previous_reports[0],
    )

    assert "tone only" in prompt
    assert "Do not copy or reuse any numbers" in prompt
    assert "Keep the summary concise" in prompt
