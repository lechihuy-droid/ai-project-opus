# RD — InsightHub Reporting Co-pilot (MVP, Copilot/VS Code concept)
**Date:** 2026-05-22
**Status:** 🟢 Approved
**Author:** HUY (planning: Claude)

> **Nguồn tham khảo:** FPT Japan AI Hackathon 2026 Brief v1.0 · `SRS_InsightHub_Agent.md` ·
> `User_Stories_InsightHub_Agent.md`. RD này tái dùng **functional requirements** của SRS/User
> Stories nhưng **thay toàn bộ kiến trúc**: 2 doc đó giả định web app standalone; concept MVP
> này là một agent chạy trong VS Code + GitHub Copilot.

---

## 0. Problem Statement

**Vấn đề:** Front PM ở FPT Japan tốn 3–6h mỗi tuần ráp báo cáo trạng thái thủ công từ
Jira/WBS/Slack/GitHub/biên bản họp; số liệu lệch giữa các nguồn, văn phong không đồng đều.

**Hiện trạng:** Đã build xong một pipeline Python (datasource → reconcile → anomalies → facts →
report → validate → export) chạy E2E được trên dữ liệu mẫu. Nhưng bước viết narrative cần gọi
LLM — và đang giả định phải có API key trả phí (Anthropic). PM thật ở FPT thường **chỉ có
license GitHub Copilot**, không có API key riêng.

**Mục tiêu:** Đóng gói sản phẩm thành một **Reporting Co-pilot chạy trong VS Code qua GitHub
Copilot** (model Claude Sonnet) — PM dùng chính license Copilot làm "bộ não" viết báo cáo,
**không cần API key nào**. Pipeline Python deterministic vẫn tính mọi con số và chặn hallucination.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Front PM / BrSE ở FPT Japan (1–3 dự án customer-facing) |
| Device / môi trường | Laptop công ty, **VS Code + GitHub Copilot license** (Business/Enterprise), model Claude Sonnet bật trong Copilot |
| Tần suất dùng | Mỗi thứ Sáu (báo cáo tuần) |
| Technical level | Trung bình — biết dùng VS Code, không code; điều khiển bằng chat tiếng người |
| Credential | **Không có API key LLM.** Có file export dữ liệu (hoặc token Jira/GitHub nếu dùng live — ngoài scope MVP) |

### 1.2 Typical Usage Flow

```
Bước 1: PM mở folder dự án trong VS Code (chứa dữ liệu export + cấu hình InsightHub)
Bước 2: VS Code đọc .vscode/mcp.json → Copilot agent mode kết nối MCP server insighthub-mcp
Bước 3: PM mở Copilot Chat, chọn model Claude Sonnet, gõ: "Tạo báo cáo tuần cho Project Sakura"
Bước 4: Copilot gọi tool get_project_facts → Python tính sẵn mọi số + citation (Facts JSON)
Bước 5: Copilot (Sonnet) viết narrative 9 section TỪ Facts; gọi validate_report → sai số thì sửa
Bước 6: Copilot gọi export_report → ghi weekly.docx / weekly.md / traceability.json
Kết quả: PM xem file trong VS Code, tinh chỉnh hội thoại ("ngắn lại", "dịch JP keigo"), gửi khách
```

### 1.3 Example Interactions

**Ví dụ 1 — Happy path:**
```
Input (Copilot Chat):  "Tạo báo cáo tuần cho Project Sakura, kỳ 15–21/05, tiếng Anh."
Output: Bản nháp 9 section trong chat + file output/weekly.docx + output/weekly.md +
        output/traceability.json. Mọi con số kèm [jira:SAKURA-12] / [github:3a7f2e1].
```

**Ví dụ 2 — Conversational refinement:**
```
Input:  "Executive summary dài quá, rút còn 3 dòng. Và dịch mục Blockers sang JP keigo."
Output: Copilot regenerate đúng 2 section đó, validate lại, ghi đè file. Các section khác giữ nguyên.
```

**Ví dụ 3 — Edge case (không có Copilot / BGK chấm headless):**
```
Input (terminal):  python -m insighthub generate --type weekly --lang en --no-llm
Output: Cùng bộ artifact, narrative ở chế độ template-only (gạch đầu dòng, vẫn đủ citation).
        E2E chạy không cần VS Code/Copilot/LLM.
```

**Ví dụ 4 — Error case (LLM lỗi giữa chừng):**
```
Tình huống: Copilot/Sonnet timeout hoặc validate_report fail 2 lần liên tiếp.
Xử lý: fallback sang template-only; báo cho PM "narrative dùng bản template do LLM lỗi".
       Không bao giờ xuất báo cáo có số chưa qua validate.
```

---

## 2. Functional Requirements

| ID | Requirement | Priority | Ref / Notes |
|---|---|---|---|
| **FR-COP-001** | PM khởi chạy sản phẩm qua VS Code Copilot Chat (agent mode), model Claude Sonnet — không cần API key LLM riêng | P0 | Concept mới |
| **FR-COP-002** | Repo có `.vscode/mcp.json` để VS Code/Copilot tự phát hiện và kết nối MCP server `insighthub-mcp` | P0 | Concept mới |
| **FR-COP-003** | Repo có file `.github` (copilot-instructions / prompt file) định nghĩa persona "InsightHub Reporting Co-pilot" + luật anti-hallucination (chỉ dùng số trong Facts, giữ nguyên citation `[system:ref]`) | P0 | Chuyển từ `_system_prompt()` |
| **FR-COP-004** | PM tinh chỉnh báo cáo bằng hội thoại trong Copilot Chat: "ngắn lại", "dịch JP keigo", "chuyển mục X sang Risks" | P1 | US-020, FR-REVIEW-003 |
| **FR-MCP-001** | MCP tool `get_project_facts(period_start, period_end)` → chạy datasource→reconcile→anomalies→facts, trả `Facts` JSON (mọi số + citation đã tính sẵn) | P0 | Bọc code đã có |
| **FR-MCP-002** | MCP tool `validate_report(draft_sections, facts)` → trả danh sách vi phạm (số/ticket không thuộc Facts) | P0 | Bọc `validate.py` |
| **FR-MCP-003** | MCP tool `export_report(sections, lang)` → ghi `weekly.docx` + `weekly.pdf` + `weekly.md` + `traceability.json` + `audit_log.md` | P0 | Bọc `export.py` |
| **FR-MCP-004** | Giữ 3 data tool gốc (`list_jira_issues`, `list_chat_messages`, `list_code_activity`) để demo "agent tự lấy dữ liệu nguồn" | P1 | Đã build |
| **FR-MCP-005** | MCP server ghi log mọi lần gọi tool (timestamp, tool, tham số) vào audit log | P1 | FR-AUDIT-002 |
| **FR-GEN-001** | Sinh báo cáo tuần đủ 9 section (exec summary, progress, completed, in-progress, next week, blockers, bugs, decisions, metrics) | P0 | US-012, FR-RGEN-001 |
| **FR-GEN-002** | Ngôn ngữ báo cáo: **JP keigo là mặc định** (brief §3.4); EN + VN vẫn hỗ trợ khi PM yêu cầu | P0 | US-016/017, CR-002 |
| **FR-GEN-003** | Mọi câu chứa số/ticket/ngày phải kèm citation `[system:ref]` truy được về source record | P0 | US-015, FR-AUDIT-001 |
| **FR-GEN-004** | Đường template-only (CLI, không LLM) cũng localize section title + fact label + từ khóa cấu trúc theo `lang` (EN/JA/VN); số và ID giữ nguyên để validator pass | P0 | CR-001 |
| **FR-GEN-005** | Đường Copilot dịch mọi văn bản lấy từ nguồn (Jira summary, Slack, commit msg, minute item, task name, mô tả anomaly) sang ngôn ngữ báo cáo; giữ verbatim ID/số/ngày/citation; báo cáo không lẫn ngôn ngữ | P0 | CR-002 |
| **FR-VAL-001** | Validator chặn số/ticket bịa: narrative phát hiện số ∉ Facts → trả vi phạm, Copilot bắt buộc sửa lại; sai mãi → fallback template-only | P0 | Brief: hallucination = disqualify |
| **FR-VAL-002** | Sinh `traceability.json` — mỗi fact map về source record (Jira key / commit SHA / Slack id / đoạn biên bản) | P0 | US-015 |
| **FR-EXP-001** | Xuất báo cáo ra **PDF** (chuyển từ DOCX). Môi trường không có Word/LibreOffice → bỏ qua PDF, vẫn giữ DOCX+MD (degrade gracefully, không làm gãy E2E) | P0 | Brief §7 yêu cầu PDF |
| **FR-CLI-001** | Lệnh headless `python -m insighthub generate --type weekly` chạy E2E đầy đủ **không cần Copilot/LLM** (chế độ template-only), xuất đủ artifact | P0 | Brief: E2E phải chạy lúc chấm = disqualify nếu không |

**Priority:** P0 = Must (thiếu là hỏng MVP / nguy cơ disqualify) · P1 = Should · P2 = Nice-to-have.

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | Performance — sinh báo cáo tuần | E2E < 60s (brief §4) | P0 |
| NFR-002 | Không API key runtime | LLM = license Copilot; file-mode = 0 token; chỉ data token nếu dùng live | P0 |
| NFR-003 | Anti-hallucination | 0 số/ticket bịa lọt qua `validate_report` | P0 |
| NFR-004 | Reliability | Copilot/LLM lỗi → fallback template-only, E2E không gãy | P0 |
| NFR-005 | Audit & traceability | Mọi tool call + LLM call được log; mọi fact có source_ref | P1 |
| NFR-006 | Confidentiality | Dữ liệu đi qua Copilot enterprise endpoint (FPT đã duyệt), không gọi LLM vendor ngoài | P1 |
| NFR-007 | Reuse | Tái dùng ≥ 80% codebase Python đã build; chỉ thêm vỏ MCP tool + file cấu hình | P1 |

---

## 4. Explicit Exclusions

> Cái KHÔNG build trong MVP — tránh scope creep.

- **Không** báo cáo tháng — fast-follow (brief §7 yêu cầu, nhưng vượt timebox MVP).
- **Không** live API connector — chỉ file-mode (sample export). `api_adapter.py` chỉ là stub.
- **Không** web UI / React / database / SSO-SAML — VS Code chính là UI; không có server, không DB.
- **Không** export PPTX / Confluence — MVP có DOCX + Markdown + PDF (PDF: xem FR-EXP-001).
- **Không** scheduled mode, portfolio roll-up, diff-vs-last-report — fast-follow.
- **Không** multi-template engine — MVP dùng 1 template weekly cố định.
- **Không** xây đường gọi LLM bằng API key trả phí cho production — concept này runtime LLM = Copilot.
- **Không** dùng endpoint Copilot reverse-engineered (`api.githubcopilot.com`) — chỉ qua VS Code chính thống.

---

## 5. Open Questions — ĐÃ CHỐT (2026-05-22)

| # | Câu hỏi | Trả lời |
|---|---|---|
| Q1 | Copilot có model **Claude Sonnet**? | ✅ Có Sonnet + nhiều model khác → concept chạy đúng thiết kế |
| Q2 | VS Code đã bật **MCP** chưa? | ⏳ Chưa biết cách bật → BD Step 0 + README hướng dẫn (xem mục dưới) |
| Q3 | BGK chấm kiểu nào? | ✅ Cả hai — CLI headless (P0) + video demo VS Code |
| Q4 | PDF có cần trong MVP? | ✅ **CÓ** — PDF vào scope MVP: FR-EXP-001 (P0) |
| Q5 | Ngôn ngữ ưu tiên demo? | ✅ **Tiếng Việt** — VN lên P0 cùng EN (FR-GEN-002) |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| LLM runtime = **GitHub Copilot (Claude Sonnet)** trong VS Code | PM chỉ có license Copilot, không API key; Copilot là endpoint enterprise FPT đã duyệt sẵn (khớp brief §4) | Anthropic API key: tốn phí + cần duyệt vendor mới. GitHub Models PAT: vẫn cần token + rate limit thấp |
| **Giữ headless CLI** song song với concept Copilot | Brief disqualify nếu E2E không chạy lúc chấm; BGK có thể không có VS Code/Copilot | Chỉ làm bản Copilot: rủi ro disqualify nếu BGK chấm headless |
| Python tính **mọi con số**, LLM chỉ viết văn từ `Facts` | Chống hallucination (brief: hallucination = disqualify); validator vendor-agnostic, không phụ thuộc LLM nào | Để LLM tự tính/tự lấy số: rủi ro bịa số → disqualify |
| **MCP** làm lớp connector + compute | Copilot agent mode hỗ trợ MCP sẵn; cùng 1 server dùng được cho cả CLI (in-memory client) lẫn Copilot | REST API riêng: cần web server, Copilot không gọi trực tiếp được |
| Tái dùng codebase đã build (~80%) | Pipeline đã chạy E2E; chỉ cần thêm vỏ MCP tool + file cấu hình | Viết lại theo kiến trúc web của SRS: vượt timebox, vô ích |
| `.github` prompt file giữ luật anti-hallucination | Khi LLM chạy trong vòng lặp agent (khó ép `temperature=0`), prompt chặt + `validate_report` là cổng cứng bù lại | Tin Copilot tự không bịa: không đủ an toàn cho tiêu chí disqualify |

---

*InsightHub Reporting Co-pilot — RD v1.0 | 2026-05-22*
