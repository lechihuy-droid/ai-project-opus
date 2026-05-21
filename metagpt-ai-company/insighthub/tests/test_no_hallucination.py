"""Tests for report hallucination guardrails."""

from __future__ import annotations

from insighthub.__main__ import _detect, _load_state, _reconcile
from insighthub.facts import build_facts
from insighthub.report import generate
from insighthub.schema import Report, ReportSection
from insighthub.validate import validate


def test_template_pipeline_validates_clean():
    state = _load_state()
    rec = _reconcile(state)
    anomalies = _detect(state, rec)
    facts = build_facts(state, rec, anomalies)
    report = generate(facts, use_llm=False)

    assert validate(report, facts) == []


def test_validate_rejects_fake_number():
    state = _load_state()
    rec = _reconcile(state)
    facts = build_facts(state, rec, _detect(state, rec))
    report = Report(
        project_name=facts.project_name,
        period_start=facts.period_start,
        period_end=facts.period_end,
        sections=[
            ReportSection(
                section_id="exec_summary",
                title="Executive Summary",
                body="Fake metric 999 [jira:SAKURA-1]",
            )
        ],
    )

    violations = validate(report, facts)

    assert any("999" in violation for violation in violations)
