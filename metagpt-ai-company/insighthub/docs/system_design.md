# InsightHub Agent — System Design

> Artifact Stage 2 (Architect). Tài liệu tham chiếu kỹ thuật **chuẩn duy nhất**
> cho mọi task Codex. Mọi contract dưới đây là **đóng băng** — Engineer code đúng
> theo, không tự đổi.

## 1. Implementation approach

Pipeline tất định + LLM bị ràng buộc. Ngôn ngữ: Python 3.11.

```
hệ thống ngoài (Jira/Chat/GitHub) ─ insighthub-mcp (3 tool, fastmcp) ─┐
WBS Excel + biên bản họp ─ direct loader ─────────────────────────────┤
                                                                      ▼
   ProjectState ─ reconcile ─▶ ReconcileResult ─ anomalies ─▶ [Anomaly]
                                                                      ▼
   facts ─▶ Facts (mọi số tính sẵn + citation + allow-list)
        ─▶ report (LLM Claude, chỉ viết narrative) ─▶ Report
        ─▶ validate (chặn số/key bịa) ─▶ template ─▶ export (DOCX + MD)
```

## 2. Thiết kế chống hallucination (BẮT BUỘC)

1. **Python tính TẤT CẢ số liệu**. LLM không bao giờ thấy dữ liệu thô, không tự tính.
2. `facts.py` xuất `Facts` — mỗi `Fact` có `value` (string) + `citations`.
3. `Facts` mang **2 allow-list**: `allowed_keys` (mọi Jira key / commit sha / PR#)
   và `allowed_numbers` (mọi token số hợp lệ).
4. `report.py` đưa LLM **chỉ object `Facts`** → LLM viết câu chữ quanh các value.
5. `validate.py` trích mọi số + mã ID trong narrative → phải ⊆ allow-list. Sai → chặn xuất.

## 3. Contracts — thêm vào `insighthub/schema.py`

> `schema.py` hiện đã có: `SourceRef, Issue, WBSTask, ChatMessage, Commit,
> PullRequest, MinuteItem, Anomaly, ProjectState`. Thêm các model sau (TASK-W0).

```python
# --- Reconciliation output -------------------------------------------------
class IssueWBSLink(BaseModel):
    issue_key: str
    wbs_task_id: str
    method: str            # key | title-exact | fuzzy | none
    score: float = 0.0

class PhaseProgress(BaseModel):
    phase: str
    planned_pct: float
    actual_pct: float
    variance: float        # actual - planned
    issue_keys: list[str] = Field(default_factory=list)

class SprintMetric(BaseModel):
    sprint: str
    committed_sp: float
    completed_sp: float
    completion_pct: float

class BugMetrics(BaseModel):
    opened: int
    closed: int
    open_total: int
    open_by_severity: dict[str, int] = Field(default_factory=dict)
    reopened: int
    mttf_days: float

class ReconcileResult(BaseModel):
    links: list[IssueWBSLink] = Field(default_factory=list)
    orphan_issues: list[str] = Field(default_factory=list)
    untracked_wbs: list[str] = Field(default_factory=list)
    phase_progress: list[PhaseProgress] = Field(default_factory=list)
    overall_planned_pct: float = 0.0
    overall_actual_pct: float = 0.0
    bug_metrics: BugMetrics
    sprint_metrics: list[SprintMetric] = Field(default_factory=list)
    issue_commit_links: dict[str, list[str]] = Field(default_factory=dict)
    completed_in_period: list[str] = Field(default_factory=list)
    in_progress: list[str] = Field(default_factory=list)
    slipped_tasks: list[str] = Field(default_factory=list)

# --- Facts (đầu vào LLM) ---------------------------------------------------
class Fact(BaseModel):
    id: str                # vd "bugs.closed"
    label: str
    value: str             # render dạng string để LLM trích verbatim
    citations: list[SourceRef] = Field(default_factory=list)

class SectionFacts(BaseModel):
    section_id: str        # exec_summary|progress|completed|in_progress|
                           # next_week|blockers|bugs|decisions|metrics
    title: str
    facts: list[Fact] = Field(default_factory=list)
    bullet_items: list[Fact] = Field(default_factory=list)

class Facts(BaseModel):
    project_name: str
    period_start: date
    period_end: date
    overall_status: str    # Green | Yellow | Red
    sections: list[SectionFacts] = Field(default_factory=list)
    anomalies: list[Anomaly] = Field(default_factory=list)
    allowed_keys: list[str] = Field(default_factory=list)
    allowed_numbers: list[str] = Field(default_factory=list)

# --- Report (đầu ra LLM) ---------------------------------------------------
class ReportSection(BaseModel):
    section_id: str
    title: str
    body: str              # markdown, có citation inline [system:ref]
    validated: bool = False

class Report(BaseModel):
    project_name: str
    period_start: date
    period_end: date
    report_type: str = "weekly"
    language: str = "en"
    overall_status: str = "Green"
    sections: list[ReportSection] = Field(default_factory=list)
```

## 4. File list

| File | Stream | Mô tả |
|---|---|---|
| `insighthub/schema.py` | W0 | + 9 model contract ở trên (đã có 9 model cũ) |
| `scripts/dump_projectstate.py` | W0 | loader tạm → `data/sample/_projectstate.json` |
| `insighthub_mcp/adapters/base.py` | SA-1 | interface `SourceAdapter` |
| `insighthub_mcp/adapters/file_adapter.py` | SA-1 | đọc file mẫu → records |
| `insighthub_mcp/adapters/api_adapter.py` | SA-1 | stub, raise NotImplementedError |
| `insighthub_mcp/server.py` | SA-1 | fastmcp, 3 tool |
| `insighthub/datasource.py` | SA-1 | MCP in-memory client + loader WBS/minutes → `ProjectState` |
| `insighthub/reconcile.py` | SA-2 | `reconcile(state) -> ReconcileResult` |
| `insighthub/anomalies.py` | SA-2 | `detect(state, rec) -> list[Anomaly]` (15 rule) |
| `insighthub/facts.py` | W2 | `build_facts(state, rec, anomalies) -> Facts` |
| `insighthub/report.py` | W2 | `generate(facts, lang) -> Report` (LLM Claude) |
| `insighthub/validate.py` | W2 | `validate(report, facts) -> list[str]` (vi phạm) |
| `insighthub/templating.py` | SA-3 | fill placeholder DOCX |
| `insighthub/export.py` | SA-3 | `Report -> .docx + .md + traceability.json` |
| `templates/weekly_template.docx` | SA-3 | template 9 mục, placeholder `{{section_id}}` |
| `insighthub/__main__.py` | W2 | CLI `generate` — wiring toàn bộ |
| `tests/test_anomalies.py` | SA-2 | ≥13/15 rule |
| `tests/test_no_hallucination.py` | W2 | validator pass |

## 5. Connector field mapping (Codex theo đúng)

**Jira `Sample_Jira_Export.xlsx`** — sheet `Issues` cột: `Key, Summary, Type,
Status, Priority, Assignee, Story Points, Created, Updated, Resolved, Sprint,
Labels, Reopened` (Reopened = "Yes"/"No"). Sheet `Sprints`: `Sprint, Start, End,
Committed SP, Completed SP`.

**WBS `Sample_WBS.xlsx`** — sheet `WBS` cột: `Task ID, Phase, Task Name, Planned
Start, Planned End, Planned MM, Planned %, Owner, Jira Key`.

**Slack `Sample_Slack_Messages.json`** — `{channel, messages:[{id, channel,
user, ts (ISO), text}]}`.

**GitHub `Sample_GitHub_Activity.json`** — `{repo, default_branch,
commits:[{sha, message, author, date}], pull_requests:[{number, title, author,
reviewers[], state, created_at, merged_at, ci_status}]}`.

**Minutes `data/sample/minutes/*.docx`** — heading lvl0 = tiêu đề; đoạn
`Date: YYYY-MM-DD`; heading lvl1 ∈ {`Decisions`,`Action Items`,`Questions`} →
các đoạn `List Bullet` theo sau là item của loại đó. `meeting_date` parse từ
dòng Date hoặc tên file.

**Jira key regex** (tách từ commit message / PR title): `[A-Z][A-Z0-9]+-\d+`.

Mọi record gắn `source_ref`: vd Jira → `SourceRef(system="jira",
ref_id="SAKURA-1", label=summary)`; commit → `system="github", ref_id=sha[:7]`;
minute → `system="minutes", ref_id="<filename>#<kind>"`.

## 6. 15 anomaly rule — logic phát hiện

| rule_id | category | sev | Logic |
|---|---|---|---|
| ANOM-PG-001 | Progress | High | issue Done nhưng key không xuất hiện trong `issue_commit_links` |
| ANOM-PG-002 | Progress | Medium | PR merged tham chiếu key K nhưng issue K status ≠ Done |
| ANOM-PG-003 | Progress | High | WBS task `planned_end < period_end` và issue liên kết ≠ Done |
| ANOM-PG-004 | Progress | High | phase có `|planned_pct - actual_pct| > 10` |
| ANOM-PG-005 | Progress | Low | issue ∈ `orphan_issues` (không có WBS parent) |
| ANOM-BG-001 | Bug | Medium | Bug, status ≠ Done, `(period_end - updated).days > 14` |
| ANOM-BG-002 | Bug | High | Bug, priority ∈ {Severity-1, Blocker, Highest}, status ≠ Done |
| ANOM-BG-003 | Bug | Medium | số Bug `reopened` trong kỳ `> 2` (baseline 1) → 1 anomaly liệt kê keys |
| ANOM-RK-001 | Risk | Medium | message chứa keyword blocker (`blocked/blocker/escalation/cannot proceed`) và **không** chứa Jira key |
| ANOM-RK-002 | Risk | Medium | MinuteItem decision/action_item không có issue tạo sau `meeting_date` khớp fuzzy ≥70% và không có Slack mention |
| ANOM-SC-001 | Schedule | High | ≥2 sprint liên tiếp (theo ngày) có `completion_pct < 70` |
| ANOM-QL-001 | Quality | Medium | PR merged có `reviewers` rỗng hoặc `author ∈ reviewers` |
| ANOM-QL-002 | Quality | High | PR có `ci_status == "failure"` |
| ANOM-RS-001 | Resource | Medium | một assignee đóng `> 40%` tổng story point hoàn thành trong kỳ |
| ANOM-CS-001 | Consistency | High | MinuteItem kind=question không có follow-up trong 5 ngày làm việc |

`evidence` mỗi `Anomaly` = list `SourceRef` của item liên quan.

## 7. Call flow

```
__main__.generate()
  state = datasource.load(connections.yaml)         # SA-1
  rec   = reconcile.reconcile(state)                # SA-2
  anos  = anomalies.detect(state, rec)              # SA-2
  facts = facts.build_facts(state, rec, anos)       # W2
  report= report.generate(facts, lang)             # W2  (LLM hoặc template-only)
  bad   = validate.validate(report, facts)          # W2  -> nếu có: retry 1 lần rồi raise
  export.export(report, facts, out_dir)             # SA-3 -> docx/md/traceability.json
```

## 8. Tech & convention

- Python 3.11; lib: `fastmcp, openpyxl, python-docx, pydantic>=2, rapidfuzz,
  anthropic, jinja2, pyyaml, pytest` (đã có `requirements.txt`).
- LLM sản phẩm: **Claude Opus 4.7** (`claude-opus-4-7`) qua `anthropic` SDK +
  prompt caching. Thiếu `ANTHROPIC_API_KEY` → `report.py` chạy chế độ
  template-only (ghép câu từ `Fact.value`, vẫn ra báo cáo hợp lệ).
- Không hardcode secret; đọc `.env`.
- Mỗi module có docstring; không over-engineer (xem `CLAUDE.md`).

## Anything UNCLEAR

- File mẫu thật của giám khảo chưa có → dùng synthetic `data/sample/` (đã sinh
  bằng `scripts/gen_sample_data.py`, cùng schema). Khi có file thật chỉ thả đè.
- `period` lấy từ `connections.yaml` (2026-05-15 → 2026-05-21).

## G2 — cổng duyệt

Contract đóng băng → sang Stage 3 (task.md) phân công.
