**FPT JAPAN — AI HACKATHON 2026**

Challenge Brief · v1.0

**AI Agent for Weekly & Monthly Project Reporting**

*Build an AI agent that turns raw project signals — Jira tickets, WBS, Slack/Teams chatter, GitHub activity, and meeting minutes — into customer-ready weekly and monthly reports for FPT Japan Front PMs and Delivery Managers.*

# **1. Context**

At FPT Japan, every Front PM and Delivery Manager (DM) running a customer-facing project spends a non-trivial chunk of every Friday — and a much bigger chunk at month-end — assembling status reports. The information they need is already scattered across the tools the team uses every day: Jira holds the task and bug state, the WBS Excel holds the plan, Slack/Teams holds the day-to-day decisions and blockers, GitHub holds what was actually built, and meeting minutes capture what was agreed with the customer.

The mechanical work is repetitive: pull ticket counts, compute completion %, list closed tickets and open bugs, summarize blockers, paste schedule status, format everything into the customer's template, translate to Japanese, double-check tone. Doing this manually costs a senior PM 3–6 hours every week and 6–10 hours every month. The numbers are sometimes inconsistent across tools. The narrative tone varies week to week. Customers occasionally notice.

Mission: Build an AI Agent that acts as a "Reporting Co-pilot" for Front PMs and DMs — one that pulls data from all the source systems on its own, reconciles it, drafts the weekly and monthly report in the customer's preferred format and language, and lets the PM review-and-ship instead of write-from-scratch.

# **2. Target Users & Scenarios**

**Primary users**

* Front PMs at FPT Japan running 1–3 customer-facing projects in parallel and submitting weekly reports every Friday.
* Delivery Managers (DM) overseeing a portfolio of 5–10 projects, needing rolled-up monthly status.
* BrSEs preparing bilingual (JP/EN/VN) status snapshots for customers and offshore teams.

**Typical scenarios**

* Friday 4pm: Front PM runs the agent. It pulls the past 7 days of Jira/Slack/GitHub activity, reconciles with WBS planned tasks, and produces a customer-ready Japanese weekly report in 2 minutes. PM reviews and submits.
* Last business day of the month: DM runs the agent in portfolio mode. It generates a per-project monthly report plus an executive roll-up across all projects.
* Customer asks an ad-hoc question ("How many bugs were fixed last sprint?"). PM asks the agent and gets a sourced answer in seconds.
* End of phase: PM needs a phase-completion report. Agent generates it using the same data sources with a phase-completion template.

# **3. Functional Requirements**

## **3.1. Data Source Connectors**

The agent must be able to ingest the following sources. Native API integration is preferred; file-based fallback (Excel/CSV export) must also work.

* **Jira (required):** issues, sub-tasks, epics, sprints, status transitions, story points, time logged, assignees, custom fields. Both live API and Excel export must be supported.
* **WBS Excel (required):** the planned schedule — phases, tasks, planned start/end, planned effort, planned % complete by week, dependencies, owner.
* **Slack / Microsoft Teams:** channel messages from customer-facing and internal project channels. Used to surface blockers, decisions, and informal status updates that never made it to Jira.
* **GitHub / GitLab / Bitbucket:** commits, PRs (opened/merged/reviewed), code review activity, release tags, CI status. Used to validate that reported "done" tickets have matching code activity.
* **Meeting minutes:** DOCX/TXT/MD files from customer meetings, or Teams/Zoom transcripts. Used to extract decisions, action items, and customer concerns.
* **Previous reports:** the last 4 weekly reports / 3 monthly reports for the same project, used as style and continuity reference.

## **3.2. Data Reconciliation & Project State**

Before generating any report, the agent must build a coherent "project state" by reconciling sources:

* Map Jira issues to WBS tasks (by key, by label, by fuzzy match on title). Flag Jira issues with no WBS parent and WBS tasks with no Jira tracking.
* Compute actual vs. planned progress per phase and per task.
* Cross-check: a Jira ticket marked "Done" with zero commits / zero PRs is suspicious — surface it for PM review.
* Detect schedule slippage: tasks past their WBS planned end-date that are not yet done.
* Aggregate bug metrics: opened/closed this period, open backlog by severity, mean time to fix, regression rate.
* Extract action items from meeting minutes and check whether each one became a Jira ticket. Flag orphan action items.
* Detect blockers from Slack/Teams (messages containing blocker keywords or escalation tone) and correlate with Jira tickets in blocked status.

## **3.3. Report Generation**

**3.3.1 Weekly Report**

The agent must produce a customer-ready weekly report containing at minimum:

* Executive summary (3–5 lines): overall status (Green/Yellow/Red), top achievements, top risks.
* Progress overview: planned vs. actual % by phase, with variance and trend vs. last week.
* Completed this week: tickets closed, features delivered, demos given. Each item with Jira key citation.
* In progress: ongoing items with owner and target close date.
* Planned for next week: top priorities, dependencies, expected demos/milestones.
* Blockers & risks: each item with owner, impact, mitigation, target resolution date.
* Bug summary: opened / closed / open by severity, with trend chart spec.
* Decisions & action items from customer meetings this week.
* Metrics appendix: velocity, throughput, code activity, optional charts.

**3.3.2 Monthly Report**

Monthly reports extend the weekly format with:

* Phase-level progress with monthly trend (4 weekly snapshots).
* Budget / effort consumption: planned MM vs. actual MM, burn rate, projected end.
* Quality KPIs: defect density, escaped defects, code review coverage, automation rate.
* Resource snapshot: team composition, ramp-up/ramp-down, key person risks.
* Forward-looking: next month plan, upcoming milestones, change requests in pipeline.
* Customer-visible deliverables produced in the month.

**3.3.3 Portfolio / DM Roll-up (Bonus)**

* Single dashboard view across N projects: status traffic light, top 3 risks per project, headline metrics.
* Drill-down to per-project monthly report.

## **3.4. Customization & Templates**

* Template selection: customer A uses a 5-section template, customer B uses an internal FPT 8-section template. The agent must support multiple templates and let the PM pick or auto-detect based on previous reports.
* Language: report output in Japanese (default for customer), English, or Vietnamese. Tone should match prior reports (formal Japanese keigo by default for customer-facing).
* Branding: support a header logo and customer name field.
* Section toggles: PM can hide/show optional sections (e.g., quality KPIs only for monthly).
* Custom KPIs: PM can configure project-specific KPIs (e.g., a CR throughput target) and have the agent include them automatically each period.

## **3.5. Workflow & Interaction**

* One-click generate: from the project's data sources, produce a full draft report.
* Review-and-edit UI: PM sees each section side-by-side with the underlying evidence (clickable Jira keys, Slack quotes, commit links). Edits made by PM are remembered for tone learning.
* Conversational refinement: "Make the executive summary more concise", "Translate to JP keigo", "Add a section on the integration phase", "Move the API issue to risks instead of blockers".
* Diff vs. last report: highlight what changed week-over-week or month-over-month, so the customer sees continuity.
* Export: DOCX / PDF / PPTX / Markdown / native Confluence page / email.
* Scheduled mode: agent can auto-draft every Friday morning and send the PM a notification.

# **4. Non-Functional Requirements**

* Latency: full weekly report generation < 60 seconds. Monthly report < 3 minutes.
* Confidentiality: customer-identifying data (project name, ticket content, customer name) must never leave the tenant boundary unless the LLM endpoint is explicitly approved.
* Audit log: every data fetch and every LLM call is logged with timestamp, source, and document hash.
* Citation & traceability: every fact in the generated report must be traceable to its source (Jira key, commit SHA, meeting minute paragraph, Slack message ID). Hallucinations are an automatic disqualification on the judge's test.
* Multilingual: JP/EN/VN. Tone in JP must be customer-appropriate (敬語).
* Extensibility: adding a new template, a new KPI, or a new data source must not require code changes for end users.
* Deployable on AWS / Azure / on-premise. Connectors authenticated via OAuth / API tokens stored in secret manager.

# **5. Built-in Reconciliation & Anomaly Rules (Illustrative)**

The rules below are the minimum set of cross-source signals the agent must detect and surface. The full version is in the supplementary file Sample\_Reporting\_Rules.xlsx.

| **Category** | **Signal** | **How the agent detects it** | **Severity** |
| --- | --- | --- | --- |
| Progress | Done ticket with no code activity | Jira issue moved to Done but no commit/PR references it within the period. | High |
| Progress | Code merged but ticket still open | Merged PR references a Jira key, but the ticket is still In Progress. | Medium |
| Progress | Task past planned end-date | WBS planned end < today and Jira status not Done. | High |
| Progress | Phase % drift | Reported phase % differs from computed (Jira-based) % by > 10 points. | High |
| Bug | Bug aging | Bug open > 14 days with no status change. | Medium |
| Bug | Severity-1 unresolved | Any Severity-1 / Blocker bug still open at end of period. | High |
| Bug | Reopen spike | Reopened bugs in this period > 2× baseline. | Medium |
| Risk | Slack blocker not in Jira | Slack message contains blocker keywords but no matching Jira ticket exists. | Medium |
| Risk | Decision not actioned | Meeting minute decision has no follow-up Jira ticket or no related Slack discussion within 3 days. | Medium |
| Schedule | Sprint commitment miss | Sprint completed < 70% of committed story points two sprints in a row. | High |
| Quality | PR without review | Merged PR with no reviewer or reviewer = author. | Medium |
| Quality | Failing CI on default branch | Default branch CI status is failing at end of period. | High |
| Resource | Single-point-of-failure | > 40% of completed story points in the period were closed by a single assignee. | Medium |
| Consistency | Customer Q&A unanswered | Customer asked a question in meeting minutes; no recorded response within 5 business days. | High |

# **6. Supplementary Reference Files**

Teams are provided with the following reference files to bootstrap the agent. Teams may extend them but must not remove the supplied baselines.

| **File** | **Purpose** |
| --- | --- |
| **Sample\_Jira\_Export.xlsx** | Anonymized Jira export covering 4 weeks of activity for a mid-size project (~80 issues, sub-tasks, sprints, time logged, custom fields). |
| **Sample\_WBS.xlsx** | WBS for the same project: phases, planned dates, planned MM, % complete by week, dependencies. |
| **Sample\_Slack\_Messages.json** | Channel export with ~300 messages over 4 weeks, including blockers, decisions, and casual updates. |
| **Sample\_GitHub\_Activity.json** | Commits, PRs, and CI status events tied to the same project's tickets. |
| **Sample\_Meeting\_Minutes.zip** | Four customer-meeting minutes in DOCX, mixing JP and EN. |
| **Sample\_Reporting\_Rules.xlsx** | Full set of reconciliation and anomaly rules with detection logic and severity defaults. |
| **Sample\_Report\_Templates.zip** | Two report templates (Customer A weekly + Internal FPT monthly) in DOCX with placeholder markers. |
| **Sample\_Previous\_Reports.zip** | Last 3 weekly reports + last 2 monthly reports for the sample project, used as tone and continuity reference. |

# **7. Deliverables**

* Source code (GitHub repository, with README explaining setup, data source configuration, and how to run a sample report).
* Demo URL or a video walkthrough of ≤ 5 minutes.
* Pitch slides (≤ 10 slides).
* Architecture document covering: data connectors, reconciliation engine, prompt/agent design, template engine, evaluation approach.
* At least one end-to-end weekly report and one monthly report generated from the supplied sample data, in DOCX and PDF.
* A traceability log showing, for the generated report, which source records every claim is backed by.

# **8. Evaluation Criteria (Total: 100 points)**

| **#** | **Criterion** | **Description** | **Points** |
| --- | --- | --- | --- |
| 1 | **Data Coverage** | Connectors work for Jira + WBS + at least one chat source + GitHub + minutes. Handles both API and Excel-export modes. | 15 |
| 2 | **Reconciliation Accuracy** | Cross-source signals (Done-without-commit, schedule drift, orphan blockers) detected with ≥ 85% precision on the judge's seeded test cases. | 15 |
| 3 | **Report Quality — Content** | Generated weekly/monthly report content is accurate, complete per template, and traceable. No hallucinated tickets or numbers. | 15 |
| 4 | **Report Quality — Tone & Language** | Japanese output uses appropriate keigo. EN and VN outputs are professional. Tone matches sample previous reports. | 10 |
| 5 | **Template Engine** | Supports multiple templates. PM can switch templates or add a new one without code changes. | 10 |
| 6 | **Citation & Traceability** | Every fact in the report is clickable / traceable to source. Hallucinations are penalized heavily. | 10 |
| 7 | **Review & Refinement UX** | Side-by-side review UI works. Conversational edits ("shorter", "translate", "move to risks") work reliably. | 5 |
| 8 | **Diff vs Last Report** | Agent can produce a week-over-week or month-over-month diff highlighting what changed. | 5 |
| 9 | **Portfolio Roll-up (Bonus)** | DM view across multiple projects with drill-down. (Bonus — full marks possible without it but other categories must be near-perfect.) | 5 |
| 10 | **Architecture & Security** | Connectors authenticated cleanly, secrets handled, audit log present, data does not leak. | 5 |
| 11 | **Pitch & Demo** | Live demo runs end-to-end on the supplied sample data. Story is clear and the value to a real Front PM is obvious. | 5 |

**Awards:**

* 🥇 First Prize: ≥ 85 points
* 🥈 Second Prize: 75–84
* 🥉 Third Prize: 65–74
* Honorable mention: 50–64

**Disqualification:**

* Hallucinated content in the generated report (tickets, names, numbers, decisions that do not exist in the source data).
* End-to-end flow (load sample data → generate report) does not run during judging.
* Submissions that simply forward raw Jira export to a generic LLM without doing reconciliation across sources.
* Sample customer data redistributed or used outside the hackathon.

# **9. Timeline**

| **Week** | **Activity** |
| --- | --- |
| **W1** | Registration opens. Brief, sample data package, and report templates released. |
| **W2–W4** | Development. Two optional office-hour sessions with FPT Front PMs / DMs for domain Q&A and template walkthrough. |
| **W5** | Submission. Preliminary judging on the sealed judge's test project (new data, new template). |
| **W6** | Finals. Live demo to a panel of Front PMs / DMs / Delivery Directors. Awards. |

# **10. References**

* Atlassian Jira REST API documentation
* Microsoft Graph API (Teams) / Slack Web API
* GitHub REST + GraphQL API
* PMI Practice Standard for Project Reporting
* FPT Japan internal Front PM / DM reporting playbook