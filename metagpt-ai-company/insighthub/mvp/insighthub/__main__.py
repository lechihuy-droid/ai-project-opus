"""Command-line entry point for InsightHub report generation."""

from __future__ import annotations

import argparse

from insighthub.anomalies import detect
from insighthub.datasource import load
from insighthub.diff import extract_allowed_tokens, prepare_diff, save_snapshot
from insighthub.export import export
from insighthub.facts import build_facts
from insighthub.monthly import build_monthly_facts
from insighthub.portfolio import generate_portfolio
from insighthub.reconcile import reconcile
from insighthub.report import generate as generate_report
from insighthub.schema import ProjectState
from insighthub.validate import validate


def main() -> None:
    parser = argparse.ArgumentParser(prog="insighthub")
    subparsers = parser.add_subparsers(dest="command", required=True)
    generate_parser = subparsers.add_parser("generate")
    generate_parser.add_argument("--type", default="weekly", choices=["weekly", "monthly", "portfolio"])
    generate_parser.add_argument("--lang", default="ja", choices=["en", "ja", "vn"])
    generate_parser.add_argument("--no-llm", action="store_true")
    generate_parser.add_argument("--out", default="output")
    generate_parser.add_argument("--connections", nargs="+", default=["connections.yaml"])
    generate_parser.add_argument("--template", default=None)

    args = parser.parse_args()
    if args.command == "generate":
        generate(args.type, args.lang, not args.no_llm, args.out, args.connections, args.template)


def generate(
    report_type: str = "weekly",
    lang: str = "ja",
    use_llm: bool = True,
    out: str = "output",
    connections: str | list[str] = "connections.yaml",
    template: str | None = None,
) -> dict[str, str]:
    """Run the deterministic InsightHub pipeline and export artifacts."""

    connection_list = _normalize_connections(connections)
    if report_type == "portfolio":
        return generate_portfolio(connection_list, lang, use_llm, out, template)

    connection_path = connection_list[0]
    state = _load_state(connection_path)
    rec = reconcile(state)
    anomalies = detect(state, rec)
    if report_type == "monthly":
        facts = build_monthly_facts(state, rec, anomalies)
    else:
        facts = build_facts(state, rec, anomalies)
    diff_artifacts = None
    if report_type == "weekly":
        diff_artifacts = prepare_diff(state, rec, facts, out)
        facts.sections.append(diff_artifacts.section)
        extra_keys, extra_numbers = extract_allowed_tokens(diff_artifacts.section)
        facts.allowed_keys = sorted(set(facts.allowed_keys) | extra_keys)
        facts.allowed_numbers = sorted(
            set(facts.allowed_numbers) | extra_numbers,
            key=_number_sort_key,
        )
    report = generate_report(facts, lang=lang, use_llm=use_llm, report_type=report_type)
    violations = validate(report, facts)

    if violations and use_llm:
        report = generate_report(
            facts,
            lang=lang,
            use_llm=True,
            violations=violations,
            report_type=report_type,
        )
        violations = validate(report, facts)
    if violations:
        report = generate_report(facts, lang=lang, use_llm=False, report_type=report_type)
        violations = validate(report, facts)
    if violations:
        raise RuntimeError("Report validation failed: " + "; ".join(violations))

    for section in report.sections:
        section.validated = True
    diff_markdown = diff_artifacts.markdown if diff_artifacts is not None else None
    paths = export(report, facts, out, template_name=template, diff_markdown=diff_markdown)
    if diff_artifacts is not None:
        save_snapshot(diff_artifacts.snapshot, out)
    print(
        f"Generated {report_type} report: issues={len(state.issues)}, "
        f"anomalies={len(anomalies)}, status={facts.overall_status}, output={out}"
    )
    for label, path in paths.items():
        print(f"{label}: {path}")
    return paths


def _load_state(connections: str = "connections.yaml") -> ProjectState:
    """Build ProjectState from live data sources (MCP server + file uploads)."""
    return load(connections)


def _normalize_connections(connections: str | list[str]) -> list[str]:
    if isinstance(connections, str):
        values = [connections]
    else:
        values = connections
    result: list[str] = []
    for value in values:
        result.extend(item.strip() for item in str(value).split(",") if item.strip())
    if not result:
        raise ValueError("At least one connections path is required")
    return result


def _number_sort_key(value: str) -> tuple[float, str]:
    return (float(value.rstrip("%")), value)


if __name__ == "__main__":
    main()
