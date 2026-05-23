"""Robustness checks for variant and degenerate project data."""

from __future__ import annotations

import subprocess
import sys
from datetime import date
from pathlib import Path

from insighthub.anomalies import detect
from insighthub.datasource import load
from insighthub.export import export
from insighthub.facts import build_facts
from insighthub.reconcile import reconcile
from insighthub.report import generate
from insighthub.schema import ProjectState
from insighthub.validate import validate


def _run_pipeline(state: ProjectState, out_dir: Path | None = None):
    rec = reconcile(state)
    anomalies = detect(state, rec)
    facts = build_facts(state, rec, anomalies)
    report = generate(facts, lang="ja", use_llm=False)

    assert len(report.sections) == 9
    assert validate(report, facts) == []

    if out_dir is not None:
        paths = export(report, facts, str(out_dir))
        assert Path(paths["weekly_docx"]).exists()
        assert Path(paths["weekly_md"]).exists()
    return facts, report


def test_variant_data_pipeline_validates_and_exports(tmp_path):
    subprocess.run(
        [sys.executable, "scripts/gen_sample_data.py", "--seed", "42", "--variant", "variant"],
        check=True,
    )

    state = load("data/sample-variant/connections.yaml")
    facts, report = _run_pipeline(state, tmp_path)

    assert facts.project_name == "Project Kiku"
    assert report.project_name == "Project Kiku"
    assert len(state.messages) == 0
    assert len(state.commits) == 0
    assert len(state.minute_items) == 0
    assert len([issue for issue in state.issues if issue.issue_type == "Bug"]) == 0


def test_empty_project_state_still_produces_valid_green_report():
    state = ProjectState(
        project_name="Empty Project",
        period_start=date(2026, 6, 1),
        period_end=date(2026, 6, 7),
    )

    facts, report = _run_pipeline(state)

    assert facts.overall_status == "Green"
    assert len(facts.anomalies) == 0
    assert len(report.sections) == 9
