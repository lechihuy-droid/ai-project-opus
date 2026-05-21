# TASK W2 — Reporting spine + wiring + integration QA

**Agent:** Codex (tuần tự, chạy SAU khi SA-1/SA-2/SA-3 xong)
**Repo:** `C:\Users\HUY\AI\metagpt-ai-company\insighthub`
**Phụ thuộc:** SA-1 (`datasource.py`), SA-2 (`reconcile.py`, `anomalies.py`),
SA-3 (`templating.py`, `export.py`) đã xong.

## Context

Đây là xương sống tích hợp B→C→D + lõi chống hallucination + CLI. Sau khi xong,
`python -m insighthub generate` phải chạy E2E ra báo cáo.

## Đọc trước

- `docs/system_design.md` — §2 (chống hallucination), §3 (contracts), §7 (call flow).
- `docs/prd.md` — 9 mục báo cáo tuần.
- `insighthub/schema.py`, `datasource.py`, `reconcile.py`, `anomalies.py`,
  `templating.py`, `export.py`.

## File phải tạo

### `insighthub/facts.py` — `build_facts(state, rec, anomalies) -> Facts`

Tính sẵn TẤT CẢ số liệu cho 9 `SectionFacts` (`section_id` xem `system_design`):
1. `exec_summary` — `overall_status`, số việc hoàn thành, số rủi ro High.
2. `progress` — `phase_progress` (mỗi phase 1 `bullet_item`), overall %.
3. `completed` — mỗi issue `completed_in_period` 1 `bullet_item`, citation jira key.
4. `in_progress` — mỗi issue `in_progress` 1 `bullet_item`.
5. `next_week` — WBS task sắp tới (planned_start > period_end hoặc đang dở).
6. `blockers` — anomaly High/Medium nhóm Risk/Schedule/Progress + `slipped_tasks`.
7. `bugs` — `bug_metrics` (opened/closed/open/severity/mttf/reopened).
8. `decisions` — `MinuteItem` decision + action_item.
9. `metrics` — velocity (Σ SP done), throughput, commit/PR count, `sprint_metrics`.

Mỗi `Fact.value` là string; mỗi `Fact` gắn `citations` (SourceRef nguồn).
`overall_status`: số anomaly High = 0→Green, 1–2→Yellow, ≥3→Red.
`allowed_keys` = mọi jira key + `sha[:7]` + `PR#<n>` + WBS task id.
`allowed_numbers` = mọi token số xuất hiện trong bất kỳ `Fact.value` (regex gom).

### `insighthub/report.py` — `generate(facts, lang="en", use_llm=True) -> Report`

- **LLM mode** (có `ANTHROPIC_API_KEY` và `use_llm`): Claude `claude-opus-4-7`
  qua `anthropic` SDK. System prompt (đặt `cache_control` để cache): vai trò +
  ràng buộc verbatim (chỉ dùng số/ID có trong facts, giữ nguyên citation
  `[system:ref]`) + mô tả 9 mục + ngôn ngữ (`en`/`ja` keigo/`vn`). User message
  = `facts.model_dump_json()`. Yêu cầu trả JSON `[{section_id, body}]`.
- **Template-only mode** (thiếu key hoặc `use_llm=False`): ghép `Fact.value` +
  `bullet_items` thành `body` markdown, gắn citation. KHÔNG gọi LLM.
- Trả `Report` đủ 9 `ReportSection`.

### `insighthub/validate.py` — `validate(report, facts) -> list[str]`

Trích mọi số (`\d+(?:\.\d+)?%?`) và ID (`[A-Z][A-Z0-9]+-\d+`, `PR#\d+`, sha hex
≥7) trong từng `ReportSection.body`. Token không thuộc `allowed_numbers ∪
allowed_keys` → 1 vi phạm. Trả list mô tả vi phạm (rỗng = sạch).

### `insighthub/__main__.py` — CLI

`argparse`: `generate --type weekly --lang en [--no-llm] [--out output]`.
Call flow `system_design §7`: load→reconcile→detect→build_facts→generate→
validate. Nếu `validate` có vi phạm: gọi `generate` lại 1 lần (đưa danh sách vi
phạm vào prompt); vẫn lỗi → fallback template-only. Rồi `export`. In tóm tắt
(số issue, anomaly, status, đường dẫn output).

### `tests/test_no_hallucination.py`

- Chạy pipeline template-only E2E → `validate` trả `[]`.
- Test âm: chèn số giả "999" vào 1 `ReportSection.body` → `validate` bắt được.

## Trách nhiệm tích hợp (Stage 5 QA)

Wire 3 stream lại; chạy `python -m insighthub generate --type weekly --lang en`;
sửa mọi mismatch contract; chạy `pytest` toàn bộ tới khi pass.

## Constraints

- Code đúng contract `schema.py`. Không sửa file của SA-1/2/3 trừ khi lỗi
  contract thật sự — nếu sửa, ghi rõ lý do.
- Tuân `CLAUDE.md`: tối giản, không thêm tính năng ngoài brief.

## Definition of Done

```
python -m insighthub generate --type weekly --lang en --no-llm
pytest -q
```
→ tạo `output/weekly.docx`, `weekly.md`, `traceability.json`, `audit_log.md`;
toàn bộ test pass (anomaly ≥13/15, no-hallucination, export). Có
`ANTHROPIC_API_KEY` thì bỏ `--no-llm` cũng chạy và `validate` sạch.
