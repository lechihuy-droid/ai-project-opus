# Inspect Full Harness Stack

Target stack:

- `inspect-ai`: core eval framework.
- `inspect-swe`: coding-agent bridge for tools such as Claude Code and Codex CLI.
- `inspect-viz`: analysis and visualization over Inspect logs.

## Install

Requires enough free disk space for Python packages such as `numpy`, `pandas`, and `pyarrow`.

```powershell
cd C:\Users\HUY\workspace\ai-project-opus
powershell -ExecutionPolicy Bypass -File .\harness\install-inspect.ps1 -NoCache
```

The venv is local to:

```text
.ih/
```

The short path is intentional. On Windows, `inspect-viz` pulls Jupyter assets
whose filenames can hit the legacy `MAX_PATH` limit if installed under
`harness/.venv-inspect/`.

## Verify

```powershell
.\.ih\Scripts\python.exe -m pip check
.\.ih\Scripts\inspect.exe --version
```

## Current Install Status

Installed on 2026-06-27.

Result: installed in the short-path venv.

Verified:

```text
inspect-ai  0.3.241
inspect-swe 0.2.63
inspect-viz 0.4.0
pip check: No broken requirements found.
```

The earlier `harness/.venv-inspect/` attempt was blocked by Windows path length
while installing Jupyter assets. Use `.ih/` for all Inspect commands.

## Practical Next Step

Run the local deterministic preflight before expensive Inspect evals:

```powershell
C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe harness\run_harness.py --suite workspace-smoke
```

Then run Inspect commands from:

```powershell
.\harness\run-inspect.ps1
```

Current baseline eval:

```powershell
.\harness\run-inspect.ps1 eval .\harness\inspect\tasks\workspace_smoke.py --log-dir .\harness\inspect\logs --display plain
.\harness\run-inspect.ps1 eval .\harness\inspect\tasks\boundary_compliance.py --log-dir .\harness\inspect\logs --display plain
```

Expected result:

```text
accuracy: 1.000
```

## Boundary Compliance

The local harness now enforces a workspace boundary before executing checks:

- file reads, JSON loads, glob roots, and Python compile paths stay inside the
  project root by default
- command working directories stay inside the project root
- path-like command arguments stay inside the project root
- raw shell launchers and dangerous command tokens require explicit allowlist

Run the direct suite:

```powershell
C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe harness\run_harness.py --suite boundary-compliance
```

Run the Inspect task:

```powershell
.\harness\run-inspect.ps1 eval .\harness\inspect\tasks\boundary_compliance.py --log-dir .\harness\inspect\logs --display plain
```

## MEP Loop

Open the Inspect viewer:

```powershell
.\harness\run-inspect.ps1 view --log-dir .\harness\inspect\logs
```

Export a minimal explanation packet from the newest Inspect log:

```powershell
.\.ih\Scripts\python.exe harness\inspect\export_mep.py
```

The packet is written under:

```text
harness/inspect/mep/<eval-log-name>/
  mep.json
  mep.md
```

Run the full local loop:

```powershell
.\harness\ci-harness.ps1
```

## Sandbox Status

Docker sandbox files are installed under `harness/sandbox/`, but Docker CLI was
not present on this machine during setup. After installing Docker Desktop:

```powershell
.\harness\run-docker-harness.ps1 workspace-smoke
.\harness\run-docker-harness.ps1 boundary-compliance
```
