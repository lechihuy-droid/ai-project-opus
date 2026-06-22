"""Persist outcome-driven heuristic ranking rules for Logos."""

from __future__ import annotations

import os
from collections import OrderedDict
from pathlib import Path


RULE_CAP = 30


def tune(outcome_signals: list[dict]) -> list[str]:
    """Update ranking rules from outcome signals and return the current rules."""

    path = _ranking_rules_path()
    existing_rules = _read_rules(path)
    new_rules = _rules_from_signals(outcome_signals)
    current_rules = _cap_rules(existing_rules + new_rules)
    _write_rules(path, current_rules)
    return current_rules


def _rules_from_signals(outcome_signals: list[dict]) -> list[str]:
    stats: OrderedDict[str, dict[str, int]] = OrderedDict()

    for signal in outcome_signals:
        kind = str(signal.get("kind", "")).strip()
        if not kind:
            continue

        kind_stats = stats.setdefault(kind, {"done": 0, "not_done": 0, "accepted_not_done": 0})
        engagement = _normalize_signal(signal.get("engagement"))
        outcome = _normalize_signal(signal.get("outcome"))

        if outcome == "done":
            kind_stats["done"] += 1
        elif outcome == "not_done":
            kind_stats["not_done"] += 1
            if engagement == "accepted":
                kind_stats["accepted_not_done"] += 1

    rules = []
    for kind, kind_stats in stats.items():
        if kind_stats["done"] > kind_stats["not_done"]:
            rules.append(f"up-rank kind {kind} when outcome is usually done")
        elif kind_stats["accepted_not_done"] and kind_stats["not_done"] >= kind_stats["done"]:
            rules.append(f"down-rank kind {kind} when accepted but rarely done")
    return rules


def _normalize_signal(value: object) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip().casefold()
    if not normalized or normalized == "none":
        return None
    return normalized


def _ranking_rules_path() -> Path:
    override = os.environ.get("ANIMUS_RANKING_RULES")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[1] / "ranking-rules.md"


def _read_rules(path: Path) -> list[str]:
    if not path.exists():
        return []

    rules = []
    with path.open("r", encoding="utf-8") as file:
        for line in file:
            stripped = line.strip()
            if stripped.startswith("- "):
                rule = stripped[2:].strip()
                if rule:
                    rules.append(rule)
    return rules


def _cap_rules(rules: list[str]) -> list[str]:
    return rules[-RULE_CAP:]


def _write_rules(path: Path, rules: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = "".join(f"- {rule}\n" for rule in rules)
    with path.open("w", encoding="utf-8") as file:
        file.write(content)
