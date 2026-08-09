"""Vendor-neutral capability contracts and their runtime adapter boundary."""
from __future__ import annotations

import asyncio
import re
import uuid
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol
from urllib.parse import urlsplit

import yaml
from jsonschema import Draft202012Validator, ValidationError


CATALOG_PATH = Path(__file__).resolve().parents[1] / "capabilities" / "capability_catalog.yaml"
_SAFE_TOOL_NAME = re.compile(r"^[a-z][a-z0-9_]{0,63}$")
_ADAPTERS: dict[str, "CapabilityAdapter"] = {}
_EFFECT_FLAGS = ("read_only", "destructive", "idempotent", "open_world")
_CANONICAL_STATUSES = frozenset({"succeeded", "failed", "refused", "unavailable"})


class CapabilityCatalogError(ValueError):
    """The checked-in capability contract is malformed."""


@dataclass(frozen=True)
class CapabilityError:
    code: str
    message: str
    retryable: bool = False
    details: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, "retryable": self.retryable, "details": self.details}


@dataclass(frozen=True)
class CapabilityResult:
    status: str
    data: dict[str, Any] | None = None
    evidence: list[dict[str, Any]] = field(default_factory=list)
    diagnostics: list[dict[str, Any]] = field(default_factory=list)
    artifacts: list[dict[str, Any]] = field(default_factory=list)
    trace_id: str = ""
    timing: dict[str, Any] = field(default_factory=dict)
    provider: dict[str, Any] = field(default_factory=dict)
    error: CapabilityError | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "status": self.status, "data": self.data, "evidence": self.evidence,
            "diagnostics": self.diagnostics, "artifacts": self.artifacts,
            "trace_id": self.trace_id, "timing": self.timing, "provider": self.provider,
            "error": self.error.as_dict() if self.error else None,
        }


@dataclass(frozen=True)
class CapabilityContext:
    """Trusted runtime context; credentials and adapter configuration never enter model inputs."""

    allowed_capabilities: frozenset[str] = frozenset()
    agent_id: str | None = None
    permission: str | None = None
    correlation_id: str | None = None
    metadata: Mapping[str, Any] = field(default_factory=dict)


class CapabilityAdapter(Protocol):
    async def invoke(self, action: str, inputs: dict[str, Any], context: CapabilityContext) -> CapabilityResult | Mapping[str, Any]: ...


@dataclass(frozen=True)
class CapabilityAction:
    name: str
    description: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]


@dataclass(frozen=True)
class CapabilityContract:
    id: str
    contract_version: str
    title: str
    description: str
    plane: str
    category: str
    effects: dict[str, Any]
    policy: dict[str, Any]
    binding: dict[str, Any]
    actions: tuple[CapabilityAction, ...]


def _mapping(value: object, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise CapabilityCatalogError(f"{label} must be an object")
    return dict(value)


def _text(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise CapabilityCatalogError(f"{label} must be a non-empty string")
    return value


def _schema(value: object, label: str) -> dict[str, Any]:
    schema = _mapping(value, label)
    try:
        Draft202012Validator.check_schema(schema)
    except Exception as exc:  # jsonschema raises several schema-specific subclasses
        raise CapabilityCatalogError(f"invalid {label}: {exc}") from exc
    return schema


def load_catalog(path: Path = CATALOG_PATH) -> dict[str, CapabilityContract]:
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise CapabilityCatalogError(f"cannot load catalog: {exc}") from exc
    root = _mapping(raw, "catalog")
    if root.get("version") != 1 or not isinstance(root.get("capabilities"), list):
        raise CapabilityCatalogError("catalog must have version 1 and a capabilities list")
    catalog: dict[str, CapabilityContract] = {}
    for item in root["capabilities"]:
        raw_contract = _mapping(item, "capability")
        capability_id = _text(raw_contract.get("id"), "capability.id")
        if not _SAFE_TOOL_NAME.fullmatch(capability_id) or capability_id in catalog:
            raise CapabilityCatalogError(f"invalid or duplicate capability id: {capability_id}")
        actions_raw = raw_contract.get("actions")
        if not isinstance(actions_raw, list) or not actions_raw:
            raise CapabilityCatalogError(f"{capability_id}.actions must be a non-empty list")
        actions: list[CapabilityAction] = []
        action_names: set[str] = set()
        for raw_action in actions_raw:
            action = _mapping(raw_action, f"{capability_id}.action")
            name = _text(action.get("name"), f"{capability_id}.action.name")
            if not _SAFE_TOOL_NAME.fullmatch(name) or name in action_names:
                raise CapabilityCatalogError(f"invalid or duplicate action: {capability_id}.{name}")
            if not _SAFE_TOOL_NAME.fullmatch(f"{capability_id}__{name}"):
                raise CapabilityCatalogError(f"unsafe composite tool name: {capability_id}__{name}")
            action_names.add(name)
            actions.append(CapabilityAction(name, _text(action.get("description"), f"{capability_id}.{name}.description"),
                                            _schema(action.get("input_schema"), f"{capability_id}.{name}.input_schema"),
                                            _schema(action.get("output_schema"), f"{capability_id}.{name}.output_schema")))
        effects = _mapping(raw_contract.get("effects"), f"{capability_id}.effects")
        for flag in _EFFECT_FLAGS:
            if not isinstance(effects.get(flag), bool):
                raise CapabilityCatalogError(f"{capability_id}.effects.{flag} must be boolean")
        if "network" in effects and not isinstance(effects["network"], bool):
            raise CapabilityCatalogError(f"{capability_id}.effects.network must be boolean")
        if effects["read_only"] == effects["destructive"]:
            raise CapabilityCatalogError(f"{capability_id}.effects must be either read-only or destructive")
        policy = _mapping(raw_contract.get("policy"), f"{capability_id}.policy")
        permissions = policy.get("allowed_permissions")
        if not isinstance(permissions, list) or not permissions or not all(isinstance(item, str) and item for item in permissions):
            raise CapabilityCatalogError(f"{capability_id}.policy.allowed_permissions must be a non-empty string list")
        if not isinstance(policy.get("timeout_seconds"), (int, float)) or isinstance(policy.get("timeout_seconds"), bool) or policy["timeout_seconds"] <= 0:
            raise CapabilityCatalogError(f"{capability_id}.policy.timeout_seconds must be a positive number")
        if not isinstance(policy.get("approval_required"), bool):
            raise CapabilityCatalogError(f"{capability_id}.policy.approval_required must be boolean")
        if policy.get("secrets_in_inputs") is not False:
            raise CapabilityCatalogError(f"{capability_id}.policy.secrets_in_inputs must be false")
        if effects.get("network") and not isinstance(policy.get("allowed_url_schemes"), list):
            raise CapabilityCatalogError(f"{capability_id}.policy.allowed_url_schemes must be a list")
        binding = _mapping(raw_contract.get("binding"), f"{capability_id}.binding")
        _text(binding.get("adapter_id"), f"{capability_id}.binding.adapter_id")
        _text(binding.get("vendor"), f"{capability_id}.binding.vendor")
        _text(binding.get("transport"), f"{capability_id}.binding.transport")
        catalog[capability_id] = CapabilityContract(
            id=capability_id, contract_version=_text(raw_contract.get("contract_version"), f"{capability_id}.contract_version"),
            title=_text(raw_contract.get("title"), f"{capability_id}.title"),
            description=_text(raw_contract.get("description"), f"{capability_id}.description"),
            plane=_text(raw_contract.get("plane"), f"{capability_id}.plane"),
            category=_text(raw_contract.get("category"), f"{capability_id}.category"),
            effects=effects, policy=policy, binding=binding, actions=tuple(actions),
        )
    return catalog


def capability_ids(path: Path = CATALOG_PATH) -> frozenset[str]:
    return frozenset(load_catalog(path))


def list_capability_ids() -> tuple[str, ...]:
    """Stable public catalog lookup used by agent-manifest validation."""
    return tuple(sorted(capability_ids()))


def public_catalog(path: Path = CATALOG_PATH) -> list[dict[str, Any]]:
    """Return secret-free catalog metadata for Hub UI and diagnostics."""
    return [
        {
            "id": contract.id, "contract_version": contract.contract_version,
            "title": contract.title, "description": contract.description,
            "plane": contract.plane, "category": contract.category,
            "effects": dict(contract.effects),
            "actions": [{"name": action.name, "description": action.description} for action in contract.actions],
            "binding": {
                "vendor": contract.binding["vendor"], "transport": contract.binding["transport"],
                "configured": bool(contract.binding.get("configured")),
                "registered": contract.binding["adapter_id"] in _ADAPTERS,
                "health": "not_checked",
            },
            "allowed_permissions": list(contract.policy["allowed_permissions"]),
        }
        for contract in sorted(load_catalog(path).values(), key=lambda item: item.id)
    ]


def register_adapter(adapter_id: str, adapter: CapabilityAdapter) -> None:
    if not adapter_id or not hasattr(adapter, "invoke"):
        raise ValueError("adapter_id and an async invoke adapter are required")
    _ADAPTERS[adapter_id] = adapter


def clear_adapters() -> None:
    _ADAPTERS.clear()


def action_tool_name(capability_id: str, action: str) -> str:
    name = f"{capability_id}__{action}"
    if not _SAFE_TOOL_NAME.fullmatch(name):
        raise ValueError(f"unsafe capability tool name: {name}")
    return name


def resolve_tool_name(tool_name: str, path: Path = CATALOG_PATH) -> tuple[CapabilityContract, CapabilityAction] | None:
    for contract in load_catalog(path).values():
        for action in contract.actions:
            if tool_name == action_tool_name(contract.id, action.name):
                return contract, action
    return None


def model_tool_schemas(allowed_capabilities: Iterable[str] | None = None, path: Path = CATALOG_PATH) -> list[dict[str, Any]]:
    allowed = None if allowed_capabilities is None else set(allowed_capabilities)
    schemas: list[dict[str, Any]] = []
    for contract in load_catalog(path).values():
        if allowed is not None and contract.id not in allowed:
            continue
        for action in contract.actions:
            schemas.append({"type": "function", "function": {"name": action_tool_name(contract.id, action.name),
                            "description": action.description, "parameters": action.input_schema}})
    return schemas


def _error(status: str, code: str, message: str, *, trace_id: str, provider: dict[str, Any], retryable: bool = False, details: dict[str, Any] | None = None) -> CapabilityResult:
    return CapabilityResult(status, trace_id=trace_id, provider=provider,
                            error=CapabilityError(code, message, retryable, details or {}))


def _validation_details(error: ValidationError) -> dict[str, Any]:
    return {"message": error.message, "path": list(error.path), "schema_path": list(error.schema_path)}


def _url_policy_error(inputs: dict[str, Any], contract: CapabilityContract, context: CapabilityContext) -> str | None:
    if not contract.effects.get("network"):
        return None
    schemes = set(contract.policy.get("allowed_url_schemes") or [])
    fixed_origins = set(contract.policy.get("allowed_origins") or [])
    context_origins = set(context.metadata.get("allowed_origins") or [])
    allowed_origins = fixed_origins or context_origins
    if contract.policy.get("require_allowed_origins") and not allowed_origins:
        return "trusted allowed origins are required"
    for key, value in inputs.items():
        if not (key == "url" or key.endswith("_url")) or not isinstance(value, str):
            continue
        parsed = urlsplit(value)
        if parsed.scheme not in schemes or not parsed.hostname or parsed.username or parsed.password:
            return f"URL is outside the allowed scheme policy: {key}"
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if allowed_origins and origin not in allowed_origins:
            return f"URL origin is not allowed: {key}"
    return None


async def invoke(capability_id: str, action_name: str, inputs: object, context: CapabilityContext, *, path: Path = CATALOG_PATH) -> CapabilityResult:
    """Authorize, validate, invoke a bound adapter, normalize, then validate adapter output."""
    trace_id = context.correlation_id or f"cap-{uuid.uuid4().hex}"
    catalog = load_catalog(path)
    contract = catalog.get(capability_id)
    if contract is None:
        return _error("refused", "unknown_capability", f"unknown capability: {capability_id}", trace_id=trace_id, provider={})
    provider = {"adapter_id": contract.binding["adapter_id"], "vendor": contract.binding["vendor"], "transport": contract.binding["transport"]}
    if capability_id not in context.allowed_capabilities:
        return _error("refused", "not_authorized", f"capability not allowed: {capability_id}", trace_id=trace_id, provider=provider)
    if context.permission not in contract.policy["allowed_permissions"]:
        return _error("refused", "permission_denied", f"permission not allowed for capability: {capability_id}", trace_id=trace_id, provider=provider)
    if contract.policy["approval_required"] and context.metadata.get("approval_granted") is not True:
        return _error("refused", "approval_required", "capability requires explicit approval", trace_id=trace_id, provider=provider)
    action = next((item for item in contract.actions if item.name == action_name), None)
    if action is None:
        return _error("failed", "unknown_action", f"unknown action: {capability_id}.{action_name}", trace_id=trace_id, provider=provider)
    if not isinstance(inputs, dict):
        return _error("failed", "invalid_input", "capability input must be an object", trace_id=trace_id, provider=provider)
    try:
        Draft202012Validator(action.input_schema).validate(inputs)
    except ValidationError as exc:
        return _error("failed", "invalid_input", "capability input does not satisfy contract", trace_id=trace_id, provider=provider, details=_validation_details(exc))
    if url_error := _url_policy_error(inputs, contract, context):
        return _error("refused", "url_not_allowed", url_error, trace_id=trace_id, provider=provider)
    adapter = _ADAPTERS.get(contract.binding["adapter_id"])
    if adapter is None:
        return _error("unavailable", "adapter_unavailable", "capability adapter is not configured", trace_id=trace_id, provider=provider)
    timeout = contract.policy.get("timeout_seconds", 30)
    try:
        raw_result = await asyncio.wait_for(adapter.invoke(action_name, dict(inputs), context), timeout=float(timeout))
    except TimeoutError:
        return _error("failed", "timeout", f"capability timed out after {timeout} seconds", trace_id=trace_id, provider=provider,
                      retryable=bool(contract.effects["idempotent"]))
    except Exception:  # adapters are an external boundary; do not leak a traceback to the model
        return _error("failed", "adapter_error", "capability adapter failed", trace_id=trace_id, provider=provider)
    if isinstance(raw_result, CapabilityResult):
        result = raw_result
    elif isinstance(raw_result, Mapping):
        result = CapabilityResult("succeeded", data=dict(raw_result))
    else:
        return _error("failed", "invalid_adapter_result", "adapter must return CapabilityResult or object data", trace_id=trace_id, provider=provider)
    status = {"success": "succeeded", "error": "failed"}.get(result.status, result.status)
    if status not in _CANONICAL_STATUSES:
        return _error("failed", "invalid_adapter_result", "adapter returned an invalid status", trace_id=trace_id, provider=provider)
    result = CapabilityResult(
        status=status, data=result.data, evidence=result.evidence, diagnostics=result.diagnostics,
        artifacts=result.artifacts, trace_id=result.trace_id or trace_id, timing=result.timing,
        provider=result.provider or provider, error=result.error,
    )
    if result.status != "succeeded":
        return result if result.error else _error("failed", "adapter_error", "adapter returned non-success", trace_id=result.trace_id, provider=result.provider)
    if not isinstance(result.data, dict):
        return _error("failed", "invalid_output", "successful capability result must contain object data", trace_id=result.trace_id, provider=result.provider)
    if any(not isinstance(item, dict) for rows in (result.evidence, result.diagnostics, result.artifacts) for item in rows):
        return _error("failed", "invalid_output", "evidence, diagnostics, and artifacts must contain objects", trace_id=result.trace_id, provider=result.provider)
    try:
        Draft202012Validator(action.output_schema).validate(result.data)
    except ValidationError as exc:
        return _error("failed", "invalid_output", "adapter output does not satisfy contract", trace_id=result.trace_id, provider=result.provider, details=_validation_details(exc))
    return result
