# Harness Report - Workspace Smoke Harness

- Run: `20260627-234104-workspace-smoke`
- Status: `pass`
- Passed: 11
- Failed: 0
- Trace: `trace.jsonl`

| Check | Status | Duration | Message | Evidence |
|---|---:|---:|---|---|
| `root-agents` | `pass` | 0.004s | Found file: AGENTS.md |  |
| `animus-status` | `pass` | 0.001s | All required text found |  |
| `consilium-readme` | `pass` | 0.002s | Found file: opus-animus\opus-consilium\README.md |  |
| `wiki-index` | `pass` | 0.004s | Found file: opus-animus\opus-consilium\personal-wiki\INDEX.md |  |
| `actio-schema` | `pass` | 0.005s | Found file: opus-animus\opus-actio\data\schema.sql |  |
| `profile-json` | `pass` | 0.002s | JSON object with 6 keys |  |
| `recall-fixtures` | `pass` | 0.003s | Found 2 matches |  |
| `compile-core-python` | `pass` | 0.051s | Compiled 6 files |  |
| `recall-tests` | `pass` | 2.765s | Command exited 0 | `harness\runs\20260627-234104-workspace-smoke\logs\recall-tests.stdout.txt`<br>`harness\runs\20260627-234104-workspace-smoke\logs\recall-tests.stderr.txt` |
| `recall-index` | `pass` | 0.456s | Command exited 0 | `harness\runs\20260627-234104-workspace-smoke\logs\recall-index.stdout.txt` |
| `recall-query-json` | `pass` | 0.344s | Command exited 0 | `harness\runs\20260627-234104-workspace-smoke\logs\recall-query-json.stdout.txt` |
