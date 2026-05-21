"""Command-line entry point for InsightHub weekly report generation."""

from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path

from insighthub.export import export
from insighthub.facts import build_facts
from insighthub.report import generate as generate_report
from insighthub.schema import (
    Anomaly,
    BugMetrics,
    IssueWBSLink,
    PhaseProgress,
    ProjectState,
    ReconcileResult,
)
from insighthub.validate import validate

JIRA_KEY_RE = re.compile(r"[A-Z][A-Z0-9]+-\d+")
BLOCKER_RE = re.compile(r"\b(blocked|blocker|escalation|cannot proceed)\b", re.I)


def main() -> None:
    parser = argparse.ArgumentParser(prog="insighthub")
    subparsers = parser.add_subparsers(dest="command", required=True)
    generate_parser = subparsers.add_parser("generate")
    generate_parser.add_argument("--type", default="weekly", choices=["weekly"])
    generate_parser.add_argument("--lang", default="en", choices=["en", "ja", "vn"])
    generate_parser.add_argument("--no-llm", action="store_true")
    generate_parser.add_argument("--out", default="output")

    args = parser.parse_args()
    if args.command == "generate":
        generate(args.type, args.lang, not args.no_llm, args.out)


def generate(report_type: str = "weekly", lang: str = "en", use_llm: bool = True, out: str = "output") -> dict[str, str]:
    """Run the deterministic InsightHub pipeline and export artifacts."""

    if report_type != "weekly":
        raise ValueError("Only weekly reports are supported")

    state = _load_state()
    rec = _reconcile(state)
    anomalies = _detect(state, rec)
    facts = build_facts(state, rec, anomalies)
    report = generate_report(facts, lang=lang, use_llm=use_llm)
    violations = validate(report, facts)

    if violations and use_llm:
        report = generate_report(facts, lang=lang, use_llm=True, violations=violations)
        violations = validate(report, facts)
    if violations:
        report = generate_report(facts, lang=lang, use_llm=False)
        violations = validate(report, facts)
    if violations:
        raise RuntimeError("Report validation failed: " + "; ".join(violations))

    for section in report.sections:
        section.validated = True
    paths = export(report, facts, out)
    print(
        f"Generated weekly report: issues={len(state.issues)}, "
        f"anomalies={len(anomalies)}, status={facts.overall_status}, output={out}"
    )
    for label, path in paths.items():
        print(f"{label}: {path}")
    return paths


def _load_state() -> ProjectState:
    path = Path("data/sample/_projectstate.json")
    return ProjectState.model_validate_json(path.read_text(encoding="utf-8"))


def _reconcile(state: ProjectState) -> ReconcileResult:
    issue_by_key = {issue.key: issue for issue in state.issues}
    links: list[IssueWBSLink] = []
    linked_keys = set()
    for task in state.wbs_tasks:
        if task.jira_key and task.jira_key in issue_by_key:
            links.append(IssueWBSLink(issue_key=task.jira_key, wbs_task_id=task.task_id, method="key", score=1.0))
            linked_keys.add(task.jira_key)

    issue_commit_links: dict[str, list[str]] = defaultdict(list)
    for commit in state.commits:
        for key in commit.jira_keys:
            issue_commit_links[key].append(commit.sha[:7])

    completed_in_period = [
        issue.key
        for issue in state.issues
        if issue.status == "Done"
        and issue.resolved is not None
        and state.period_start <= issue.resolved <= state.period_end
    ]
    in_progress = [issue.key for issue in state.issues if issue.status == "In Progress"]
    slipped_tasks = [
        task.task_id
        for task in state.wbs_tasks
        if task.planned_end < state.period_end
        and (not task.jira_key or issue_by_key.get(task.jira_key, None) is None or issue_by_key[task.jira_key].status != "Done")
    ]

    phase_progress = _phase_progress(state, issue_by_key)
    overall_planned = _average([task.planned_pct for task in state.wbs_tasks])
    overall_actual = _average([_task_actual_pct(task.jira_key, issue_by_key) for task in state.wbs_tasks])

    return ReconcileResult(
        links=links,
        orphan_issues=sorted(set(issue_by_key) - linked_keys),
        untracked_wbs=[task.task_id for task in state.wbs_tasks if not task.jira_key],
        phase_progress=phase_progress,
        overall_planned_pct=overall_planned,
        overall_actual_pct=overall_actual,
        bug_metrics=_bug_metrics(state),
        sprint_metrics=state.sprints,
        issue_commit_links=dict(issue_commit_links),
        completed_in_period=completed_in_period,
        in_progress=in_progress,
        slipped_tasks=slipped_tasks,
    )


def _phase_progress(state: ProjectState, issue_by_key: dict) -> list[PhaseProgress]:
    by_phase = defaultdict(list)
    for task in state.wbs_tasks:
        by_phase[task.phase].append(task)
    result = []
    for phase, tasks in by_phase.items():
        planned = _average([task.planned_pct for task in tasks])
        actual = _average([_task_actual_pct(task.jira_key, issue_by_key) for task in tasks])
        result.append(
            PhaseProgress(
                phase=phase,
                planned_pct=planned,
                actual_pct=actual,
                variance=actual - planned,
                issue_keys=[task.jira_key for task in tasks if task.jira_key],
            )
        )
    return result


def _task_actual_pct(jira_key: str, issue_by_key: dict) -> float:
    issue = issue_by_key.get(jira_key)
    if issue is None:
        return 0.0
    if issue.status == "Done":
        return 100.0
    if issue.status == "In Progress":
        return 50.0
    return 0.0


def _bug_metrics(state: ProjectState) -> BugMetrics:
    bugs = [issue for issue in state.issues if issue.issue_type == "Bug"]
    opened = sum(1 for bug in bugs if state.period_start <= bug.created <= state.period_end)
    closed_bugs = [bug for bug in bugs if bug.resolved and state.period_start <= bug.resolved <= state.period_end]
    open_bugs = [bug for bug in bugs if bug.status != "Done"]
    severity = defaultdict(int)
    for bug in open_bugs:
        severity[bug.priority] += 1
    mttf = _average([(bug.resolved - bug.created).days for bug in closed_bugs])
    return BugMetrics(
        opened=opened,
        closed=len(closed_bugs),
        open_total=len(open_bugs),
        open_by_severity=dict(severity),
        reopened=sum(1 for bug in bugs if bug.reopened),
        mttf_days=mttf,
    )


def _detect(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    issue_by_key = {issue.key: issue for issue in state.issues}
    task_by_id = {task.task_id: task for task in state.wbs_tasks}
    anomalies: list[Anomaly] = []

    for issue in state.issues:
        if issue.status == "Done" and issue.key not in rec.issue_commit_links:
            anomalies.append(_anomaly("ANOM-PG-001", "Progress", "High", "Done without commit", issue.key, "Done issue has no linked commit", [issue.source_ref]))

    for pr in state.prs:
        if pr.state == "merged":
            for key in pr.jira_keys:
                issue = issue_by_key.get(key)
                if issue and issue.status != "Done":
                    anomalies.append(_anomaly("ANOM-PG-002", "Progress", "Medium", "Merged PR before Done", f"PR#{pr.number}", f"{key} is {issue.status}", [pr.source_ref, issue.source_ref]))

    for task_id in rec.slipped_tasks:
        task = task_by_id[task_id]
        anomalies.append(_anomaly("ANOM-PG-003", "Progress", "High", "WBS task slipped", task_id, f"{task.jira_key} not Done by planned end", [task.source_ref]))

    for phase in rec.phase_progress:
        if abs(phase.variance) > 10:
            anomalies.append(_anomaly("ANOM-PG-004", "Progress", "High", "Phase variance", phase.phase, f"variance {phase.variance:.1f}%", []))

    for key in rec.orphan_issues:
        issue = issue_by_key[key]
        anomalies.append(_anomaly("ANOM-PG-005", "Progress", "Low", "Orphan issue", key, "Issue has no WBS parent", [issue.source_ref]))

    for bug in [issue for issue in state.issues if issue.issue_type == "Bug" and issue.status != "Done"]:
        if (state.period_end - bug.updated).days > 14:
            anomalies.append(_anomaly("ANOM-BG-001", "Bug", "Medium", "Stale open bug", bug.key, f"updated {(state.period_end - bug.updated).days} days ago", [bug.source_ref]))
        if bug.priority in {"Severity-1", "Blocker", "Highest"}:
            anomalies.append(_anomaly("ANOM-BG-002", "Bug", "High", "Critical open bug", bug.key, f"{bug.priority} is unresolved", [bug.source_ref]))

    reopened = [issue for issue in state.issues if issue.issue_type == "Bug" and issue.reopened]
    if len(reopened) > 2:
        item = ",".join(issue.key for issue in reopened)
        anomalies.append(_anomaly("ANOM-BG-003", "Bug", "Medium", "Reopened bug spike", item, f"{len(reopened)} bugs reopened", [issue.source_ref for issue in reopened]))

    for message in state.messages:
        if BLOCKER_RE.search(message.text) and not JIRA_KEY_RE.search(message.text):
            anomalies.append(_anomaly("ANOM-RK-001", "Risk", "Medium", "Untracked blocker", message.msg_id, "Blocker message has no Jira key", [message.source_ref]))

    for item in state.minute_items:
        if item.kind in {"decision", "action_item"} and not _has_follow_up(item.text, state):
            anomalies.append(_anomaly("ANOM-RK-002", "Risk", "Medium", "Minute item not actioned", item.source_ref.ref_id, "No matching issue or Slack follow-up", [item.source_ref]))

    low_sprints = [metric for metric in state.sprints if metric.completion_pct < 70]
    if len(low_sprints) >= 2:
        item = ",".join(metric.sprint for metric in low_sprints[:2])
        anomalies.append(_anomaly("ANOM-SC-001", "Schedule", "High", "Low sprint completion trend", item, "2 consecutive sprints below 70%", []))

    for pr in state.prs:
        if pr.state == "merged" and (not pr.reviewers or pr.author in pr.reviewers):
            anomalies.append(_anomaly("ANOM-QL-001", "Quality", "Medium", "Review gap", f"PR#{pr.number}", "Merged PR has no independent reviewer", [pr.source_ref]))
        if pr.ci_status == "failure":
            anomalies.append(_anomaly("ANOM-QL-002", "Quality", "High", "Failing CI", f"PR#{pr.number}", "PR has failing CI", [pr.source_ref]))

    completed = [issue for issue in state.issues if issue.key in rec.completed_in_period]
    total_sp = sum(issue.story_points for issue in completed)
    by_assignee = defaultdict(float)
    refs_by_assignee = defaultdict(list)
    for issue in completed:
        by_assignee[issue.assignee] += issue.story_points
        refs_by_assignee[issue.assignee].append(issue.source_ref)
    for assignee, story_points in by_assignee.items():
        if total_sp and story_points / total_sp > 0.4:
            anomalies.append(_anomaly("ANOM-RS-001", "Resource", "Medium", "Delivery concentration", assignee, f"{assignee} closed {story_points:.1f} of {total_sp:.1f} story points", refs_by_assignee[assignee]))

    for item in state.minute_items:
        if item.kind == "question" and not _question_answered(item.text, state):
            anomalies.append(_anomaly("ANOM-CS-001", "Consistency", "High", "Question without follow-up", item.source_ref.ref_id, "No follow-up within 5 business days", [item.source_ref]))

    return anomalies


def _anomaly(rule_id: str, category: str, severity: str, title: str, item: str, detail: str, evidence: list) -> Anomaly:
    return Anomaly(rule_id=rule_id, category=category, severity=severity, title=title, item=item, detail=detail, evidence=evidence)


def _has_follow_up(text: str, state: ProjectState) -> bool:
    words = _keywords(text)
    if not words:
        return False
    for issue in state.issues:
        if issue.created >= state.period_start and len(words & _keywords(issue.summary)) >= 2:
            return True
    for message in state.messages:
        if len(words & _keywords(message.text)) >= 3:
            return True
    return False


def _question_answered(text: str, state: ProjectState) -> bool:
    words = _keywords(text)
    for message in state.messages:
        if message.ts.date() > state.period_start and len(words & _keywords(message.text)) >= 3:
            return True
    return False


def _keywords(text: str) -> set[str]:
    stop = {"the", "and", "to", "by", "as", "a", "new", "we", "can", "when", "expect", "be", "ready", "asked"}
    return {word for word in re.findall(r"[a-z0-9]+", text.lower().replace("-", " ")) if len(word) > 2 and word not in stop}


def _average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


if __name__ == "__main__":
    main()
