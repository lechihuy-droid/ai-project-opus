"""Build weekly snapshot diffs and persist report history."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from insighthub.schema import Fact, Facts, ProjectState, ReconcileResult, SectionFacts

NUMBER_RE = re.compile(r"\d+(?:\.\d+)?%?")
KEY_RE = re.compile(r"\b(?:[A-Z][A-Z0-9]+-\d+|PR#\d+|[0-9a-fA-F]{7,})\b")
SECTION_ID = "changes_vs_last_report"
SECTION_TITLE = "Changes vs last report"


@dataclass(frozen=True)
class DiffArtifacts:
    """Computed diff outputs used by the CLI/export layer."""

    section: SectionFacts
    markdown: str
    snapshot: dict[str, Any]


def prepare_diff(
    state: ProjectState,
    rec: ReconcileResult,
    facts: Facts,
    out_dir: str,
) -> DiffArtifacts:
    """Build a diff section against the latest saved snapshot for the same project."""

    output_dir = Path(out_dir)
    history_dir = output_dir / "history"
    current_snapshot = _build_snapshot(state, rec, facts)
    previous_snapshot = load_latest_snapshot(history_dir, state.project_name)
    section = _build_section(previous_snapshot, current_snapshot, state, facts)
    markdown = _build_markdown(section)
    return DiffArtifacts(section=section, markdown=markdown, snapshot=current_snapshot)


def save_snapshot(snapshot: dict[str, Any], out_dir: str) -> Path:
    """Persist the current run snapshot under output/history."""

    history_dir = Path(out_dir) / "history"
    history_dir.mkdir(parents=True, exist_ok=True)
    filename = _next_snapshot_name(history_dir, str(snapshot["period_end"]))
    path = history_dir / filename
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def load_latest_snapshot(history_dir: Path, project_name: str) -> dict[str, Any] | None:
    """Return the newest snapshot file for the same project, if any."""

    if not history_dir.exists():
        return None
    matches: list[tuple[float, Path]] = []
    for path in history_dir.glob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if payload.get("project_name") == project_name:
            matches.append((path.stat().st_mtime, path))
    if not matches:
        return None
    _, latest = max(matches, key=lambda item: item[0])
    return json.loads(latest.read_text(encoding="utf-8"))


def extract_allowed_tokens(section: SectionFacts) -> tuple[set[str], set[str]]:
    """Extract validator allow-list additions from one computed diff section."""

    keys: set[str] = set()
    numbers: set[str] = set()
    for fact in [*section.facts, *section.bullet_items]:
        keys.update(KEY_RE.findall(fact.value))
        numbers.update(NUMBER_RE.findall(fact.value))
    return keys, numbers


def _build_snapshot(
    state: ProjectState,
    rec: ReconcileResult,
    facts: Facts,
) -> dict[str, Any]:
    metrics_fact_ids = {
        "throughput": "metrics.throughput",
        "velocity": "metrics.velocity",
        "closed_bugs": "bugs.closed",
        "open_bugs": "bugs.open_total",
    }
    metrics = {
        "throughput": len(rec.completed_in_period),
        "velocity": sum(issue.story_points for issue in state.issues if issue.key in rec.completed_in_period),
        "closed_bugs": rec.bug_metrics.closed,
        "open_bugs": rec.bug_metrics.open_total,
    }
    return {
        "project_name": state.project_name,
        "period_start": state.period_start.isoformat(),
        "period_end": state.period_end.isoformat(),
        "overall_status": facts.overall_status,
        "issues": {
            issue.key: {
                "summary": issue.summary,
                "status": issue.status,
            }
            for issue in state.issues
        },
        "metrics": metrics,
        "metric_fact_ids": metrics_fact_ids,
    }


def _build_section(
    previous: dict[str, Any] | None,
    current: dict[str, Any],
    state: ProjectState,
    facts: Facts,
) -> SectionFacts:
    if previous is None:
        return SectionFacts(
            section_id=SECTION_ID,
            title=SECTION_TITLE,
            bullet_items=[
                Fact(
                    id="changes_vs_last_report.none",
                    label="Changes vs last report",
                    value="No previous snapshot available.",
                    citations=[],
                )
            ],
        )

    issue_by_key = {issue.key: issue for issue in state.issues}
    metric_citations = _metric_citations(facts)
    bullet_items: list[Fact] = []

    previous_issues = previous.get("issues", {})
    current_issues = current.get("issues", {})
    newly_closed = sorted(
        key
        for key, issue in current_issues.items()
        if key in previous_issues
        and previous_issues[key].get("status") != "Done"
        and issue.get("status") == "Done"
    )
    for key in newly_closed:
        issue = issue_by_key.get(key)
        citations = [issue.source_ref] if issue is not None else []
        bullet_items.append(
            Fact(
                id=f"changes_vs_last_report.closed.{key}",
                label="Newly closed since last report",
                value=f"{key}: {previous_issues[key].get('status', 'Unknown')} -> Done",
                citations=citations,
            )
        )

    status_changes = sorted(
        key
        for key, issue in current_issues.items()
        if key in previous_issues
        and previous_issues[key].get("status") != issue.get("status")
        and issue.get("status") != "Done"
    )
    for key in status_changes:
        issue = issue_by_key.get(key)
        citations = [issue.source_ref] if issue is not None else []
        bullet_items.append(
            Fact(
                id=f"changes_vs_last_report.status.{key}",
                label="Status changed since last report",
                value=(
                    f"{key}: {previous_issues[key].get('status', 'Unknown')} -> "
                    f"{current_issues[key].get('status', 'Unknown')}"
                ),
                citations=citations,
            )
        )

    previous_metrics = previous.get("metrics", {})
    current_metrics = current.get("metrics", {})
    metric_labels = {
        "throughput": "Throughput",
        "velocity": "Velocity",
        "closed_bugs": "Closed bugs",
        "open_bugs": "Open bugs",
    }
    metric_suffixes = {
        "throughput": "issues completed",
        "velocity": "story points done",
        "closed_bugs": "bugs closed",
        "open_bugs": "bugs open",
    }
    for key in ("throughput", "velocity", "closed_bugs", "open_bugs"):
        if key not in previous_metrics:
            continue
        current_value = float(current_metrics.get(key, 0))
        previous_value = float(previous_metrics.get(key, 0))
        delta = current_value - previous_value
        if delta == 0:
            continue
        delta_text = _format_delta(delta)
        current_text = _format_number(current_value)
        citations = metric_citations.get(key, [])
        bullet_items.append(
            Fact(
                id=f"changes_vs_last_report.metric.{key}",
                label="Metric delta since last report",
                value=f"{metric_labels[key]} {delta_text}, {current_text} {metric_suffixes[key]}",
                citations=citations,
            )
        )

    if not bullet_items:
        bullet_items.append(
            Fact(
                id="changes_vs_last_report.stable",
                label="Changes vs last report",
                value="No changes detected versus the latest snapshot.",
                citations=[],
            )
        )

    return SectionFacts(section_id=SECTION_ID, title=SECTION_TITLE, bullet_items=bullet_items)


def _build_markdown(section: SectionFacts) -> str:
    lines = [f"# {section.title}", ""]
    for fact in [*section.facts, *section.bullet_items]:
        citations = " ".join(citation.cite() for citation in fact.citations)
        suffix = f" {citations}" if citations else ""
        lines.append(f"- {fact.label}: {fact.value}{suffix}")
    return "\n".join(lines).rstrip() + "\n"


def _metric_citations(facts: Facts) -> dict[str, list[Any]]:
    mapping = {
        "throughput": "metrics.throughput",
        "velocity": "metrics.velocity",
        "closed_bugs": "bugs.closed",
        "open_bugs": "bugs.open_total",
    }
    result: dict[str, list[Any]] = {}
    by_id = {
        fact.id: fact
        for section in facts.sections
        for fact in [*section.facts, *section.bullet_items]
    }
    for key, fact_id in mapping.items():
        fact = by_id.get(fact_id)
        result[key] = list(fact.citations) if fact is not None else []
    return result


def _next_snapshot_name(history_dir: Path, base_name: str) -> str:
    candidate = f"{base_name}.json"
    if not (history_dir / candidate).exists():
        return candidate
    index = 2
    while (history_dir / f"{base_name}-{index}.json").exists():
        index += 1
    return f"{base_name}-{index}.json"


def _format_delta(value: float) -> str:
    sign = "+" if value > 0 else "-"
    return f"{sign}{_format_number(abs(value))}"


def _format_number(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else f"{value:.1f}"
