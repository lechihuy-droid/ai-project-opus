"""Deterministic, metadata-first skill selection for the Harness control plane.

This module never exposes or injects SKILL.md bodies. Discovery descriptors are
cached by the skill library; only a later execution rollout may load complete
selected skills after policy and budget checks have succeeded.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import yaml

from services import capabilities, runtime_agents, skill_library


SKILL_METADATA_PATH = Path(__file__).resolve().parents[1] / "catalogs" / "skill_metadata.yaml"
SKILL_SELECTION_POLICY_PATH = Path(__file__).resolve().parents[1] / "policies" / "skill_selection.yaml"
_METADATA_FIELDS = frozenset({
    "id", "domains", "intents", "compatible_agents", "required_capabilities",
    "optional_capabilities", "risk_level",
})
_POLICY_FIELDS = frozenset({"version", "selection"})
_SELECTION_FIELDS = frozenset({
    "max_skills_per_agent_run", "max_prompt_chars", "never_truncate_skill",
    "strategy", "rules", "thresholds",
})


def _sha256(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return f"sha256:{hashlib.sha256(encoded).hexdigest()}"


def _load_yaml(path: Path, label: str) -> dict[str, Any]:
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise ValueError(f"Cannot load {label}: {exc}") from exc
    if not isinstance(raw, dict):
        raise ValueError(f"{label} must be a mapping")
    return raw


def _string_list(value: object, label: str) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or any(not isinstance(item, str) or not item for item in value):
        raise ValueError(f"{label} must be a list of non-empty strings")
    if len(value) != len(set(value)):
        raise ValueError(f"{label} must not contain duplicates")
    return list(value)


def _metadata() -> tuple[str, dict[str, dict[str, Any]], str]:
    raw = _load_yaml(SKILL_METADATA_PATH, "skill metadata")
    if set(raw) != {"version", "skills"} or not isinstance(raw.get("version"), str) or not raw["version"]:
        raise ValueError("skill metadata must contain only version and skills")
    entries = raw["skills"]
    if not isinstance(entries, list):
        raise ValueError("skill metadata.skills must be a list")
    result: dict[str, dict[str, Any]] = {}
    for row in entries:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not row["id"]:
            raise ValueError("each skill metadata entry needs an id")
        unknown = set(row) - _METADATA_FIELDS
        if unknown:
            raise ValueError(f"Unknown skill metadata field(s): {', '.join(sorted(unknown))}")
        skill_id = str(row["id"])
        if skill_id in result or "/" not in skill_id:
            raise ValueError(f"Duplicate or non-namespaced skill metadata id: {skill_id}")
        clean: dict[str, Any] = {"id": skill_id}
        for field in _METADATA_FIELDS - {"id", "risk_level"}:
            clean[field] = _string_list(row.get(field), f"{skill_id}.{field}")
        risk = row.get("risk_level", "low")
        if not isinstance(risk, str) or not risk:
            raise ValueError(f"{skill_id}.risk_level must be a non-empty string")
        clean["risk_level"] = risk
        result[skill_id] = clean
    return raw["version"], result, _sha256(raw)


def _policy() -> tuple[dict[str, Any], str]:
    raw = _load_yaml(SKILL_SELECTION_POLICY_PATH, "skill selection policy")
    if set(raw) != _POLICY_FIELDS or not isinstance(raw.get("version"), str) or not raw["version"]:
        raise ValueError("skill selection policy must contain only version and selection")
    selection = raw["selection"]
    if not isinstance(selection, dict) or set(selection) - _SELECTION_FIELDS:
        raise ValueError("skill selection policy.selection has invalid fields")
    for field in ("max_skills_per_agent_run", "max_prompt_chars"):
        value = selection.get(field)
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            raise ValueError(f"selection.{field} must be a positive integer")
    if selection.get("never_truncate_skill") is not True:
        raise ValueError("selection.never_truncate_skill must be true")
    strategy = _string_list(selection.get("strategy"), "selection.strategy")
    supported = {"explicit_request", "agent_required_skills", "policy_force", "intent_match", "domain_match"}
    unsupported = sorted(set(strategy) - supported)
    if unsupported:
        raise ValueError(f"Unsupported skill selection strategy: {', '.join(unsupported)}")
    rules = selection.get("rules", [])
    if not isinstance(rules, list):
        raise ValueError("selection.rules must be a list")
    for rule in rules:
        if not isinstance(rule, dict) or set(rule) - {"if", "force", "prefer", "candidates"}:
            raise ValueError("selection rule has invalid fields")
        if not isinstance(rule.get("if"), dict):
            raise ValueError("selection rule.if must be a mapping")
        for key in ("force", "prefer", "candidates"):
            _string_list(rule.get(key), f"selection rule.{key}")
    normalized = {"version": raw["version"], "selection": selection}
    return normalized, _sha256(raw)


def _intent(task: str, lifecycle_stage: str) -> set[str]:
    text = task.lower()
    intents: set[str] = set()
    if "dashboard" in text:
        intents.add("build_dashboard")
    if any(word in text for word in ("verify", "verification", "validate", "test", "kiểm tra", "xác minh")) or lifecycle_stage == "verification":
        intents.add("verify")
    if any(word in text for word in ("security", "secure", "bảo mật")):
        intents.add("review_security")
    if any(word in text for word in ("database", "postgres", "sql", "migration", "dữ liệu")):
        intents.add("database")
    if any(word in text for word in ("frontend", "ui", "react", "web")):
        intents.add("build_frontend")
    return intents


def _task_domains(task: str, task_tags: list[str]) -> set[str]:
    text = task.lower()
    domains = {tag.lower() for tag in task_tags}
    if any(word in text for word in ("dashboard", "frontend", "ui", "react", "web")):
        domains.update({"frontend", "uiux"})
    if any(word in text for word in ("database", "postgres", "sql", "migration", "dữ liệu")):
        domains.add("database")
    if any(word in text for word in ("security", "secure", "bảo mật")):
        domains.add("security")
    return domains


def _inventory(metadata: dict[str, dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], str]:
    entries = skill_library.list_skill_inventory_metadata()
    discovered_ids = {str(entry["id"]) for entry in entries}
    orphaned = sorted(set(metadata) - discovered_ids)
    if orphaned:
        raise ValueError(f"Skill metadata references missing skill(s): {', '.join(orphaned)}")
    result: dict[str, dict[str, Any]] = {}
    for entry in entries:
        skill_id = str(entry["id"])
        # Discovery owns identity.  Metadata is enrichment only: excluding an
        # un-enriched source here would make a bare duplicate look unique and
        # silently route a request to the wrong vendor/source.
        enriched = metadata.get(skill_id, {
            "id": skill_id,
            "domains": [],
            "intents": [],
            "compatible_agents": [],
            "required_capabilities": [],
            "optional_capabilities": [],
            "risk_level": "low",
        })
        row = {
            "id": skill_id,
            "name": str(entry["name"]),
            "source": str(entry["source"]),
            "description": "",
            "content_hash": _sha256({"id": skill_id, "size": entry["prompt_chars"], "modified_ns": entry["modified_ns"]}),
            "path": str(entry["path"]),
            "prompt_chars": int(entry["prompt_chars"]),
            **enriched,
        }
        result[skill_id] = row
    serializable = [{key: row[key] for key in ("id", "source", "content_hash")} for row in sorted(result.values(), key=lambda item: item["id"])]
    return result, _sha256(serializable)


def _resolve_requested(identity: str, inventory: dict[str, dict[str, Any]]) -> str:
    if identity in inventory:
        return identity
    matches = sorted(item["id"] for item in inventory.values() if item["name"] == identity)
    if not matches:
        raise ValueError(f"Unknown explicit skill: {identity}")
    if len(matches) != 1:
        raise ValueError(f"Ambiguous skill identity: {identity}")
    return matches[0]


def _resolve_agent_required(identity: str, inventory: dict[str, dict[str, Any]]) -> str:
    """Resolve legacy manifest names to the Hub-owned skill during migration.

    Explicit user requests remain fail-closed on collisions. Existing agent
    profiles historically stored bare names whose runtime precedence is Hub
    built-in first, so the shadow resolver mirrors that one compatibility rule.
    """
    if identity in inventory:
        return identity
    hub_identity = f"hub_builtin/{identity}"
    if hub_identity in inventory:
        return hub_identity
    return _resolve_requested(identity, inventory)


def _capability_state(
    skill: dict[str, Any], agent_capabilities: set[str], permission: str,
    runtime_capabilities: dict[str, dict[str, Any]],
) -> tuple[str, list[dict[str, Any]]]:
    trace: list[dict[str, Any]] = []
    def decision(name: str) -> str:
        runtime = runtime_capabilities.get(name)
        if name not in agent_capabilities or runtime is None:
            return "denied"
        if permission not in set(runtime.get("allowed_permissions", [])):
            return "denied"
        binding = runtime.get("binding", {})
        if not binding.get("configured") or not binding.get("registered") or binding.get("health") not in {"healthy", "not_checked"}:
            return "unavailable"
        return "allowed"
    required_decisions = {name: decision(name) for name in skill["required_capabilities"]}
    optional_decisions = {name: decision(name) for name in skill["optional_capabilities"]}
    missing_required = [name for name, value in required_decisions.items() if value != "allowed"]
    missing_optional = [name for name, value in optional_decisions.items() if value != "allowed"]
    for name, value in required_decisions.items():
        trace.append({"capability_id": name, "required": True, "decision": value})
    for name, value in optional_decisions.items():
        trace.append({"capability_id": name, "required": False, "decision": value})
    if missing_required:
        return "denied", trace
    if missing_optional:
        return "degraded", trace
    return "ready", trace


def _matching_forced(policy: dict[str, Any], payload: dict[str, Any]) -> list[str]:
    force: list[str] = []
    for rule in policy["selection"]["rules"]:
        conditions = rule["if"]
        matches = True
        for key, expected in conditions.items():
            value = payload.get(key)
            if isinstance(expected, list):
                values = value if isinstance(value, list) else []
                if not set(expected).issubset(set(values)):
                    matches = False
                    break
            elif value != expected:
                matches = False
                break
        if matches:
            force.extend(rule.get("force", []))
    return force


def preview(payload: dict[str, Any]) -> dict[str, Any]:
    """Return a deterministic, metadata-only shadow selection decision."""
    if not isinstance(payload, dict):
        raise ValueError("skill resolution payload must be a mapping")
    task = payload.get("task")
    agent_id = payload.get("agent_id")
    lifecycle_stage = payload.get("lifecycle_stage", "implementation")
    if not isinstance(task, str) or not task.strip():
        raise ValueError("task is required")
    if not isinstance(agent_id, str) or not agent_id:
        raise ValueError("agent_id is required")
    if not isinstance(lifecycle_stage, str) or not lifecycle_stage:
        raise ValueError("lifecycle_stage must be a non-empty string")
    task_tags = _string_list(payload.get("task_tags", []), "task_tags")
    explicit = _string_list(payload.get("explicit_skills", []), "explicit_skills")

    catalog_version, metadata, metadata_hash = _metadata()
    policy, policy_hash = _policy()
    inventory, inventory_hash = _inventory(metadata)
    agent = runtime_agents.get_agent(agent_id)
    agent_capabilities = set(agent.get("capabilities", []))
    known_capabilities = set(capabilities.list_capability_ids())
    runtime_capabilities = {str(item["id"]): item for item in capabilities.public_catalog()}
    # Agent validation protects this normally; explicit check retains fail-closed
    # behaviour for callers that provide an old manifest during a deploy.
    if not agent_capabilities.issubset(known_capabilities):
        raise ValueError("Agent contains unknown capability grants")

    explicit_ids = [_resolve_requested(identity, inventory) for identity in explicit]
    forced_ids = [_resolve_requested(identity, inventory) for identity in _matching_forced(policy, payload)]
    required_ids = [_resolve_agent_required(identity, inventory) for identity in agent.get("skills", [])]
    intents = _intent(task, lifecycle_stage)
    domains = _task_domains(task, task_tags)
    priority: list[tuple[str, str]] = [(skill_id, "policy_forced") for skill_id in forced_ids]
    buckets: dict[str, list[tuple[str, str]]] = {
        "explicit_request": [(skill_id, "explicit_request") for skill_id in explicit_ids],
        "agent_required_skills": [(skill_id, "agent_required_skill") for skill_id in required_ids],
        "policy_force": [],
        "intent_match": [],
        "domain_match": [],
    }
    for skill in sorted(inventory.values(), key=lambda item: item["id"]):
        if set(skill["intents"]) & intents:
            buckets["intent_match"].append((skill["id"], "intent_match"))
    for skill in sorted(inventory.values(), key=lambda item: item["id"]):
        if set(skill["domains"]) & domains:
            buckets["domain_match"].append((skill["id"], "domain_match"))
    for strategy in policy["selection"]["strategy"]:
        priority.extend(buckets[strategy])

    ordered: list[tuple[str, str]] = []
    seen: set[str] = set()
    for skill_id, reason in priority:
        if skill_id not in seen:
            seen.add(skill_id)
            ordered.append((skill_id, reason))

    max_skills = policy["selection"]["max_skills_per_agent_run"]
    max_chars = policy["selection"]["max_prompt_chars"]
    used_chars = 0
    selected: list[dict[str, Any]] = []
    trace_by_id: dict[str, dict[str, Any]] = {}
    capability_resolution: list[dict[str, Any]] = []
    for skill_id, candidate_reason in ordered:
        skill = inventory[skill_id]
        cap_state, capability_trace = _capability_state(skill, agent_capabilities, str(agent["permission"]), runtime_capabilities)
        capability_resolution.append({"skill_id": skill_id, "state": cap_state, "capabilities": capability_trace})
        trace: dict[str, Any] = {"skill_id": skill_id, "outcome": "rejected", "reason": candidate_reason, "capability_state": cap_state}
        if skill["compatible_agents"] and agent_id not in skill["compatible_agents"]:
            trace["reason"] = "incompatible_agent"
        elif cap_state == "denied":
            trace["reason"] = "required_capability_denied"
        else:
            # Metadata-first preview must not read a SKILL.md body.  UTF-8 bytes
            # conservatively upper-bound characters, so this can reject an
            # otherwise fitting candidate but can never select one that needs
            # partial/truncated loading.
            try:
                content_size = int(skill["prompt_chars"])
            except OSError:
                trace["reason"] = "skill_unreadable"
            else:
                if len(selected) >= max_skills or used_chars + content_size > max_chars:
                    trace["reason"] = "prompt_budget_exceeded"
                else:
                    trace.update({"outcome": "selected", "reason": candidate_reason})
                    used_chars += content_size
                    content_descriptor = skill_library.skill_content_descriptor(skill["id"])
                    selected.append({
                        "id": skill["id"], "name": skill["name"], "source": skill["source"],
                        "content_hash": content_descriptor["content_hash"], "description": content_descriptor["description"],
                        "capability_state": cap_state,
                    })
        trace_by_id[skill_id] = trace
        if skill_id in forced_ids and trace["outcome"] != "selected":
            raise ValueError(f"Forced skill cannot be selected: {skill_id} ({trace['reason']})")

    # Expose deterministic rejects for eligible installed skills even when they
    # were not semantic candidates, so the UI can explain the catalog safely.
    for skill_id in sorted(inventory):
        if skill_id not in trace_by_id:
            skill = inventory[skill_id]
            cap_state, capability_trace = _capability_state(skill, agent_capabilities, str(agent["permission"]), runtime_capabilities)
            capability_resolution.append({"skill_id": skill_id, "state": cap_state, "capabilities": capability_trace})
            reason = "not_selected"
            if skill["compatible_agents"] and agent_id not in skill["compatible_agents"]:
                reason = "incompatible_agent"
            elif cap_state == "denied":
                reason = "required_capability_denied"
            trace_by_id[skill_id] = {"skill_id": skill_id, "outcome": "rejected", "reason": reason, "capability_state": cap_state}

    return {
        "mode": "shadow",
        "agent_id": agent_id,
        "task": {"intent": sorted(intents), "domains": sorted(domains), "lifecycle_stage": lifecycle_stage, "tags": sorted(task_tags)},
        "selected_skills": selected,
        "selection_trace": [trace_by_id[skill_id] for skill_id in sorted(trace_by_id)],
        "capability_resolution": sorted(capability_resolution, key=lambda item: item["skill_id"]),
        "policy": {"version": policy["version"], "content_hash": policy_hash},
        "catalog": {"version": catalog_version, "content_hash": _sha256({"metadata": metadata_hash, "inventory": inventory_hash})},
        "prompt_budget": {"max_skills": max_skills, "max_chars": max_chars, "used_chars": used_chars, "truncated": False},
    }
