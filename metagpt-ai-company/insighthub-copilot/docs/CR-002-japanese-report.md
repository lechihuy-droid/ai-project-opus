# CR-002 — Báo cáo đồng nhất tiếng Nhật, tự dịch nguồn đa ngôn ngữ
**Date:** 2026-05-22
**Status:** 🟢 Implemented
**Ref:** `RD/SD/BD/CR-001-insighthub-copilot-mvp.md`
**Loại:** Change Request — SDD lightweight (Phase 1+2 gộp trong doc này).

---

## 0. Problem

Brief yêu cầu báo cáo khách hàng mặc định **tiếng Nhật keigo** (§3.4). Dữ liệu nguồn **lẫn
ngôn ngữ**: biên bản họp "mixing JP and EN" (§6), Jira summary / commit message phần lớn
tiếng Anh. Hiện báo cáo bị **lẫn ngôn ngữ** — văn bản nguồn tiếng Anh lọt thẳng vào báo cáo.

Cần: báo cáo **một ngôn ngữ JP mạch lạc**, mọi nội dung từ nguồn được **dịch sang JP**.

## 1. Brief mapping (đã kiểm chứng)

- §3.4 "report output in **Japanese (default for customer)**" → JP là ngôn ngữ mặc định.
- §4 "Multilingual: JP/EN/VN" + §8 tiêu chí 4 chấm **cả** EN/VN → **giữ EN/VN** (không bỏ).
- §6 "minutes mixing JP and EN" → nguồn đa ngôn ngữ là thực tế → buộc phải dịch.
- Brief **không** có tiêu chí chấm "Translation" riêng → dịch là **phương tiện** để có báo cáo
  một ngôn ngữ sạch, do **LLM** lo, không cần engine dịch riêng.

## 2. Scope

**IN:** JP là ngôn ngữ **mặc định**; đường Copilot **dịch toàn bộ văn bản nguồn** sang ngôn ngữ
báo cáo khi viết narrative; giữ EN/VN là tùy chọn.

**OUT:** Không thêm máy dịch cho CLI headless — CLI là **phao E2E-proof + công cụ sinh
deliverable §7**, không phải bản khách hàng (xem CR-001 + thảo luận đã chốt). Không bỏ EN/VN.

## 3. Requirement Change

- **FR-GEN-002** (RD) — đổi: **JP là ngôn ngữ mặc định** (trước: EN). EN/VN vẫn hỗ trợ.
- **FR-GEN-005** (mới) — đường Copilot phải **dịch mọi văn bản lấy từ nguồn** (Jira summary,
  Slack quote, commit message, minute item, WBS task name, mô tả anomaly) sang ngôn ngữ báo
  cáo. Giữ **verbatim**: ID (SAKURA-x, PR#x, SHA, WBS task id), số, ngày, citation
  `[system:ref]`. Báo cáo **không được lẫn ngôn ngữ**. P0.

## 4. Design

- **`.github/copilot-instructions.md` + `weekly-report.prompt.md`:** JP default + luật "dịch
  toàn bộ văn bản nguồn sang ngôn ngữ báo cáo; giữ ID/số/ngày/citation verbatim; báo cáo một
  ngôn ngữ duy nhất, không lẫn".
- **Default `lang="ja"`:** `__main__.py` (`--lang`, `generate()`), `insighthub_mcp/server.py`
  (`export_report`, `_report_from_sections`).
- **An toàn với validator:** `validate.py` chỉ kiểm **số và ID** ⊆ Facts — dịch phần văn xuôi
  không ảnh hưởng. LLM được phép dịch tự do miễn giữ ID/số/ngày/citation.
- **CLI headless:** không đổi — `--lang ja` cho cấu trúc JP (CR-001 i18n); nội dung nguồn giữ
  ngôn ngữ gốc (CLI là phao, không phải bản khách hàng).

## 5. Acceptance Criteria

- [x] `python -m insighthub generate` (không tham số) → mặc định tiếng Nhật.
- [x] Copilot path: instruction yêu cầu dịch toàn bộ nguồn sang JP, giữ ID/số/citation verbatim.
- [x] EN/VN vẫn gọi được (`--lang en` / `--lang vn`).
- [x] `validate.py` + `pytest` pass — dịch không phá anti-hallucination.

## 6. Impact

- **Thấp.** Sửa 2 prompt doc + 4 dòng default ngôn ngữ. `facts.py` / `validate.py` / `i18n.py`
  / pipeline lõi **không đổi** → không rủi ro hồi quy.
- Đường Copilot (bản khách hàng demo) giờ ra báo cáo JP đồng nhất, đã dịch hết.

---

*InsightHub Reporting Co-pilot — CR-002 | 2026-05-22*
