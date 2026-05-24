# EVM Portfolio Sample Pack

This supplemental sample pack is for UAT scenarios where a Delivery Manager
reviews multiple projects with earned-value-management signals.

Projects included:

- `project-atlas-5m`: large project, budget about 5M USD
- `project-beacon-1m`: medium project, budget about 1M USD

Artifacts per project:

- `connections.yaml`
- `evm_context.yaml`
- `Sample_Jira_Export.xlsx`
- `Sample_WBS.xlsx`
- `Sample_Slack_Messages.json`
- `Sample_GitHub_Activity.json`
- `minutes/*.docx`
- `previous_reports/*.md`

Suggested commands:

```powershell
& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m insighthub generate --type weekly --lang en --no-llm --connections data/evm-portfolio/project-atlas-5m/connections.yaml --out output-evm-atlas
& "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m insighthub generate --type portfolio --lang en --no-llm --connections data/evm-portfolio/project-atlas-5m/connections.yaml data/evm-portfolio/project-beacon-1m/connections.yaml --out output-evm-portfolio
```
