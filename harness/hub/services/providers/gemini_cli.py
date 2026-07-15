from __future__ import annotations

from typing import Iterator

from services.providers.base import ChatEvent, ProviderStatus

PROVIDER_ID = "gemini"
_NOT_INSTALLED_MESSAGE = "Gemini chua duoc cai. Cai dat: npm install -g @google/gemini-cli"


def status() -> ProviderStatus:
    return {
        "id": PROVIDER_ID,
        "available": False,
        "version": None,
        "detail": "not_installed",
        "capabilities": {"stream": False, "resume": False, "models": None},
    }


def stream_chat(
    messages: list[dict[str, str]],
    session_id: str | None = None,
    model: str | None = None,
) -> Iterator[ChatEvent]:
    yield {"type": "error", "message": _NOT_INSTALLED_MESSAGE, "code": None}
