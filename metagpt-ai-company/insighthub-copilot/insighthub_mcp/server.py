"""FastMCP server exposing InsightHub data and report pipeline tools."""

from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from fastmcp import FastMCP

from insighthub.schema import Report, ReportSection
from insighthub_mcp.adapters.api_adapter import ChatApiAdapter, GithubApiAdapter, JiraApiAdapter
from insighthub_mcp.adapters.file_adapter import ChatFileAdapter, GithubFileAdapter, JiraFileAdapter

mcp = FastMCP("insighthub-mcp")
_CACHE: dict[str, Any] = {}


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _load_config(connections_path: str = "connections.yaml") -> dict[str, Any]:
    path = Path(connections_path)
    if not path.is_absolute():
        path = _repo_root() / path
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _resolve_path(value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = _repo_root() / path
    return path


def _period(period_start: str, period_end: str) -> tuple[date, date]:
    return date.fromisoformat(period_start), date.fromisoformat(period_end)


def _adapter(system: str, connections_path: str = "connections.yaml"):
    config = _load_config(connections_path)
    system_config = config["systems"][system]
    if system_config.get("adapter") == "api":
        return {
            "jira": JiraApiAdapter,
            "chat": ChatApiAdapter,
            "github": GithubApiAdapter,
        }[system](system_config)

    path = _resolve_path(system_config["file"])
    return {
        "jira": JiraFileAdapter,
        "chat": ChatFileAdapter,
        "github": GithubFileAdapter,
    }[system](path)


def _audit(tool: str, params: dict[str, Any]) -> None:
    output_dir = _repo_root() / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    audit_path = output_dir / "audit_log.md"
    timestamp = datetime.now(timezone.utc).isoformat()
    rendered_params = ", ".join(f"{key}={value!r}" for key, value in params.items())
    with audit_path.open("a", encoding="utf-8") as handle:
        handle.write(f"- {timestamp} · {tool} · {rendered_params}\n")


def _cached_facts():
    facts = _CACHE.get("facts")
    if facts is None:
        return None
    return facts


def _report_from_sections(sections: list[dict], lang: str = "ja") -> Report | dict:
    facts = _cached_facts()
    if facts is None:
        return {"error": "call get_project_facts first"}

    title_by_id = {section.section_id: section.title for section in facts.sections}
    report_sections = [
        ReportSection(
            section_id=str(item.get("section_id", "")),
            title=str(item.get("title") or title_by_id.get(str(item.get("section_id", "")), "")),
            body=str(item.get("body", "")),
        )
        for item in sections
    ]
    return Report(
        project_name=facts.project_name,
        period_start=facts.period_start,
        period_end=facts.period_end,
        language=lang,
        overall_status=facts.overall_status,
        sections=report_sections,
    )


@mcp.tool
def list_jira_issues(period_start: str, period_end: str, connections_path: str = "connections.yaml") -> dict:
    """List Jira issues and sprint metrics for a reporting period."""

    _audit("list_jira_issues", {"period_start": period_start, "period_end": period_end})
    start, end = _period(period_start, period_end)
    payload = _adapter("jira", connections_path).fetch(start, end)[0]
    return payload


@mcp.tool
def list_chat_messages(period_start: str, period_end: str, connections_path: str = "connections.yaml") -> dict:
    """List chat messages for a reporting period."""

    _audit("list_chat_messages", {"period_start": period_start, "period_end": period_end})
    start, end = _period(period_start, period_end)
    return {"messages": _adapter("chat", connections_path).fetch(start, end)}


@mcp.tool
def list_code_activity(period_start: str, period_end: str, connections_path: str = "connections.yaml") -> dict:
    """List GitHub commits and pull requests for a reporting period."""

    _audit("list_code_activity", {"period_start": period_start, "period_end": period_end})
    start, end = _period(period_start, period_end)
    return _adapter("github", connections_path).fetch(start, end)[0]


@mcp.tool
def get_project_facts(period_start: str = "", period_end: str = "") -> dict:
    """Build and cache deterministic project facts for a reporting period."""

    _audit("get_project_facts", {"period_start": period_start, "period_end": period_end})
    try:
        from insighthub.anomalies import detect
        from insighthub.datasource import load
        from insighthub.facts import build_facts
        from insighthub.reconcile import reconcile

        state = load("connections.yaml")
        rec = reconcile(state)
        anoms = detect(state, rec)
        facts = build_facts(state, rec, anoms)
        _CACHE["facts"] = facts
        return facts.model_dump(mode="json")
    except Exception as exc:
        return {"error": str(exc)}


@mcp.tool
def validate_report(sections: list[dict]) -> dict:
    """Validate draft report sections against cached Facts allow-lists."""

    _audit("validate_report", {"section_count": len(sections)})
    from insighthub.validate import validate

    report = _report_from_sections(sections)
    if isinstance(report, dict):
        return report
    facts = _cached_facts()
    violations = validate(report, facts)
    return {"ok": not violations, "violations": violations}


@mcp.tool
def export_report(sections: list[dict], lang: str = "ja") -> dict:
    """Validate and export a report from cached Facts."""

    _audit("export_report", {"section_count": len(sections), "lang": lang})
    from insighthub.export import export
    from insighthub.validate import validate

    report = _report_from_sections(sections, lang=lang)
    if isinstance(report, dict):
        return report
    facts = _cached_facts()
    violations = validate(report, facts)
    if violations:
        return {"error": "validation failed", "violations": violations}

    for section in report.sections:
        section.validated = True
    paths = export(report, facts, "output")
    paths.setdefault("weekly_pdf", None)
    _audit("export_report.completed", {"paths": paths})
    return {"ok": True, "paths": paths}


if __name__ == "__main__":
    mcp.run()
