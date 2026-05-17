# Mode 4 - Apply Fixes

Read `lessons/<lane>/qa-report.md`.

Apply only listed fixes to `slide-plan.json` or template files. Do not redesign, add templates, change tokens, or write production skeleton/script.

Re-run:

```powershell
node scripts/render.js --lane <lane>
node scripts/runAgent.js --lane <lane> --mode qa
```

Stop after three QA iterations if verdict is not `PASS` or `PASS_WITH_NOTES`.
