"""Minimal Claude CLI helpers shared by Opus Animus subsystems."""

from __future__ import annotations

import json
import os
import subprocess
from typing import Any


CLAUDE_CMD = os.environ.get("CLAUDE_CMD", "claude.cmd")


def claude_cli(prompt: str, timeout: int = 60) -> str:
    """Run Claude CLI in print mode and return stdout text."""

    result = subprocess.run(
        [CLAUDE_CMD, "-p"],
        input=prompt,
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI exit {result.returncode}: {result.stderr[:300]}")
    return result.stdout.strip()


def claude_cli_json(prompt: str, timeout: int = 60, expect: str = "object") -> dict | list:
    """Run Claude CLI and parse the first JSON object or array in the response."""

    text = claude_cli(prompt, timeout=timeout)
    parsed = _extract_json(text, expect=expect)
    if not isinstance(parsed, dict | list):
        raise ValueError(f"No JSON {expect} in response: {text[:200]}")
    return parsed


def _extract_json(text: str, expect: str) -> Any:
    if expect not in {"object", "array"}:
        raise ValueError("expect must be 'object' or 'array'")

    decoder = json.JSONDecoder()
    starts = "{" if expect == "object" else "["
    for index, char in enumerate(text):
        if char != starts:
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if expect == "object" and isinstance(value, dict):
            return value
        if expect == "array" and isinstance(value, list):
            return value
    raise ValueError(f"No JSON {expect} in response: {text[:200]}")
