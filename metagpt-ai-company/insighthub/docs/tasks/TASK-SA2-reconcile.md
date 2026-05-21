# TASK SA-2 — Reconciliation + Anomaly engine

**Agent:** Codex (Wave 1, song song với SA-1, SA-3)
**Repo:** `C:\Users\HUY\AI\metagpt-ai-company\insighthub`
**Phụ thuộc:** W0 xong (`schema.py` đủ contract, `data/sample/_projectstate.json`).

## Context

Đây là lõi "đối soát chéo" — biến `ProjectState` thành `ReconcileResult` + danh
sách `Anomaly`. Đây là phần ăn điểm Reconciliation Accuracy (≥85% precision) và
là thứ phân biệt sản phẩm với "forward Jira export cho LLM".

## Đọc trước

- `docs/system_design.md` — §3 (contracts `ReconcileResult` v.v.), §6 (15 rule).
- `insighthub/schema.py`. Nạp dữ liệu test: `data/sample/_projectstate.json`
  (`ProjectState.model_validate_json(open(...).read())`), đối chiếu rule gài ở
  `data/sample/_ground_truth.json`.

## File phải tạo

### `insighthub/reconcile.py` — `reconcile(state: ProjectState) -> ReconcileResult`

- **Jira↔WBS link** mỗi issue: (1) WBS `jira_key == issue.key` → `method="key"`;
  (2) `issue.summary == wbs.name` → `"title-exact"`; (3) rapidfuzz
  `fuzz.ratio ≥ 80` → `"fuzzy"`; else `"none"`. `orphan_issues` = issue method
  none. `untracked_wbs` = WBS task không issue nào link.
- **phase_progress**: gom issue theo phase (qua link → WBS task → phase).
  `actual_pct` = Σ(SP issue Done) / Σ(SP toàn phase) × 100 (issue không SP tính
  1 điểm). `planned_pct` = trung bình `WBSTask.planned_pct` của phase.
  `variance = actual - planned`.
- `overall_actual_pct` / `overall_planned_pct`: trung bình có trọng số theo SP.
- **bug_metrics**: `opened` = Bug created trong kỳ; `closed` = Bug resolved
  trong kỳ; `open_total` = Bug status≠Done cuối kỳ; `open_by_severity` đếm theo
  `priority`; `reopened` = số Bug `reopened=True`; `mttf_days` = trung bình
  `(resolved-created).days` của Bug closed trong kỳ.
- `sprint_metrics` = `state.sprints` (copy).
- `issue_commit_links`: dict `issue_key -> [sha/PR#]` quét `Commit.jira_keys` +
  `PullRequest.jira_keys`.
- `completed_in_period` = issue có `resolved` trong `[period_start, period_end]`.
- `in_progress` = issue status "In Progress".
- `slipped_tasks` = WBS task `planned_end < period_end` và issue link ≠ Done.

### `insighthub/anomalies.py` — `detect(state, rec) -> list[Anomaly]`

Cài **15 rule** đúng logic `system_design.md §6`. Mỗi `Anomaly` điền đủ
`rule_id, category, severity, title, item, detail, evidence` (`evidence` =
`list[SourceRef]` của item liên quan). Một hàm/ rule, đặt tên `_rule_pg001(...)` v.v.
**Precision quan trọng**: chỉ flag khi đúng điều kiện — đừng over-flag.

### `tests/test_anomalies.py`

- Nạp `_projectstate.json` → `reconcile` → `detect`.
- Nạp `_ground_truth.json` (`expected_rules`: 15 rule_id).
- Assert: số `rule_id` phát hiện trùng `expected_rules` ≥ **13/15**.
- Assert precision: tổng số `Anomaly` ≤ **25** (không over-flag).

## Constraints

- Chỉ tạo 3 file trên. **Không đụng** `datasource.py`, `facts.py`, `report.py`,
  `export.py`, `templating.py`.
- Code đúng contract `schema.py`. `reconcile` thuần tất định, không LLM.
- Tự nạp dữ liệu từ `_projectstate.json` — KHÔNG import `datasource` (tránh phụ
  thuộc SA-1).

## Definition of Done

```
pytest tests/test_anomalies.py -q
```
pass: phát hiện ≥13/15 rule, tổng anomaly ≤25.
