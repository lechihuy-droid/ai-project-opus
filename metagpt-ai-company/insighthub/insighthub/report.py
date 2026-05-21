"""Generate weekly report narrative from cited facts."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from insighthub.facts import SECTION_TITLES
from insighthub.schema import Fact, Facts, Report, ReportSection

MODEL = "claude-opus-4-7"
SECTION_ORDER = tuple(SECTION_TITLES)


def generate(
    facts: Facts,
    lang: str = "en",
    use_llm: bool = True,
    violations: list[str] | None = None,
) -> Report:
    """Generate a report, using Claude when configured and template output otherwise."""

    if use_llm and _anthropic_key():
        try:
            return _generate_llm(facts, lang, violations)
        except Exception:
            return _generate_template(facts, lang)
    return _generate_template(facts, lang)


def _generate_template(facts: Facts, lang: str) -> Report:
    sections = []
    section_by_id = {section.section_id: section for section in facts.sections}
    for section_id in SECTION_ORDER:
        section = section_by_id.get(section_id)
        title = section.title if section else SECTION_TITLES[section_id]
        body = _render_section(section.facts, section.bullet_items) if section else "(no data)"
        sections.append(ReportSection(section_id=section_id, title=title, body=body, validated=False))

    return Report(
        project_name=facts.project_name,
        period_start=facts.period_start,
        period_end=facts.period_end,
        language=lang,
        overall_status=facts.overall_status,
        sections=sections,
    )


def _render_section(facts: list[Fact], bullet_items: list[Fact]) -> str:
    lines: list[str] = []
    for fact in facts:
        lines.append(f"- {fact.label}: {fact.value}{_citations(fact)}")
    for fact in bullet_items:
        lines.append(f"- {fact.value}{_citations(fact)}")
    return "\n".join(lines) if lines else "(no data)"


def _citations(fact: Fact) -> str:
    tokens = [citation.cite() for citation in fact.citations]
    return f" {' '.join(tokens)}" if tokens else ""


def _generate_llm(facts: Facts, lang: str, violations: list[str] | None) -> Report:
    from anthropic import Anthropic

    client = Anthropic(api_key=_anthropic_key())
    response = client.messages.create(
        model=MODEL,
        max_tokens=3000,
        temperature=0,
        system=[
            {
                "type": "text",
                "text": _system_prompt(lang, violations),
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
    title_by_id = {section.section_id: section.title for section in facts.sections}
    for item in payload:
        section_id = str(item.get("section_id", ""))
        if section_id not in SECTION_ORDER:
            continue
        sections.append(
            ReportSection(
                section_id=section_id,
                title=title_by_id.get(section_id, SECTION_TITLES[section_id]),
                body=str(item.get("body", "")).strip(),
                validated=False,
            )
        )
    seen = {section.section_id for section in sections}
    for section in _generate_template(facts, lang).sections:
        if section.section_id not in seen:
            sections.append(section)
    sections.sort(key=lambda section: SECTION_ORDER.index(section.section_id))

    return Report(
        project_name=facts.project_name,
        period_start=facts.period_start,
        period_end=facts.period_end,
        language=lang,
        overall_status=facts.overall_status,
        sections=sections,
    )


def _system_prompt(lang: str, violations: list[str] | None) -> str:
    retry = ""
    if violations:
        retry = "\nPrevious output failed validation. Fix these violations:\n" + "\n".join(
            f"- {violation}" for violation in violations
        )
    return (
        "You write an InsightHub weekly status report from a Facts JSON object only. "
        "Use only numbers and IDs that appear in Facts.allowed_numbers or Facts.allowed_keys. "
        "Do not invent ticket IDs, PRs, commits, dates, percentages, counts, names, or metrics. "
        "Preserve inline citations exactly as [system:ref] when using a fact. "
        "Return JSON only: an array of objects with section_id and body. "
        "The 9 sections are exec_summary, progress, completed, in_progress, next_week, "
        "blockers, bugs, decisions, metrics. "
        f"Write in language '{lang}'. For ja, use business keigo. For vn, use Vietnamese."
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
