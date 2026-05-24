from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AI_ROOT = ROOT.parent
METAGPT_REPO = AI_ROOT / "MetaGPT"
CONFIG_EXAMPLE = ROOT / "config" / "config2.yaml.example"
USER_CONFIG = Path.home() / ".metagpt" / "config2.yaml"


def status(ok: bool, label: str, detail: str) -> None:
    mark = "OK" if ok else "MISSING"
    print(f"[{mark}] {label}: {detail}")


def main() -> int:
    py_ok = (3, 9) <= sys.version_info[:2] < (3, 12)
    status(py_ok, "Python", sys.version.split()[0])

    status(METAGPT_REPO.exists(), "MetaGPT repo", str(METAGPT_REPO))
    status(CONFIG_EXAMPLE.exists(), "Config example", str(CONFIG_EXAMPLE))
    status(USER_CONFIG.exists(), "User config", str(USER_CONFIG))

    if not py_ok:
        print("MetaGPT requires Python >=3.9 and <3.12.")
        return 1
    if not METAGPT_REPO.exists():
        print("Clone FoundationAgents/MetaGPT next to this folder first.")
        return 1
    if not USER_CONFIG.exists():
        print("Copy config/config2.yaml.example to %USERPROFILE%\\.metagpt\\config2.yaml and add your API key.")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
