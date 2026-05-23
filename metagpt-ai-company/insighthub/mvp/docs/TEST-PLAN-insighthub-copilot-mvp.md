# TEST PLAN — InsightHub Reporting Co-pilot (MVP, Concept B)
**Date:** 2026-05-22
**Ref:** `RD` / `SD` / `BD` / `CR-001` — insighthub-copilot-mvp
**Status:** 🟢 Mọi test tự động pass · 1 nhóm test thủ công (VS Code Copilot) chờ chạy

---

## 1. Mục tiêu & Phạm vi

Kiểm chứng MVP Concept B đáp ứng RD và **né được 2 điều kiện disqualify** của brief:
(1) E2E phải chạy lúc chấm, (2) không hallucination.

**Trong phạm vi:** pipeline dữ liệu, 3 MCP tool, sinh báo cáo, anti-hallucination, PDF,
đa ngôn ngữ (CR-001), CLI headless.
**Ngoài phạm vi:** báo cáo tháng, live API, web UI, scheduled mode (RD §4 Exclusions).

## 2. Môi trường test

| Thành phần | Giá trị |
|---|---|
| Python | `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe` |
| pytest | env `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` |
| Repo | `metagpt-ai-company/insighthub-copilot/` |
| Dữ liệu | `data/sample/` (36 Jira, 12 WBS, 13 chat, 23 GitHub, 5 minutes, 3 sprint) |
| PDF | cần MS Word (docx2pdf); thiếu Word → PDF skip, không tính fail |

## 3. Test Cases — Tự động

| ID | FR | Mô tả | Cách chạy | Kết quả mong đợi |
|---|---|---|---|---|
| **T-01** | FR-MCP-001 | Pipeline load đủ 5 nguồn | `python -m insighthub.datasource` | `{jira:36,wbs:12,chat:13,github:23,minutes:5}`, `sprints=3` |
| **T-02** | FR-CLI-001 | CLI E2E template-only | `python -m insighthub generate --type weekly --lang en --no-llm` | 5 file trong `output/`; in `status=Red` |
| **T-03** | FR-VAL-001 | Validator chặn số bịa | `pytest tests/test_no_hallucination.py` | pass — số ∉ Facts bị bắt |
| **T-04** | FR-GEN-001 | Anomaly đủ ≥85% | `pytest tests/test_anomalies.py` | pass — ≥85% rule seeded |
| **T-05** | FR-EXP-001 | Xuất DOCX/MD/JSON | `pytest tests/test_export.py` | pass |
| **T-06** | FR-MCP-001/002/003 | 3 MCP tool qua in-memory client | `pytest tests/test_mcp_tools.py` | pass — facts 9 section · validate bắt bịa · export ghi file |
| **T-07** | FR-MCP-004 | MCP expose đúng 6 tool | list_tools qua `Client(mcp)` | `get_project_facts, validate_report, export_report, list_jira_issues, list_chat_messages, list_code_activity` |
| **T-08** | FR-EXP-001 | PDF best-effort | `generate ... --no-llm` (máy có Word) | `weekly.pdf` sinh ra; máy không Word → log "PDF skipped", 4 file kia vẫn có |
| **T-09** | FR-GEN-004 / CR-001 | Báo cáo tiếng Nhật | `generate --type weekly --lang ja --no-llm` | `weekly.md`: section title + label tiếng Nhật; số & `SAKURA-*` nguyên vẹn |
| **T-10** | FR-GEN-002 / CR-001 | Báo cáo tiếng Việt | `generate --type weekly --lang vn --no-llm` | `weekly.md` tiếng Việt; số & ID nguyên vẹn |
| **T-11** | FR-GEN-002 | Báo cáo tiếng Anh (regression) | `generate --type weekly --lang en --no-llm` | không đổi so với trước CR-001 |
| **T-12** | NFR-001 | E2E < 60s | đo thời gian T-02 | < 60s |
| **T-13** | NFR-003 | 0 số bịa lọt | validator chạy trong T-02/09/10 không raise | export thành công cả 3 ngôn ngữ |

**Lệnh chạy nhanh toàn bộ test tự động:**
```
set PYTEST_DISABLE_PLUGIN_AUTOLOAD=1
python -m pytest -q
python -m insighthub generate --type weekly --lang ja --no-llm
python -m insighthub generate --type weekly --lang vn --no-llm
```

## 4. Test Cases — Thủ công (đường Copilot, cần VS Code)

| ID | FR | Mô tả | Bước | Kết quả mong đợi |
|---|---|---|---|---|
| **M-01** | FR-COP-001/002 | VS Code phát hiện MCP server | Mở repo → bật MCP → Start `insighthub-mcp` | Server "running", thấy 6 tool |
| **M-02** | FR-COP-001/003 | Copilot sinh báo cáo | Copilot Chat agent + Sonnet: *"Tạo báo cáo tuần Project Sakura tiếng Nhật"* | Copilot gọi get_project_facts → viết keigo → validate → export; ra file |
| **M-03** | FR-COP-004 | Tinh chỉnh hội thoại | *"Rút gọn Executive Summary còn 3 dòng"* | Copilot regenerate đúng section đó, validate lại |
| **M-04** | FR-VAL-001 | Anti-hallucination đường LLM | Kiểm citation trong báo cáo Copilot sinh | Mọi số/ID có `[system:ref]`; không số lạ |

## 5. Tiêu chí Pass

- **Bắt buộc (P0):** T-01…T-13 pass · M-01, M-02 pass.
- **Disqualify guard:** T-02 (E2E chạy) + T-03/T-13 (no hallucination) **phải** xanh.
- Test thủ công M-* nên quay video làm bằng chứng demo cho BGK.

## 6. Kết quả lần chạy gần nhất (2026-05-22)

| Nhóm | Kết quả |
|---|---|
| `pytest` (T-03…T-07) | ✅ 7/7 pass |
| T-01 datasource | ✅ đúng counts |
| T-02 CLI E2E | ✅ 5 file, status=Red |
| T-08 PDF | ✅ `weekly.pdf` 281KB (máy có Word) |
| T-09/T-10/T-11 đa ngôn ngữ | ✅ JA/VN/EN — số & ID nguyên vẹn |
| M-01…M-04 | ⏳ Chờ chạy thủ công trong VS Code |

---

*InsightHub Reporting Co-pilot — Test Plan v1.0 | 2026-05-22*
