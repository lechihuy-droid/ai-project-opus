"""Generate report narrative from cited facts."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from insighthub import i18n
from insighthub.schema import Fact, Facts, Report, ReportSection

MODEL = "claude-opus-4-7"
STYLE_REFERENCE_MAX_CHARS = 2500


def generate(
    facts: Facts,
    lang: str = "en",
    use_llm: bool = True,
    violations: list[str] | None = None,
    report_type: str = "weekly",
) -> Report:
    """Generate a report, using Claude when configured and template output otherwise."""

    if use_llm and _anthropic_key():
        try:
            return _generate_llm(facts, lang, violations, report_type)
        except Exception:
            return _generate_template(facts, lang, report_type)
    return _generate_template(facts, lang, report_type)


def _generate_template(facts: Facts, lang: str, report_type: str = "weekly") -> Report:
    sections = []
    section_by_id = {section.section_id: section for section in facts.sections}
    for section_id in _section_order(facts):
        section = section_by_id.get(section_id)
        title = i18n.section_title(section_id, lang)
        body = _render_section(section.facts, section.bullet_items, lang) if section else i18n.no_data(lang)
        sections.append(ReportSection(section_id=section_id, title=title, body=body, validated=False))

    return Report(
        project_name=facts.project_name,
        period_start=facts.period_start,
        period_end=facts.period_end,
        report_type=report_type,
        language=lang,
        overall_status=facts.overall_status,
        sections=sections,
    )


def _render_section(facts: list[Fact], bullet_items: list[Fact], lang: str) -> str:
    lines: list[str] = []
    for fact in facts:
        label = i18n.label(fact.label, lang)
        value = i18n.localize_value(fact.value, lang)
        lines.append(f"- {label}: {value}{_citations(fact)}")
    for fact in bullet_items:
        value = i18n.localize_value(fact.value, lang)
        lines.append(f"- {value}{_citations(fact)}")
    return "\n".join(lines) if lines else i18n.no_data(lang)


def _citations(fact: Fact) -> str:
    tokens = [citation.cite() for citation in fact.citations]
    return f" {' '.join(tokens)}" if tokens else ""


def _generate_llm(facts: Facts, lang: str, violations: list[str] | None, report_type: str) -> Report:
    from anthropic import Anthropic

    section_order = _section_order(facts)
    client = Anthropic(api_key=_anthropic_key())
    response = client.messages.create(
        model=MODEL,
        max_tokens=3000,
        temperature=0,
        system=[
            {
                "type": "text",
                "text": _system_prompt(lang, violations, report_type, section_order, _style_reference()),
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": facts.model_dump_json(),
            }
        ],
    )
    payload = _parse_json_response(response)
    sections = []
    for item in payload:
        section_id = str(item.get("section_id", ""))
        if section_id not in section_order:
            continue
        sections.append(
            ReportSection(
                section_id=section_id,
                title=i18n.section_title(section_id, lang),
                body=str(item.get("body", "")).strip(),
                validated=False,
            )
        )
    seen = {section.section_id for section in sections}
    for section in _generate_template(facts, lang, report_type).sections:
        if section.section_id not in seen:
            sections.append(section)
    sections.sort(key=lambda section: section_order.index(section.section_id))

    return Report(
        project_name=facts.project_name,
        period_start=facts.period_start,
        period_end=facts.period_end,
        report_type=report_type,
        language=lang,
        overall_status=facts.overall_status,
        sections=sections,
    )


def _system_prompt(
    lang: str,
    violations: list[str] | None,
    report_type: str = "weekly",
    section_order: tuple[str, ...] | None = None,
    style_reference: str = "",
) -> str:
    retry = ""
    if violations:
        retry = "\nPrevious output failed validation. Fix these violations:\n" + "\n".join(
            f"- {violation}" for violation in violations
        )
    style = ""
    if style_reference:
        style = (
            "\nUse this previous-report style reference for tone only. "
            "Do not copy or reuse any numbers, IDs, dates, statuses, or source facts from it:\n"
            f"{style_reference}"
        )
    sections = ", ".join(section_order or ())
    return (
        f"You write an InsightHub {report_type} status report from a Facts JSON object only. "
        "Use only numbers and IDs that appear in Facts.allowed_numbers or Facts.allowed_keys. "
        "Do not invent ticket IDs, PRs, commits, dates, percentages, counts, names, or metrics. "
        "Preserve inline citations exactly as [system:ref] when using a fact. "
        "Return JSON only: an array of objects with section_id and body. "
        f"The sections are {sections}. "
        f"Write in language '{lang}'. For ja, use business keigo. For vn, use Vietnamese."
        f"{style}"
        f"{retry}"
    )


def _parse_json_response(response: Any) -> list[dict[str, Any]]:
    text = "".join(
        getattr(block, "text", "")
        for block in getattr(response, "content", [])
        if getattr(block, "type", "") == "text"
    ).strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    data = json.loads(text)
    if not isinstance(data, list):
        raise ValueError("Claude response must be a JSON array")
    return [item for item in data if isinstance(item, dict)]


def _anthropic_key() -> str | None:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        return key
    env_path = Path(".env")
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("ANTHROPIC_API_KEY="):
            value = line.split("=", 1)[1].strip().strip('"').strip("'")
            return value or None
    return None


def _section_order(facts: Facts) -> tuple[str, ...]:
    return tuple(section.section_id for section in facts.sections)


def _style_reference() -> str:
    try:
        from insighthub.datasource import load_previous_reports

        reports = load_previous_reports()
    except Exception:
        return ""
    excerpts = []
    for text in reports[:2]:
        cleaned = text.strip()
        if cleaned:
            excerpts.append(cleaned[:1200])
    return "\n\n---\n\n".join(excerpts)[:STYLE_REFERENCE_MAX_CHARS]
