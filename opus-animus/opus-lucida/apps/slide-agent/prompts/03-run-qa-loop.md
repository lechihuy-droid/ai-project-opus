# Mode 3 - QA Loop

Run:

```powershell
node scripts/runAgent.js --lane <lane> --mode qa
```

Then add teaching QA to `lessons/<lane>/qa-report.md` using the same format:

- verdict
- critical
- major
- minor
- exact fix list

Verdicts: `PASS`, `PASS_WITH_NOTES`, `REVISE`, `BLOCK`.
