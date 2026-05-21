"""Build cited report facts from reconciled project state."""

from __future__ import annotations

import re

from insighthub.schema import (
    Anomaly,
    Fact,
    Facts,
    ProjectState,
    ReconcileResult,
    SectionFacts,
    SourceRef,
)

NUMBER_RE = re.compile(r"\d+(?:\.\d+)?%?")

SECTION_TITLES = {
    "exec_summary": "Executive Summary",
    "progress": "Progress",
    "completed": "Completed",
    "in_progress": "In Progress",
    "next_week": "Next Week",
    "blockers": "Blockers",
    "bugs": "Bugs",
    "decisions": "Decisions",
    "metrics": "Metrics",
}


def build_facts(state: ProjectState, rec: ReconcileResult, anomalies: list[Anomaly]) -> Facts:
    """Return all precomputed report facts and allow-lists for validation."""

    issue_by_key = {issue.key: issue for issue in state.issues}
    task_by_id = {task.task_id: task for task in state.wbs_tasks}
    high_count = sum(1 for anomaly in anomalies if anomaly.severity == "High")
    overall_status = "Green" if high_count == 0 else "Yellow" if high_count <= 2 else "Red"

    sections = [
        _exec_summary(state, rec, anomalies, overall_status, high_count),
        _progress(state, rec),
        _completed(rec, issue_by_key),
        _in_progress(rec, issue_by_key),
        _next_week(state, rec, issue_by_key),
        _blockers(rec, anomalies, task_by_id),
        _bugs(state, rec),
        _decisions(state),
        _metrics(state, rec),
    ]

    allowed_keys = sorted(
        set(issue_by_key)
        | {commit.sha[:7] for commit in state.commits}
        | {f"PR#{pr.number}" for pr in state.prs}
        | set(task_by_id)
    )
    allowed_numbers = sorted(
        {
            match.group(0)
            for section in sections
            for fact in [*section.facts, *section.bullet_items]
            for match in NUMBER_RE.finditer(fact.value)
        },
        key=_number_sort_key,
    )

    return Facts(
        project_name=state.project_name,
        period_start=state.period_start,
        period_end=state.period_end,
        overall_status=overall_status,
        sections=sections,
        anomalies=anomalies,
        allowed_keys=allowed_keys,
        allowed_numbers=allowed_numbers,
    )


def _exec_summary(
    state: ProjectState,
    rec: ReconcileResult,
    anomalies: list[Anomaly],
    overall_status: str,
    high_count: int,
) -> SectionFacts:
    completed = len(rec.completed_in_period)
    citations = [issue.source_ref for issue in state.issues if issue.key in rec.completed_in_period]
    facts = [
        Fact(
            id="exec_summary.overall_status",
            label="Overall status",
            value=overall_status,
            citations=_fallback_citations(citations, state),
        ),
        Fact(
            id="exec_summary.completed_count",
            label="Completed work items",
            value=f"{completed} completed work items",
            citations=citations,
        ),
        Fact(
            id="exec_summary.high_risks",
            label="High risks",
            value=f"{high_count} High anomalies",
            citations=[ref for anomaly in anomalies if anomaly.severity == "High" for ref in anomaly.evidence],
        ),
    ]
    return SectionFacts(section_id="exec_summary", title=SECTION_TITLES["exec_summary"], facts=facts)


def _progress(state: ProjectState, rec: ReconcileResult) -> SectionFacts:
    phase_refs = {
        phase.phase: [
            task.source_ref
            for task in state.wbs_tasks
            if task.phase == phase.phase or task.jira_key in phase.issue_keys
        ]
        for phase in rec.phase_progress
    }
    facts = [
        Fact(
            id="progress.overall",
            label="Overall progress",
            value=f"{_fmt_pct(rec.overall_actual_pct)} actual vs {_fmt_pct(rec.overall_planned_pct)} planned",
            citations=[task.source_ref for task in state.wbs_tasks],
        )
    ]
    bullets = [
        Fact(
            id=f"progress.phase.{_slug(phase.phase)}",
            label=phase.phase,
            value=(
                f"{phase.phase}: {_fmt_pct(phase.actual_pct)} actual vs "
                f"{_fmt_pct(phase.planned_pct)} planned, variance {_fmt_pct(phase.variance)}"
            ),
            citations=phase_refs.get(phase.phase, []),
        )
        for phase in rec.phase_progress
    ]
    return SectionFacts(
        section_id="progress",
        title=SECTION_TITLES["progress"],
        facts=facts,
        bullet_items=bullets,
    )


def _completed(rec: ReconcileResult, issue_by_key: dict[str, object]) -> SectionFacts:
    return SectionFacts(
        section_id="completed",
        title=SECTION_TITLES["completed"],
        bullet_items=[
            Fact(
                id=f"completed.{key}",
                label=key,
                value=f"{key}: {issue.summary} completed",
                citations=[issue.source_ref],
            )
            for key in rec.completed_in_period
            if (issue := issue_by_key.get(key)) is not None
        ],
    )


def _in_progress(rec: ReconcileResult, issue_by_key: dict[str, object]) -> SectionFacts:
    return SectionFacts(
        section_id="in_progress",
        title=SECTION_TITLES["in_progress"],
        bullet_items=[
            Fact(
                id=f"in_progress.{key}",
                label=key,
                value=f"{key}: {issue.summary} is {issue.status}",
                citations=[issue.source_ref],
            )
            for key in rec.in_progress
            if (issue := issue_by_key.get(key)) is not None
        ],
    )


def _next_week(
    state: ProjectState,
    rec: ReconcileResult,
    issue_by_key: dict[str, object],
) -> SectionFacts:
    next_tasks = []
    for task in state.wbs_tasks:
        issue = issue_by_key.get(task.jira_key)
        if task.planned_start > state.period_end or (issue and issue.status != "Done"):
            next_tasks.append(task)

    return SectionFacts(
        section_id="next_week",
        title=SECTION_TITLES["next_week"],
        facts=[
            Fact(
                id="next_week.count",
                label="Upcoming or open WBS tasks",
                value=f"{len(next_tasks)} upcoming or open WBS tasks",
                citations=[task.source_ref for task in next_tasks],
            )
        ],
        bullet_items=[
            Fact(
                id=f"next_week.{task.task_id}",
                label=task.task_id,
                value=f"{task.task_id}: {task.name} planned start {task.planned_start.isoformat()}",
                citations=[task.source_ref],
            )
            for task in next_tasks
        ],
    )


def _blockers(
    rec: ReconcileResult,
    anomalies: list[Anomaly],
    task_by_id: dict[str, object],
) -> SectionFacts:
    relevant = [
        anomaly
        for anomaly in anomalies
        if anomaly.severity in {"High", "Medium"}
        and anomaly.category in {"Risk", "Schedule", "Progress"}
    ]
    bullets = [
        Fact(
            id=f"blockers.{anomaly.rule_id}.{_slug(anomaly.item)}",
            label=anomaly.rule_id,
            value=f"{anomaly.severity} {anomaly.category}: {anomaly.item} - {anomaly.detail or anomaly.title}",
            citations=anomaly.evidence,
        )
        for anomaly in relevant
    ]
    for task_id in rec.slipped_tasks:
        task = task_by_id.get(task_id)
        if task is not None:
            bullets.append(
                Fact(
                    id=f"blockers.slipped.{task_id}",
                    label="Slipped task",
                    value=f"{task_id}: slipped task {task.name}",
                    citations=[task.source_ref],
                )
            )
    return SectionFacts(
        section_id="blockers",
        title=SECTION_TITLES["blockers"],
        facts=[
            Fact(
                id="blockers.count",
                label="Blockers and schedule risks",
                value=f"{len(bullets)} blocker or schedule risk items",
                citations=[ref for item in bullets for ref in item.citations],
            )
        ],
        bullet_items=bullets,
    )


def _bugs(state: ProjectState, rec: ReconcileResult) -> SectionFacts:
    metrics = rec.bug_metrics
    bug_refs = [issue.source_ref for issue in state.issues if issue.issue_type == "Bug"]
    severity_counts = ", ".join(
        f"{severity} {count}" for severity, count in sorted(metrics.open_by_severity.items())
    ) or "none 0"
    facts = [
        Fact(id="bugs.opened", label="Opened bugs", value=f"{metrics.opened} bugs opened", citations=bug_refs),
        Fact(id="bugs.closed", label="Closed bugs", value=f"{metrics.closed} bugs closed", citations=bug_refs),
        Fact(id="bugs.open_total", label="Open bugs", value=f"{metrics.open_total} bugs open", citations=bug_refs),
        Fact(
            id="bugs.severity",
            label="Open bugs by severity",
            value=f"Open bug severity counts: {severity_counts}",
            citations=bug_refs,
        ),
        Fact(id="bugs.reopened", label="Reopened bugs", value=f"{metrics.reopened} bugs reopened", citations=bug_refs),
        Fact(id="bugs.mttf", label="Mean time to fix", value=f"{_fmt_float(metrics.mttf_days)} days MTTF", citations=bug_refs),
    ]
    return SectionFacts(section_id="bugs", title=SECTION_TITLES["bugs"], facts=facts)


def _decisions(state: ProjectState) -> SectionFacts:
    items = [item for item in state.minute_items if item.kind in {"decision", "action_item"}]
    return SectionFacts(
        section_id="decisions",
        title=SECTION_TITLES["decisions"],
        bullet_items=[
            Fact(
                id=f"decisions.{idx}",
                label=item.kind.replace("_", " ").title(),
                value=f"{item.kind}: {item.text}",
                citations=[item.source_ref],
            )
            for idx, item in enumerate(items, start=1)
        ],
    )


def _metrics(state: ProjectState, rec: ReconcileResult) -> SectionFacts:
    completed_issues = [issue for issue in state.issues if issue.key in rec.completed_in_period]
    velocity = sum(issue.story_points for issue in completed_issues)
    throughput = len(completed_issues)
    facts = [
        Fact(
            id="metrics.velocity",
            label="Velocity",
            value=f"{_fmt_float(velocity)} story points done",
            citations=[issue.source_ref for issue in completed_issues],
        ),
        Fact(
            id="metrics.throughput",
            label="Throughput",
            value=f"{throughput} issues completed",
            citations=[issue.source_ref for issue in completed_issues],
        ),
        Fact(
            id="metrics.github",
            label="GitHub activity",
            value=f"{len(state.commits)} commits and {len(state.prs)} PRs",
            citations=[*[commit.source_ref for commit in state.commits], *[pr.source_ref for pr in state.prs]],
        ),
    ]
    bullets = [
        Fact(
            id=f"metrics.sprint.{_slug(metric.sprint)}",
            label=metric.sprint,
            value=(
                f"{metric.sprint}: {_fmt_float(metric.completed_sp)} completed SP "
                f"of {_fmt_float(metric.committed_sp)} committed SP, {_fmt_pct(metric.completion_pct)} completion"
            ),
        )
        for metric in rec.sprint_metrics
    ]
    return SectionFacts(
        section_id="metrics",
        title=SECTION_TITLES["metrics"],
        facts=facts,
        bullet_items=bullets,
    )


def _fallback_citations(citations: list[SourceRef], state: ProjectState) -> list[SourceRef]:
    if citations:
        return citations
    if state.issues:
        return [state.issues[0].source_ref]
    return []


def _fmt_pct(value: float) -> str:
    return f"{value:.1f}%"


def _fmt_float(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else f"{value:.1f}"


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_") or "item"


def _number_sort_key(value: str) -> tuple[float, str]:
    return (float(value.rstrip("%")), value)
