"""Portfolio roll-up over multiple project reports."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from insighthub.anomalies import detect
from insighthub.datasource import load
from insighthub.export import export
from insighthub.facts import build_facts
from insighthub.report import generate as generate_report
from insighthub.reconcile import reconcile
from insighthub.schema import (
    Fact,
    Facts,
    PortfolioFacts,
    PortfolioProjectSummary,
    ProjectState,
    ReconcileResult,
    Report,
    ReportSection,
    SectionFacts,
)
from insighthub.validate import validate

NUMBER_RE = re.compile(r"\d+(?:\.\d+)?%?")
KEY_RE = re.compile(r"\b(?:[A-Z][A-Z0-9]+-\d+|PR#\d+|[0-9a-fA-F]{7,})\b")


@dataclass(frozen=True)
class ProjectBundle:
    """One generated project report plus the computed inputs behind it."""

    state: ProjectState
    rec: ReconcileResult
    facts: Facts
    report: Report
    paths: dict[str, str]


def generate_portfolio(
    connections_paths: list[str],
    lang: str,
    use_llm: bool,
    out: str,
    template_name: str | None = None,
) -> dict[str, str]:
    """Generate weekly reports per project, then export a portfolio dashboard."""

    if len(connections_paths) < 2:
        raise ValueError("Portfolio mode requires at least two connections files")

    output_dir = Path(out)
    bundles = [
        _generate_project_bundle(
            connections_path,
            lang,
            use_llm,
            output_dir / "projects",
            output_dir,
            template_name,
        )
        for connections_path in connections_paths
    ]
    portfolio_facts = build_portfolio_facts(bundles)
    portfolio_report = _build_portfolio_report(portfolio_facts)
    violations = validate(portfolio_report, portfolio_facts)
    if violations:
        raise RuntimeError("Portfolio validation failed: " + "; ".join(violations))
    for section in portfolio_report.sections:
        section.validated = True
    return export(portfolio_report, portfolio_facts, out)


def build_portfolio_facts(bundles: list[ProjectBundle]) -> PortfolioFacts:
    """Build deterministic portfolio facts from generated weekly project bundles."""

    if not bundles:
        raise ValueError("At least one project bundle is required")

    projects = [_project_summary(bundle) for bundle in bundles]
    start = min(bundle.state.period_start for bundle in bundles)
    end = max(bundle.state.period_end for bundle in bundles)
    overall_status = _portfolio_status([bundle.facts.overall_status for bundle in bundles])
    sections = [_overview_section(projects), _dashboard_section(projects, bundles)]
    allowed_numbers = sorted(
        {
            match.group(0)
            for section in sections
            for fact in [*section.facts, *section.bullet_items]
            for match in NUMBER_RE.finditer(fact.value)
        },
        key=lambda value: (float(value.rstrip("%")), value),
    )
    allowed_keys = sorted(
        {
            match.group(0)[:7] if len(match.group(0)) >= 7 and re.fullmatch(r"[0-9a-fA-F]{7,}", match.group(0)) else match.group(0)
            for section in sections
            for fact in [*section.facts, *section.bullet_items]
            for match in KEY_RE.finditer(fact.value)
        }
        | {key for bundle in bundles for key in bundle.facts.allowed_keys}
    )
    return PortfolioFacts(
        project_name="InsightHub Portfolio",
        period_start=start,
        period_end=end,
        overall_status=overall_status,
        sections=sections,
        anomalies=[anomaly for bundle in bundles for anomaly in bundle.facts.anomalies],
        allowed_keys=allowed_keys,
        allowed_numbers=allowed_numbers,
        projects=projects,
    )


def _generate_project_bundle(
    connections_path: str,
    lang: str,
    use_llm: bool,
    projects_dir: Path,
    root_out: Path,
    template_name: str | None,
) -> ProjectBundle:
    state = load(connections_path)
    rec = reconcile(state)
    anomalies = detect(state, rec)
    facts = build_facts(state, rec, anomalies)
    report = generate_report(facts, lang=lang, use_llm=use_llm, report_type="weekly")
    violations = validate(report, facts)
    if violations and use_llm:
        report = generate_report(
            facts,
            lang=lang,
            use_llm=True,
            violations=violations,
            report_type="weekly",
        )
        violations = validate(report, facts)
    if violations:
        report = generate_report(facts, lang=lang, use_llm=False, report_type="weekly")
        violations = validate(report, facts)
    if violations:
        raise RuntimeError(
            f"Project report validation failed for {state.project_name}: " + "; ".join(violations)
        )
    for section in report.sections:
        section.validated = True
    project_out = projects_dir / _slug(state.project_name)
    paths = export(report, facts, str(project_out), template_name=template_name)
    for key in ("weekly_docx", "weekly_md"):
        if key in paths:
            paths[key] = Path(paths[key]).relative_to(root_out).as_posix()
    return ProjectBundle(state=state, rec=rec, facts=facts, report=report, paths=paths)


def _project_summary(bundle: ProjectBundle) -> PortfolioProjectSummary:
    top_risks = _top_risks(bundle.facts, bundle.rec)
    metrics = [
        next((fact.value for fact in bundle.facts.sections[-1].facts if fact.id == "metrics.velocity"), "0 story points done"),
        next((fact.value for fact in bundle.facts.sections[-1].facts if fact.id == "metrics.throughput"), "0 issues completed"),
        next((fact.value for fact in bundle.facts.sections[-1].facts if fact.id == "metrics.github"), "0 commits and 0 PRs"),
    ]
    return PortfolioProjectSummary(
        project_name=bundle.state.project_name,
        overall_status=bundle.facts.overall_status,
        period_start=bundle.state.period_start,
        period_end=bundle.state.period_end,
        top_risks=top_risks,
        headline_metrics=metrics,
        weekly_docx_path=bundle.paths.get("weekly_docx", ""),
        weekly_md_path=bundle.paths.get("weekly_md", ""),
    )


def _overview_section(projects: list[PortfolioProjectSummary]) -> SectionFacts:
    counts = {
        "Green": sum(1 for project in projects if project.overall_status == "Green"),
        "Yellow": sum(1 for project in projects if project.overall_status == "Yellow"),
        "Red": sum(1 for project in projects if project.overall_status == "Red"),
    }
    return SectionFacts(
        section_id="portfolio_overview",
        title="Portfolio Overview",
        facts=[
            Fact(
                id="portfolio.projects",
                label="Projects covered",
                value=f"{len(projects)} projects covered",
            ),
            Fact(
                id="portfolio.status_mix",
                label="Status mix",
                value=f"Green {counts['Green']}, Yellow {counts['Yellow']}, Red {counts['Red']}",
            ),
        ],
    )


def _dashboard_section(projects: list[PortfolioProjectSummary], bundles: list[ProjectBundle]) -> SectionFacts:
    bullet_items: list[Fact] = []
    for project, bundle in zip(projects, bundles, strict=True):
        citations = [
            reference
            for section in bundle.facts.sections
            for fact in [*section.facts, *section.bullet_items]
            for reference in fact.citations
        ]
        risks = "; ".join(project.top_risks[:3]) if project.top_risks else "No active high or medium risks"
        metrics = "; ".join(project.headline_metrics)
        md_link = _portable_path(project.weekly_md_path)
        docx_link = _portable_path(project.weekly_docx_path)
        bullet_items.append(
            Fact(
                id=f"portfolio.project.{_slug(project.project_name)}",
                label=project.project_name,
                value=(
                    f"{project.project_name}: {project.overall_status}; top 3 risks: {risks}; "
                    f"headline metrics: {metrics}; drill-down: "
                    f"[weekly.md]({md_link}) and [weekly.docx]({docx_link})"
                ),
                citations=citations[:12],
            )
        )
    return SectionFacts(
        section_id="portfolio_dashboard",
        title="Portfolio Dashboard",
        bullet_items=bullet_items,
    )


def _build_portfolio_report(facts: PortfolioFacts) -> Report:
    sections = [
        ReportSection(
            section_id=section.section_id,
            title=section.title,
            body=_render_section(section),
        )
        for section in facts.sections
    ]
    return Report(
        project_name=facts.project_name,
        period_start=facts.period_start,
        period_end=facts.period_end,
        report_type="portfolio",
        language="en",
        overall_status=facts.overall_status,
        sections=sections,
    )


def _render_section(section: SectionFacts) -> str:
    lines = [f"- {fact.label}: {fact.value}{_citations(fact)}" for fact in section.facts]
    lines.extend(f"- {fact.value}{_citations(fact)}" for fact in section.bullet_items)
    return "\n".join(lines) if lines else "(no data)"


def _citations(fact: Fact) -> str:
    tokens = [citation.cite() for citation in fact.citations]
    return f" {' '.join(tokens)}" if tokens else ""


def _top_risks(facts: Facts, rec: ReconcileResult) -> list[str]:
    risks = [
        f"{anomaly.severity} {anomaly.category}: {anomaly.item}"
        for anomaly in facts.anomalies
        if anomaly.severity in {"High", "Medium"} and anomaly.category in {"Risk", "Schedule", "Progress"}
    ]
    if not risks:
        risks = [f"Slipped task {task_id}" for task_id in rec.slipped_tasks]
    return risks[:3]


def _portfolio_status(statuses: list[str]) -> str:
    if "Red" in statuses:
        return "Red"
    if "Yellow" in statuses:
        return "Yellow"
    return "Green"


def _portable_path(path: str) -> str:
    return Path(path).as_posix()


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "project"
