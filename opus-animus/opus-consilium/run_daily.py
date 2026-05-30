"""
Daily Consilium brief.

Default behavior is local-only:
- read the durable wiki hubs
- ask Claude CLI to analyze the three research lanes: tech, ceo, competitor
- write logs/daily/YYYY-MM-DD.md
- print the brief

No Telegram or Telegraph call is made here. Collection happens in
run_lane.py / run_collect.py; this file is the local decision brief.
"""
from __future__ import annotations

import argparse
import io
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

from utils.config import logs_dir, personal_wiki_dir
from utils.llm import claude_cli


sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

load_dotenv()


@dataclass(frozen=True)
class Lane:
    key: str
    title: str
    pages: tuple[str, ...]
    focus: str
    action: str


LANES = (
    Lane(
        key="tech",
        title="Tech Learning Research",
        pages=("AI/ai-trend-radar.md", "Personal/reskill-roadmap.md", "Research/research-audit-queue.md"),
        focus="AI workflow, coding agents, evals, memory/context, sandboxing, and tools worth testing.",
        action="Pick one small workflow/eval/memory test; ignore isolated paper noise.",
    ),
    Lane(
        key="ceo",
        title="CEO Business Model Research",
        pages=("Business/competitor-business-model-radar.md", "FDE/fde-adoption-radar.md", "Stock/investment-theses.md"),
        focus="Customer budget, offer design, operating model, adoption blockers, and investment/business thesis.",
        action="Translate signals into offer, pricing, vertical, or operating-model implications.",
    ),
    Lane(
        key="competitor",
        title="Competitor Intelligence Research",
        pages=("Business/competitor-business-model-radar.md", "FDE/fde-adoption-radar.md", "Research/research-source-map.md"),
        focus="Named SIer/consulting/vendor moves, partnerships, AI-SDLC proof, revenue/bookings, and positioning.",
        action="Track concrete named-actor evidence; suppress vague AI positioning.",
    ),
)


def _read_wiki_page(rel_path: str) -> str:
    path = personal_wiki_dir() / rel_path
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _frontmatter_value(text: str, key: str) -> str:
    match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return ""
    for line in match.group(1).splitlines():
        if line.startswith(f"{key}:"):
            return line.partition(":")[2].strip().strip('"')
    return ""


def _strip_frontmatter(text: str) -> str:
    return re.sub(r"^---\s*\n.*?\n---\s*", "", text, flags=re.DOTALL)


def _section(text: str, heading: str) -> str:
    body = _strip_frontmatter(text)
    pattern = rf"^##\s+{re.escape(heading)}\s*$"
    match = re.search(pattern, body, flags=re.MULTILINE)
    if not match:
        return ""
    rest = body[match.end():]
    next_heading = re.search(r"^##\s+", rest, flags=re.MULTILINE)
    return rest[: next_heading.start()].strip() if next_heading else rest.strip()


def _latest_subsection(text: str, prefix: str) -> str:
    body = _strip_frontmatter(text)
    matches = list(re.finditer(rf"^###\s+{re.escape(prefix)}.*$", body, flags=re.MULTILINE))
    if not matches:
        return ""
    match = matches[-1]
    rest = body[match.start():]
    next_heading = re.search(r"^###\s+", rest[1:], flags=re.MULTILINE)
    return rest[: next_heading.start() + 1].strip() if next_heading else rest.strip()


def _bullets(text: str, limit: int = 4) -> list[str]:
    found: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            item = stripped[2:].strip()
            if item and item not in found:
                found.append(item)
        if len(found) >= limit:
            break
    return found


def _fallback_summary(text: str, limit: int = 3) -> list[str]:
    for heading in ("Key Points", "Current Synthesis", "Summary"):
        items = _bullets(_section(text, heading), limit=limit)
        if items:
            return items
    title = _frontmatter_value(text, "title") or "wiki page"
    return [f"Review [[{Path(title).stem}]]; no bullet summary found."]


def _lane_signals(lane: Lane) -> list[str]:
    signals: list[str] = []
    for rel_path in lane.pages:
        text = _read_wiki_page(rel_path)
        if not text:
            continue
        if lane.key == "tech":
            candidate = _latest_subsection(text, "Raw Ingest Signals") or _latest_subsection(text, "Promoted Signals")
        elif lane.key == "ceo":
            candidate = _section(text, "Current Synthesis") or _section(text, "Key Signals")
        else:
            candidate = _section(text, "Research Signals To Track") or _section(text, "Current Synthesis")
        for item in _bullets(candidate, limit=3) or _fallback_summary(text, limit=2):
            if item not in signals:
                signals.append(item)
        if len(signals) >= 4:
            break
    return signals[:4]


def _queue_status() -> list[str]:
    text = _read_wiki_page("Research/research-audit-queue.md")
    table = _section(text, "Current Counts")
    rows = []
    for line in table.splitlines():
        if not line.startswith("|") or "---" in line or "Queue" in line:
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) >= 2:
            rows.append(f"{cells[0]}: {cells[1]}")
    return rows


def build_evidence_bundle() -> str:
    today_iso = date.today().isoformat()
    today_display = date.today().strftime("%d/%m/%Y")
    lines = [
        f"Date: {today_iso} ({today_display})",
        "Delivery: local-only; no Telegram; no Telegraph.",
        "Research lanes: tech, ceo, competitor.",
        "",
    ]

    for lane in LANES:
        lines.extend(
            [
                f"## Lane: {lane.key} - {lane.title}",
                f"Focus: {lane.focus}",
                f"Default action bias: {lane.action}",
                "",
                "Evidence signals from wiki hubs:",
            ]
        )
        for signal in _lane_signals(lane):
            lines.append(f"- {signal}")
        lines.append("")

    lines.extend(["## Intake Status", ""])
    for item in _queue_status():
        lines.append(f"- {item}")
    return "\n".join(lines).rstrip() + "\n"


def _deterministic_brief(evidence: str, reason: str | None = None) -> str:
    today_iso = date.today().isoformat()
    today_display = date.today().strftime("%d/%m/%Y")
    lines = [
        f"# Consilium Daily Brief - {today_iso}",
        "",
        f"Brief {today_display} | local-only | 3 lanes | deterministic fallback",
        "",
    ]

    if reason:
        lines.extend([f"> LLM synthesis unavailable: {reason}", ""])

    for lane in LANES:
        lines.extend(
            [
                f"## {lane.title}",
                f"Focus: {lane.focus}",
                "",
                "What Changed:",
            ]
        )
        for signal in _lane_signals(lane):
            lines.append(f"- {signal}")
        lines.extend(
            [
                "",
                "Suggested Action:",
                f"- {lane.action}",
                "",
                "Ignore:",
                "- Isolated source noise without decision impact or a clear target hub.",
                "",
            ]
        )

    lines.extend(["## Intake Status", ""])
    in_intake = False
    for line in evidence.splitlines():
        if line == "## Intake Status":
            in_intake = True
            continue
        if in_intake and line.startswith("- "):
            lines.append(line)
    lines.extend(
        [
            "",
            "## Decision",
            "- Decision label: test",
            "- Do not ingest or archive from daily directly; use `run_wiki.py audit-research` for gates.",
            "- Telegram/Telegraph export is intentionally disabled for daily.",
            "",
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def synthesize_brief(evidence: str) -> str:
    today_iso = date.today().isoformat()
    today_display = date.today().strftime("%d/%m/%Y")
    prompt = f"""
You are Opus Consilium, Huy's decision brain.

Write a concise daily brief in Vietnamese from the evidence below.

Hard rules:
- Use exactly the three lanes: tech, ceo, competitor.
- Separate evidence from interpretation.
- Do not invent facts beyond the evidence.
- Give practical suggested actions, what to ignore, and wiki pages to update.
- Keep it decision-oriented, not a news summary.
- No Telegram, Telegraph, publishing, or external-send instruction.
- Mention that delivery is local-only.

Required markdown structure:
# Consilium Daily Brief - {today_iso}

Brief {today_display} | LLM-assisted | local-only | 3 lanes

## Tech
### What changed
### What it means
### Suggested action
### Ignore
### Wiki updates

## CEO
### What changed
### What it means
### Suggested action
### Ignore
### Wiki updates

## Competitor
### What changed
### What it means
### Suggested action
### Ignore
### Wiki updates

## Intake Status
## Decision

Evidence:
{evidence[:9000]}
""".strip()
    return claude_cli(prompt, timeout=180).strip() + "\n"


def build_brief(use_llm: bool = True) -> str:
    evidence = build_evidence_bundle()
    if not use_llm:
        return _deterministic_brief(evidence)
    try:
        return synthesize_brief(evidence)
    except Exception as exc:
        return _deterministic_brief(evidence, reason=str(exc)[:300])


def main(argv: list[str] | None = None) -> str:
    parser = argparse.ArgumentParser(description="Write a local-only, LLM-assisted, three-lane Consilium daily brief.")
    parser.add_argument("--no-write", action="store_true", help="Print only; do not write logs/daily.")
    parser.add_argument("--no-llm", action="store_true", help="Use deterministic fallback only.")
    args = parser.parse_args(argv)

    brief = build_brief(use_llm=not args.no_llm)
    if not args.no_write:
        path = logs_dir() / f"{date.today().isoformat()}.md"
        path.write_text(brief, encoding="utf-8")
        print(f"[run_daily] Wrote {path}")
    print(brief)
    return brief


if __name__ == "__main__":
    main()
