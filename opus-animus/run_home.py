"""Run Opus Animus Home from the workspace root."""
from __future__ import annotations

import sys
from pathlib import Path

import uvicorn

ROOT = Path(__file__).resolve().parent
CONSILIUM = ROOT / "opus-consilium"
sys.path.insert(0, str(CONSILIUM))

from run_dashboard import app  # noqa: E402


if __name__ == "__main__":
    print("OPUS ANIMUS HOME -> http://localhost:8765")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
