# CR-001 — Báo cáo đa ngôn ngữ ở đường template-only (JA/VN)
**Date:** 2026-05-22
**Status:** 🟢 Implemented
**Ref:** `RD/SD/BD-insighthub-copilot-mvp.md`
**Loại:** Change Request — chạy theo SDD lightweight (Phase 1+2 gộp trong doc này).

---

## 0. Problem

Brief FPT (§3.3, §3.6) yêu cầu báo cáo **tiếng Nhật keigo** cho khách hàng. Đường
Copilot/LLM đã sinh đúng JA/VN/EN (Sonnet viết narrative theo `lang`). **Nhưng** đường
CLI template-only (`report.py::_generate_template`) in narrative **tiếng Anh bất kể `--lang`** —
vì `facts.py` bake sẵn prose tiếng Anh vào `fact.label` / `fact.value` và section title.

→ Lưới an toàn headless (đường disqualify-guard) không đúng ngôn ngữ. Đây là tồn đọng #2 sau MVP.

## 1. Scope

**IN:** Localize đường template-only — section title, fact label, từ khóa lặp lại trong value,
status (Green/Yellow/Red), severity (High/Medium/Low). Áp dụng EN / JA / VN.

**OUT:**
- Keigo tự nhiên hoàn chỉnh — vẫn do **LLM/Copilot** lo (không thể sinh keigo tất định, không LLM).
- Không dịch dữ liệu thô: Jira summary, mô tả anomaly, tên người, task name — giữ nguyên (là nguồn).
- Không sửa `facts.py` — giữ canonical English cho `allowed_numbers`/validator.

## 2. Requirement Change

- **FR-GEN-002** (RD) — bổ sung: localization áp dụng cho **cả đường template-only**, không chỉ LLM.
- **FR-GEN-004** (mới) — đường template-only phải render section title + fact label + từ khóa cấu
  trúc theo `lang` (EN/JA/VN). **Số liệu và ID giữ nguyên** để validator vẫn pass. P0.

## 3. Design

- **Mới `insighthub/i18n.py`** — 3 bảng tra cứu (section titles · fact labels · value phrases) cho
  `ja`/`vn` + helper `section_title()`, `label()`, `localize_value()`, `no_data()`.
  Ràng buộc: chuỗi dịch **không chứa chữ số** (tránh phá `allowed_numbers`).
- **Sửa `report.py`:**
  - `_generate_template` / `_render_section` nhận `lang`, dùng `i18n`.
  - `_generate_llm` dùng `i18n.section_title()` cho tiêu đề → đường Copilot cũng nhất quán.
- `localize_value()` thay cụm tiếng Anh đã biết, **longest-first** để tránh chồng lấn; số/ID không đụng.
- `facts.py`, `validate.py`, `export.py`, MCP tool, pipeline — **không đổi**.

## 4. Acceptance Criteria

- [x] `generate --type weekly --lang ja --no-llm` → `weekly.md` tiêu đề + label tiếng Nhật; mọi
  số và `SAKURA-*` giữ nguyên.
- [x] `generate --type weekly --lang vn --no-llm` → tiếng Việt.
- [x] `generate --type weekly --lang en --no-llm` → không đổi so với trước CR.
- [x] Validator pass cả 3 ngôn ngữ (không số/ID bịa); `pytest` pass.

## 5. Impact

- **Thấp.** Thêm 1 file (`i18n.py`), sửa 1 file (`report.py`). Pipeline lõi + validator + MCP tool
  không đổi → không rủi ro hồi quy anti-hallucination.
- Đường Copilot: tiêu đề section cũng được localize → JA/VN nhất quán giữa 2 đường.

---

*InsightHub Reporting Co-pilot — CR-001 | 2026-05-22*
