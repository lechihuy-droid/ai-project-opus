from __future__ import annotations

from typing import Any

from services import governance, inform, risk


DESTRUCTIVE_TOKEN_REASON = "destructive token without allow_override"
UNCLASSIFIED_TOKEN_REASON = "unclassified command in unattended job"
INJECTION_REASON = "L1 injection pattern"


def _lines_from_diff(diff_text: str) -> list[str]:
    lines: list[str] = []
    for line in str(diff_text or "").splitlines():
        if line.startswith("+") and not line.startswith("+++"):
            lines.append(line[1:].strip())
    return lines


def _command_tiers(job: dict[str, Any]) -> list[str]:
    tiers: list[str] = []
    command = job.get("command")
    if command:
        tiers.append(risk.classify_command(command))
    diff_text = str(job.get("diff") or job.get("diff_text") or "")
    for line in _lines_from_diff(diff_text):
        tiers.append(risk.classify_command(line))
    return tiers


def rule_check(job: dict[str, Any]) -> dict[str, Any]:
    reasons: list[str] = []
    allow_override = bool(job.get("allow_override"))
    findings = job.get("inform_findings")

    if inform.has_injection_finding(findings):
        reasons.append(INJECTION_REASON)

    tiers = [str(job.get("max_tier") or "read_only"), *_command_tiers(job)]
    has_unknown = risk.UNKNOWN in tiers

    # Hooks fire unattended with no human approving the run, so an
    # unclassified command must fail closed there. Interactive jobs keep the
    # old fail-open behavior (see warn fallback below) - only the unattended
    # case gets the new deny.
    if job.get("unattended") and has_unknown:
        if allow_override:
            governance.record_denial(str(job.get("id") or ""), [UNCLASSIFIED_TOKEN_REASON])
        else:
            reasons.append(UNCLASSIFIED_TOKEN_REASON)

    if not allow_override and any(tier == "destructive" for tier in tiers):
        reasons.append(DESTRUCTIVE_TOKEN_REASON)

    if reasons:
        return {"decision": "deny", "reasons": reasons}

    # NOTE: UNKNOWN has no entry in risk.TIER_RANK, so it must never enter
    # this sorted-by-rank set - it is handled separately below.
    warn_tiers = [tier for tier in tiers if tier in {"network", "execute"}]
    if warn_tiers:
        unique = sorted(set(warn_tiers), key=lambda item: risk.TIER_RANK[item])
        return {"decision": "warn", "reasons": [f"tier warning: {', '.join(unique)}"]}

    if has_unknown:
        return {"decision": "warn", "reasons": ["unclassified command"]}

    return {"decision": "allow", "reasons": []}
