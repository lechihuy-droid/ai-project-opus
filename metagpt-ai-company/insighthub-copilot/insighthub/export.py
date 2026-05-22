"""Export validated reports to DOCX, Markdown, traceability, and audit files."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from insighthub.schema import Fact, Facts, Report
from insighthub.templating import SECTIONS, render

logger = logging.getLogger(__name__)


def export(report: Report, facts: Facts, out_dir: str = "output") -> dict[str, str]:
    """Export report artifacts and return their file paths."""

    output_dir = Path(out_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    template_path = Path("templates/weekly_template.docx")
    if not template_path.exists():
        from scripts.build_template import build_template

        build_template(template_path)

    docx_path = output_dir / "weekly.docx"
    md_path = output_dir / "weekly.md"
    traceability_path = output_dir / "traceability.json"
    audit_path = output_dir / "audit_log.md"

    document = render(report, str(template_path))
    document.save(docx_path)
    pdf_path = _to_pdf(str(docx_path))

    md_path.write_text(_build_markdown(report), encoding="utf-8")
    traceability_path.write_text(
        json.dumps(_build_traceability(facts), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    audit_text = _build_audit_log(report, facts)
    if audit_path.exists():
        existing_audit = audit_path.read_text(encoding="utf-8").rstrip()
        audit_path.write_text(f"{existing_audit}\n\n{audit_text}", encoding="utf-8")
    else:
        audit_path.write_text(audit_text, encoding="utf-8")

    paths = {
        "weekly_docx": str(docx_path),
        "weekly_md": str(md_path),
        "traceability_json": str(traceability_path),
        "audit_log_md": str(audit_path),
    }
    if pdf_path:
        paths["weekly_pdf"] = pdf_path
    return paths


def _to_pdf(docx_path: str) -> str | None:
    """Convert DOCX to PDF when docx2pdf/Word is available."""

    pdf_path = str(Path(docx_path).with_suffix(".pdf"))
    try:
        from docx2pdf import convert

        convert(docx_path, pdf_path)
    except Exception as exc:
        logger.warning("PDF skipped: %s", exc)
        return None
    return pdf_path


def _build_markdown(report: Report) -> str:
    section_by_id = {section.section_id: section for section in report.sections}
    lines = [
        f"# {report.project_name} — Weekly Status Report",
        "",
        f"Period: {report.period_start.isoformat()} - {report.period_end.isoformat()}",
        f"Overall Status: {report.overall_status}",
        "",
    ]

    for section_id, default_title in SECTIONS:
        section = section_by_id.get(section_id)
        title = section.title if section else default_title
        body = section.body if section and section.body else "(no data)"
        lines.extend([f"## {title}", "", body, ""])

    return "\n".join(lines).rstrip() + "\n"


def _build_traceability(facts: Facts) -> dict[str, dict[str, object]]:
    traceability: dict[str, dict[str, object]] = {}
    for fact in _iter_facts(facts):
        traceability[fact.id] = {
            "label": fact.label,
            "value": fact.value,
            "citations": [
                {
                    "system": citation.system,
                    "ref_id": citation.ref_id,
                    "label": citation.label,
                    "url": citation.url,
                }
                for citation in fact.citations
            ],
        }
    return traceability


def _iter_facts(facts: Facts) -> list[Fact]:
    result: list[Fact] = []
    for section in facts.sections:
        result.extend(section.facts)
        result.extend(section.bullet_items)
    return result


def _build_audit_log(report: Report, facts: Facts) -> str:
    fact_count = len(_iter_facts(facts))
    section_ids = [section_id for section_id, _title in SECTIONS]
    lines = [
        "# Audit Log",
        "",
        f"- Timestamp: {datetime.now(timezone.utc).isoformat()}",
        f"- Project: {report.project_name}",
        f"- Period: {report.period_start.isoformat()} - {report.period_end.isoformat()}",
        f"- Fact count: {fact_count}",
        f"- Anomaly count: {len(facts.anomalies)}",
        f"- Sections exported: {', '.join(section_ids)}",
        "- Model used: claude-opus-4-7",
        "",
    ]
    return "\n".join(lines)
