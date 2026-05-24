# Codex Test Brief — InsightHub MVP (Re-run All Tests)

**Date:** 2026-05-23
**Working dir:** `C:\Users\HUY\AI\metagpt-ai-company\insighthub\mvp\`
**Interpreter:** `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
**Task:** Chạy toàn bộ test suite, report kết quả, fix nếu fail.

---

## Setup

```powershell
cd C:\Users\HUY\AI\metagpt-ai-company\insighthub\mvp
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD = "1"
python -m pip install -r requirements.txt
```

---

## Step 1 — pytest (tất cả auto test)

```powershell
python -m pytest -q
```

**Expected:** tất cả pass, 0 failed, 0 error.

Nếu fail → fix file tương ứng, không sửa file `data/sample/` (immutable).

---

## Step 2 — CLI E2E (disqualify guard)

```powershell
python -m insighthub generate --type weekly --lang en --no-llm
```

**Expected:**
- File `output/weekly.docx` tồn tại
- File `output/weekly.md` tồn tại
- File `output/traceability.json` tồn tại
- File `output/audit_log.md` tồn tại
- stdout in ra `status=Red` (hoặc field overall_status)
- Chạy xong trong vòng 60 giây

---

## Step 3 — Đa ngôn ngữ

```powershell
python -m insighthub generate --type weekly --lang ja --no-llm
python -m insighthub generate --type weekly --lang vn --no-llm
```

**Expected (mỗi lần):**
- 4+ file trong `output/`
- `weekly.md` dùng đúng ngôn ngữ (JA: section title tiếng Nhật; VN: tiếng Việt)
- Số và ticket ID (`SAKURA-*`) nguyên vẹn, không bị dịch
- `validate` không raise (0 violations)

---

## Step 4 — Datasource counts

```powershell
python -m insighthub.datasource
```

**Expected:**
```
jira: 36  (hoặc ≥1)
wbs: 12   (hoặc ≥1)
chat: 13  (hoặc ≥1)
github: 23 (hoặc ≥1)
minutes: 5 (hoặc ≥1)
sprints: 3 (hoặc ≥1)
```

---

## Step 5 — Variant data (robustness)

```powershell
python scripts/gen_sample_data.py --seed 42 --variant variant
python -m pytest tests/test_robustness.py -v
```

**Expected:** cả 2 test pass:
- `test_variant_data_pipeline_validates_and_exports` — Project Kiku, thiếu Slack/GitHub/minutes → vẫn ra DOCX+MD
- `test_empty_project_state_still_produces_valid_green_report` — overall_status=Green, 9 section

---

## Step 6 — Portfolio

```powershell
python -m insighthub generate --type portfolio --lang en --no-llm
```

> Nếu cần 2 connections file: thêm `--connections connections.yaml data/sample-variant/connections.yaml`

**Expected:**
- File `output/portfolio.md` có "Portfolio Dashboard"
- Liệt kê ≥2 project (Project Sakura + Project Kiku)
- Sub-report mỗi project tồn tại

---

## Constraints (KHÔNG được làm)

- Không sửa file trong `data/sample/` (immutable source)
- Không sửa `schema.py` field cũ (chỉ được thêm model mới)
- Không làm yếu validator anti-hallucination
- Không dùng `--no-verify` hay bỏ qua bất kỳ assertion nào
- Không commit

---

## Kết quả cần báo lại

Sau khi chạy xong, report theo format:

| Step | Lệnh | Kết quả | Ghi chú |
|---|---|---|---|
| S1 | pytest -q | PASS / FAIL (N failed) | |
| S2 | generate EN --no-llm | PASS / FAIL | thời gian chạy |
| S3 JA | generate --lang ja | PASS / FAIL | |
| S3 VN | generate --lang vn | PASS / FAIL | |
| S4 | datasource | PASS / FAIL | counts |
| S5 | test_robustness | PASS / FAIL | |
| S6 | portfolio | PASS / FAIL | |

Nếu bất kỳ step nào FAIL: liệt kê file đã sửa + lý do.
