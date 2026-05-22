"""Tests for weekly report export artifacts."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document

from insighthub.export import export
from insighthub.schema import Fact, Facts, Report, ReportSection, SectionFacts, SourceRef


def test_export_writes_all_artifacts(tmp_path):
    citation = SourceRef(
        system="jira",
        ref_id="SAKURA-1",
        label="Implement login",
        url="https://example.test/browse/SAKURA-1",
    )
    facts = Facts(
        project_name="Sakura",
        period_start=date(2026, 5, 15),
        period_end=date(2026, 5, 21),
        overall_status="Yellow",
        sections=[
            SectionFacts(
                section_id="exec_summary",
                title="Executive Summary",
                facts=[
                    Fact(
                        id="summary.status",
                        label="Overall status",
                        value="Yellow",
                        citations=[citation],
                    )
                ],
            ),
            SectionFacts(
                section_id="progress",
                title="Progress",
                bullet_items=[
                    Fact(
                        id="progress.completed",
                        label="Completed work",
                        value="3 stories completed",
                        citations=[citation],
                    )
                ],
            ),
        ],
    )
    report = Report(
        project_name="Sakura",
        period_start=date(2026, 5, 15),
        period_end=date(2026, 5, 21),
        overall_status="Yellow",
        sections=[
            ReportSection(
                section_id="exec_summary",
                title="Executive Summary",
                body="Status is Yellow [jira:SAKURA-1]",
                validated=True,
            ),
            ReportSection(
                section_id="progress",
                title="Progress",
                body="- Completed 3 stories [jira:SAKURA-1]\n- Burnup is on track",
                validated=True,
            ),
            ReportSection(
                section_id="bugs",
                title="Bugs",
                body="No critical bug opened.",
                validated=True,
            ),
        ],
    )

    paths = export(report, facts, str(tmp_path))

    assert {
        "weekly_docx",
        "weekly_md",
        "traceability_json",
        "audit_log_md",
    }.issubset(paths)
    for path in paths.values():
        assert Path(path).exists()

    Document(paths["weekly_docx"])
    traceability = json.loads(tmp_path.joinpath("traceability.json").read_text(encoding="utf-8"))
    assert traceability["summary.status"]["citations"][0]["system"] == "jira"
    assert traceability["summary.status"]["citations"][0]["ref_id"] == "SAKURA-1"
