"""Validate report narrative against fact allow-lists."""

from __future__ import annotations

import re

from insighthub.schema import Facts, Report

NUMBER_RE = re.compile(r"\d+(?:\.\d+)?%?")
ID_RE = re.compile(r"\b(?:[A-Z][A-Z0-9]+-\d+|PR#\d+|[0-9a-fA-F]{7,})\b")
CITATION_RE = re.compile(r"\[[^\]]+\]")


def validate(report: Report, facts: Facts) -> list[str]:
    """Return validation violations for numbers and IDs not present in facts."""

    allowed_numbers = set(facts.allowed_numbers)
    allowed_keys = set(facts.allowed_keys)
    violations: list[str] = []

    for section in report.sections:
        body = section.body or ""
        body_without_citations = CITATION_RE.sub(" ", body)
        ids = ID_RE.findall(body_without_citations)
        for token in ids:
            normalized = token[:7] if re.fullmatch(r"[0-9a-fA-F]{7,}", token) else token
            if normalized not in allowed_keys:
                violations.append(f"{section.section_id}: disallowed ID '{token}'")

        body_without_ids = ID_RE.sub(" ", body_without_citations)
        for token in NUMBER_RE.findall(body_without_ids):
            if token not in allowed_numbers:
                violations.append(f"{section.section_id}: disallowed number '{token}'")

    return violations
