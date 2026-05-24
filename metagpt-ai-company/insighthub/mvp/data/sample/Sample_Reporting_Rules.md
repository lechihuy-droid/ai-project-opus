# Sample Reporting Rules Baseline

This file is a human-readable UAT baseline for the anomaly and reconciliation rules
referenced by the FPT Japan AI Hackathon brief. It mirrors the seeded expectations in
`_ground_truth.json` and gives judges and PM reviewers a compact checklist to validate.

| Brief category | Judge signal | MVP rule id | Seeded sample evidence |
|---|---|---|---|
| Progress | Done ticket with no code activity | `ANOM-PG-001` | `SAKURA-12` done with no linked commit or PR |
| Progress | Code merged but ticket still open | `ANOM-PG-002` | `SAKURA-15` still in progress while `PR-5` merged |
| Progress | Task past planned end-date | `ANOM-PG-003` | `P2-T05` / `SAKURA-20` still not done after planned end |
| Progress | Phase percent drift | `ANOM-PG-004` | Phase 2 Development planned about 84% vs actual about 36% |
| Progress | Jira issue with no WBS parent | `ANOM-PG-005` | `SAKURA-30` orphaned from WBS |
| Bug | Bug aging | `ANOM-BG-001` | `SAKURA-25` open since `2026-04-20` |
| Bug | Severity-1 unresolved | `ANOM-BG-002` | `SAKURA-26` unresolved severity-1 issue |
| Bug | Reopen spike | `ANOM-BG-003` | `SAKURA-27`, `SAKURA-28`, `SAKURA-29` reopened in period |
| Risk | Slack blocker not in Jira | `ANOM-RK-001` | Slack message `C-004` with blocker language and no Jira key |
| Risk | Decision not actioned | `ANOM-RK-002` | Guest checkout decision has no follow-up issue or Slack trail |
| Schedule | Sprint commitment miss | `ANOM-SC-001` | Sprint 7 and Sprint 8 both below 70% completion |
| Quality | PR without review | `ANOM-QL-001` | `PR-7` merged with no reviewer |
| Quality | Failing CI on default branch | `ANOM-QL-002` | `PR-8` failing CI on main |
| Resource | Single point of failure | `ANOM-RS-001` | Tanaka closed more than 40% of completed story points |
| Consistency | Customer Q&A unanswered | `ANOM-CS-001` | Load-test question in minutes has no recorded response |

Recommended UAT use:

1. Run weekly generation on sample data.
2. Compare surfaced anomalies with this baseline.
3. Confirm the report and traceability artifacts reference the same seeded signals.
