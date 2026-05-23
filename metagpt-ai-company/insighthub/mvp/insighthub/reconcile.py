"""Deterministic reconciliation from ProjectState to report metrics."""

from __future__ import annotations

from collections import defaultdict

from rapidfuzz import fuzz

from insighthub.schema import (
    BugMetrics,
    Issue,
    IssueWBSLink,
    PhaseProgress,
    ProjectState,
    ReconcileResult,
    WBSTask,
)


def reconcile(state: ProjectState) -> ReconcileResult:
    """Reconcile Jira, WBS, GitHub, and sprint facts into one result."""

    issue_by_key = {issue.key: issue for issue in state.issues}
    task_by_id = {task.task_id: task for task in state.wbs_tasks}
    links = [_link_issue(issue, state.wbs_tasks) for issue in state.issues]
    linked_issue_keys = {link.issue_key for link in links if link.method != "none"}
    linked_task_ids = {link.wbs_task_id for link in links if link.method != "none"}
    task_by_issue = {
        link.issue_key: task_by_id[link.wbs_task_id]
        for link in links
        if link.method != "none" and link.wbs_task_id in task_by_id
    }

    issue_commit_links = _issue_commit_links(state)
    completed_in_period = [
        issue.key
        for issue in state.issues
        if issue.resolved is not None and state.period_start <= issue.resolved <= state.period_end
    ]
    in_progress = [issue.key for issue in state.issues if issue.status == "In Progress"]
    slipped_tasks = [
        task.task_id
        for task in state.wbs_tasks
        if task.planned_end < state.period_end
        and (not (issue := _linked_issue_for_task(task.task_id, links, issue_by_key)) or issue.status != "Done")
    ]

    phase_progress = _phase_progress(state, task_by_issue)

    return ReconcileResult(
        links=links,
        orphan_issues=sorted(set(issue_by_key) - linked_issue_keys),
        untracked_wbs=[task.task_id for task in state.wbs_tasks if task.task_id not in linked_task_ids],
        phase_progress=phase_progress,
        overall_planned_pct=_weighted_planned(state.wbs_tasks, state.issues, task_by_issue),
        overall_actual_pct=_weighted_actual(state.issues),
        bug_metrics=_bug_metrics(state),
        sprint_metrics=state.sprints,
        issue_commit_links=issue_commit_links,
        completed_in_period=completed_in_period,
        in_progress=in_progress,
        slipped_tasks=slipped_tasks,
    )


def _link_issue(issue: Issue, tasks: list[WBSTask]) -> IssueWBSLink:
    for task in tasks:
        if task.jira_key == issue.key:
            return IssueWBSLink(issue_key=issue.key, wbs_task_id=task.task_id, method="key", score=100.0)

    for task in tasks:
        if issue.summary.strip().casefold() == task.name.strip().casefold():
            return IssueWBSLink(issue_key=issue.key, wbs_task_id=task.task_id, method="title-exact", score=100.0)

    best_task: WBSTask | None = None
    best_score = 0.0
    for task in tasks:
        score = float(fuzz.ratio(issue.summary, task.name))
        if score > best_score:
            best_score = score
            best_task = task
    if best_task is not None and best_score >= 80.0:
        return IssueWBSLink(issue_key=issue.key, wbs_task_id=best_task.task_id, method="fuzzy", score=best_score)

    return IssueWBSLink(issue_key=issue.key, wbs_task_id="", method="none", score=0.0)


def _issue_commit_links(state: ProjectState) -> dict[str, list[str]]:
    links: dict[str, list[str]] = defaultdict(list)
    for commit in state.commits:
        for key in commit.jira_keys:
            links[key].append(commit.sha[:7])
    for pr in state.prs:
        for key in pr.jira_keys:
            links[key].append(f"PR#{pr.number}")
    return {key: sorted(set(values)) for key, values in links.items()}


def _phase_progress(state: ProjectState, task_by_issue: dict[str, WBSTask]) -> list[PhaseProgress]:
    issues_by_phase: dict[str, list[Issue]] = defaultdict(list)
    tasks_by_phase: dict[str, list[WBSTask]] = defaultdict(list)
    for task in state.wbs_tasks:
        tasks_by_phase[task.phase].append(task)
    for issue in state.issues:
        task = task_by_issue.get(issue.key)
        if task is not None:
            issues_by_phase[task.phase].append(issue)

    progress = []
    for phase, tasks in tasks_by_phase.items():
        issues = issues_by_phase.get(phase, [])
        total_sp = sum(_sp(issue) for issue in issues)
        done_sp = sum(_sp(issue) for issue in issues if issue.status == "Done")
        actual = (done_sp / total_sp * 100.0) if total_sp else 0.0
        planned = _average([task.planned_pct for task in tasks])
        progress.append(
            PhaseProgress(
                phase=phase,
                planned_pct=planned,
                actual_pct=actual,
                variance=actual - planned,
                issue_keys=[issue.key for issue in issues],
            )
        )
    return progress


def _weighted_planned(tasks: list[WBSTask], issues: list[Issue], task_by_issue: dict[str, WBSTask]) -> float:
    issue_by_key = {issue.key: issue for issue in issues}
    weights_by_task: dict[str, float] = defaultdict(float)
    for issue_key, task in task_by_issue.items():
        if issue_key in issue_by_key:
            weights_by_task[task.task_id] += _sp(issue_by_key[issue_key])
    for task in tasks:
        if task.task_id not in weights_by_task:
            weights_by_task[task.task_id] = task.planned_mm or 1.0
    total_weight = sum(weights_by_task.values())
    if not total_weight:
        return 0.0
    return sum(task.planned_pct * weights_by_task[task.task_id] for task in tasks) / total_weight


def _weighted_actual(issues: list[Issue]) -> float:
    total_sp = sum(_sp(issue) for issue in issues)
    if not total_sp:
        return 0.0
    done_sp = sum(_sp(issue) for issue in issues if issue.status == "Done")
    return done_sp / total_sp * 100.0


def _linked_issue_for_task(task_id: str, links: list[IssueWBSLink], issue_by_key: dict[str, Issue]) -> Issue | None:
    for link in links:
        if link.wbs_task_id == task_id and link.method != "none":
            return issue_by_key.get(link.issue_key)
    return None


def _bug_metrics(state: ProjectState) -> BugMetrics:
    bugs = [issue for issue in state.issues if issue.issue_type == "Bug"]
    closed = [bug for bug in bugs if bug.resolved and state.period_start <= bug.resolved <= state.period_end]
    open_bugs = [bug for bug in bugs if bug.status != "Done"]
    open_by_severity: dict[str, int] = defaultdict(int)
    for bug in open_bugs:
        open_by_severity[bug.priority] += 1
    return BugMetrics(
        opened=sum(1 for bug in bugs if state.period_start <= bug.created <= state.period_end),
        closed=len(closed),
        open_total=len(open_bugs),
        open_by_severity=dict(open_by_severity),
        reopened=sum(1 for bug in bugs if bug.reopened),
        mttf_days=_average([(bug.resolved - bug.created).days for bug in closed if bug.resolved]),
    )


def _sp(issue: Issue) -> float:
    return issue.story_points if issue.story_points else 1.0


def _average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0
