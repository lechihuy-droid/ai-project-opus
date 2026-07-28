from __future__ import annotations

from collections.abc import Callable, Iterator
from dataclasses import dataclass, field
from services import runtime_agents
from services.providers import get_provider
from services.providers.base import ChatEvent, Provider, ToolPolicy


ExecutionEvent = ChatEvent


@dataclass(frozen=True)
class ExecutionRequest:
    correlation_id: str
    provider_id: str
    model: str | None
    messages: list[dict[str, str]]
    session_id: str | None = None
    system_prompt: str | None = None
    tool_policy: ToolPolicy | None = None
    limits: dict[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class ExecutionError:
    message: str
    code: int | None = None


@dataclass(frozen=True)
class ExecutionRoute:
    provider_id: str
    model: str | None
    provider_class: str | None
    adapter: Provider


@dataclass(frozen=True)
class ExecutionResult:
    route: ExecutionRoute | None = None
    error: ExecutionError | None = None

    @property
    def denied(self) -> bool:
        return self.error is not None


ProviderResolver = Callable[[str], Provider]


def gateway(request: ExecutionRequest, *, resolver: ProviderResolver = get_provider) -> ExecutionResult:
    """Resolve one authored provider/model route, or return an explicit denial."""
    try:
        routed = runtime_agents.resolve_provider({"provider": request.provider_id, "model": request.model})
        return ExecutionResult(route=ExecutionRoute(
            provider_id=str(routed["provider"]), model=routed["model"], provider_class=routed["class"],
            adapter=resolver(str(routed["provider"])),
        ))
    except ValueError as exc:
        return ExecutionResult(error=ExecutionError(str(exc)))


def execute(
    request: ExecutionRequest, *, resolver: ProviderResolver = get_provider, result: ExecutionResult | None = None,
) -> Iterator[ExecutionEvent]:
    """Run exactly the gateway-selected route and preserve adapter event payloads."""
    result = result or gateway(request, resolver=resolver)
    if result.error is not None:
        yield {"type": "error", "message": result.error.message, "code": result.error.code}
        return
    assert result.route is not None
    kwargs: dict[str, object] = {"session_id": request.session_id, "model": result.route.model}
    if request.system_prompt:
        kwargs["system_prompt"] = request.system_prompt
    if request.tool_policy is not None:
        kwargs["tool_policy"] = request.tool_policy
    yield from result.route.adapter.stream_chat(request.messages, **kwargs)


class MockAdapter:
    """In-memory Provider adapter for execution tests; never contacts a provider."""

    def __init__(self, events: list[ChatEvent]) -> None:
        self.events = list(events)
        self.calls: list[dict[str, object]] = []

    def status(self) -> dict[str, object]:
        return {"id": "mock", "available": True, "version": None, "detail": "ok", "capabilities": {"stream": True}}

    def stream_chat(
        self, messages: list[dict[str, str]], session_id: str | None = None, model: str | None = None,
        system_prompt: str | None = None, tool_policy: ToolPolicy | None = None,
    ) -> Iterator[ChatEvent]:
        self.calls.append({
            "messages": messages, "session_id": session_id, "model": model,
            "system_prompt": system_prompt, "tool_policy": tool_policy,
        })
        yield from self.events
