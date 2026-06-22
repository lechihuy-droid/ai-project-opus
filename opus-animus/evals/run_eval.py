"""CLI for Opus Animus eval suites."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from animus_core.eval_runner import format_report, run_eval  # noqa: E402
from animus_core.router import route  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Run Opus Animus eval suites.")
    parser.add_argument("--suite", choices=("routing",), required=True)
    parser.add_argument("--update-baseline", action="store_true")
    args = parser.parse_args(argv)

    goldens_path = REPO_ROOT / "evals" / "routing-goldens.jsonl"
    baseline_path = REPO_ROOT / "evals" / "baseline.json"

    report = run_eval(
        goldens_path,
        route,
        baseline_path=baseline_path if baseline_path.exists() else None,
    )
    print(format_report(report))

    if args.update_baseline:
        baseline_path.write_text(
            json.dumps({"routing_accuracy": report["routing_accuracy"]}, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Updated baseline: {baseline_path}")

    return 1 if report["result"] == "FAIL" else 0


if __name__ == "__main__":
    raise SystemExit(main())
