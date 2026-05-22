# BD — Build Plan: InsightHub Reporting Co-pilot (MVP, Concept B)
**Date:** 2026-05-22
**Status:** ✅ Implemented
**Ref:** `RD-insighthub-copilot-mvp.md` (🟢 Approved), `SD-insighthub-copilot-mvp.md` (🟢 Approved)
**Estimate:** ~3 giờ (Codex)

> Pipeline Python (`insighthub/`) đã copy sẵn và chạy E2E được. BD này chỉ build **lớp
> Concept B**: PDF export + 3 MCP tool + file cấu hình VS Code/Copilot + README + test.
> **KHÔNG sửa** logic pipeline (datasource/reconcile/anomalies/facts/validate/templating).

---

## Prerequisites

- [x] RD approved (Gate 1)
- [x] SD approved (Gate 2)
- [x] Code lõi đã copy: `insighthub/`, `insighthub_mcp/`, `data/`, `templates/`, `tests/`
- [x] Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- [x] Chạy pytest với env `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`

**Interface contract:** mọi chữ ký hàm/tool lấy từ `SD §4`. Không tự đổi tên field `schema.py`.

---

## Build Steps

### Step 0 — Verify baseline
**Mục tiêu:** Xác nhận pipeline đã copy chạy đúng trước khi thêm lớp mới.
**Việc làm:**
- [x] Chạy 2 smoke test dưới.
**Smoke test:**
- `python -m insighthub.datasource` → `{jira:36, wbs:12, chat:13, github:23, minutes:5}`, `sprints=3`
- `python -m insighthub generate --type weekly --lang en --no-llm` → 4 file trong `output/`
**Estimate:** 5 min

---

### Step 1 — PDF export (FR-EXP-001)
**Mục tiêu:** Thêm xuất PDF, best-effort, không làm gãy E2E khi thiếu Word.
**Files:**
- Sửa: `requirements.txt` — thêm `docx2pdf>=0.1.8`
- Sửa: `insighthub/export.py` — thêm hàm `_to_pdf(docx_path: str) -> str | None`:
  thử `from docx2pdf import convert; convert(docx_path, pdf_path)`; mọi exception → log + `return None`.
  Trong `export()`: sau khi ghi DOCX, gọi `_to_pdf()`; nếu ra path thì thêm key `weekly_pdf` vào dict trả về.
**Việc làm:**
- [x] `pip install docx2pdf` cho interpreter 3.11 (attempted; package unavailable on current index, best-effort fallback verified)
- [x] Implement `_to_pdf` + wire vào `export()`
**Smoke test:** `python -m insighthub generate --type weekly --lang vn --no-llm`
→ in ra `weekly_pdf: output\weekly.pdf` (hoặc log "PDF skipped" nếu máy không có Word — vẫn pass);
4 file kia luôn có.
**Estimate:** 30 min

---

### Step 2 — MCP server: 3 pipeline tool + cache (FR-MCP-001/002/003)
**Mục tiêu:** Copilot gọi được pipeline qua MCP.
**Files:**
- Sửa: `insighthub_mcp/server.py`
**Việc làm (theo SD §4):**
- [x] Thêm module-level `_CACHE: dict = {}`
- [x] `get_project_facts(period_start: str = "", period_end: str = "")` → `datasource.load()` →
  `reconcile` → `detect` → `build_facts`; lưu `_CACHE["facts"]`; trả `facts.model_dump()`
- [x] `validate_report(sections: list[dict])` → lấy `_CACHE["facts"]` (lỗi rõ nếu chưa có);
  dựng `Report` từ sections + metadata facts; gọi `validate.validate()`; trả `{ok, violations}`
- [x] `export_report(sections: list[dict], lang: str = "en")` → dựng `Report`; validate lần cuối;
  còn violations → `{error, violations}` (KHÔNG ghi file); ok → `export.export()` + `_to_pdf`;
  trả `{ok: true, paths: {...}}`
- [x] Giữ nguyên 3 data tool cũ (`list_jira_issues`/`list_chat_messages`/`list_code_activity`)
- [x] Mỗi tool append 1 dòng audit (timestamp · tool · tham số) vào `output/audit_log.md`
- [x] Giữ `if __name__ == "__main__": mcp.run()` (stdio) để VS Code spawn được
**Smoke test:** script tạm dùng `fastmcp` in-memory `Client(mcp)`:
list_tools → 6 tool; `get_project_facts("2026-05-15","2026-05-21")` → có 9 section;
`export_report(...)` → file `output/weekly.docx` được ghi.
**Estimate:** 60 min

---

### Step 3 — Cấu hình VS Code + Copilot (FR-COP-002/003)
**Mục tiêu:** VS Code/Copilot phát hiện server + biết quy trình.
**Files mới:**
- `.vscode/mcp.json` — server stdio:
  ```json
  { "servers": { "insighthub-mcp": {
      "type": "stdio",
      "command": "C:\\Users\\HUY\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
      "args": ["-m", "insighthub_mcp.server"] } } }
  ```
- `.github/copilot-instructions.md` — persona "InsightHub Reporting Co-pilot" + **quy trình bắt buộc**
  (get_project_facts → viết narrative 9 section → validate_report → sửa nếu violations → export_report)
  + **luật anti-hallucination** (chỉ dùng số trong Facts JSON; giữ nguyên `[system:ref]`; JA=keigo;
  ngôn ngữ mặc định theo yêu cầu PM). Nội dung luật lấy từ `report.py::_system_prompt()`.
- `.github/prompts/weekly-report.prompt.md` — prompt file "sinh báo cáo tuần" một phát.
**Smoke test:** `python -c "import json; json.load(open('.vscode/mcp.json'))"` → không lỗi;
3 file tồn tại, non-empty.
**Estimate:** 30 min

---

### Step 4 — README + test
**Mục tiêu:** Hướng dẫn chạy + test 3 tool mới.
**Files mới:**
- `README.md` — 2 cách chạy: (A) VS Code + Copilot (kèm **hướng dẫn bật MCP** — xem RD Q2),
  (B) CLI headless. Setup, demo runbook.
- `tests/test_mcp_tools.py` — test 3 tool qua in-memory `Client`: facts có 9 section;
  validate_report bắt được số bịa; export_report ghi file.
**Smoke test:** `set PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` + `pytest -q` → tất cả pass.
**Estimate:** 30 min

---

### Step 5 — Integration Test (Definition of Done)
**Test cases:**
- [x] CLI: `python -m insighthub generate --type weekly --lang vn --no-llm` → DOCX/MD/JSON/log output
  (PDF best-effort; skipped on this machine because `docx2pdf` is unavailable). Note: `lang=vn`
  is preserved in the Report, but template body text remains English because `report.py` is a frozen
  pipeline file under this BD.
- [x] MCP E2E: in-memory client `get_project_facts` → `validate_report` → `export_report` → `{ok:true}`
- [x] `pytest -q` (với `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`) → toàn bộ pass
- [x] `.vscode/mcp.json` + 2 file `.github` tồn tại hợp lệ
**Estimate:** 15 min

---

## Rollback Plan

Project mới, không DB. Lỗi step nào → xóa/sửa file của step đó. Pipeline lõi không đụng tới nên
luôn quay về được trạng thái Step 0 (CLI chạy được).

---

## Checklist Trước Khi Done

- [x] Tất cả smoke test Step 0–5 pass
- [x] Mọi FR P0 trong RD có implementation (FR-COP/MCP/GEN/VAL/EXP/CLI)
- [x] Không P0 NFR bị vi phạm (E2E < 60s; validator chặn bịa; CLI chạy không cần LLM)
- [x] Không hardcode secret
- [x] BD doc — các step marked ✅

---

*InsightHub Reporting Co-pilot — BD v1.0 | 2026-05-22*
