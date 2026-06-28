from __future__ import annotations

from pathlib import Path


HUB_DIR = Path(__file__).resolve().parent
HARNESS_DIR = HUB_DIR.parent
ROOT = HARNESS_DIR.parent
RUNS_DIR = HARNESS_DIR / "runs"
SUITES_DIR = HARNESS_DIR / "suites"
JOBS_DIR = HUB_DIR / "jobs"
PORT = 8799
STEP_CAP = 50
JOB_AGENT_CMD = "codex"
JOB_TIME_CAP_SECONDS = 1800
JOB_ALLOW_AGENTS = {"codex"}
LOOP_CONSECUTIVE_THRESHOLD = 12
OPUS_AI_DIR = ROOT / "opus-animus" / "ai"
INSPECT_MEP_DIR = HARNESS_DIR / "inspect" / "mep"
INSPECT_EXPORT_MEP = HARNESS_DIR / "inspect" / "export_mep.py"

USAGE_SOURCES = {
    "claude": Path.home() / ".claude" / "projects",
    "codex": [
        Path.home() / ".codex" / "sessions",
        Path.home() / ".codex" / "archived_sessions",
    ],
    "inspect": HARNESS_DIR / "inspect" / "logs",
}


if __name__ == "__main__":
    print(ROOT)
