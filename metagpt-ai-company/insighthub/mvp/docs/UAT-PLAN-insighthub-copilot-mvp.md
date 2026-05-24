# TEST PLAN - InsightHub Reporting Co-pilot (MVP, Concept B)
**Date:** 2026-05-23
**Status:** Draft for judging/demo use
**Primary source of truth:** `brief/AI_Hackathon_InsightHub_Agent_Brief.md`
**Supporting refs:** `RD-insighthub-copilot-mvp.md`, `SD-insighthub-copilot-mvp.md`, `README.md`

---

## 1. Purpose

This document serves two purposes:

1. Check how much of the original hackathon brief is covered by the current MVP.
2. Define one consolidated acceptance-oriented test plan focused on what judges, PMs, and DMs can actually see during demo time.

This is **not** a unit/integration test plan. It is a business-visible acceptance plan.

---

## 1.1 PM / DM KPI pack used by this plan

For this plan, **EVM is treated as only one KPI group**, not a separate test branch.
The consolidated KPI pack for PM/DM review is:

- Schedule: planned vs actual progress, schedule variance, milestone hit rate, sprint commitment, critical-path risk
- Cost / EVM: `BAC`, `PV`, `EV`, `AC`, `SPI`, `CPI`, `EAC`, `VAC`, burn-rate trend
- Delivery: throughput, velocity, completed milestones, due milestones
- Quality: open bugs, severity-1 bugs, reopen rate, review coverage, CI pass rate
- Risk / Blocker: open blockers, blocker aging, unanswered customer questions
- Change control: approved CR count, pending CR count, cost impact, schedule impact
- Resource: team size, utilization, single-owner dependency, overtime risk

The default `sample/` pack is still the main weekly PM path. The `evm-portfolio/` pack is used to test a DM handling multiple customer projects where EVM is one important lens among several management KPIs.

---

## 2. Coverage Summary Against Brief

### 2.1 High-level score

| Coverage bucket | Approx. level | Notes |
|---|---:|---|
| Covered well and UAT-ready | **45-55%** | Weekly report, file-based ingestion, reconciliation core, anti-hallucination, traceability, multilingual, headless E2E |
| Partially covered | **20-25%** | Monthly, portfolio, previous-report continuity, template switching, conversational refinement |
| Missing / out of MVP scope | **25-35%** | Live API connectors, review UI, scheduled mode, PPTX/Confluence/email export, section toggles, custom KPI config, deployment/security stack |

### 2.2 What the MVP is strongest at

- Weekly report generation from sample project data
- Cross-source reconciliation and anomaly detection
- Anti-hallucination validation and source traceability
- File-mode operation with no LLM/API-key dependency
- JP/EN/VN output support
- CLI fallback to protect against disqualification during judging

### 2.3 What should not be over-claimed

- Native live API connectors as production-ready
- Dedicated side-by-side review UI
- Full monthly acceptance parity with the weekly path
- Full DM portfolio workflow as a finished judging path
- Scheduler / notification workflow
- Export to PPTX / Confluence / email
- End-user extensibility for KPI/source additions without engineering work

---

## 3. Brief Coverage Matrix

### 3.1 Data Source Connectors

| Brief requirement | Current MVP status | Coverage | UAT note |
|---|---|---|---|
| Jira: file export support | `Sample_Jira_Export.xlsx` is wired in `connections.yaml` | Full | Use in primary weekly UAT |
| Jira: live API support | API adapter exists as concept/stub only | Partial | Do not claim as demo-ready |
| WBS Excel support | `Sample_WBS.xlsx` is wired and consumed | Full | Use in primary weekly UAT |
| Slack or Teams support | Slack file export exists; Teams does not | Partial | Claim "at least one chat source" only |
| GitHub/GitLab/Bitbucket support | GitHub file export exists; GitLab/Bitbucket do not | Partial | Claim GitHub only |
| Meeting minutes ingestion | Minutes directory is wired and consumed | Full | Use in weekly UAT and traceability checks |
| Previous reports as continuity reference | Sample previous reports exist; continuity behavior is limited | Partial | UAT as secondary check only |

### 3.2 Reconciliation and Project State

| Brief requirement | Current MVP status | Coverage | UAT note |
|---|---|---|---|
| Jira-to-WBS mapping and orphan detection | Present in pipeline/docs | Full | UAT by anomaly/result review |
| Planned vs. actual progress | Present in weekly report facts | Full | UAT in progress section |
| Done ticket with no code activity | Present as anomaly rule | Full | Must be in seeded anomaly checks |
| Schedule slippage detection | Present as anomaly rule | Full | Must be in seeded anomaly checks |
| Bug metrics incl. backlog/severity | Present at summary level | Partial | Verify only metrics actually emitted |
| Action items from minutes -> Jira follow-up | Claimed in rules/docs; needs acceptance proof | Partial | Treat as targeted UAT case |
| Slack blocker -> Jira correlation | Claimed in rules/docs; needs acceptance proof | Partial | Treat as targeted UAT case |

### 3.3 Report Generation

| Brief requirement | Current MVP status | Coverage | UAT note |
|---|---|---|---|
| Weekly report with 9 minimum sections | Core MVP path | Full | Main acceptance path |
| Monthly report | Monthly artifacts and module exist | Partial | Verify separately; do not assume parity |
| Portfolio / DM roll-up | Portfolio module and variant data exist | Partial | Bonus-only acceptance path |
| Ad-hoc sourced Q&A | No dedicated acceptance flow defined | Missing/Partial | Exclude from main UAT |
| Phase-completion report | Not implemented as explicit flow | Missing | Out of scope for MVP UAT |

### 3.4 Customization and Templates

| Brief requirement | Current MVP status | Coverage | UAT note |
|---|---|---|---|
| Multiple templates | `templates/registry.yaml` lists multiple templates | Partial | Verify switchability, not full template ecosystem |
| JP/EN/VN language output | Supported | Full | Include in UAT |
| JP keigo tone | Claimed in prompt path/docs | Partial | Manual Copilot UAT only |
| Branding: logo and customer name | Customer/project name is visible; logo/header is not proven | Partial/Missing | Do not make central claim |
| Section toggles | Not exposed as user feature | Missing | Exclude |
| Custom KPI config | Not exposed as user feature | Missing | Exclude |

### 3.5 Workflow and Interaction

| Brief requirement | Current MVP status | Coverage | UAT note |
|---|---|---|---|
| One-click generate | CLI and Copilot paths exist | Full | Main acceptance path |
| Review-and-edit UI with side-by-side evidence | No dedicated UI; evidence exists in artifacts | Missing/Partial | Reframe as traceability review, not UI |
| Conversational refinement | Supported conceptually via Copilot | Partial | Manual UAT only |
| Diff vs last report | Diff artifact/module exists | Partial | Secondary UAT only |
| Export DOCX/PDF/Markdown | Present | Full | Include in weekly and monthly checks |
| Export PPTX/Confluence/email | Not implemented | Missing | Exclude |
| Scheduled mode | Not implemented | Missing | Exclude |

### 3.6 Non-Functional and Deliverables

| Brief requirement | Current MVP status | Coverage | UAT note |
|---|---|---|---|
| Weekly latency < 60s | Present in prior test plan and CLI path | Full | Include as acceptance check |
| Monthly latency < 3 min | Not yet proven as judging-ready | Partial | Secondary check only |
| Confidentiality / no unapproved data leak | Local file-mode is strongest path | Partial | Claim conservatively |
| Audit log for fetches/LLM calls | Audit artifact exists | Full | Include in weekly UAT |
| Citation and traceability for every fact | Traceability is core MVP strength | Full | Main acceptance gate |
| Multilingual JP/EN/VN | Supported | Full | Include in UAT |
| Extensibility without code changes | Limited evidence | Partial | Do not over-claim |
| Deployable on AWS/Azure/on-prem with secret manager | Not a finished MVP concern | Missing | Out of scope |
| Weekly + monthly DOCX and PDF generated | Weekly is strong; monthly exists but needs acceptance proof | Partial | Verify both separately |
| Traceability log delivered | Present | Full | Main acceptance gate |

---

## 4. UAT Scope

### 4.1 In scope

- Weekly report UAT from supplied sample data
- File-based data coverage for Jira, WBS, Slack, GitHub, and meeting minutes
- Reconciliation/anomaly acceptance on seeded sample data
- Citation and traceability acceptance
- EN/JP/VN output acceptance
- PDF best-effort behavior
- Manual Copilot-path acceptance for conversational refinement
- DM/PM KPI review where EVM is one part of a wider management KPI pack
- Multi-project portfolio checks using large-project and medium-project sample data

### 4.2 Out of scope

- Live API connector acceptance
- Dedicated review UI acceptance
- Scheduled mode
- PPTX / Confluence / email export
- Phase-completion reporting
- Production deployment/security certification

---

## 5. UAT Scenarios

### 5.1 Core acceptance scenarios

| ID | Scenario | Objective | Expected acceptance result |
|---|---|---|---|
| UAT-01 | Weekly E2E report generation | Prove load sample data -> generate report works during judging | `weekly.docx`, `weekly.md`, `traceability.json`, `audit_log.md`, and `weekly.pdf` when available |
| UAT-02 | Data coverage across required sources | Prove the MVP uses Jira + WBS + at least one chat source + GitHub + minutes | Evidence from report facts and traceability spans all five source groups |
| UAT-03 | Reconciliation and anomaly detection | Prove the agent is not just forwarding Jira to an LLM | Seeded anomalies are surfaced at acceptable quality |
| UAT-04 | No hallucination / full traceability | Prove every key claim can be traced to source data | No invented ticket/number/date; sampled claims trace back cleanly |
| UAT-05 | Weekly section completeness | Prove the generated weekly report is customer-usable | All 9 minimum weekly sections are present and populated |
| UAT-06 | Multilingual output | Prove the MVP can deliver EN/JP/VN output | EN, JP, and VN reports generate without breaking IDs or metrics |
| UAT-07 | Graceful degradation | Prove the flow still passes even if PDF conversion or Copilot path is unavailable | CLI no-LLM path still completes; PDF may be skipped without failing E2E |
| UAT-08 | PM/DM KPI pack review | Prove the report pack can support PM/DM review beyond raw tickets | Schedule, cost/EVM, delivery, quality, blocker, change, and resource metrics are present in test data and can be discussed in review |
| UAT-09 | Multi-project DM portfolio | Prove one DM can review a large project and a medium project in one portfolio flow | Portfolio output references at least 2 projects with different size/risk profiles |

### 5.2 Secondary / bonus scenarios

| ID | Scenario | Objective | Expected acceptance result |
|---|---|---|---|
| UAT-10 | Monthly report generation | Check whether monthly deliverable is acceptance-usable | `monthly.docx` and `monthly.pdf` exist and contain monthly structure |
| UAT-11 | Template switching | Check whether PM can select another template without code edits | Alternate template can be selected and output still renders |
| UAT-12 | Previous-report continuity | Check whether prior reports influence continuity/tone | Output does not contradict prior report state; continuity evidence is reasonable |
| UAT-13 | Conversational refinement in Copilot | Check PM-facing refinement workflow | "shorter", "translate", "move to risks" type edits succeed without breaking validation |

---

## 6. UAT Sample Data Checklist

### 6.1 Available sample data in the repo

| Data asset | Current location | Intended UAT use |
|---|---|---|
| Jira export | `data/sample/Sample_Jira_Export.xlsx` | Core weekly/monthly facts, progress, completed work, bugs |
| WBS export | `data/sample/Sample_WBS.xlsx` | Planned schedule, variance, slippage |
| Slack export | `data/sample/Sample_Slack_Messages.json` | Blockers, informal updates, escalation signals |
| GitHub activity | `data/sample/Sample_GitHub_Activity.json` | Commit/PR/CI correlation |
| Meeting minutes | `data/sample/minutes/` | Decisions, action items, customer concerns |
| Previous reports | `data/sample/previous_reports/` | Continuity, diff, and historical style checks |
| Reporting rules baseline | `data/sample/Sample_Reporting_Rules.md` | Human-readable anomaly acceptance baseline |
| Ground truth | `data/sample/_ground_truth.json` | Seeded anomaly/reconciliation validation |
| Project state snapshot | `data/sample/_projectstate.json` | Internal consistency spot-checks |
| Variant project data | `data/sample-variant/` | Portfolio and robustness checks |
| EVM / DM portfolio pack | `data/evm-portfolio/` | Multi-project DM review with large-project and medium-project KPI packs |
| Template registry | `templates/registry.yaml` | Template switching checks |

### 6.2 Data needed per UAT scenario

| UAT ID | Minimum data required | Why it is needed |
|---|---|---|
| UAT-01 | Jira + WBS + Slack + GitHub + minutes + `connections.yaml` | Full weekly generation path |
| UAT-02 | Same as UAT-01 | Coverage proof across all required source groups |
| UAT-03 | Jira + WBS + Slack + GitHub + minutes + `_ground_truth.json` | Reconciliation/anomaly acceptance |
| UAT-04 | Generated weekly outputs + original source files | Traceability and no-hallucination checks |
| UAT-05 | Generated weekly report + brief section checklist | Confirm 9 weekly sections |
| UAT-06 | Same source pack as UAT-01 + EN/JP/VN outputs | Multilingual acceptance |
| UAT-07 | Same source pack as UAT-01 | Fallback/degradation acceptance |
| UAT-08 | `data/sample/` plus `data/evm-portfolio/` and `evm_context.yaml` files | PM/DM KPI review with EVM as one KPI group |
| UAT-09 | `data/evm-portfolio/project-atlas-5m/` + `data/evm-portfolio/project-beacon-1m/` | Multi-project DM portfolio |
| UAT-10 | Sample pack + monthly outputs + previous reports | Monthly acceptance |
| UAT-11 | Source pack + `templates/registry.yaml` + template DOCX files | Template switching |
| UAT-12 | Source pack + `previous_reports/` | Continuity and diff checks |
| UAT-13 | Source pack + `.vscode/mcp.json` + `.github` prompt/instructions | Manual Copilot-path acceptance |

### 6.3 Data gaps to call out before judging

| Gap | Impact on UAT |
|---|---|
| No native `.xlsx` rules workbook in the current repo snapshot | Use `Sample_Reporting_Rules.md` plus `_ground_truth.json` as the UAT baseline |
| No Teams sample export | Claim Slack-only for chat coverage |
| No GitLab/Bitbucket sample export | Claim GitHub-only for code activity coverage |
| No production live API credentials or judge-secret setup | Keep UAT on file-mode path |
| No dedicated review UI fixture | Evaluate traceability artifacts rather than UI workflow |

---

## 7. Acceptance Gates for Demo Day

### 7.1 Must-pass gates

- UAT-01 Weekly E2E runs successfully during judging
- UAT-03 Reconciliation/anomaly behavior is visibly cross-source
- UAT-04 No hallucinated content is found
- UAT-05 All 9 weekly sections are present
- UAT-06 At least one non-English path works cleanly
- UAT-07 CLI fallback works even if Copilot path is unavailable
- UAT-08 PM/DM KPI pack is coherent and reviewable
- UAT-09 Portfolio path works across large and medium projects

### 7.2 Nice-to-have gates

- UAT-10 Monthly report is demo-ready
- UAT-11 Template switching is shown live
- UAT-13 Conversational refinement is shown live in Copilot

---

## 8. Judge-Facing Positioning

When presenting this MVP, position it as:

- Strong on weekly reporting, traceability, reconciliation, anti-hallucination, and PM/DM KPI review
- Safe to demo because the CLI path protects against runtime LLM/Copilot failure
- Partially extended toward monthly, template variety, and portfolio use cases

Do **not** position it as:

- A fully productionized multi-connector platform
- A finished reporting UI product
- A complete replacement for the entire brief scope

---

*InsightHub Reporting Co-pilot - Test Plan v1.1 | 2026-05-23*
