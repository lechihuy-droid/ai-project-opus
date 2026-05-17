# Dev Approach — Spec-Driven Development
**Áp dụng cho:** AI Project Personal Agent
**Phương pháp:** Spec-Driven Development (SDD)
**Tham khảo gốc:** `C:/Users/HUY/AI/SDD-toolkit/`

---

## Quy Tắc Số 1

> **Trước khi viết bất kỳ dòng code nào cho feature/function mới — đọc checklist.md và tạo RD doc.**

Không có RD = không có gate = không có code.

## Quy Tắc Số 2 — Docs Luôn Đi Cùng Code

Mỗi thay đổi trong OPUS ANIMUS phải để lại dấu vết trong tài liệu dự án. Không merge trạng thái mới vào hệ thống nếu docs vẫn mô tả trạng thái cũ.

| Loại thay đổi | Tài liệu cần update |
|---|---|
| Priority/scope/backlog | `TODO.md` |
| Data flow hoặc component boundary | `docs/SA-system-architecture.md` |
| Feature/behavior mới | RD/BD doc tương ứng trong `opus-consilium/docs/` hoặc app docs |
| Wiki schema/workflow | `personal-wiki/SCHEMA.md` + RD/BD wiki |
| Ý tưởng tương lai | Backlog only, không code ngầm |

## Quy Tắc Số 3 — Chọn Mức SDD Theo Blast Radius

Không phải việc nào cũng cần full SDD. Chọn mức nhẹ nhất vẫn kiểm soát được rủi ro:

| Tình huống | Process |
|---|---|
| Module mới, data flow mới, integration mới | Full SDD: RD → SD → BD → build |
| Đổi behavior lõi như ingest/query/contract CLI | Lightweight SDD tối thiểu RD + BD; thêm SD nếu đổi boundary |
| Schema/workflow markdown, wiki hygiene, template | Lightweight BD + code trực tiếp có kiểm soát |
| Fix bug rõ nguyên nhân, docs typo, dedupe thủ công | Code trực tiếp + update docs/status |
| Hermes/natural-language control layer | Backlog trước; chỉ build khi operations bên dưới đã ổn định |

Mặc định cho Wiki + Obsidian hiện tại: **lightweight SDD** cho Phase 1-2; chỉ dùng full SDD khi bắt đầu sửa `ingest.py`, `query.py`, hoặc thêm operation mới vào `run_wiki.py`.

---

## 5 Phases — Tóm Tắt

```
Phase 0  Discovery      Confirm vấn đề + definition of done        (30 min)
Phase 1  Requirements   Viết RD doc → user approve          ← GATE 1
Phase 2  Design         Viết SD doc → user approve          ← GATE 2
Phase 3  Build Plan     Viết BD doc → user approve          ← GATE 3
Phase 4  Implementation Code theo BD, không improvise scope
Phase 5  Review         Cross-check từng FR có implementation
```

Xem chi tiết: [sdd-process.md](sdd-process.md)

---

## Workflow Nhanh Cho Feature Mới

```
1. Tạo docs/RD-{feature-name}.md   ← dùng templates/RD.md
2. Fill Section 0 (problem) + Section 1 (usage) trước
3. Derive FR/NFR từ usage
4. List Explicit Exclusions — ít nhất 1
5. Confirm Open Questions với user
6. Sau khi approve → tạo docs/BD-{feature-name}.md
7. Implement từng step, smoke test sau mỗi step
8. Mark ✅ trong BD khi xong từng step
```

---

## Templates

| Loại | File | Dùng khi |
|---|---|---|
| Requirements | [templates/RD.md](templates/RD.md) | Bắt đầu feature mới |
| System Design | [templates/SD.md](templates/SD.md) | Design cần rõ architecture |
| Build Plan | [templates/BD.md](templates/BD.md) | Bất kỳ feature có > 2 steps |

---

## Áp Dụng Vào Project Này

### Khi thêm RSS source mới
→ Không cần RD riêng — update `config.yaml` + test feedparser, ghi vào BACKLOG là đủ.

### Khi thêm Module mới (D, E...)
→ Full SDD: Phase 0 → 5, tạo `RD-module-d.md` + `BD-module-d.md`.

### Khi fix bug rõ nguyên nhân
→ Chỉ cần BD inline (ghi thẳng vào conversation), không cần tạo file.

### Khi refactor / tối ưu performance
→ Mô tả vấn đề trong 2 câu + BD steps. Không cần RD đầy đủ.

### Khi thêm integration point mới (tool mới, API mới)
→ Tạo `SD-interface-contract.md` bổ sung hoặc update file hiện có.

---

## Anti-Patterns Đã Gặp Trong Project Này

| Tình huống | Hậu quả | Lesson |
|---|---|---|
| Home v2 không có rendering contract | Blank screen, mất thời gian debug | Luôn define component interface trước khi render |
| Module C build không có BD steps | Debug khó, không biết step nào fail | Smoke test per step là bắt buộc |
| RSS lưu 300 chars không có full content spec | Wiki pages thin, kém quality | NFR về content depth cần có trong RD |
| markitdown-agent không có integration spec | Phải refactor sau | Interface contract trước khi viết tool |
