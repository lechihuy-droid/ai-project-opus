"""
Claude CLI helper — chạy prompt qua subprocess stdin, parse JSON output.
Dùng cho tất cả filter/synthesis trong project (không cần API key).
"""
import json
import re
import subprocess

# Gọi thẳng .exe — npm shim claude.cmd thiếu EXIT /b nên cmd.exe báo
# "batch file cannot be found" → exit 1 giả dù CLI đã chạy xong.
CLAUDE_CMD = r"C:\Users\HUY\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe"


def claude_cli(prompt: str, timeout: int = 120) -> str:
    """Gọi Claude CLI qua print mode (-p), trả về raw text output."""
    result = subprocess.run(
        [CLAUDE_CMD, "-p"],
        input=prompt,
        capture_output=True, text=True, encoding="utf-8",
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI exit {result.returncode}: {result.stderr[:300]}")
    return result.stdout.strip()


def claude_cli_json(prompt: str, timeout: int = 120, expect: str = "object") -> dict | list:
    """
    Gọi Claude CLI và parse JSON từ output.
    expect: 'object' (default) → {...}; 'array' → [...]
    Strip markdown fences và tìm JSON block bằng regex.
    """
    text = claude_cli(prompt, timeout=timeout)
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    pattern = r"\[.*\]" if expect == "array" else r"\{.*\}"
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        raise ValueError(f"No JSON {expect} in response: {text[:200]}")
    return json.loads(m.group())
