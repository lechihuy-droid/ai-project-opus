# TASK SA-3 — Output: template engine + export

**Agent:** Codex (Wave 1, song song với SA-1, SA-2)
**Repo:** `C:\Users\HUY\AI\metagpt-ai-company\insighthub`
**Phụ thuộc:** W0 xong (`schema.py` đủ contract).

## Context

Stream cuối pipeline: nhận `Report` (9 mục narrative đã sinh) → đổ vào template
DOCX và xuất file. Cũng sinh `traceability.json` (truy vết) và `audit_log.md`.

## Đọc trước

- `docs/system_design.md` — §3 (contracts `Report`, `ReportSection`, `Facts`,
  `Fact`, `SourceRef`).
- `insighthub/schema.py`.

9 `section_id` cố định: `exec_summary, progress, completed, in_progress,
next_week, blockers, bugs, decisions, metrics`.

## File phải tạo

### `scripts/build_template.py`
Script python-docx sinh `templates/weekly_template.docx`: tiêu đề
`{{project_name}} — Weekly Status Report`, dòng `Period: {{period}}`, dòng
`Overall Status: {{overall_status}}`; rồi 9 mục — mỗi mục 1 heading lvl1
(tên người đọc được, vd "1. Executive Summary") + 1 đoạn placeholder
`{{section_id}}`. Chạy script này tạo ra file .docx.

### `insighthub/templating.py`
`render(report: Report, template_path: str) -> docx.Document`:
- Mở template, thay placeholder `{{project_name}}`, `{{period}}`,
  `{{overall_status}}`, và `{{section_id}}` bằng `ReportSection.body` tương ứng.
- `body` là markdown nhẹ: dòng `- ` → bullet (`List Bullet`); còn lại → đoạn
  thường. Giữ citation inline `[system:ref]` nguyên văn.
- Placeholder thiếu section → thay bằng "(no data)".

### `insighthub/export.py`
`export(report: Report, facts: Facts, out_dir: str) -> dict[str,str]`:
- `weekly.docx` — qua `templating.render`, dùng `templates/weekly_template.docx`
  (nếu thiếu thì gọi `build_template` tạo trước).
- `weekly.md` — ghép markdown: tiêu đề + 9 mục `## {title}` + `body`.
- `traceability.json` — từ `facts`: map mỗi `Fact.id` → `{label, value,
  citations:[{system,ref_id,label,url}]}`.
- `audit_log.md` — timestamp, project, period, số fact, số anomaly, danh sách
  section đã xuất, model dùng.
Trả dict đường dẫn 4 file. `out_dir` mặc định `output/`, tự tạo nếu chưa có.

### `tests/test_export.py`
Tự dựng fixture `Report` + `Facts` hợp contract (2–3 section, mỗi section vài
`Fact` có `citations`). Gọi `export(...)` → assert 4 file tồn tại; mở lại
`weekly.docx` bằng `docx.Document()` không lỗi; `traceability.json` parse được
và chứa citation.

## Constraints

- Chỉ tạo file trên + `templates/weekly_template.docx`. **Không đụng**
  `datasource.py`, `reconcile.py`, `facts.py`, `report.py`.
- Code đúng contract `schema.py`. Không phụ thuộc stream khác — test bằng fixture tự dựng.
- python-docx: replace placeholder phải duyệt cả `paragraph.runs` (placeholder
  có thể nằm rải nhiều run — gộp text paragraph rồi set lại).

## Definition of Done

```
python scripts/build_template.py
pytest tests/test_export.py -q
```
pass: template tạo được; export ra đủ 4 file; `weekly.docx` mở sạch.
