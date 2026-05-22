"""Tests for InsightHub MCP pipeline tools."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from fastmcp import Client

from insighthub.report import generate
from insighthub.schema import Facts
from insighthub_mcp.server import mcp


def _payload(result: Any) -> dict:
    if hasattr(result, "structured_content") and result.structured_content is not None:
        return result.structured_content
    if hasattr(result, "data") and result.data is not None:
        return result.data
    if hasattr(result, "content") and result.content:
        text = getattr(result.content[0], "text", None)
        if text:
            return json.loads(text)
    if isinstance(result, dict):
        return result
    raise TypeError(f"Unsupported MCP result: {type(result)!r}")


def test_get_project_facts_returns_nine_sections():
    async def run() -> None:
        async with Client(mcp) as client:
            result = await client.call_tool(
                "get_project_facts",
                {"period_start": "2026-05-15", "period_end": "2026-05-21"},
            )
            facts = _payload(result)

        assert "error" not in facts
        assert len(facts["sections"]) == 9
        assert facts["project_name"] == "Project Sakura"

    asyncio.run(run())


def test_validate_report_rejects_fake_number():
    async def run() -> None:
        async with Client(mcp) as client:
            await client.call_tool(
                "get_project_facts",
                {"period_start": "2026-05-15", "period_end": "2026-05-21"},
            )
            result = await client.call_tool(
                "validate_report",
                {
                    "sections": [
                        {
                            "section_id": "exec_summary",
                            "title": "Executive Summary",
                            "body": "Fake metric 999 [jira:SAKURA-1]",
                        }
                    ]
                },
            )
            validation = _payload(result)

        assert validation["ok"] is False
        assert any("999" in violation for violation in validation["violations"])

    asyncio.run(run())


def test_export_report_writes_docx():
    async def run() -> None:
        async with Client(mcp) as client:
            result = await client.call_tool(
                "get_project_facts",
                {"period_start": "2026-05-15", "period_end": "2026-05-21"},
            )
            facts = Facts.model_validate(_payload(result))
            report = generate(facts, lang="en", use_llm=False)
            sections = [section.model_dump() for section in report.sections]

            result = await client.call_tool("export_report", {"sections": sections, "lang": "en"})
            exported = _payload(result)

        assert exported["ok"] is True
        assert Path(exported["paths"]["weekly_docx"]).exists()
        assert "weekly_pdf" in exported["paths"]

    asyncio.run(run())
