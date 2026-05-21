# TASK W0 — Freeze contracts + dump ProjectState

**Agent:** Codex (tuần tự, chạy ĐẦU TIÊN — mở khóa Wave 1)
**Repo:** `C:\Users\HUY\AI\metagpt-ai-company\insighthub`
**Ước lượng:** ~15 phút

## Context

InsightHub Agent — AI co-pilot sinh báo cáo tuần cho PM. Pipeline:
`datasource → reconcile → anomalies → facts → report → validate → export`.
Task này đóng băng contract dữ liệu để 3 stream sau code song song không đụng nhau.

## Đọc trước

- `docs/system_design.md` — §3 (contracts), §5 (field mapping), §8 (tech).
- `insighthub/schema.py` — đã có 9 model: `SourceRef, Issue, WBSTask,
  ChatMessage, Commit, PullRequest, MinuteItem, Anomaly, ProjectState`.

## Việc 1 — Mở rộng `insighthub/schema.py`

Thêm **đúng nguyên văn** 9 model trong `system_design.md §3`: `IssueWBSLink,
PhaseProgress, SprintMetric, BugMetrics, ReconcileResult, Fact, SectionFacts,
Facts, ReportSection, Report`.

Thêm 1 field vào `ProjectState`:
```python
    sprints: list[SprintMetric] = Field(default_factory=list)
```
(`SprintMetric` dùng cho cả dữ liệu ingest lẫn output reconcile — chấp nhận.)

`BugMetrics` và `ReconcileResult` có field bắt buộc `bug_metrics` không default →
khi tạo phải truyền. Giữ nguyên, không thêm default giả.

## Việc 2 — `scripts/dump_projectstate.py`

Loader **tạm** (procedural, không qua MCP) đọc `data/sample/` → `ProjectState` →
ghi `data/sample/_projectstate.json` (dùng `state.model_dump_json(indent=2)`).

Theo đúng field mapping `system_design.md §5`:
- Jira `Sample_Jira_Export.xlsx` sheet `Issues` → `list[Issue]`; sheet `Sprints`
  → `list[SprintMetric]` (tính `completion_pct = completed/committed*100`).
- `Sample_WBS.xlsx` sheet `WBS` → `list[WBSTask]`.
- `Sample_Slack_Messages.json` → `list[ChatMessage]`.
- `Sample_GitHub_Activity.json` → `list[Commit]` + `list[PullRequest]`; tách
  `jira_keys` từ message/title bằng regex `[A-Z][A-Z0-9]+-\d+`.
- `data/sample/minutes/*.docx` → `list[MinuteItem]` (parse heading lvl1
  `Decisions`/`Action Items`/`Questions`; `meeting_date` từ tên file
  `minutes_YYYY-MM-DD_*`).
- `period_start/end` lấy từ `connections.yaml` key `period`.

Mỗi record gắn `source_ref` đúng `system_design.md §5`.
Status "Reopened" cột Jira: "Yes" → `reopened=True`.

## Constraints

- Không sửa file ngoài 2 file trên.
- Date trong Excel openpyxl trả `datetime` — convert `.date()` khi cần.
- Đọc `connections.yaml` bằng `pyyaml`.

## Definition of Done

```
python scripts/dump_projectstate.py
```
→ in ra số lượng và tạo `data/sample/_projectstate.json` với **chính xác**:
36 issues · 12 wbs_tasks · 13 messages · 13 commits · 10 prs · 5 minute_items · 3 sprints.
File JSON load lại được bằng `ProjectState.model_validate_json(...)`.
