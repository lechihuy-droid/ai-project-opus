from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AI_ROOT = ROOT.parent
METAGPT_REPO = AI_ROOT / "MetaGPT"
WORKSPACE = ROOT / "workspace"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run MetaGPT's software-company workflow in this project workspace.")
    parser.add_argument("--idea", required=True, help="One-line product requirement for the AI company.")
    parser.add_argument("--project-name", default="", help="Optional output project name.")
    parser.add_argument(
        "--existing-path",
        default="",
        help="Existing project folder to update. When set, the workflow runs in incremental mode.",
    )
    parser.add_argument(
        "--incremental",
        action="store_true",
        help="Run MetaGPT in incremental mode against --existing-path.",
    )
    parser.add_argument("--investment", type=float, default=3.0, help="Budget limit used by MetaGPT cost manager.")
    parser.add_argument("--rounds", type=int, default=5, help="Number of SOP rounds to run.")
    parser.add_argument("--run-tests", action="store_true", help="Ask MetaGPT to include QA/test actions where supported.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not METAGPT_REPO.exists():
        raise SystemExit(f"MetaGPT repo not found: {METAGPT_REPO}")

    sys.path.insert(0, str(METAGPT_REPO))
    WORKSPACE.mkdir(parents=True, exist_ok=True)

    from metagpt.software_company import generate_repo

    existing_path = Path(args.existing_path).resolve() if args.existing_path else None
    if args.incremental and not existing_path:
        raise SystemExit("--incremental requires --existing-path.")
    if existing_path and not existing_path.exists():
        raise SystemExit(f"Existing path not found: {existing_path}")

    project_path = generate_repo(
        idea=args.idea,
        investment=args.investment,
        n_round=args.rounds,
        run_tests=args.run_tests,
        project_name=args.project_name,
        inc=bool(args.incremental or existing_path),
        project_path=str(existing_path or WORKSPACE),
    )
    print(project_path or WORKSPACE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
