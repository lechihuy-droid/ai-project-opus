# InsightHub Agent — Task Breakdown & Parallelization

> Artifact Stage 3 (ProjectManager). Phân công cho **Codex** code. Claude chỉ
> plan + duyệt cổng + tích hợp cuối. Mỗi task có brief tự chứa trong `docs/tasks/`.

## Required packages

Đã khai trong `requirements.txt`. Cài: `pip install -r requirements.txt`.

## Logic analysis — vì sao chia luồng được

InsightHub là pipeline `A→B→C→D`. Parallel chỉ an toàn vì **contract đã đóng băng**
trong `schema.py` (xem `system_design.md` §3). Sau khi W0 xong, 3 stream code
độc lập theo contract, không đụng file của nhau.

Khử phụ thuộc khi chạy song song:
- `data/sample/_projectstate.json` (W0 sinh) → SA-2 nạp trực tiếp, **không cần SA-1**.
- Facts fixture (cho sẵn trong brief SA-3) → SA-3 test **không cần SA-2/W2**.

## Sóng thực thi

```
W0  (tuần tự, ~15') ── Codex#0
        │  schema.py + _projectstate.json
        ▼
┌──────────────── WAVE 1 — 3 Codex SONG SONG ────────────────┐
│ SA-1 Data/MCP      SA-2 Reconcile+Anomaly   SA-3 Output     │
└───────────────────────────┬─────────────────────────────────┘
        ▼
W2  (tuần tự) ── Codex#0 ── facts+report+validate+__main__ + tích hợp + QA E2E
```

## Bảng phân công

| Task | Brief | File tạo | Phụ thuộc | Done = verify |
|---|---|---|---|---|
| **W0** | `tasks/TASK-W0-contracts.md` | `schema.py` (+9 model), `scripts/dump_projectstate.py`, `data/sample/_projectstate.json` | — | `python scripts/dump_projectstate.py` chạy OK; JSON có 36 issue / 12 WBS / 13 msg / 13 commit / 10 PR / 5 minute / 3 sprint |
| **SA-1** | `tasks/TASK-SA1-data-mcp.md` | `insighthub_mcp/**`, `insighthub/datasource.py` | W0 | `datasource.load()` → `ProjectState` khớp `_projectstate.json`; MCP server expose 3 tool |
| **SA-2** | `tasks/TASK-SA2-reconcile.md` | `insighthub/reconcile.py`, `anomalies.py`, `tests/test_anomalies.py` | W0 | `pytest tests/test_anomalies.py` — phát hiện ≥13/15 rule, tổng anomaly ≤25 (precision) |
| **SA-3** | `tasks/TASK-SA3-output.md` | `templates/weekly_template.docx`, `insighthub/templating.py`, `export.py` | W0 | từ Facts fixture → `weekly.docx`+`weekly.md`+`traceability.json`, DOCX mở sạch |
| **W2** | `tasks/TASK-W2-reporting.md` | `insighthub/facts.py`, `report.py`, `validate.py`, `__main__.py`, `tests/test_no_hallucination.py` | SA-1,2,3 | `python -m insighthub generate --type weekly --lang en` ra đủ 4 file output; `pytest` toàn bộ pass |

## Task list (thứ tự code)

1. `W0` → 2. `{SA-1, SA-2, SA-3}` song song → 3. `W2`.

## Shared knowledge

- Contract & field mapping & 15 rule: `docs/system_design.md` — **nguồn chuẩn duy nhất**.
- Scope MVP & cái gì out-of-scope: `docs/prd.md`.
- Dữ liệu mẫu đã sinh sẵn ở `data/sample/` (+ `_ground_truth.json` liệt kê 15 rule gài).
- LLM sản phẩm = Claude; thiếu key → template-only mode (vẫn phải chạy).

## Quy tắc cho mỗi Codex

- Chỉ tạo/sửa file thuộc task mình. **Không đụng** file stream khác.
- Code đúng contract `schema.py`, không tự đổi tên field.
- Tự viết smoke test, tự verify Done-criteria trước khi báo xong.
- Tuân `CLAUDE.md`: tối giản, không thêm tính năng ngoài brief.

## Tích hợp (W2 — Codex)

Sau Wave 1, Codex chạy W2: viết spine `facts/report/validate`, wiring
`__main__.py`, gộp 3 stream, chạy E2E + `pytest`, debug tới khi pass (Stage 5
QaEngineer). Claude **review** kết quả cuối, không code.

## G3 — cổng duyệt

Duyệt bảng phân công → phát 5 brief cho Codex.
