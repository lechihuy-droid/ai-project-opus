from __future__ import annotations

from typing import Iterator, Protocol, TypedDict


class ProviderStatus(TypedDict):
    id: str
    available: bool
    version: str | None
    detail: str
    capabilities: dict[str, object]


class ChatEvent(TypedDict, total=False):
    type: str  # "reasoning" | "delta" | "tool_call" | "tool_result" | "done" | "error"
    text: str
    usage: dict[str, object]
    session_id: str | None
    message: str
    code: int | None
    tool_name: str
    tool_input: object
    tool_use_id: str
    tool_output: object


class ToolPolicy(TypedDict, total=False):
    permission: str
    allowed_tools: list[str]
    allowed_paths: list[str]


class Provider(Protocol):
    """Duck-typed contract each services/providers/<id>.py module implements at module level."""

    def status(self) -> ProviderStatus: ...

    def stream_chat(
        self,
        messages: list[dict[str, object]],
        session_id: str | None = None,
        model: str | None = None,
        system_prompt: str | None = None,
        tool_policy: ToolPolicy | None = None,
        tools: list[dict[str, object]] | None = None,
    ) -> Iterator[ChatEvent]: ...
