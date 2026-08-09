from __future__ import annotations

import logging
from types import ModuleType

from services.providers import base, claude_cli, codex_cli, nvidia_api

logger = logging.getLogger(__name__)

registry: dict[str, ModuleType] = {
    "nvidia": nvidia_api,
    "claude": claude_cli,
    "codex": codex_cli,
}


def get_provider(provider_id: str) -> ModuleType:
    provider = registry.get(provider_id)
    if provider is None:
        raise ValueError(f"Unknown provider: {provider_id}")
    return provider


def list_providers() -> list[base.ProviderStatus]:
    """Probe every registered provider, isolating failures per provider.

    A single provider's status() can legitimately raise (e.g. procs.resolve_cmd
    refuses to guess at an unparseable Windows batch shim rather than risk
    handing untrusted argv to cmd.exe). That must not blank the whole /api/providers
    response — callers still need to see the other providers' real status. Log
    the failure and report that one provider as unavailable with the reason.
    """
    statuses: list[base.ProviderStatus] = []
    for provider_id, provider in registry.items():
        try:
            statuses.append(provider.status())
        except Exception as exc:
            logger.warning("provider %s status() failed: %s", provider_id, exc, exc_info=True)
            statuses.append(
                {
                    "id": provider_id,
                    "available": False,
                    "version": None,
                    "detail": (str(exc).strip() or exc.__class__.__name__)[:200],
                    "capabilities": {},
                }
            )
    return statuses
