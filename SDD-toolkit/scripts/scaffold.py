"""
SDD Scaffold — Bootstrap a new project with SDD doc structure.

Usage:
  python scaffold.py new <project-name> [--path <target-dir>]
  python scaffold.py add-docs [--path <existing-project-dir>]

Examples:
  python scaffold.py new my-api
  python scaffold.py new trading-bot --path C:/Users/HUY/projects
  python scaffold.py add-docs --path C:/Users/HUY/existing-project
"""
import sys
import shutil
import argparse
from pathlib import Path
from datetime import date

TOOLKIT_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = TOOLKIT_DIR / "templates"

TEMPLATE_MAP = {
    "docs/RD-requirements.md": "RD-template.md",
    "docs/SD-system-design.md": "SD-system-design.md",
    "docs/BD-build-plan.md": "BD-build-plan.md",
    "docs/BACKLOG.md": "BACKLOG.md",
    "CLAUDE.md": "CLAUDE-project.md",
}


def fill_placeholders(content: str, project_name: str) -> str:
    today = date.today().isoformat()
    return (
        content
        .replace("{Project/Feature Name}", project_name)
        .replace("{Project Name}", project_name)
        .replace("{Project}", project_name)
        .replace("{project}", project_name.lower().replace(" ", "-"))
        .replace("{YYYY-MM-DD}", today)
        .replace("{date}", today)
    )


def scaffold_new(project_name: str, target_dir: Path):
    project_dir = target_dir / project_name.lower().replace(" ", "-")

    if project_dir.exists():
        print(f"[error] Directory already exists: {project_dir}")
        sys.exit(1)

    print(f"[scaffold] Creating project: {project_dir}")

    (project_dir / "docs").mkdir(parents=True)

    for dest_rel, template_name in TEMPLATE_MAP.items():
        src = TEMPLATES_DIR / template_name
        dest = project_dir / dest_rel

        if not src.exists():
            print(f"  [skip] Template not found: {src}")
            continue

        content = src.read_text(encoding="utf-8")
        content = fill_placeholders(content, project_name)
        dest.write_text(content, encoding="utf-8")
        print(f"  [ok] {dest_rel}")

    print(f"\n[scaffold] Done. Next steps:")
    print(f"  1. cd {project_dir}")
    print(f"  2. Fill in CLAUDE.md — stack, conventions, run command")
    print(f"  3. Open docs/RD-requirements.md — start with Section 0 (Problem Statement)")
    print(f"  4. Run: claude (Claude Code will read CLAUDE.md automatically)")


def add_docs(project_dir: Path):
    if not project_dir.exists():
        print(f"[error] Directory not found: {project_dir}")
        sys.exit(1)

    project_name = project_dir.name
    (project_dir / "docs").mkdir(exist_ok=True)

    created = 0
    skipped = 0
    for dest_rel, template_name in TEMPLATE_MAP.items():
        dest = project_dir / dest_rel
        if dest.exists():
            print(f"  [skip] Already exists: {dest_rel}")
            skipped += 1
            continue

        src = TEMPLATES_DIR / template_name
        if not src.exists():
            print(f"  [skip] Template not found: {src}")
            continue

        content = src.read_text(encoding="utf-8")
        content = fill_placeholders(content, project_name)
        dest.write_text(content, encoding="utf-8")
        print(f"  [ok] {dest_rel}")
        created += 1

    print(f"\n[scaffold] {created} files created, {skipped} skipped (already exist)")


def main():
    parser = argparse.ArgumentParser(description="SDD Scaffold")
    subparsers = parser.add_subparsers(dest="command")

    new_cmd = subparsers.add_parser("new", help="Create new project with SDD structure")
    new_cmd.add_argument("project_name", help="Project name")
    new_cmd.add_argument("--path", default=".", help="Parent directory (default: current dir)")

    add_cmd = subparsers.add_parser("add-docs", help="Add SDD docs to existing project")
    add_cmd.add_argument("--path", default=".", help="Project directory (default: current dir)")

    args = parser.parse_args()

    if args.command == "new":
        scaffold_new(args.project_name, Path(args.path).resolve())
    elif args.command == "add-docs":
        add_docs(Path(args.path).resolve())
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
