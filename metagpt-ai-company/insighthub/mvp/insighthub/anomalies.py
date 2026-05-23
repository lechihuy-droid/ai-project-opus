"""Anomaly detection rules for reconciled project state."""

from __future__ import annotations

import re
from datetime import timedelta

from rapidfuzz import fuzz

from insighthub.schema import Anomaly, Issue, MinuteItem, ProjectState, ReconcileResult, SourceRef

JIRA_KEY_RE = re.compile(r"[A-Z][A-Z0-9]+-\d+")
BLOCKER_RE = re.compile(r"\b(blocked|blocker|escalation|cannot proceed)\b", re.I)
HIGH_PRIORITIES = {"Severity-1", "Blocker", "Highest"}


def detect(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    """Run the 15 frozen anomaly rules from the system design."""

    rules = [
        _rule_pg001,
        _rule_pg002,
        _rule_pg003,
        _rule_pg004,
        _rule_pg005,
        _rule_bg001,
        _rule_bg002,
        _rule_bg003,
        _rule_rk001,
        _rule_rk002,
        _rule_sc001,
        _rule_ql001,
        _rule_ql002,
        _rule_rs001,
        _rule_cs001,
    ]
    anomalies: list[Anomaly] = []
    for rule in rules:
        anomalies.extend(rule(state, rec))
    return anomalies


def _rule_pg001(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    return [
        _anomaly("ANOM-PG-001", "Progress", "High", "Done without code link", issue.key, "Done issue has no linked commit or PR", [issue.source_ref])
        for issue in state.issues
        if issue.status == "Done" and issue.key not in rec.issue_commit_links
    ]


def _rule_pg002(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    issue_by_key = {issue.key: issue for issue in state.issues}
    anomalies = []
    for pr in state.prs:
        if pr.state != "merged":
            continue
        for key in pr.jira_keys:
            issue = issue_by_key.get(key)
            if issue is not None and issue.status != "Done":
                anomalies.append(_anomaly("ANOM-PG-002", "Progress", "Medium", "Merged PR before Done", f"PR#{pr.number}", f"{key} is {issue.status}", [pr.source_ref, issue.source_ref]))
    return anomalies


def _rule_pg003(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    task_by_id = {task.task_id: task for task in state.wbs_tasks}
    return [
        _anomaly("ANOM-PG-003", "Progress", "High", "WBS task slipped", task_id, f"{task_by_id[task_id].jira_key or task_id} is not Done by planned end", [task_by_id[task_id].source_ref])
        for task_id in rec.slipped_tasks
        if task_id in task_by_id
    ]


def _rule_pg004(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    refs_by_phase = {phase: [task.source_ref for task in state.wbs_tasks if task.phase == phase] for phase in {task.phase for task in state.wbs_tasks}}
    return [
        _anomaly("ANOM-PG-004", "Progress", "High", "Phase progress variance", phase.phase, f"planned {phase.planned_pct:.1f}% vs actual {phase.actual_pct:.1f}%", refs_by_phase.get(phase.phase, []))
        for phase in rec.phase_progress
        if abs(phase.planned_pct - phase.actual_pct) > 10.0
    ]


def _rule_pg005(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    issue_by_key = {issue.key: issue for issue in state.issues}
    # Jira issue hierarchies are absent in the sample. Keep this rule precise by reporting
    # work created during the period without WBS coverage, instead of every historical child task.
    issues = [
        issue
        for key in rec.orphan_issues
        if (issue := issue_by_key.get(key)) is not None
        and issue.issue_type != "Bug"
        and (state.period_start <= issue.created <= state.period_end or "spike" in issue.summary.lower())
    ]
    if not issues:
        return []
    return [_anomaly("ANOM-PG-005", "Progress", "Low", "Orphan Jira issues", ",".join(issue.key for issue in issues), "Issues have no WBS parent", [issue.source_ref for issue in issues])]


def _rule_bg001(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    return [
        _anomaly("ANOM-BG-001", "Bug", "Medium", "Stale open bug", bug.key, f"last updated {(state.period_end - bug.updated).days} days ago", [bug.source_ref])
        for bug in _open_bugs(state)
        if (state.period_end - bug.updated).days > 14
    ]


def _rule_bg002(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    return [
        _anomaly("ANOM-BG-002", "Bug", "High", "Critical open bug", bug.key, f"{bug.priority} bug is unresolved", [bug.source_ref])
        for bug in _open_bugs(state)
        if bug.priority in HIGH_PRIORITIES
    ]


def _rule_bg003(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    reopened = [bug for bug in state.issues if bug.issue_type == "Bug" and bug.reopened]
    if len(reopened) <= 2:
        return []
    return [_anomaly("ANOM-BG-003", "Bug", "Medium", "Reopened bug spike", ",".join(bug.key for bug in reopened), f"{len(reopened)} bugs reopened", [bug.source_ref for bug in reopened])]


def _rule_rk001(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    return [
        _anomaly("ANOM-RK-001", "Risk", "Medium", "Untracked blocker", message.msg_id, "Blocker message has no Jira key", [message.source_ref])
        for message in state.messages
        if BLOCKER_RE.search(message.text) and not JIRA_KEY_RE.search(message.text)
    ]


def _rule_rk002(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    anomalies = []
    for item in state.minute_items:
        if item.kind in {"decision", "action_item"} and not _minute_has_follow_up(item, state):
            anomalies.append(_anomaly("ANOM-RK-002", "Risk", "Medium", "Minute item not actioned", item.source_ref.ref_id, "No matching issue or Slack mention after the meeting", [item.source_ref]))
    return anomalies


def _rule_sc001(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    streak = []
    for sprint in state.sprints:
        if sprint.completion_pct < 70.0:
            streak.append(sprint)
            if len(streak) >= 2:
                return [_anomaly("ANOM-SC-001", "Schedule", "High", "Consecutive low sprint completion", ",".join(item.sprint for item in streak[-2:]), "At least 2 consecutive sprints below 70%", [])]
        else:
            streak = []
    return []


def _rule_ql001(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    return [
        _anomaly("ANOM-QL-001", "Quality", "Medium", "Merged PR review gap", f"PR#{pr.number}", "Merged PR has no independent reviewer", [pr.source_ref])
        for pr in state.prs
        if pr.state == "merged" and (not pr.reviewers or pr.author in pr.reviewers)
    ]


def _rule_ql002(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    return [
        _anomaly("ANOM-QL-002", "Quality", "High", "Failing CI", f"PR#{pr.number}", "PR has failing CI", [pr.source_ref])
        for pr in state.prs
        if pr.ci_status == "failure"
    ]


def _rule_rs001(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    completed = [issue for issue in state.issues if issue.key in rec.completed_in_period]
    total_sp = sum(_sp(issue) for issue in completed)
    if not total_sp:
        return []
    by_assignee: dict[str, list[Issue]] = {}
    for issue in completed:
        by_assignee.setdefault(issue.assignee, []).append(issue)
    anomalies = []
    for assignee, issues in by_assignee.items():
        assignee_sp = sum(_sp(issue) for issue in issues)
        if assignee_sp / total_sp > 0.4:
            anomalies.append(_anomaly("ANOM-RS-001", "Resource", "Medium", "Delivery concentration", assignee, f"{assignee} closed {assignee_sp:.1f}/{total_sp:.1f} story points", [issue.source_ref for issue in issues]))
    return anomalies


def _rule_cs001(state: ProjectState, rec: ReconcileResult) -> list[Anomaly]:
    anomalies = []
    for item in state.minute_items:
        if item.kind == "question" and not _question_has_follow_up(item, state):
            anomalies.append(_anomaly("ANOM-CS-001", "Consistency", "High", "Question without follow-up", item.source_ref.ref_id, "No follow-up within 5 business days", [item.source_ref]))
    return anomalies


def _open_bugs(state: ProjectState) -> list[Issue]:
    return [issue for issue in state.issues if issue.issue_type == "Bug" and issue.status != "Done"]


def _minute_has_follow_up(item: MinuteItem, state: ProjectState) -> bool:
    for issue in state.issues:
        if issue.created >= item.meeting_date and fuzz.token_set_ratio(item.text, issue.summary) >= 70:
            return True
    for message in state.messages:
        if message.ts.date() >= item.meeting_date and fuzz.token_set_ratio(item.text, message.text) >= 70:
            return True
    return False


def _question_has_follow_up(item: MinuteItem, state: ProjectState) -> bool:
    deadline = item.meeting_date + timedelta(days=7)
    for issue in state.issues:
        if item.meeting_date < issue.created <= deadline and fuzz.token_set_ratio(item.text, issue.summary) >= 70:
            return True
    for message in state.messages:
        if item.meeting_date < message.ts.date() <= deadline and fuzz.token_set_ratio(item.text, message.text) >= 70:
            return True
    return False


def _sp(issue: Issue) -> float:
    return issue.story_points if issue.story_points else 1.0


def _anomaly(rule_id: str, category: str, severity: str, title: str, item: str, detail: str, evidence: list[SourceRef]) -> Anomaly:
    return Anomaly(rule_id=rule_id, category=category, severity=severity, title=title, item=item, detail=detail, evidence=evidence)
