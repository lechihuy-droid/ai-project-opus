"""Deterministic action-class lookup for approval gating."""

from __future__ import annotations

import os
from pathlib import Path

import yaml


REGISTRY_PATH = Path(__file__).resolve().parents[1] / "ai" / "action-registry.yaml"
ACTION_CLASSES = {"read", "draft", "write", "dangerous"}
GATES = {
    "read": "free",
    "draft": "free",
    "write": "requires_approval",
    "dangerous": "requires_confirm",
}

_REGISTRY_CACHE: dict[str, str] | None = None


def classify(tool_id: str) -> str:
    """Return the registered action class, defaulting unknown tools to dangerous."""

    return _load_registry().get(tool_id, "dangerous")


def gate_for(action_class: str) -> str:
    """Return the gate policy for an action class."""

    if action_class not in GATES:
        allowed_values = ", ".join(sorted(GATES))
        raise ValueError(f"Invalid action_class: {action_class!r}. Expected one of: {allowed_values}")
    return GATES[action_class]


def _load_registry() -> dict[str, str]:
    global _REGISTRY_CACHE

    if _REGISTRY_CACHE is None:
        with _registry_path().open("r", encoding="utf-8") as registry_file:
            registry = yaml.safe_load(registry_file) or {}
        _validate_registry(registry)
        _REGISTRY_CACHE = dict(registry)

    return _REGISTRY_CACHE


def _registry_path() -> Path:
    return Path(os.environ.get("ANIMUS_ACTION_REGISTRY", REGISTRY_PATH))


def _validate_registry(registry: object) -> None:
    if not isinstance(registry, dict):
        raise ValueError("Action registry must be a mapping of tool_id to class")

    invalid = {tool_id: action_class for tool_id, action_class in registry.items() if action_class not in ACTION_CLASSES}
    if invalid:
        details = ", ".join(f"{tool_id}={action_class!r}" for tool_id, action_class in sorted(invalid.items()))
        raise ValueError(f"Invalid action registry class(es): {details}")
