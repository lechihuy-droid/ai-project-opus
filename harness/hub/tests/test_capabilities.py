from __future__ import annotations

import asyncio

import pytest

from services import capabilities


@pytest.fixture(autouse=True)
def _isolated_adapters() -> None:
    capabilities.clear_adapters()
    yield
    capabilities.clear_adapters()


def _context(*, allowed: tuple[str, ...] = ("design_context_fetch",), permission: str = "read_only") -> capabilities.CapabilityContext:
    return capabilities.CapabilityContext(
        allowed_capabilities=frozenset(allowed), permission=permission, correlation_id="capability-test",
    )


def _invoke(capability_id: str, action: str, inputs: object, context: capabilities.CapabilityContext) -> capabilities.CapabilityResult:
    return asyncio.run(capabilities.invoke(capability_id, action, inputs, context))


def test_catalog_exposes_vendor_neutral_wave_one_contracts_and_action_schemas() -> None:
    catalog = capabilities.load_catalog()

    assert set(catalog) == {"design_context_fetch", "browser_visual_validation", "accessibility_validation"}
    assert catalog["design_context_fetch"].binding["adapter_id"] == "figma_mcp"
    assert catalog["design_context_fetch"].id != catalog["design_context_fetch"].binding["vendor"]
    assert {schema["function"]["name"] for schema in capabilities.model_tool_schemas()} == {
        "design_context_fetch__fetch",
        "browser_visual_validation__screenshot",
        "browser_visual_validation__check_responsive",
        "browser_visual_validation__run_e2e",
        "accessibility_validation__scan",
    }
    assert capabilities.resolve_tool_name("accessibility_validation__scan")[0].contract_version == "1.0.0"  # type: ignore[index]


def test_adapter_happy_path_normalizes_data_and_preserves_evidence() -> None:
    class FigmaAdapter:
        async def invoke(self, action, inputs, context):
            assert action == "fetch"
            assert inputs == {"design_url": "https://www.figma.com/design/abc"}
            assert context.correlation_id == "capability-test"
            return capabilities.CapabilityResult(
                "succeeded",
                data={"document": {"name": "Checkout"}, "nodes": []},
                evidence=[{"kind": "design_url", "value": inputs["design_url"]}],
            )

    capabilities.register_adapter("figma_mcp", FigmaAdapter())
    result = _invoke("design_context_fetch", "fetch", {"design_url": "https://www.figma.com/design/abc"}, _context())

    assert result.status == "succeeded"
    assert result.data == {"document": {"name": "Checkout"}, "nodes": []}
    assert result.evidence == [{"kind": "design_url", "value": "https://www.figma.com/design/abc"}]
    assert result.trace_id == "capability-test"
    assert result.provider["adapter_id"] == "figma_mcp"


def test_invoke_refuses_ungranted_capability_before_adapter() -> None:
    class ExplodingAdapter:
        async def invoke(self, action, inputs, context):
            raise AssertionError("adapter must not run")

    capabilities.register_adapter("figma_mcp", ExplodingAdapter())
    result = _invoke("design_context_fetch", "fetch", {"design_url": "https://www.figma.com/a"}, _context(allowed=()))

    assert result.status == "refused"
    assert result.error is not None and result.error.code == "not_authorized"


def test_invoke_refuses_wrong_permission_before_adapter() -> None:
    result = _invoke("design_context_fetch", "fetch", {"design_url": "https://www.figma.com/a"}, _context(permission="admin"))

    assert result.status == "refused"
    assert result.error is not None and result.error.code == "permission_denied"


def test_invalid_input_is_rejected_before_adapter() -> None:
    class ExplodingAdapter:
        async def invoke(self, action, inputs, context):
            raise AssertionError("adapter must not run")

    capabilities.register_adapter("figma_mcp", ExplodingAdapter())
    result = _invoke("design_context_fetch", "fetch", {"design_url": ""}, _context())

    assert result.status == "failed"
    assert result.error is not None and result.error.code == "invalid_input"
    assert result.error.details["path"] == ["design_url"]


def test_missing_adapter_is_a_typed_unavailable_result() -> None:
    result = _invoke("design_context_fetch", "fetch", {"design_url": "https://www.figma.com/a"}, _context())

    assert result.status == "unavailable"
    assert result.error is not None and result.error.code == "adapter_unavailable"
    assert result.provider["vendor"] == "figma"


def test_network_capability_requires_a_trusted_origin_scope() -> None:
    context = capabilities.CapabilityContext(
        allowed_capabilities=frozenset({"browser_visual_validation"}), permission="read_only",
        correlation_id="capability-test",
    )
    result = _invoke(
        "browser_visual_validation", "screenshot",
        {"url": "http://127.0.0.1:3000", "viewport": {"width": 1280, "height": 720}}, context,
    )

    assert result.status == "refused"
    assert result.error is not None and result.error.code == "url_not_allowed"


def test_approval_policy_fails_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    catalog = capabilities.load_catalog()
    monkeypatch.setattr(capabilities, "load_catalog", lambda path=capabilities.CATALOG_PATH: catalog)
    catalog["design_context_fetch"].policy["approval_required"] = True

    result = _invoke(
        "design_context_fetch", "fetch", {"design_url": "https://www.figma.com/a"}, _context(),
    )

    assert result.status == "refused"
    assert result.error is not None and result.error.code == "approval_required"


def test_timeout_and_adapter_exception_are_sanitized(monkeypatch: pytest.MonkeyPatch) -> None:
    catalog = capabilities.load_catalog()
    monkeypatch.setattr(capabilities, "load_catalog", lambda path=capabilities.CATALOG_PATH: catalog)
    catalog["design_context_fetch"].policy["timeout_seconds"] = 0.001

    class SlowAdapter:
        async def invoke(self, action, inputs, context):
            await asyncio.sleep(0.02)
            return {"document": {}, "nodes": []}

    capabilities.register_adapter("figma_mcp", SlowAdapter())
    timeout = _invoke("design_context_fetch", "fetch", {"design_url": "https://www.figma.com/a"}, _context())
    assert timeout.status == "failed"
    assert timeout.error is not None and timeout.error.code == "timeout"

    class LeakingAdapter:
        async def invoke(self, action, inputs, context):
            raise RuntimeError("token=super-secret")

    catalog["design_context_fetch"].policy["timeout_seconds"] = 1
    capabilities.register_adapter("figma_mcp", LeakingAdapter())
    error = _invoke("design_context_fetch", "fetch", {"design_url": "https://www.figma.com/a"}, _context())
    assert error.status == "failed"
    assert error.error is not None and error.error.code == "adapter_error"
    assert "super-secret" not in error.error.message
    assert "super-secret" not in error.error.details.values()


def test_invalid_adapter_output_is_rejected_against_contract() -> None:
    class InvalidAdapter:
        async def invoke(self, action, inputs, context):
            return {"document": "not-an-object"}

    capabilities.register_adapter("figma_mcp", InvalidAdapter())
    result = _invoke("design_context_fetch", "fetch", {"design_url": "https://www.figma.com/a"}, _context())

    assert result.status == "failed"
    assert result.error is not None and result.error.code == "invalid_output"
