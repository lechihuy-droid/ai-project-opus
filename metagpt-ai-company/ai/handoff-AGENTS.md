# Handoff - Codex

## Current Task

MetaGPT has been cloned and a wrapper folder has been scaffolded.

## Exact Next Action

Install MetaGPT dependencies with Python 3.11 if the user wants to run the workflow locally, then configure `%USERPROFILE%/.metagpt/config2.yaml` from `config/config2.yaml.example`.

## Files Touched

- `index.html`
- `config/config2.yaml.example`
- `prompts/software_company_examples.txt`
- `prompts/insighthub_mvp.txt`
- `scripts/check_setup.py`
- `scripts/install.ps1`
- `scripts/run_insighthub.ps1`
- `scripts/run_company.py` (supports `--existing-path` and `--incremental`)
- `ai/status.md`
- `ai/handoff-AGENTS.md`

## Validation

Run:

```powershell
C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe scripts\check_setup.py
.\scripts\install.ps1
C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe scripts\run_company.py --help
```

Uploaded project folder detected at:

`C:/Users/HUY/AI/metagpt-ai-company/workspace/workspace (2)/workspace`
