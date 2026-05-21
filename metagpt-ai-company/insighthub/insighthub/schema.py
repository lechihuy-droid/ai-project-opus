"""Pydantic models for ingested data and reconciled project state.

Every ingested record carries a `source_ref` so any downstream fact can be
traced back to the exact Jira key / commit SHA / Slack message / WBS row /
meeting-minute paragraph it came from. This is the backbone of the
citation-and-traceability requirement and the hallucination guard.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

Severity = Literal["High", "Medium", "Low"]


class SourceRef(BaseModel):
    """A pointer back to one source record. Rendered into citations."""

    system: str            # jira | wbs | slack | teams | github | minutes
    ref_id: str            # e.g. "SAKURA-123", commit sha, slack ts, "P2-T05"
    label: str = ""        # human-readable description
    url: Optional[str] = None

    def cite(self) -> str:
        """Inline citation token, e.g. '[jira:SAKURA-123]'."""
        return f"[{self.system}:{self.ref_id}]"


# --------------------------------------------------------------------------
# Ingested records
# --------------------------------------------------------------------------
class Issue(BaseModel):
    key: str
    summary: str
    issue_type: str = "Task"          # Story | Task | Bug | Sub-task | Epic
    status: str = "To Do"             # To Do | In Progress | Done | ...
    priority: str = "Medium"          # Highest | High | Medium | Low | Severity-1
    assignee: str = ""
    story_points: float = 0.0
    created: date
    updated: date
    resolved: Optional[date] = None
    sprint: str = ""
    labels: list[str] = Field(default_factory=list)
    reopened: bool = False
    source_ref: SourceRef


class WBSTask(BaseModel):
    task_id: str
    phase: str
    name: str
    planned_start: date
    planned_end: date
    planned_mm: float = 0.0           # planned effort, man-months
    planned_pct: float = 0.0          # planned % complete as of report week-end
    owner: str = ""
    jira_key: str = ""                # explicit Jira link, if the WBS supplies it
    source_ref: SourceRef


class ChatMessage(BaseModel):
    msg_id: str
    channel: str
    user: str
    ts: datetime
    text: str
    source_ref: SourceRef


class Commit(BaseModel):
    sha: str
    message: str
    author: str
    date: datetime
    jira_keys: list[str] = Field(default_factory=list)
    source_ref: SourceRef


class PullRequest(BaseModel):
    number: int
    title: str
    author: str
    reviewers: list[str] = Field(default_factory=list)
    state: str = "open"               # open | merged | closed
    created: datetime
    merged_at: Optional[datetime] = None
    ci_status: str = ""               # success | failure | ""
    jira_keys: list[str] = Field(default_factory=list)
    source_ref: SourceRef


class MinuteItem(BaseModel):
    meeting_date: date
    kind: Literal["decision", "action_item", "question"]
    text: str
    owner: str = ""
    due: Optional[date] = None
    source_ref: SourceRef


# --------------------------------------------------------------------------
# Reconciliation output
# --------------------------------------------------------------------------
class Anomaly(BaseModel):
    """One cross-source signal detected by the anomaly engine."""

    rule_id: str                      # e.g. ANOM-PG-001
    category: str                     # Progress | Bug | Risk | Schedule | Quality | Resource | Consistency
    severity: Severity
    title: str                        # short rule name
    item: str                         # the affected item (Jira key, task, message)
    detail: str = ""                  # one-line explanation
    evidence: list[SourceRef] = Field(default_factory=list)


# --- Reconciliation output -------------------------------------------------
class IssueWBSLink(BaseModel):
    issue_key: str
    wbs_task_id: str
    method: str            # key | title-exact | fuzzy | none
    score: float = 0.0

class PhaseProgress(BaseModel):
    phase: str
    planned_pct: float
    actual_pct: float
    variance: float        # actual - planned
    issue_keys: list[str] = Field(default_factory=list)

class SprintMetric(BaseModel):
    sprint: str
    committed_sp: float
    completed_sp: float
    completion_pct: float

class BugMetrics(BaseModel):
    opened: int
    closed: int
    open_total: int
    open_by_severity: dict[str, int] = Field(default_factory=dict)
    reopened: int
    mttf_days: float

class ReconcileResult(BaseModel):
    links: list[IssueWBSLink] = Field(default_factory=list)
    orphan_issues: list[str] = Field(default_factory=list)
    untracked_wbs: list[str] = Field(default_factory=list)
    phase_progress: list[PhaseProgress] = Field(default_factory=list)
    overall_planned_pct: float = 0.0
    overall_actual_pct: float = 0.0
    bug_metrics: BugMetrics
    sprint_metrics: list[SprintMetric] = Field(default_factory=list)
    issue_commit_links: dict[str, list[str]] = Field(default_factory=dict)
    completed_in_period: list[str] = Field(default_factory=list)
    in_progress: list[str] = Field(default_factory=list)
    slipped_tasks: list[str] = Field(default_factory=list)

# --- Facts (đầu vào LLM) ---------------------------------------------------
class Fact(BaseModel):
    id: str                # vd "bugs.closed"
    label: str
    value: str             # render dạng string để LLM trích verbatim
    citations: list[SourceRef] = Field(default_factory=list)

class SectionFacts(BaseModel):
    section_id: str        # exec_summary|progress|completed|in_progress|
                           # next_week|blockers|bugs|decisions|metrics
    title: str
    facts: list[Fact] = Field(default_factory=list)
    bullet_items: list[Fact] = Field(default_factory=list)

class Facts(BaseModel):
    project_name: str
    period_start: date
    period_end: date
    overall_status: str    # Green | Yellow | Red
    sections: list[SectionFacts] = Field(default_factory=list)
    anomalies: list[Anomaly] = Field(default_factory=list)
    allowed_keys: list[str] = Field(default_factory=list)
    allowed_numbers: list[str] = Field(default_factory=list)

# --- Report (đầu ra LLM) ---------------------------------------------------
class ReportSection(BaseModel):
    section_id: str
    title: str
    body: str              # markdown, có citation inline [system:ref]
    validated: bool = False

class Report(BaseModel):
    project_name: str
    period_start: date
    period_end: date
    report_type: str = "weekly"
    language: str = "en"
    overall_status: str = "Green"
    sections: list[ReportSection] = Field(default_factory=list)


class ProjectState(BaseModel):
    """All ingested data for one project + reporting period."""

    project_name: str
    period_start: date
    period_end: date
    issues: list[Issue] = Field(default_factory=list)
    wbs_tasks: list[WBSTask] = Field(default_factory=list)
    messages: list[ChatMessage] = Field(default_factory=list)
    commits: list[Commit] = Field(default_factory=list)
    prs: list[PullRequest] = Field(default_factory=list)
    minute_items: list[MinuteItem] = Field(default_factory=list)
    sprints: list[SprintMetric] = Field(default_factory=list)

    def source_count(self) -> dict[str, int]:
        return {
            "jira": len(self.issues),
            "wbs": len(self.wbs_tasks),
            "chat": len(self.messages),
            "github": len(self.commits) + len(self.prs),
            "minutes": len(self.minute_items),
        }
