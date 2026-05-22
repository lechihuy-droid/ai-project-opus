"""Command-line entry point for InsightHub weekly report generation."""

from __future__ import annotations

import argparse

from insighthub.anomalies import detect
from insighthub.datasource import load
from insighthub.export import export
from insighthub.facts import build_facts
from insighthub.reconcile import reconcile
from insighthub.report import generate as generate_report
from insighthub.schema import ProjectState
from insighthub.validate import validate


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
    rec = reconcile(state)
    anomalies = detect(state, rec)
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
    """Build ProjectState from live data sources (MCP server + file uploads)."""
    return load()


if __name__ == "__main__":
    main()
