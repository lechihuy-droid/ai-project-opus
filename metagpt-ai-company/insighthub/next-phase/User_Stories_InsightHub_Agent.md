# User Stories and Acceptance Criteria
## AI Agent for Weekly & Monthly Project Reporting - InsightHub Agent

**Document Version:** 1.0  
**Project:** FPT Japan AI Hackathon 2026  
**Prepared By:** Business Analyst  
**Date:** May 21, 2026  
**Status:** Draft

---

## Table of Contents

1. [Epic 1: Data Integration](#epic-1-data-integration)
2. [Epic 2: Data Reconciliation and Anomaly Detection](#epic-2-data-reconciliation-and-anomaly-detection)
3. [Epic 3: AI Report Generation](#epic-3-ai-report-generation)
4. [Epic 4: Multi-Language Support](#epic-4-multi-language-support)
5. [Epic 5: Review and Refinement Workflow](#epic-5-review-and-refinement-workflow)
6. [Epic 6: Export and Distribution](#epic-6-export-and-distribution)
7. [Epic 7: Portfolio Management](#epic-7-portfolio-management)
8. [Epic 8: Security and Audit](#epic-8-security-and-audit)

---

## Epic 1: Data Integration

### US-001: Connect to Jira via API

**As a** Front PM  
**I want** to connect the InsightHub Agent to my Jira project via API  
**So that** the system can automatically retrieve issues, sprints, and status data for report generation

#### Acceptance Criteria
- [ ] Given I have valid Jira Cloud API credentials, when I enter the API token and project key, then the system successfully authenticates and retrieves project metadata
- [ ] Given I have configured a Jira project, when I trigger data sync, then all issues (tickets, sub-tasks, epics) for the project are fetched within 10 seconds
- [ ] Given I want to filter issues by date range, when I specify start and end dates, then only issues created or updated within that range are retrieved
- [ ] Given I have Jira custom fields configured, when I map custom fields to standard attributes, then custom field values appear in reconciled data
- [ ] Given Jira API returns an error (e.g., invalid credentials), when connecting, then I see a user-friendly error message explaining the issue

#### Business Rules
- **BR-CONN-001**: Jira API credentials must be stored securely in secret manager (not in database plaintext)
- **BR-CONN-002**: System must support both Jira Cloud API v3 and Jira Server/Data Center API v2
- **Industry Standard**: Compliance with OAuth 2.0 / API token authentication standards

#### Technical Notes
- Use Jira REST API `/rest/api/3/search` endpoint with JQL
- Implement pagination for projects with > 100 issues (page size: 100)
- Cache issue metadata for 1 hour to reduce API calls

#### Dependencies
- FR-CONN-001 (Jira Integration requirement)
- Secret manager configured and accessible

---

### US-002: Import WBS from Excel File

**As a** Front PM  
**I want** to upload my project's WBS Excel file to the system  
**So that** the system can compare planned vs. actual progress

#### Acceptance Criteria
- [ ] Given I have a WBS Excel file (.xlsx or .xls), when I upload it via the UI, then the file is parsed successfully
- [ ] Given my WBS has columns: Phase, Task, Planned Start, Planned End, Planned MM, Planned %, when parsing, then all columns are extracted correctly
- [ ] Given my WBS uses custom column names, when I provide column mapping configuration, then the system parses the file using my mapping
- [ ] Given a WBS task has missing planned end date, when importing, then the system flags it as incomplete and displays a warning
- [ ] Given I upload an invalid file format (e.g., .txt), when uploading, then I see an error message "Invalid file format. Please upload .xlsx or .xls"

#### Business Rules
- **BR-CONN-003**: WBS file must contain at minimum: Task Name, Planned Start Date, Planned End Date
- **BR-CONN-004**: System must support flexible column mapping to accommodate different WBS templates

#### Technical Notes
- Use openpyxl (Python) or xlsx (Node.js) for Excel parsing
- Support both .xlsx (Office 2007+) and .xls (Office 97-2003) formats
- Store column mapping configuration per project

#### Dependencies
- FR-CONN-002 (WBS Excel Integration requirement)

---

### US-003: Connect to Slack for Chat Messages

**As a** Front PM  
**I want** to connect the InsightHub Agent to my project's Slack channels  
**So that** the system can detect blockers and decisions mentioned in team conversations

#### Acceptance Criteria
- [ ] Given I have Slack workspace admin approval, when I install the Slack app via OAuth, then the system is authorized to read channel messages
- [ ] Given I have configured specific channels (e.g., #project-abc, #customer-sync), when I trigger data sync, then messages from those channels are fetched
- [ ] Given I specify a date range, when fetching Slack messages, then only messages within that range are retrieved
- [ ] Given a Slack message contains thread replies, when fetching, then the full thread (parent + replies) is retrieved for context
- [ ] Given a Slack message contains keywords "blocked" or "blocker", when analyzing, then the system flags it as a potential blocker

#### Business Rules
- **BR-CONN-005**: System must filter out bot messages and system notifications unless explicitly configured
- **BR-CONN-006**: Slack API rate limits must be respected (Tier 3: 50+ requests per minute)

#### Technical Notes
- Use Slack Web API methods: `conversations.history`, `conversations.replies`
- Implement exponential backoff for rate limit handling
- Store user ID to display name mapping for readable reports

#### Dependencies
- FR-CONN-003 (Slack/Teams Integration requirement)
- Slack App registration and OAuth flow implemented

---

### US-004: Connect to GitHub for Code Activity

**As a** Front PM  
**I want** to connect the InsightHub Agent to my project's GitHub repository  
**So that** the system can verify that completed tickets have corresponding code commits

#### Acceptance Criteria
- [ ] Given I have a GitHub personal access token with repo read permissions, when I configure the repository, then the system successfully authenticates
- [ ] Given I have configured a repository, when I trigger data sync, then all commits from the specified date range are fetched
- [ ] Given I have pull requests in the repository, when fetching data, then PR status (open, merged, closed), author, reviewers, and merge date are retrieved
- [ ] Given a commit message contains "ABC-123: Fix login bug", when parsing, then the system links the commit to Jira issue ABC-123
- [ ] Given a pull request has failing CI status, when analyzing, then the system flags it as a quality issue

#### Business Rules
- **BR-CONN-007**: System must extract Jira keys from commit messages using regex pattern `[A-Z]{2,}-\d+`
- **BR-CONN-008**: System must handle GitHub API rate limits (5000 requests/hour for authenticated users)

#### Technical Notes
- Use GitHub REST API v3 endpoints: `/repos/{owner}/{repo}/commits`, `/repos/{owner}/{repo}/pulls`
- Support GitHub GraphQL API v4 for more efficient bulk queries
- Cache commit data for 1 hour to reduce API usage

#### Dependencies
- FR-CONN-004 (GitHub/GitLab/Bitbucket Integration requirement)

---

### US-005: Import Meeting Minutes Documents

**As a** Front PM  
**I want** to upload meeting minutes from customer meetings  
**So that** the system can extract decisions and action items for the report

#### Acceptance Criteria
- [ ] Given I have a meeting minutes file in DOCX format, when I upload it, then the text content is extracted correctly
- [ ] Given a meeting minutes file has a section titled "Action Items", when parsing, then all action items are extracted
- [ ] Given an action item is formatted as "AI: John - Create API documentation by May 25", when parsing, then owner=John and due date=May 25 are extracted
- [ ] Given a meeting minutes file has a section titled "Decisions", when parsing, then all decision statements are extracted
- [ ] Given I upload a PDF meeting minutes file, when parsing, then text content is extracted (OCR not required for text-based PDFs)

#### Business Rules
- **BR-CONN-009**: System must support DOCX, PDF, TXT, and Markdown formats for meeting minutes
- **BR-CONN-010**: Action item format detection should be flexible (support multiple common formats)

#### Technical Notes
- Use python-docx for DOCX parsing, PyPDF2 or pdfplumber for PDF parsing
- Use NLP techniques (spaCy or regex) to detect section headers like "Action Items", "Decisions", "次のステップ" (Japanese)

#### Dependencies
- FR-CONN-005 (Meeting Minutes Integration requirement)

---

## Epic 2: Data Reconciliation and Anomaly Detection

### US-006: Map Jira Issues to WBS Tasks

**As a** Front PM  
**I want** the system to automatically map Jira issues to WBS tasks  
**So that** I can see which planned tasks are being tracked and which are orphaned

#### Acceptance Criteria
- [ ] Given a Jira issue "ABC-123" and a WBS task with Jira Key field "ABC-123", when reconciling, then they are automatically linked
- [ ] Given a Jira issue titled "Implement login page" and a WBS task titled "Implement login page", when reconciling, then they are linked by title match
- [ ] Given a Jira issue with no exact WBS match but 85% title similarity, when reconciling, then fuzzy match links them
- [ ] Given a Jira issue with no matching WBS task, when reconciling, then it is flagged as "Orphan Jira Issue" in the report
- [ ] Given a WBS task with no matching Jira issue, when reconciling, then it is flagged as "Untracked WBS Task" in the report

#### Business Rules
- **BR-RECON-001**: Exact match on Jira Key field takes precedence over title matching
- **BR-RECON-002**: Fuzzy match threshold is configurable (default: 80% similarity)

#### Technical Notes
- Use Levenshtein distance or cosine similarity for fuzzy matching
- Store manual mappings in database to persist across report runs
- Allow PM to override automatic mappings via UI

#### Dependencies
- FR-RECON-001 (Jira-to-WBS Task Mapping requirement)
- US-001 (Jira data available), US-002 (WBS data available)

---

### US-007: Detect Schedule Slippage

**As a** Front PM  
**I want** the system to automatically detect tasks that are past their planned end date but not yet completed  
**So that** I can proactively communicate delays to the customer

#### Acceptance Criteria
- [ ] Given a WBS task with planned end date = May 15, 2026 and current date = May 21, 2026, and Jira status = "In Progress", when checking, then it is flagged as schedule slippage with 6 days overdue
- [ ] Given a task is 8 days overdue, when categorizing severity, then it is marked as "High"
- [ ] Given a task is 4 days overdue, when categorizing severity, then it is marked as "Medium"
- [ ] Given a task is 2 days overdue, when categorizing severity, then it is marked as "Low"
- [ ] Given a task with planned end date = May 15 and Jira status = "Done", when checking, then it is NOT flagged (completion date may be after planned date but task is done)

#### Business Rules
- **BR-RECON-003**: Slippage severity: < 3 days = Low, 3-7 days = Medium, > 7 days = High
- **BR-RECON-004**: Only tasks with Jira status ≠ "Done" are checked for slippage

#### Technical Notes
- Compare WBS planned end date to current system date
- Compute days overdue: `(current_date - planned_end_date).days`
- Include slippage items in "Blockers & Risks" section of report

#### Dependencies
- FR-RECON-003 (Schedule Slippage Detection requirement)
- US-006 (Jira-WBS mapping completed)

---

### US-008: Detect Done Tickets Without Code Activity

**As a** Front PM  
**I want** the system to flag Jira tickets marked "Done" that have no corresponding code commits or pull requests  
**So that** I can verify that work was actually completed

#### Acceptance Criteria
- [ ] Given a Jira issue ABC-123 with status "Done" and no commits or PRs referencing ABC-123, when checking, then it is flagged as "Done without code activity" with High severity
- [ ] Given a Jira issue ABC-456 with status "Done" and a commit message "ABC-456: Implement feature X", when checking, then it is NOT flagged
- [ ] Given a documentation task with no expected code changes, when flagged, then I can dismiss the flag as "Documentation only"
- [ ] Given I dismiss a false positive flag, when generating future reports, then that issue is not flagged again

#### Business Rules
- **BR-RECON-005**: System uses regex pattern `[A-Z]{2,}-\d+` to extract Jira keys from commit messages and PR titles
- **BR-RECON-006**: Common commit message patterns supported: "ABC-123:", "Fixes ABC-123", "[ABC-123]", "Close #ABC-123"

#### Technical Notes
- Cross-reference Jira "Done" issues with GitHub commits/PRs linked by Jira key
- Store dismissed flags in database per (issue_key, rule_id)

#### Dependencies
- FR-RECON-004 (Code Activity Cross-Check requirement)
- US-001 (Jira data), US-004 (GitHub data)

---

### US-009: Detect Code Merged but Ticket Not Closed

**As a** Front PM  
**I want** the system to flag pull requests that have been merged but the referenced Jira ticket is still open  
**So that** I can ensure tickets are updated properly

#### Acceptance Criteria
- [ ] Given a merged PR titled "ABC-789: Fix bug" and Jira issue ABC-789 has status "In Progress", when checking, then it is flagged as "Code merged but ticket still open" with Medium severity
- [ ] Given a merged PR and Jira issue ABC-789 has status "Done", when checking, then it is NOT flagged
- [ ] Given multiple PRs reference the same Jira issue, when checking, then the flag appears only once per issue

#### Business Rules
- **BR-RECON-007**: Only merged PRs are checked (open/closed-unmerged PRs are ignored)

#### Technical Notes
- Filter PRs where `merged = true`
- Extract Jira keys from PR title and commits in the PR

#### Dependencies
- FR-RECON-004 (Code Activity Cross-Check requirement)
- US-001 (Jira data), US-004 (GitHub data)

---

### US-010: Compute Bug Metrics and Trends

**As a** Front PM  
**I want** the system to automatically compute bug metrics (opened, closed, backlog, MTTF)  
**So that** I can report quality trends to the customer

#### Acceptance Criteria
- [ ] Given 5 bugs were created in the reporting period, when computing metrics, then "Bugs Opened: 5" is displayed
- [ ] Given 8 bugs moved to "Done" in the reporting period, when computing metrics, then "Bugs Closed: 8" is displayed
- [ ] Given 12 bugs are open at the end of the period (4 Critical, 8 Medium), when reporting, then breakdown by severity is shown
- [ ] Given bugs were closed in 3, 5, and 7 days, when computing Mean Time To Fix, then MTTF = 5 days
- [ ] Given 2 out of 10 closed bugs were reopened in the period, when computing regression rate, then it is 20%
- [ ] Given previous period had 6 bugs opened and current period has 5, when computing trend, then "Opened: 5 (-1 vs last period)" is shown

#### Business Rules
- **BR-RECON-008**: Bugs are identified by Jira issue type = "Bug" or "Defect"
- **BR-RECON-009**: MTTF is computed only for bugs closed in the reporting period: average of (closed_date - created_date)
- **BR-RECON-010**: Regression rate = (count of reopened bugs) / (count of closed bugs)

#### Technical Notes
- Use Jira status history to detect reopened bugs (transitioned to Done, then back to In Progress)
- Compute trends by comparing current period metrics to previous period

#### Dependencies
- FR-RECON-005 (Bug Metrics Aggregation requirement)
- US-001 (Jira data available)

---

### US-011: Detect High-Severity Anomalies (Priority Rules)

**As a** Front PM  
**I want** the system to automatically detect critical anomalies like Severity-1 bugs still open or failing CI on main branch  
**So that** I can escalate them immediately

#### Acceptance Criteria
- [ ] Given a Jira bug with Priority = "Blocker" or "Severity-1" is still open at the end of the reporting period, when running anomaly detection, then it is flagged as High severity in the Executive Summary
- [ ] Given the default branch (main/master) has failing CI status at the end of the reporting period, when checking, then it is flagged as "Failing CI on default branch" with High severity
- [ ] Given a sprint completed < 70% of committed story points for two consecutive sprints, when checking, then it is flagged as "Sprint commitment miss" with High severity
- [ ] Given a WBS phase has actual % = 60% and planned % = 80% (variance = -20%), when checking, then it is flagged as "Phase drift" with High severity
- [ ] Given all High-severity anomalies, when generating report, then they are surfaced in the Executive Summary section

#### Business Rules
- **BR-ANOM-001**: High-severity anomalies must always appear in Executive Summary
- **BR-ANOM-002**: Sprint commitment miss requires 2 consecutive sprints < 70% to trigger (avoids false positives from one-off issues)
- **BR-ANOM-003**: Phase drift threshold is configurable (default: 10 percentage points)

#### Technical Notes
- Implement rules from Sample_Reporting_Rules.xlsx: ANOM-BG-002, ANOM-QL-002, ANOM-SC-001, ANOM-PG-004
- Priority anomalies: High > Medium > Low for sorting in report

#### Dependencies
- FR-ANOM-001, FR-ANOM-002 (Anomaly Detection requirements)
- US-001 (Jira data), US-004 (GitHub CI status)

---

## Epic 3: AI Report Generation

### US-012: Generate Weekly Report with All Sections

**As a** Front PM  
**I want** the system to generate a complete weekly report with all required sections  
**So that** I can submit it to my customer with minimal edits

#### Acceptance Criteria
- [ ] Given project data for the week of May 15-21, when I click "Generate Weekly Report", then a complete report is generated in < 60 seconds
- [ ] Given the generated report, when I review it, then it contains all 9 sections: Executive Summary, Progress Overview, Completed This Week, In Progress, Planned for Next Week, Blockers & Risks, Bug Summary, Decisions & Action Items, Metrics Appendix
- [ ] Given 5 tickets were closed this week, when viewing "Completed This Week" section, then all 5 tickets are listed with Jira key hyperlinks
- [ ] Given 2 High-severity anomalies were detected, when viewing Executive Summary, then both anomalies are mentioned as top risks
- [ ] Given no blockers were detected, when viewing Blockers & Risks section, then it states "No blockers reported this week"

#### Business Rules
- **BR-RGEN-001**: Executive Summary shall be concise (3-5 lines maximum)
- **BR-RGEN-002**: Overall status (Green/Yellow/Red) is determined by: Green = no High anomalies, Yellow = 1-2 High anomalies, Red = 3+ High anomalies or Severity-1 bug unresolved
- **BR-RGEN-003**: All facts must have source citations (Jira keys, commit SHAs, Slack message links)

#### Technical Notes
- Use LLM (Claude, GPT-4) with structured prompt template containing all data sections
- Use previous reports as few-shot examples for tone consistency
- Post-process LLM output to inject hyperlinks to source systems

#### Dependencies
- FR-RGEN-001 (Weekly Report Generation requirement)
- All Epic 1 and Epic 2 user stories (data available and reconciled)

---

### US-013: Generate Monthly Report with Extended Sections

**As a** Front PM  
**I want** the system to generate a monthly report with additional sections beyond the weekly report  
**So that** I can provide comprehensive monthly status to my customer

#### Acceptance Criteria
- [ ] Given project data for the month of May 2026, when I generate a monthly report, then it contains all weekly sections PLUS monthly-specific sections: Phase Trend, Budget/Effort, Quality KPIs, Resource Snapshot, Forward-Looking, Deliverables
- [ ] Given 4 weeks of data in May, when viewing Phase Trend section, then I see a table with 4 data points (week 1-4) showing % complete for each phase
- [ ] Given planned 10 MM and actual 8 MM consumed, when viewing Budget/Effort section, then variance = -2 MM and burn rate is computed
- [ ] Given 50 code reviews conducted and 45 had reviewer ≠ author, when viewing Quality KPIs, then code review coverage = 90%
- [ ] Given 3 deliverables were completed in May, when viewing Deliverables section, then all 3 are listed with delivery date and description

#### Business Rules
- **BR-RGEN-004**: Monthly report generation time limit: < 3 minutes
- **BR-RGEN-005**: Phase trend shall show week-over-week progression to visualize trajectory

#### Technical Notes
- Aggregate weekly data into monthly summaries
- Compute month-over-month trends where applicable (e.g., bug backlog change)

#### Dependencies
- FR-RGEN-002 (Monthly Report Generation requirement)
- US-012 (Weekly report generation working)

---

### US-014: Apply Customer-Specific Template

**As a** Front PM  
**I want** to select a customer-specific report template  
**So that** the generated report matches my customer's required format

#### Acceptance Criteria
- [ ] Given I have 2 templates configured (Customer A Weekly, Internal FPT Monthly), when I select Customer A template, then the report is generated using that template's structure
- [ ] Given I have generated 3 previous reports using Customer A template, when I generate a new report without selecting a template, then the system auto-selects Customer A template based on history
- [ ] Given a template has placeholder `{{EXECUTIVE_SUMMARY}}`, when generating report, then the placeholder is replaced with the actual executive summary content
- [ ] Given a template has a conditional section "Quality KPIs (Monthly only)", when generating a weekly report, then that section is omitted
- [ ] Given I upload a new template DOCX file via UI, when I save it, then the new template appears in the template selection dropdown

#### Business Rules
- **BR-TMPL-001**: Template selection precedence: User manual selection > Auto-detection from previous reports > Default template
- **BR-TMPL-002**: Templates must contain required placeholders for mandatory sections (Executive Summary, Progress Overview)

#### Technical Notes
- Store templates in database or file system with metadata (template_name, template_type, customer)
- Use Jinja2 (Python) or Handlebars (Node.js) for placeholder replacement
- Validate template on upload to ensure required placeholders exist

#### Dependencies
- FR-TMPL-001 (Multiple Template Support requirement)

---

### US-015: Include Full Traceability for All Facts

**As a** Front PM  
**I want** every fact in the generated report to be traceable to its source  
**So that** I can quickly verify information when the customer asks follow-up questions

#### Acceptance Criteria
- [ ] Given the report states "8 bugs closed this week", when I click on the citation link, then I am taken to a Jira query showing exactly those 8 bugs
- [ ] Given the report states "API integration delayed (mentioned in Slack)", when I click the citation, then I am taken to the specific Slack message
- [ ] Given the report states "Commit 3a7f2e1 implements feature X", when I click the commit SHA, then I am taken to the GitHub commit page
- [ ] Given a report is generated, when I download the traceability log file, then it lists all source record IDs (Jira keys, commit SHAs, Slack message IDs) used in the report
- [ ] Given the LLM generates a fact with no source evidence, when post-processing validates, then report generation fails with error "Unable to trace fact to source"

#### Business Rules
- **BR-AUDIT-001**: Zero tolerance for hallucinations - any fact without source citation shall cause generation to fail
- **BR-AUDIT-002**: Citations in DOCX/PDF shall be hyperlinks; in plain text/Markdown shall be footnotes with URLs

#### Technical Notes
- Implement post-processing validation step before finalizing report
- Generate traceability log as JSON file: `{"fact": "8 bugs closed", "sources": ["PROJ-101", "PROJ-102", ...]}`
- Store traceability log alongside exported report

#### Dependencies
- FR-AUDIT-001 (Citation and Source Traceability requirement)

---

## Epic 4: Multi-Language Support

### US-016: Generate Japanese Report with Keigo

**As a** Front PM  
**I want** the system to generate reports in Japanese using appropriate keigo (敬語)  
**So that** I can submit professional customer-facing reports without manual translation

#### Acceptance Criteria
- [ ] Given I select language = "Japanese (Customer)" when generating a report, then all narrative text is in Japanese keigo
- [ ] Given the report states a blocker, when reviewing Japanese text, then appropriate polite phrasing is used (e.g., "お客様にご報告申し上げます" instead of "報告します")
- [ ] Given technical terms like "sprint", "bug", "pull request", when translating, then consistent terminology is used ("スプリント", "バグ", "プルリクエスト")
- [ ] Given Jira keys (e.g., "PROJ-123") and acronyms (e.g., "API", "CI/CD"), when generating Japanese report, then they remain in English
- [ ] Given I have provided 3 previous Japanese reports as examples, when generating a new report, then the tone and terminology match the examples

#### Business Rules
- **BR-LANG-001**: Customer-facing reports default to keigo; internal reports use です/ます体
- **BR-LANG-002**: Technical term translation must be consistent across all reports
- **Industry Standard**: Business Japanese communication standards (JLPT N1 level)

#### Technical Notes
- Use LLM with Japanese language instruction and keigo examples in prompt
- Provide domain-specific glossary (JP-EN) to ensure consistent term translation
- Validate output with native Japanese speaker during development

#### Dependencies
- FR-LANG-001 (Japanese Report Generation requirement)

---

### US-017: Generate English and Vietnamese Reports

**As a** BrSE (Bridge System Engineer)  
**I want** the system to generate reports in English or Vietnamese  
**So that** I can communicate with offshore teams in their preferred language

#### Acceptance Criteria
- [ ] Given I select language = "English", when generating a report, then all narrative text is in English
- [ ] Given I select language = "Vietnamese", when generating a report, then all narrative text is in Vietnamese
- [ ] Given I configure terminology preference "bug" vs "defect", when generating English report, then the selected term is used consistently
- [ ] Given technical terms, when translating to Vietnamese, then consistent terminology is maintained (e.g., "sprint" → "sprint" or "chu kỳ", configured per project)

#### Business Rules
- **BR-LANG-003**: All three languages (JA, EN, VN) shall use professional business tone
- **BR-LANG-004**: Terminology preferences are configurable per project

#### Technical Notes
- Maintain glossary for technical terms in all 3 languages
- Allow PM/BrSE to configure preferred terminology variants

#### Dependencies
- FR-LANG-002 (English and Vietnamese Report Generation requirement)

---

## Epic 5: Review and Refinement Workflow

### US-018: Review Report with Side-by-Side Evidence

**As a** Front PM  
**I want** to view the generated report alongside supporting evidence from source systems  
**So that** I can verify accuracy before submitting to the customer

#### Acceptance Criteria
- [ ] Given a generated report, when I open the review screen, then the report is displayed in the main pane with formatted sections
- [ ] Given the report states "8 bugs closed", when I click on the citation, then the side evidence pane shows a list of 8 Jira bugs with keys, titles, and close dates
- [ ] Given I click on a Slack message citation, when the evidence pane updates, then the full message text and timestamp are displayed
- [ ] Given the evidence pane shows 50 items, when I scroll through them, then navigation is smooth and responsive
- [ ] Given I click "Blockers & Risks" in the table of contents, when navigating, then that section scrolls into view in the main pane

#### Business Rules
- **BR-REVIEW-001**: Evidence pane shall show maximum 100 items at once (paginate if more)
- **BR-REVIEW-002**: Citations shall be clickable to highlight corresponding evidence

#### Technical Notes
- Use split-pane layout with resizable dividers (React, Vue, or Angular)
- Lazy-load evidence items to improve performance for large datasets

#### Dependencies
- FR-REVIEW-001 (Side-by-Side Review Interface requirement)

---

### US-019: Edit Report Inline

**As a** Front PM  
**I want** to edit any section of the report directly in the browser  
**So that** I can make quick adjustments without exporting to Word first

#### Acceptance Criteria
- [ ] Given I click on the "Executive Summary" section, when I double-click, then a rich text editor appears allowing me to edit the text
- [ ] Given I edit "5 bugs" to "6 bugs" and click Save, when I view the report again, then the change is persisted
- [ ] Given I make edits and export to DOCX, when I open the DOCX file, then my edited content appears (not the original AI-generated content)
- [ ] Given I want to undo my edits, when I click "Revert to AI version", then the original AI-generated text is restored
- [ ] Given I make multiple edits over time, when I view edit history, then I see a log of changes with timestamps and my user ID

#### Business Rules
- **BR-REVIEW-003**: All edits are logged in audit trail for compliance
- **BR-REVIEW-004**: Revert action requires confirmation to prevent accidental data loss

#### Technical Notes
- Use rich text editor: Quill, Draft.js, or TinyMCE
- Auto-save edits every 30 seconds to prevent data loss
- Store edit history in database

#### Dependencies
- FR-REVIEW-002 (Inline Editing requirement)

---

### US-020: Refine Report Using Conversational Commands

**As a** Front PM  
**I want** to refine the report using natural language commands like "make this shorter" or "translate to Japanese"  
**So that** I can quickly improve the report without manual editing

#### Acceptance Criteria
- [ ] Given I type "Make the executive summary more concise" in the chat interface, when the command is processed, then the executive summary is regenerated with fewer words
- [ ] Given I type "Translate the Blockers & Risks section to Japanese keigo", when processed, then that section is translated while other sections remain in the original language
- [ ] Given I type "Move the API integration issue from In Progress to Blockers & Risks", when processed, then the issue appears in Blockers & Risks section and is removed from In Progress
- [ ] Given the system regenerates a section based on my command, when I view the before/after preview, then I can accept or reject the change
- [ ] Given I reject a conversational edit, when I click "Keep original", then the original content is retained

#### Business Rules
- **BR-REVIEW-005**: Conversational commands must be interpreted by LLM with high accuracy (>90% intent detection)
- **BR-REVIEW-006**: Before/after preview is mandatory for all conversational edits

#### Technical Notes
- Use LLM instruction-following capability (Claude Opus, GPT-4)
- Parse command to extract intent (shorten, translate, move, add, remove) and target section
- Show diff view for before/after comparison (similar to git diff)

#### Dependencies
- FR-REVIEW-003 (Conversational Refinement requirement)

---

## Epic 6: Export and Distribution

### US-021: Export Report to DOCX and PDF

**As a** Front PM  
**I want** to export the finalized report to DOCX and PDF formats  
**So that** I can distribute it to my customer via email or file sharing

#### Acceptance Criteria
- [ ] Given a finalized report, when I click "Export to DOCX", then a Microsoft Word .docx file is downloaded to my computer
- [ ] Given a finalized report, when I click "Export to PDF", then a PDF file is downloaded with all formatting, tables, and hyperlinks preserved
- [ ] Given the report contains Jira key citations, when I export to DOCX, then Jira keys are clickable hyperlinks to Jira
- [ ] Given the report contains tables and charts, when I export to PDF, then tables and charts are rendered correctly
- [ ] Given I export to PDF, when I print the PDF, then page breaks are logical (sections do not break mid-table)

#### Business Rules
- **BR-EXPORT-001**: Exported files shall preserve all formatting from the template
- **BR-EXPORT-002**: Citations in DOCX/PDF shall be hyperlinks (not plain text URLs)

#### Technical Notes
- Use python-docx or docxtpl for DOCX generation
- Use ReportLab or WeasyPrint for PDF generation
- Embed fonts in PDF for consistent rendering across systems

#### Dependencies
- FR-EXPORT-001 (Multiple Export Formats requirement)

---

### US-022: Export Report to PowerPoint

**As a** Delivery Manager  
**I want** to export the report to PowerPoint format  
**So that** I can present it in executive meetings

#### Acceptance Criteria
- [ ] Given a finalized report with 8 sections, when I export to PPTX, then a PowerPoint file is generated with 9 slides (1 title slide + 8 section slides)
- [ ] Given a section contains a table, when exported to PPTX, then the table is rendered as a PowerPoint table on the slide
- [ ] Given a section contains a chart specification ("bar chart: opened=5, closed=8"), when exported to PPTX, then a bar chart is rendered on the slide
- [ ] Given the template specifies branding (logo, colors), when exporting to PPTX, then branding is applied to all slides

#### Business Rules
- **BR-EXPORT-003**: Each report section maps to one slide; long sections are split across multiple slides if needed
- **BR-EXPORT-004**: Charts are rendered as native PowerPoint charts (not images) for editability

#### Technical Notes
- Use python-pptx for PowerPoint generation
- Support chart types: bar, line, pie (based on chart specification in report)

#### Dependencies
- FR-EXPORT-001 (Multiple Export Formats requirement)

---

### US-023: Publish Report Directly to Confluence

**As a** Front PM  
**I want** to publish the report directly to a Confluence page  
**So that** stakeholders can access the latest report without email distribution

#### Acceptance Criteria
- [ ] Given I have configured Confluence credentials and space, when I click "Publish to Confluence", then a new page is created in the specified Confluence space
- [ ] Given I publish a report, when I view the Confluence page, then all sections, tables, and formatting are preserved
- [ ] Given I publish an updated report to the same Confluence page, when viewing, then the page content is updated (not duplicated)
- [ ] Given the report contains citations, when published to Confluence, then citations are rendered as hyperlinks

#### Business Rules
- **BR-EXPORT-005**: Confluence page title format: "\[Project Name\] - Weekly Report - \[Date\]"
- **BR-EXPORT-006**: If a page with the same title exists, prompt user to "Update existing page" or "Create new page"

#### Technical Notes
- Use Confluence REST API: `POST /wiki/rest/api/content` to create page
- Convert report HTML to Confluence storage format (XHTML)

#### Dependencies
- FR-EXPORT-001 (Multiple Export Formats requirement)

---

## Epic 7: Portfolio Management

### US-024: View Portfolio Dashboard (DM)

**As a** Delivery Manager  
**I want** to view a portfolio dashboard showing status of all my projects  
**So that** I can quickly identify which projects need attention

#### Acceptance Criteria
- [ ] Given I oversee 5 projects, when I open the portfolio dashboard, then all 5 projects are displayed in a table with columns: Project Name, Status (traffic light), % Complete, Open Bugs, Top 3 Risks
- [ ] Given Project A has status Red (3 High-severity anomalies), when viewing the dashboard, then Project A's status icon is red and highlighted
- [ ] Given I click on Project B in the dashboard, when drilling down, then I am taken to Project B's monthly report view
- [ ] Given I filter the dashboard by status = "Red", when applying filter, then only Red status projects are shown
- [ ] Given aggregate metrics across all 10 projects (total % complete, total open bugs), when viewing dashboard footer, then aggregate values are displayed

#### Business Rules
- **BR-PORTFOLIO-001**: Status traffic light: Green = 0 High anomalies, Yellow = 1-2 High anomalies, Red = 3+ High anomalies
- **BR-PORTFOLIO-002**: Top 3 risks per project are the 3 highest-severity anomalies detected

#### Technical Notes
- Portfolio dashboard is a read-only view aggregating data from individual project reports
- Use caching to improve performance (refresh every 5 minutes)

#### Dependencies
- FR-RGEN-003 (Portfolio Roll-Up Report requirement)

---

### US-025: Generate Multi-Project Roll-Up Report

**As a** Delivery Manager  
**I want** to generate a consolidated report across all my projects  
**So that** I can present overall portfolio status to executives

#### Acceptance Criteria
- [ ] Given I select 5 projects for the roll-up report, when I click "Generate Portfolio Report", then a consolidated report is generated showing one summary row per project
- [ ] Given each project has a monthly report, when generating portfolio report, then key metrics from each monthly report are aggregated (% complete, bug counts, resource counts)
- [ ] Given Project A is Red status and Project B is Yellow status, when viewing Executive Summary, then both projects are called out with reason for status
- [ ] Given the portfolio report is generated, when I export to PPTX, then one slide is created per project + one executive summary slide

#### Business Rules
- **BR-PORTFOLIO-003**: Portfolio report generation time limit: < 5 minutes for up to 10 projects
- **BR-PORTFOLIO-004**: Portfolio report does NOT include full details of each project (use drill-down for details)

#### Technical Notes
- Run individual project report generation in parallel to improve performance
- Aggregate results into portfolio template

#### Dependencies
- FR-RGEN-003 (Portfolio Roll-Up Report requirement)
- US-024 (Portfolio dashboard working)

---

## Epic 8: Security and Audit

### US-026: Authenticate and Authorize Users

**As a** System Administrator  
**I want** to configure user authentication and role-based access control  
**So that** only authorized users can generate reports and view project data

#### Acceptance Criteria
- [ ] Given I have configured SSO via SAML, when a user logs in with their corporate credentials, then they are authenticated successfully
- [ ] Given a user has role = "Viewer", when they attempt to generate a report, then access is denied with message "You do not have permission to generate reports"
- [ ] Given a user has role = "PM", when they access a project, then they can view and generate reports for that project only
- [ ] Given a user has role = "Admin", when they access the system, then they can manage all projects, users, and configuration
- [ ] Given a user is inactive for 30 minutes, when they try to perform an action, then their session expires and they are redirected to login

#### Business Rules
- **BR-SEC-001**: Roles: Admin (full access), PM (project access), DM (portfolio access), Viewer (read-only)
- **BR-SEC-002**: Session timeout: 30 minutes of inactivity

#### Technical Notes
- Support SSO via SAML 2.0, OAuth 2.0, or LDAP/Active Directory
- Store role assignments in database (user_id, role, project_id)
- Implement JWT tokens for session management

#### Dependencies
- NFR-SEC-001 (Authentication and Authorization requirement)

---

### US-027: Store API Credentials Securely

**As a** System Administrator  
**I want** API credentials for Jira, Slack, GitHub to be stored securely  
**So that** sensitive credentials are not exposed in logs or database

#### Acceptance Criteria
- [ ] Given I configure a Jira API token, when I save it, then it is encrypted and stored in a secret manager (AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault)
- [ ] Given I view the data source configuration UI, when I see the API token field, then the value is masked (e.g., "••••••••••••")
- [ ] Given a developer reviews the source code repository, when scanning for credentials, then no hardcoded API tokens or passwords are found
- [ ] Given the application logs API calls, when I review logs, then API credentials are redacted (not logged in plaintext)

#### Business Rules
- **BR-SEC-003**: All secrets must be stored in approved secret manager (no plaintext in database or config files)
- **BR-SEC-004**: Credentials in logs must be redacted automatically

#### Technical Notes
- Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault for secret storage
- Implement secret rotation policy (rotate every 90 days)

#### Dependencies
- NFR-SEC-002 (Data Encryption requirement)

---

### US-028: Log All Actions for Audit

**As a** Compliance Officer  
**I want** all system actions to be logged in an audit trail  
**So that** I can investigate issues and demonstrate compliance

#### Acceptance Criteria
- [ ] Given a PM generates a report, when I view the audit log, then I see an entry with timestamp, user ID, action = "ReportGenerated", project ID, and generation time
- [ ] Given a user edits a report section, when I view the audit log, then I see an entry with timestamp, user ID, action = "ReportEdited", section name, and diff (before/after)
- [ ] Given the system fetches data from Jira API, when I view the audit log, then I see an entry with timestamp, action = "APICall", endpoint, response status, and latency
- [ ] Given the system calls an LLM API, when I view the audit log, then I see an entry with timestamp, model name, prompt hash (not full prompt for security), response length, and latency
- [ ] Given I attempt to modify an audit log entry, when I try to save, then the modification fails with error "Audit logs are append-only and cannot be modified"

#### Business Rules
- **BR-AUDIT-003**: Audit logs are append-only (tamper-evident)
- **BR-AUDIT-004**: Audit logs retained for minimum 1 year
- **BR-AUDIT-005**: Audit log access restricted to Admin and Compliance Officer roles

#### Technical Notes
- Store audit logs in dedicated table or logging service (CloudWatch, Datadog, ELK)
- Use structured logging format: JSON with fields (timestamp, user_id, action, details)
- Implement append-only enforcement (database constraint or blockchain-style hashing)

#### Dependencies
- FR-AUDIT-002 (Audit Log requirement)

---

### US-029: Ensure Data Confidentiality (No Data Leakage)

**As a** Information Security Officer  
**I want** to ensure customer-identifying data does not leave our network boundary  
**So that** we comply with data protection agreements

#### Acceptance Criteria
- [ ] Given the LLM API endpoint is a public service (e.g., api.openai.com), when I configure the system, then I am prompted to enable "Data Anonymization Mode" which redacts customer names, project names, and ticket content before sending to LLM
- [ ] Given I deploy the system on-premise, when I verify network traffic, then no external API calls are made except to the configured LLM endpoint
- [ ] Given I enable data anonymization, when generating a report, then the LLM receives anonymized prompts (e.g., "Customer A" instead of "Acme Corp")
- [ ] Given the system stores customer data, when I check database encryption, then data at rest is encrypted with AES-256

#### Business Rules
- **BR-SEC-005**: Customer-identifying data shall NOT be sent to public LLM APIs unless explicitly approved by customer contract
- **BR-SEC-006**: On-premise deployment must support fully air-gapped operation (no external API calls except to approved LLM)

#### Technical Notes
- Implement data anonymization preprocessor for LLM prompts
- Support self-hosted LLM deployment (e.g., Claude via AWS Bedrock in customer VPC)

#### Dependencies
- NFR-SEC-003 (Data Confidentiality requirement)

---

## Epic 9: Scheduling and Automation

### US-030: Schedule Weekly Report Generation

**As a** Front PM  
**I want** to schedule automatic weekly report generation every Friday morning  
**So that** I don't forget to generate the report and can focus on review instead of creation

#### Acceptance Criteria
- [ ] Given I configure schedule = "Every Friday at 9:00 AM JST", when Friday arrives, then the system automatically generates a weekly report at 9:00 AM
- [ ] Given a scheduled report completes successfully, when generated, then I receive an email notification with a link to review the report
- [ ] Given I want to temporarily disable scheduled generation, when I toggle "Enable Schedule" to OFF, then no report is generated on the next scheduled date
- [ ] Given a scheduled report generation fails (e.g., Jira API unreachable), when the error occurs, then I receive an email notification with error details and suggested action

#### Business Rules
- **BR-SCHED-001**: Scheduled reports are generated in "Draft" status and require PM review before finalization
- **BR-SCHED-002**: If scheduled generation fails, retry once after 30 minutes; if second attempt fails, send error notification

#### Technical Notes
- Use cron (Linux), Celery Beat (Python), or node-cron (Node.js) for scheduling
- Store schedule configuration per project: (project_id, frequency, day_of_week, time, timezone, enabled)
- Implement retry logic with exponential backoff

#### Dependencies
- FR-SCHED-001 (Scheduled Report Generation requirement)

---

## User Story Summary Table

| Epic | User Story ID | Title | Priority | Status |
|------|---------------|-------|----------|--------|
| Epic 1 | US-001 | Connect to Jira via API | Must Have | Draft |
| Epic 1 | US-002 | Import WBS from Excel File | Must Have | Draft |
| Epic 1 | US-003 | Connect to Slack for Chat Messages | Must Have | Draft |
| Epic 1 | US-004 | Connect to GitHub for Code Activity | Must Have | Draft |
| Epic 1 | US-005 | Import Meeting Minutes Documents | Must Have | Draft |
| Epic 2 | US-006 | Map Jira Issues to WBS Tasks | Must Have | Draft |
| Epic 2 | US-007 | Detect Schedule Slippage | Must Have | Draft |
| Epic 2 | US-008 | Detect Done Tickets Without Code Activity | Must Have | Draft |
| Epic 2 | US-009 | Detect Code Merged but Ticket Not Closed | Should Have | Draft |
| Epic 2 | US-010 | Compute Bug Metrics and Trends | Must Have | Draft |
| Epic 2 | US-011 | Detect High-Severity Anomalies | Must Have | Draft |
| Epic 3 | US-012 | Generate Weekly Report with All Sections | Must Have | Draft |
| Epic 3 | US-013 | Generate Monthly Report with Extended Sections | Must Have | Draft |
| Epic 3 | US-014 | Apply Customer-Specific Template | Must Have | Draft |
| Epic 3 | US-015 | Include Full Traceability for All Facts | Must Have | Draft |
| Epic 4 | US-016 | Generate Japanese Report with Keigo | Must Have | Draft |
| Epic 4 | US-017 | Generate English and Vietnamese Reports | Must Have | Draft |
| Epic 5 | US-018 | Review Report with Side-by-Side Evidence | Must Have | Draft |
| Epic 5 | US-019 | Edit Report Inline | Must Have | Draft |
| Epic 5 | US-020 | Refine Report Using Conversational Commands | Should Have | Draft |
| Epic 6 | US-021 | Export Report to DOCX and PDF | Must Have | Draft |
| Epic 6 | US-022 | Export Report to PowerPoint | Should Have | Draft |
| Epic 6 | US-023 | Publish Report Directly to Confluence | Should Have | Draft |
| Epic 7 | US-024 | View Portfolio Dashboard (DM) | Could Have | Draft |
| Epic 7 | US-025 | Generate Multi-Project Roll-Up Report | Could Have | Draft |
| Epic 8 | US-026 | Authenticate and Authorize Users | Must Have | Draft |
| Epic 8 | US-027 | Store API Credentials Securely | Must Have | Draft |
| Epic 8 | US-028 | Log All Actions for Audit | Must Have | Draft |
| Epic 8 | US-029 | Ensure Data Confidentiality | Must Have | Draft |
| Epic 9 | US-030 | Schedule Weekly Report Generation | Should Have | Draft |

**Total User Stories:** 30  
**Must Have:** 22  
**Should Have:** 6  
**Could Have:** 2

---

## Appendix: MoSCoW Prioritization Summary

### Must Have (Critical for MVP)
- All data connectors (Jira, WBS, Slack/Teams, GitHub, meeting minutes)
- Core reconciliation (Jira-WBS mapping, schedule slippage, code cross-check)
- Anomaly detection (minimum 15 rules)
- Weekly and monthly report generation with full traceability
- Multi-language support (JA keigo, EN, VN)
- Review workflow with inline editing
- Export to DOCX and PDF
- Security (authentication, credential storage, audit log, data confidentiality)

### Should Have (High Value, Include if Time Permits)
- Conversational refinement commands
- Export to PowerPoint and Confluence
- Scheduled report generation
- Additional anomaly rules beyond minimum 15

### Could Have (Nice to Have, Bonus Points)
- Portfolio dashboard and roll-up reports for Delivery Managers
- Advanced analytics and trend visualization
- Custom KPI configuration UI

### Won't Have (Out of Scope for Hackathon)
- Mobile app
- Real-time dashboards
- Direct customer communication features
- Budget forecasting beyond planned vs. actual
- Resource allocation optimization

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** May 21, 2026
- **Next Review Date:** [To be determined]
- **Distribution:** Development Team, QA Team, Product Owner, Hackathon Judges
