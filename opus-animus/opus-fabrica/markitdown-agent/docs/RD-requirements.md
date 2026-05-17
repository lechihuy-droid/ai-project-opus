# RD — Markitdown Agent
**Date:** 2026-04-28
**Status:** 🟢 Approved (retrospective — agent đã build xong)
**Author:** HUY

---

## 0. Problem Statement

**Vấn đề:** Cần convert nhiều loại file (PDF, DOCX, PPTX...) sang Markdown để ingest vào personal wiki hoặc đọc bằng LLM.

**Hiện trạng:** Không có tool tự động — phải convert tay từng file, mất thời gian.

**Mục tiêu:** Watch-folder agent: drop file vào một thư mục → .md tự động xuất hiện ở thư mục khác, không cần thao tác thêm.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Chỉ mình tôi |
| Device | Windows PC |
| Tần suất | Khi cần convert file (không thường xuyên) |
| Technical level | Developer |

### 1.2 Typical Usage Flow

```
1. User chạy: python agent.py
2. Agent bắt đầu watch input/
3. User drop file vào input/ (từ Explorer, CLI, hoặc từ browser download)
4. Agent detect file mới → convert → lưu vào output/{filename}.md
5. User đọc output/ hoặc copy .md vào wiki
```

### 1.3 Example Interactions

**Ví dụ 1 — PDF paper:**
```
Input:  input/attention-is-all-you-need.pdf
Output: output/attention-is-all-you-need.md
Log:    10:23:15  INFO     OK  attention-is-all-you-need.pdf  →  attention-is-all-you-need.md
```

**Ví dụ 2 — Collision:**
```
Input:  input/report.pdf (đã có output/report.md từ trước)
Output: output/report_2.md
```

**Ví dụ 3 — Unsupported format:**
```
Input:  input/archive.tar.gz
Log:    10:23:20  WARNING  Skipped (unsupported): archive.tar.gz
```

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Watch `input/` liên tục — detect file mới ngay khi được tạo hoặc moved | P0 |
| FR-002 | Convert file sang Markdown bằng markitdown | P0 |
| FR-003 | Lưu output vào `output/{stem}.md` | P0 |
| FR-004 | Xử lý collision: nếu dest đã tồn tại → append `_2`, `_3`... | P0 |
| FR-005 | Skip file format không support — không crash, log warning | P0 |
| FR-006 | Log mỗi conversion: file name, success/fail, error message | P0 |
| FR-007 | Tạo `input/` và `output/` tự động nếu chưa có | P1 |
| FR-008 | Handle drag-and-drop (watchdog `on_moved` event) | P1 |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric |
|---|---|---|
| NFR-001 | Conversion speed | < 10s cho file thông thường (< 50MB) |
| NFR-002 | Graceful shutdown | Ctrl+C → clean stop, không corrupt output |
| NFR-003 | No data loss | Không xóa file input sau convert |

---

## 4. Explicit Exclusions

- **Không** auto-ingest vào personal-wiki — user copy thủ công khi cần
- **Không** recursive watch subfolders — chỉ watch `input/` flat
- **Không** cleanup `input/` sau convert — user tự quản lý
- **Không** web UI — CLI only

---

## 5. Open Questions

Không còn open questions — agent đã implemented và tested.

---

## 6. Design Decisions

| Quyết định | Lý do |
|---|---|
| `watchdog` library | Cross-platform, stable, đơn giản hơn polling loop |
| `time.sleep(0.5)` trước convert | Một số editor/OS write file theo 2 bước — sleep đảm bảo file fully written |
| Collision với `_2`, `_3` thay vì overwrite | Preserve existing output, tránh mất data |
| `markitdown[all]` | Cài đủ converters cho mọi format support — không cần quản lý per-format deps |

---

*Markitdown Agent — RD v1.0 | 2026-04-28 (retrospective)*
