# InsightHub Reporting Co-pilot

InsightHub Reporting Co-pilot generates a traceable weekly project status report from sample Jira, WBS, chat, GitHub, and meeting-minute exports. The MVP runs in two modes:

- VS Code + GitHub Copilot Chat through the local MCP server `insighthub-mcp`.
- Headless CLI with deterministic template output and no LLM/API key.

Python computes every metric. Copilot only writes narrative from the returned Facts JSON, and `validate_report` blocks invented numbers or IDs before export.

## Setup

Use Python 3.11:

```powershell
& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m pip install -r requirements.txt
```

`docx2pdf` is best-effort. If Word/docx2pdf is unavailable, PDF export is skipped while DOCX, Markdown, traceability, and audit artifacts still generate.

## Option A: VS Code + Copilot

1. Open this repository folder in VS Code.
2. Confirm `.vscode/mcp.json` exists and points to:
   `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`.
3. Enable MCP/agent mode in GitHub Copilot Chat if your VS Code build requires it.
4. Choose a Copilot model such as Claude Sonnet.
5. Run the prompt file `.github/prompts/weekly-report.prompt.md`, or ask:
   `Create a weekly report for Project Sakura, 2026-05-15 to 2026-05-21, in English.`

Required Copilot flow:

1. `get_project_facts(period_start, period_end)`
2. Draft exactly 9 report sections from Facts only.
3. `validate_report(sections)`
4. Repair violations if any.
5. `export_report(sections, lang)`

Generated files are written to `output/`.

## Option B: CLI Headless

Run without Copilot or an LLM key:

```powershell
& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m insighthub generate --type weekly --lang vn --no-llm
```

Expected artifacts:

- `output/weekly.docx`
- `output/weekly.md`
- `output/traceability.json`
- `output/audit_log.md`
- `output/weekly.pdf` when PDF conversion is available

## Demo Runbook

```powershell
& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m insighthub.datasource
& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m insighthub generate --type weekly --lang en --no-llm
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD=1
& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m pytest -q
```

The datasource smoke test should report `{jira:36, wbs:12, chat:13, github:23, minutes:5}` and `sprints=3`.
