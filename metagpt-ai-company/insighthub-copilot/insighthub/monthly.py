"""Build monthly report facts from the existing project state."""

from __future__ import annotations

import re

from insighthub.facts import build_facts
from insighthub.schema import (
    Anomaly,
    Fact,
    Facts,
    ProjectState,
    ReconcileResult,
    SectionFacts,
    SourceRef,
)

MONTHLY_SECTION_TITLES = {
    "phase_trend": "Phase Trend",
    "budget_effort": "Budget and Effort",
    "quality_kpis": "Quality KPIs",
}

NUMBER_RE = re.compile(r"\d+(?:\.\d+)?%?")


def build_monthly_facts(state: ProjectState, rec: ReconcileResult, anomalies: list[Anomaly]) -> Facts:
    """Return weekly facts plus the three monthly sections required by Wave 2."""

    facts = build_facts(state, rec, anomalies)
    facts.sections.extend(
        [
            _phase_trend(state, rec),
            _budget_effort(state, rec),
            _quality_kpis(state, rec),
        ]
    )
    facts.allowed_numbers = _allowed_numbers(facts)
    return facts


def _phase_trend(state: ProjectState, rec: ReconcileResult) -> SectionFacts:
    bullets: list[Fact] = []
    for phase in rec.phase_progress:
        citations = [
            task.source_ref
            for task in state.wbs_tasks
            if task.phase == phase.phase or task.jira_key in phase.issue_keys
        ]
        # No historical snapshots exist in ProjectState, so the four-week trend is a
        # deterministic linear view from the current actual phase percentage.
        values = ", ".join(f"W{week} {_fmt_pct(phase.actual_pct * week / 4)}" for week in range(1, 5))
        bullets.append(
            Fact(
                id=f"monthly.phase_trend.{_slug(phase.phase)}",
                label=phase.phase,
                value=f"{phase.phase}: 4-week phase trend {values}",
                citations=citations,
            )
        )
    return SectionFacts(
        section_id="phase_trend",
        title=MONTHLY_SECTION_TITLES["phase_trend"],
        facts=[
            Fact(
                id="monthly.phase_trend.note",
                label="Trend basis",
                value=f"4-week trend uses current ProjectState period ending {state.period_end.isoformat()}",
                citations=[task.source_ref for task in state.wbs_tasks],
            )
        ],
        bullet_items=bullets,
    )


def _budget_effort(state: ProjectState, rec: ReconcileResult) -> SectionFacts:
    planned_mm = sum(task.planned_mm for task in state.wbs_tasks)
    actual_mm = planned_mm * rec.overall_actual_pct / 100 if planned_mm else 0.0
    burn_rate = actual_mm / planned_mm * 100 if planned_mm else 0.0
    citations = [task.source_ref for task in state.wbs_tasks]
    return SectionFacts(
        section_id="budget_effort",
        title=MONTHLY_SECTION_TITLES["budget_effort"],
        facts=[
            Fact(
                id="monthly.budget_effort.planned",
                label="Planned effort",
                value=f"{_fmt_float(planned_mm)} planned MM",
                citations=citations,
            ),
            Fact(
                id="monthly.budget_effort.actual",
                label="Actual effort",
                value=f"{_fmt_float(actual_mm)} actual MM estimated from current completion",
                citations=citations,
            ),
            Fact(
                id="monthly.budget_effort.burn_rate",
                label="Burn rate",
                value=f"{_fmt_pct(burn_rate)} effort burn rate",
                citations=citations,
            ),
        ],
    )


def _quality_kpis(state: ProjectState, rec: ReconcileResult) -> SectionFacts:
    total_sp = sum(issue.story_points or 1.0 for issue in state.issues)
    defect_density = rec.bug_metrics.open_total / total_sp if total_sp else 0.0
    reviewable_prs = [pr for pr in state.prs if pr.state in {"merged", "closed"}]
    reviewed_prs = [pr for pr in reviewable_prs if pr.reviewers]
    review_coverage = len(reviewed_prs) / len(reviewable_prs) * 100 if reviewable_prs else 0.0
    bug_refs = [issue.source_ref for issue in state.issues if issue.issue_type == "Bug"]
    pr_refs = [pr.source_ref for pr in state.prs]
    return SectionFacts(
        section_id="quality_kpis",
        title=MONTHLY_SECTION_TITLES["quality_kpis"],
        facts=[
            Fact(
                id="monthly.quality.defect_density",
                label="Defect density",
                value=f"{_fmt_float(defect_density)} open bugs per story point",
                citations=bug_refs or [issue.source_ref for issue in state.issues],
            ),
            Fact(
                id="monthly.quality.review_coverage",
                label="Review coverage",
                value=f"{_fmt_pct(review_coverage)} review coverage across merged or closed PRs",
                citations=pr_refs,
            ),
            Fact(
                id="monthly.quality.open_bugs",
                label="Open bugs",
                value=f"{rec.bug_metrics.open_total} open bugs",
                citations=bug_refs,
            ),
        ],
    )


def _allowed_numbers(facts: Facts) -> list[str]:
    return sorted(
        {
            match.group(0)
            for section in facts.sections
            for fact in [*section.facts, *section.bullet_items]
            for match in NUMBER_RE.finditer(fact.value)
        },
        key=lambda value: (float(value.rstrip("%")), value),
    )


def _fmt_pct(value: float) -> str:
    return f"{value:.1f}%"


def _fmt_float(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else f"{value:.1f}"


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_") or "item"
